import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Log configuration for debugging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// Helper function to extract error messages from various error types
export const getErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error';
  
  // Handle network/fetch errors specifically
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Network connection failed. Please check your internet connection and verify that the Supabase URL is accessible.';
  }
  
  if (error.message && error.message.includes('Failed to fetch')) {
    return 'Unable to connect to the database. Please check your internet connection and Supabase configuration.';
  }
  
  // Handle Supabase PostgrestError
  if (error.message) {
    return error.message;
  }
  
  // Handle error objects with details
  if (error.details) {
    return error.details;
  }
  
  // Handle error objects with hint
  if (error.hint) {
    return error.hint;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle error objects with code
  if (error.code) {
    return `Database error (${error.code})`;
  }
  
  // Fallback to string representation
  return String(error);
};

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('clients').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection test successful');
    return true;
  } catch (err) {
    console.error('Network error during connection test:', err);
    return false;
  }
};

// Helper function to upload files to Supabase Storage
async function uploadFileToStorage(file: File, bucketName: string = 'distributor-photos'): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrl;
}

// Helper functions for data operations
export const dataService = {
  // Expose supabase client for advanced operations
  supabase,

  // Projects
  async getProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          distributors (
            id,
            distributor_id,
            kast_naam,
            systeem,
            voeding,
            bouwjaar,
            keuring_datum,
            getest_door,
            un_in_v,
            in_in_a,
            ik_th_in_ka1s,
            ik_dyn_in_ka,
            freq_in_hz,
            type_nr_hs,
            fabrikant,
            profile_photo,
            status,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .order('created_at', { referencedTable: 'distributors', ascending: true });
      
      if (error) {
        console.error('Database error in getProjects:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in getProjects:', err);
      throw new Error(`Failed to fetch projects: ${getErrorMessage(err)}`);
    }
  },

  async createProject(project: any) {
    try {
      console.log('Creating project with intake form:', project.intakeForm);
      console.log('Full project data:', project);
      console.log('Contact person being saved:', project.contactPerson || project.contact_person);
      
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          project_number: project.projectNumber,
          date: project.date,
          location: project.location,
          client: project.client,
          contact_person: project.contactPerson || project.contact_person,
          status: project.status,
          description: project.description,
          intake_form: project.intakeForm || project.intakeFormData
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Database error in createProject:', error);
        throw error;
      }
      
      console.log('Project created successfully:', data);
      console.log('Saved intake form data:', data.intake_form);
      return data;
    } catch (err) {
      console.error('Network error in createProject:', err);
      throw new Error(`Failed to create project: ${getErrorMessage(err)}`);
    }
  },

  async updateProject(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          project_number: updates.projectNumber,
          date: updates.date,
          location: updates.location,
          client: updates.client,
          contact_person: updates.contact_person,
          status: updates.status,
          description: updates.description,
          intake_form: updates.intakeForm || null
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Database error in updateProject:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in updateProject:', err);
      throw new Error(`Failed to update project: ${getErrorMessage(err)}`);
    }
  },

  async deleteProject(id: string) {
    try {
      // Note: Due to CASCADE constraints in the database, 
      // deleting the project will automatically delete:
      // - All distributors associated with this project
      // - All documents associated with this project and its distributors
      // - All test_data associated with the distributors
      // - All work_entries associated with the distributors
      // - All client_portals associated with this project
      // - All delivery_notifications associated with the portals
      // Clients are NOT deleted as they can have multiple projects
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Database error in deleteProject:', error);
        throw error;
      }
    } catch (err) {
      console.error('Network error in deleteProject:', err);
      throw new Error(`Failed to delete project: ${getErrorMessage(err)}`);
    }
  },

  // Distributors
  async getDistributors() {
    try {
      const { data, error } = await supabase
        .from('distributors')
        .select(`
          *,
          projects (
            project_number,
            client,
            location
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Database error in getDistributors:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in getDistributors:', err);
      throw new Error(`Failed to fetch distributors: ${getErrorMessage(err)}`);
    }
  },

  async getDistributorsByProject(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('distributors')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Database error in getDistributorsByProject:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in getDistributorsByProject:', err);
      throw new Error(`Failed to fetch distributors by project: ${getErrorMessage(err)}`);
    }
  },

  async createDistributor(distributor: any) {
    try {
      console.log('createDistributor called with:', distributor);
      console.log('🔍 DISTRIBUTOR SAVE: Checking key fields:');
      console.log('  - distributorId:', distributor.distributorId);
      console.log('  - kastNaam:', distributor.kastNaam);
      console.log('  - projectId:', distributor.projectId);
      
      // Debug: Check all possible field variations
      console.log('🔍 DISTRIBUTOR SAVE: All possible ID fields:');
      console.log('  - distributor.distributorId:', distributor.distributorId);
      console.log('  - distributor.distributor_id:', distributor.distributor_id);
      console.log('  - distributor.id:', distributor.id);
      
      console.log('🔍 DISTRIBUTOR SAVE: All possible name fields:');
      console.log('  - distributor.kastNaam:', distributor.kastNaam);
      console.log('  - distributor.kast_naam:', distributor.kast_naam);
      console.log('  - distributor.name:', distributor.name);
      
      let profilePhotoUrl = '';
      
      // Handle file upload if profilePhoto is a File object
      if (distributor.profilePhoto instanceof File) {
        profilePhotoUrl = await uploadFileToStorage(distributor.profilePhoto);
      } else if (typeof distributor.profilePhoto === 'string') {
        profilePhotoUrl = distributor.profilePhoto;
      }

      // Ensure we get the distributor ID from any possible field
      const distributorId = distributor.distributorId || distributor.distributor_id || distributor.id;
      const kastNaam = distributor.kastNaam || distributor.kast_naam || distributor.name;
      
      console.log('🔍 DISTRIBUTOR SAVE: Final mapped values:');
      console.log('  - Final distributorId:', distributorId);
      console.log('  - Final kastNaam:', kastNaam);
      
      if (!distributorId) {
        console.error('❌ CRITICAL: No distributor ID found in any field!');
        console.log('❌ Full distributor object:', JSON.stringify(distributor, null, 2));
        throw new Error('Distributor ID is missing - cannot save distributor');
      }
      
      if (!kastNaam) {
        console.error('❌ CRITICAL: No kast naam found in any field!');
        console.log('❌ Full distributor object:', JSON.stringify(distributor, null, 2));
        throw new Error('Kast naam is missing - cannot save distributor');
      }
      const dbData = {
        distributor_id: distributorId,
        project_id: distributor.projectId,
        kast_naam: kastNaam,
        systeem: distributor.systeem,
        voeding: distributor.voeding,
        bouwjaar: distributor.bouwjaar,
        keuring_datum: distributor.keuringDatum,
        getest_door: distributor.getestDoor,
        un_in_v: distributor.unInV,
        in_in_a: distributor.inInA,
        ik_th_in_ka1s: distributor.ikThInKA1s,
        ik_dyn_in_ka: distributor.ikDynInKA,
        freq_in_hz: distributor.freqInHz,
        type_nr_hs: distributor.typeNrHs,
        fabrikant: distributor.fabrikant,
        profile_photo: profilePhotoUrl,
        status: distributor.status,
        toegewezen_monteur: distributor.toegewezenMonteur || null,
        gewenste_lever_datum: distributor.gewensteLeverDatum || null
      };
      
      console.log('Database data being inserted:', dbData);
      console.log('🔍 DB DATA: Key fields check:');
      console.log('  - distributor_id:', dbData.distributor_id);
      console.log('  - kast_naam:', dbData.kast_naam);
      console.log('  - project_id:', dbData.project_id);
      console.log('  - toegewezen_monteur:', dbData.toegewezen_monteur);
      
      // Validate required fields before database insert
      if (!dbData.distributor_id || dbData.distributor_id.trim() === '') {
        console.error('❌ VALIDATION FAILED: distributor_id is empty or missing');
        console.log('❌ dbData.distributor_id value:', JSON.stringify(dbData.distributor_id));
        throw new Error('distributor_id is required but missing or empty');
      }
      
      if (!dbData.kast_naam || dbData.kast_naam.trim() === '') {
        console.error('❌ VALIDATION FAILED: kast_naam is empty or missing');
        console.log('❌ dbData.kast_naam value:', JSON.stringify(dbData.kast_naam));
        throw new Error('kast_naam is required but missing or empty');
      }
      
      if (!dbData.project_id) {
        console.error('❌ VALIDATION FAILED: project_id is missing');
        throw new Error('project_id is required but missing');
      }

      const { data, error } = await supabase
        .from('distributors')
        .insert([dbData])
        .select()
        .single();
      
      if (error) {
        console.error('Database error in createDistributor:', error);
        console.error('Failed to insert data:', dbData);
        throw error;
      }
      console.log('Distributor created successfully in database:', data);
      console.log('✅ SAVED: distributor_id =', data.distributor_id, 'kast_naam =', data.kast_naam);
      return data;
    } catch (err) {
      console.error('Network error in createDistributor:', err);
      throw new Error(`Failed to create distributor: ${getErrorMessage(err)}`);
    }
  },

  async updateDistributor(id: string, updates: any) {
    try {
      let profilePhotoUrl = '';
      
      // Handle file upload if profilePhoto is a File object
      if (updates.profilePhoto instanceof File) {
        profilePhotoUrl = await uploadFileToStorage(updates.profilePhoto);
      } else if (typeof updates.profilePhoto === 'string') {
        profilePhotoUrl = updates.profilePhoto;
      }

      const { data, error } = await supabase
        .from('distributors')
        .update({
          distributor_id: updates.distributorId,
          project_id: updates.projectId,
          kast_naam: updates.kastNaam,
          systeem: updates.systeem,
          voeding: updates.voeding,
          bouwjaar: updates.bouwjaar,
          keuring_datum: updates.keuringDatum,
          getest_door: updates.getestDoor,
          un_in_v: updates.unInV,
          in_in_a: updates.inInA,
          ik_th_in_ka1s: updates.ikThInKA1s,
          ik_dyn_in_ka: updates.ikDynInKA,
          freq_in_hz: updates.freqInHz,
          type_nr_hs: updates.typeNrHs,
          fabrikant: updates.fabrikant,
          profile_photo: profilePhotoUrl,
          status: updates.status,
          // Add new columns conditionally to handle migration
          ...(updates.toegewezenMonteur !== undefined && { toegewezen_monteur: updates.toegewezenMonteur }),
          ...(updates.gewensteLeverDatum !== undefined && { gewenste_lever_datum: updates.gewensteLeverDatum })
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Database error in updateDistributor:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in updateDistributor:', err);
      throw new Error(`Failed to update distributor: ${getErrorMessage(err)}`);
    }
  },

  async deleteDistributor(id: string) {
    try {
      const { error } = await supabase
        .from('distributors')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Database error in deleteDistributor:', error);
        throw error;
      }
    } catch (err) {
      console.error('Network error in deleteDistributor:', err);
      throw new Error(`Failed to delete distributor: ${getErrorMessage(err)}`);
    }
  },

  // Documents
  async getDocuments(projectId?: string, distributorId?: string, folder?: string) {
    try {
      console.log('getDocuments called with:', { projectId, distributorId, folder });

      // Add timeout to prevent hanging requests - increased timeout for large datasets
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      // Select metadata fields including storage_path for new storage-based documents
      let query = supabase
        .from('documents')
        .select('id, project_id, distributor_id, folder, name, type, size, uploaded_at, storage_path')
        .order('uploaded_at', { ascending: false })
        .abortSignal(controller.signal);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      if (distributorId) {
        query = query.eq('distributor_id', distributorId);
      }
      if (folder) {
        query = query.eq('folder', folder);
      }

      const { data, error } = await query.limit(100); // Increased limit now that we have indexes

      clearTimeout(timeoutId);

      if (error) {
        if (error.name === 'AbortError') {
          throw new Error('Document loading timed out after 15 seconds - please try again or contact support');
        }
        console.error('Database error in getDocuments:', error);
        throw error;
      }

      console.log('getDocuments returning:', data?.length || 0, 'documents');
      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Document loading was cancelled due to timeout - this may indicate a database performance issue');
      }
      console.error('Network error in getDocuments:', err);
      throw new Error(`Failed to fetch documents: ${getErrorMessage(err)}`);
    }
  },

  async getDocumentContent(documentId: string) {
    try {
      console.log('getDocumentContent called with:', documentId);

      // First, check if document has storage_path or content
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('storage_path, content')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        console.error('Database error in getDocumentContent:', fetchError);
        throw fetchError;
      }

      // If document uses storage, get public URL (bucket is public)
      if (doc?.storage_path) {
        console.log('📁 Document uses storage, generating public URL...');
        const publicUrl = this.getStorageUrl(doc.storage_path);
        console.log('✅ Public URL generated for storage file:', publicUrl);
        return publicUrl;
      }

      // Otherwise, return legacy base64 content
      if (doc?.content) {
        console.log('⏱️ Fetching legacy base64 content...');
        return doc.content;
      }

      throw new Error('Document has no content or storage path');
    } catch (err) {
      console.error('Network error in getDocumentContent:', err);
      throw new Error(`Failed to fetch document content: ${getErrorMessage(err)}`);
    }
  },

  // Upload file to Supabase Storage
  async uploadFileToStorage(file: File, projectId: string, distributorId: string, folder: string): Promise<string> {
    try {
      // Create a path: projectId/distributorId/folder/filename
      const timestamp = Date.now();
      const sanitizedFolder = folder.replace(/\//g, '_');
      const storagePath = `${projectId}/${distributorId}/${sanitizedFolder}/${timestamp}_${file.name}`;

      console.log('📤 Uploading file to storage:', storagePath);

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('✅ File uploaded successfully:', data.path);
      return data.path;
    } catch (err) {
      console.error('Network error in uploadFileToStorage:', err);
      throw new Error(`Failed to upload file: ${getErrorMessage(err)}`);
    }
  },

  // Get public URL for a storage file
  getStorageUrl(storagePath: string): string {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  },

  // Get signed URL for a storage file (for private access)
  async getSignedStorageUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      throw error;
    }

    return data.signedUrl;
  },

  async createDocument(document: any) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          project_id: document.projectId,
          distributor_id: document.distributorId,
          folder: document.folder,
          name: document.name,
          type: document.type,
          size: document.size,
          storage_path: document.storagePath || null,
          content: document.content || null // Keep for backward compatibility during migration
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error in createDocument:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in createDocument:', err);
      throw new Error(`Failed to create document: ${getErrorMessage(err)}`);
    }
  },

  async deleteDocument(id: string) {
    try {
      // First, get the document to find its storage path
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching document:', fetchError);
      }

      // Delete from storage if storage_path exists
      if (doc?.storage_path) {
        console.log('🗑️ Deleting file from storage:', doc.storage_path);
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([doc.storage_path]);

        if (storageError) {
          console.error('Error deleting from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        } else {
          console.log('✅ File deleted from storage');
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error in deleteDocument:', error);
        throw error;
      }

      console.log('✅ Document deleted from database');
    } catch (err) {
      console.error('Network error in deleteDocument:', err);
      throw new Error(`Failed to delete document: ${getErrorMessage(err)}`);
    }
  },

  // Test Data
  async getTestData(distributorId: string) {
    try {
      const { data, error } = await supabase
        .from('test_data')
        .select('*')
        .eq('distributor_id', distributorId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Database error in getTestData:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in getTestData:', err);
      throw new Error(`Failed to fetch test data: ${getErrorMessage(err)}`);
    }
  },

  async createTestData(testData: any) {
    try {
      const { data, error } = await supabase
        .from('test_data')
        .insert([{
          distributor_id: testData.distributorId,
          test_type: testData.testType,
          data: testData.data
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Database error in createTestData:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in createTestData:', err);
      throw new Error(`Failed to create test data: ${getErrorMessage(err)}`);
    }
  },

  // Work Entries
  async getWorkEntries(distributorId: string) {
    try {
      const { data, error } = await supabase
        .from('work_entries')
        .select('*')
        .eq('distributor_id', distributorId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Database error in getWorkEntries:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in getWorkEntries:', err);
      throw new Error(`Failed to fetch work entries: ${getErrorMessage(err)}`);
    }
  },

  async createWorkEntry(workEntry: any) {
    try {
      const { data, error } = await supabase
        .from('work_entries')
        .insert([{
          distributor_id: workEntry.distributorId,
          worker_id: workEntry.workerId,
          date: workEntry.date,
          hours: workEntry.hours,
          status: workEntry.status,
          notes: workEntry.notes
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Database error in createWorkEntry:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in createWorkEntry:', err);
      throw new Error(`Failed to create work entry: ${getErrorMessage(err)}`);
    }
  },

  async updateWorkEntry(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('work_entries')
        .update({
          distributor_id: updates.distributorId,
          worker_id: updates.workerId,
          date: updates.date,
          hours: updates.hours,
          status: updates.status,
          notes: updates.notes
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Database error in updateWorkEntry:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in updateWorkEntry:', err);
      throw new Error(`Failed to update work entry: ${getErrorMessage(err)}`);
    }
  },

  async deleteWorkEntry(id: string) {
    try {
      const { error } = await supabase
        .from('work_entries')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Database error in deleteWorkEntry:', error);
        throw error;
      }
    } catch (err) {
      console.error('Network error in deleteWorkEntry:', err);
      throw new Error(`Failed to delete work entry: ${getErrorMessage(err)}`);
    }
  },

  // Clients
  async getClients() {
    try {
      console.log('Attempting to fetch clients from Supabase...');
      
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (clientsError) {
        console.error('Database error in getClients:', clientsError);
        throw clientsError;
      }

      console.log('Successfully fetched clients:', clients?.length || 0);

      // Fetch contacts for each client
      const clientsWithContacts = await Promise.all(
        (clients || []).map(async (client) => {
          try {
            const { data: contacts, error: contactsError } = await supabase
              .from('contacts')
              .select('*')
              .eq('client_id', client.id);
            
            if (contactsError) {
              console.error('Database error fetching contacts for client:', client.id, contactsError);
              throw contactsError;
            }
            
            return {
              ...client,
              contacts: contacts || []
            };
          } catch (err) {
            console.error('Error fetching contacts for client:', client.id, err);
            return {
              ...client,
              contacts: []
            };
          }
        })
      );
      
      return clientsWithContacts;
    } catch (err) {
      console.error('Network error in getClients:', err);
      
      // Provide more specific error messages
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to the database. Please check your internet connection and try again.');
      } else {
        throw new Error(`Failed to fetch clients: ${getErrorMessage(err)}`);
      }
    }
  },

  async createClient(clientData: any) {
    try {
      // Extract contacts from client data
      const { contacts, ...clientOnly } = clientData;
      
      // Create the client first
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert([clientOnly])
        .select()
        .single();
      
      if (clientError) {
        console.error('Database error in createClient:', clientError);
        throw clientError;
      }

      // Create contacts if they exist
      if (contacts && contacts.length > 0) {
        const contactsWithClientId = contacts.map((contact: any) => ({
          ...contact,
          client_id: client.id
        }));

        const { error: contactsError } = await supabase
          .from('contacts')
          .insert(contactsWithClientId);
        
        if (contactsError) {
          console.error('Database error creating contacts:', contactsError);
          throw contactsError;
        }
      }

      // Return the client with its contacts
      return {
        ...client,
        contacts: contacts || []
      };
    } catch (err) {
      console.error('Network error in createClient:', err);
      throw new Error(`Failed to create client: ${getErrorMessage(err)}`);
    }
  },

  async updateClient(id: string, updates: any) {
    try {
      // Extract contacts from updates
      const { contacts, ...clientUpdates } = updates;
      
      // Update the client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .update(clientUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (clientError) {
        console.error('Database error in updateClient:', clientError);
        throw clientError;
      }

      // Delete existing contacts
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('client_id', id);
      
      if (deleteError) {
        console.error('Database error deleting contacts:', deleteError);
        throw deleteError;
      }

      // Create new contacts if they exist
      if (contacts && contacts.length > 0) {
        const contactsWithClientId = contacts.map((contact: any) => ({
          ...contact,
          client_id: id
        }));

        const { error: contactsError } = await supabase
          .from('contacts')
          .insert(contactsWithClientId);
        
        if (contactsError) {
          console.error('Database error creating new contacts:', contactsError);
          throw contactsError;
        }
      }

      // Return the client with its new contacts
      return {
        ...client,
        contacts: contacts || []
      };
    } catch (err) {
      console.error('Network error in updateClient:', err);
      throw new Error(`Failed to update client: ${getErrorMessage(err)}`);
    }
  },

  async deleteClient(id: string) {
    try {
      // Contacts will be automatically deleted due to ON DELETE CASCADE
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error in deleteClient:', error);
        throw error;
      }
    } catch (err) {
      console.error('Network error in deleteClient:', err);
      throw new Error(`Failed to delete client: ${getErrorMessage(err)}`);
    }
  },

  async uploadClientLogo(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `client-logos/${fileName}`;

      const { data, error } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (error) {
        console.error('Storage error uploading client logo:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading client logo:', err);
      throw new Error(`Failed to upload client logo: ${getErrorMessage(err)}`);
    }
  },

  // Users
  async getUsers() {
    try {
      console.log('Fetching users from database...');
      const { data: dbUsers, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Database error in getUsers:', error);
        throw error;
      }
      
      console.log('Successfully fetched users from database:', dbUsers?.length || 0);
      return dbUsers || [];
    } catch (err) {
      console.error('Network error in getUsers:', err);
      throw new Error(`Failed to fetch users: ${getErrorMessage(err)}`);
    }
  },

  async createUser(user: any) {
    try {
      console.log('Creating user in database:', user.username);
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: user.username,
          email: user.email,
          password: user.password,
          role: user.role,
          permissions: user.permissions || {},
          profile_picture: user.profilePicture || user.profile_picture,
          is_active: user.isActive !== undefined ? user.isActive : true,
          assigned_projects: user.assigned_projects || [],
          assigned_clients: user.assigned_clients || [],
         assigned_locations: user.assignedLocations || [],
          last_login: user.lastLogin || user.last_login || null
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Database error in createUser:', error);
        
        // Provide more specific error messages
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          throw new Error('Insufficient permissions to create user. Only administrators can create new users.');
        } else if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          throw new Error('A user with this username or email already exists.');
        }
        throw error;
      }
      
      console.log('User successfully created in database:', data.username);
      return data;
    } catch (err) {
      console.error('Network error in createUser:', err);
      
      // Re-throw with original message if it's already a custom error
      if (err.message?.includes('Insufficient permissions') || err.message?.includes('already exists')) {
        throw err;
      }
      
      throw new Error(`Failed to create user in database: ${getErrorMessage(err)}`);
    }
  },

  async updateUser(id: string, updates: any) {
    try {
     // Try to update with assigned_locations, but handle gracefully if column doesn't exist
     let updateData: any = {
       username: updates.username,
       email: updates.email,
       password: updates.password,
       role: updates.role,
       profile_picture: updates.profilePicture || updates.profile_picture,
      permissions: updates.permissions || {},
      is_active: updates.isActive !== undefined ? updates.isActive : true,
      assigned_projects: updates.assigned_projects || [],
      assigned_clients: updates.assigned_clients || [],
      last_login: updates.lastLogin || updates.last_login || null
     }

     // Only add assigned_locations if the updates has it
     if (updates.assignedLocations !== undefined) {
       updateData.assigned_locations = updates.assignedLocations;
     }

     const { data, error } = await supabase
       .from('users')
       .update(updateData)
       .eq('id', id)
       .select()
       .single();
      
      if (error) {
       // If it's a column not found error for assigned_locations, try without it
       if (error.message?.includes('assigned_locations') && error.message?.includes('schema cache')) {
         console.log('assigned_locations column not found, updating without it...');
         delete updateData.assigned_locations;
         
         const { data: retryData, error: retryError } = await supabase
           .from('users')
           .update(updateData)
           .eq('id', id)
           .select()
           .single();
         
         if (retryError) {
           console.error('Database error in updateUser (retry):', retryError);
           throw retryError;
         }
         
         console.log('User updated successfully without assigned_locations column');
         return retryData;
       }
       
        console.error('Database error in updateUser:', error);
        if (error.message?.includes('row-level security policy')) {
          throw new Error('Insufficient permissions to update this user.');
        }
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Network error in updateUser:', err);
      if (err.message?.includes('row-level security policy') || err.message?.includes('Insufficient permissions')) {
        throw new Error('You do not have permission to update this user.');
      }
      throw new Error(`Failed to update user: ${getErrorMessage(err)}`);
    }
  },

  async deleteUser(id: string) {
    try {
      // Delete user from database
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Database error in deleteUser:', error);
        if (error.message?.includes('row-level security policy')) {
          throw new Error('Insufficient permissions to delete this user.');
        }
        throw error;
      }
      
      // Also remove from localStorage
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedLocalUsers = localUsers.filter((u: any) => u.id !== id);
      localStorage.setItem('users', JSON.stringify(updatedLocalUsers));
      
    } catch (err) {
      console.error('Network error in deleteUser:', err);
      if (err.message?.includes('row-level security policy') || err.message?.includes('Insufficient permissions')) {
        throw new Error('You do not have permission to delete this user.');
      }
      // Fall back to localStorage only for network errors
      if (err.message?.includes('Network') || err.message?.includes('Failed to fetch')) {
        const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedLocalUsers = localUsers.filter((u: any) => u.id !== id);
        localStorage.setItem('users', JSON.stringify(updatedLocalUsers));
      } else {
        throw err;
      }
    }
  },

  // Access Codes
  async getAccessCodes() {
    try {
      const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Database error in getAccessCodes:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in getAccessCodes:', err);
     throw new Error(getErrorMessage(err));
    }
  },

  async createAccessCode(accessCode: any) {
    try {
      const { data, error } = await supabase
        .from('access_codes')
        .insert([{
          code: accessCode.code,
          created_by: accessCode.createdBy,
          expires_at: accessCode.expiresAt,
          is_active: accessCode.isActive,
          max_uses: accessCode.maxUses,
          verdeler_id: accessCode.verdeler_id,
          project_number: accessCode.project_number
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Database error in createAccessCode:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in createAccessCode:', err);
     throw new Error(getErrorMessage(err));
    }
  },

  async validateAccessCode(code: string, verdeler_id?: string) {
    try {
      console.log('🔍 VALIDATE: Starting validation for code:', code, 'verdeler_id:', verdeler_id);
      
      // Get all active codes with this code value
      const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true);
      
      console.log('🔍 VALIDATE: Database query result:', data, 'error:', error);
      
      if (error) {
        console.error('Database error in validateAccessCode:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('❌ VALIDATE: No codes found for:', code.toUpperCase());
        return { valid: false, reason: 'Invalid code' };
      }

      console.log('🔍 VALIDATE: Found codes:', data.length, 'codes');
      data.forEach((codeData, index) => {
        console.log(`  Code ${index + 1}:`, {
          code: codeData.code,
          verdeler_id: codeData.verdeler_id,
          expires_at: codeData.expires_at,
          is_active: codeData.is_active,
          usage_count: codeData.usage_count,
          max_uses: codeData.max_uses
        });
      });

      // Find a matching code based on verdeler_id
      let matchingCode = null;
      
      if (verdeler_id && verdeler_id !== 'undefined' && verdeler_id.trim() !== '') {
        console.log('🔍 VALIDATE: Looking for verdeler-specific code for:', verdeler_id);
        // First try to find a code specific to this verdeler
        matchingCode = data.find(codeData => {
          const matches = codeData.verdeler_id === verdeler_id.trim();
          console.log(`  Checking code ${codeData.code}: verdeler_id=${codeData.verdeler_id}, matches=${matches}`);
          return matches;
        });
        
        // If no verdeler-specific code found, try to find a global code (verdeler_id is null)
        if (!matchingCode) {
          console.log('🔍 VALIDATE: No verdeler-specific code found, looking for global code...');
          matchingCode = data.find(codeData => {
            const isGlobal = codeData.verdeler_id === null || codeData.verdeler_id === '';
            console.log(`  Checking global code ${codeData.code}: verdeler_id=${codeData.verdeler_id}, isGlobal=${isGlobal}`);
            return isGlobal;
          });
        }
      } else {
        console.log('🔍 VALIDATE: No verdeler_id provided, using first active code');
        // If no verdeler_id provided, use the first active code
        matchingCode = data[0];
      }

      if (!matchingCode) {
        console.log('❌ VALIDATE: No matching code found for verdeler:', verdeler_id);
        return { valid: false, reason: 'Code not valid for this verdeler' };
      }

      console.log('✅ VALIDATE: Found matching code:', matchingCode.code, 'for verdeler:', matchingCode.verdeler_id);

      // Check if code has expired
      const now = new Date();
      const expiresAt = new Date(matchingCode.expires_at);
      console.log('🕐 VALIDATE: Time check - now:', now.toISOString(), 'expires:', expiresAt.toISOString());
      
      if (now > expiresAt) {
        console.log('❌ VALIDATE: Code has expired');
        return { valid: false, reason: 'Code has expired' };
      }

      // Check usage limits
      if (matchingCode.max_uses && matchingCode.usage_count >= matchingCode.max_uses) {
        console.log('❌ VALIDATE: Usage limit exceeded:', matchingCode.usage_count, '>=', matchingCode.max_uses);
        return { valid: false, reason: 'Code usage limit exceeded' };
      }

      console.log('✅ VALIDATE: All checks passed, updating usage count...');

      // Update usage count
      const { error: updateError } = await supabase
        .from('access_codes')
        .update({
          usage_count: matchingCode.usage_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', matchingCode.id);

      if (updateError) {
        console.error('Error updating usage count:', updateError);
        // Don't fail validation for this, just log it
      }

      console.log('✅ VALIDATE: Code validation successful!');
      return { valid: true, data: matchingCode };
    } catch (err) {
      console.error('Network error in validateAccessCode:', err);
     throw new Error(getErrorMessage(err));
    }
  },

  async updateAccessCode(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('access_codes')
        .update({
          is_active: updates.isActive,
          expires_at: updates.expiresAt,
          max_uses: updates.maxUses
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Database error in updateAccessCode:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in updateAccessCode:', err);
     throw new Error(getErrorMessage(err));
    }
  },

  // Client Portals
  async getClientPortals() {
    try {
      const { data, error } = await supabase
        .from('client_portals')
        .select(`
          *,
          projects (
            project_number,
            client,
            location,
            description
          ),
          clients (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Database error in getClientPortals:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in getClientPortals:', err);
      throw new Error(`Failed to fetch client portals: ${getErrorMessage(err)}`);
    }
  },

  async createClientPortal(portalData: any) {
    try {
      const { data, error } = await supabase
        .from('client_portals')
        .insert([portalData])
        .select()
        .single();
      
      if (error) {
        console.error('Database error in createClientPortal:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in createClientPortal:', err);
      throw new Error(`Failed to create client portal: ${getErrorMessage(err)}`);
    }
  },

  async updateClientPortal(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('client_portals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Database error in updateClientPortal:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Network error in updateClientPortal:', err);
      throw new Error(`Failed to update client portal: ${getErrorMessage(err)}`);
    }
  },

  async deleteAccessCode(id: string) {
    try {
      const { error } = await supabase
        .from('access_codes')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Database error in deleteAccessCode:', error);
        throw error;
      }
    } catch (err) {
      console.error('Network error in deleteAccessCode:', err);
     throw new Error(getErrorMessage(err));
    }
  }
};