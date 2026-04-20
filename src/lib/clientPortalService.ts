import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export interface ClientPortal {
  id: string;
  project_id: string;
  client_id?: string;
  access_code: string;
  portal_url: string;
  expires_at: string;
  is_active: boolean;
  email_sent: boolean;
  email_sent_at?: string;
  last_accessed?: string;
  access_count: number;
  delivery_status: 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'completed';
  created_at: string;
  shared_folders?: string[];
  shared_project_folders?: string[];
  verdeler_ids?: string[];
}

export interface DeliveryNotification {
  id: string;
  portal_id: string;
  email_template: string;
  email_subject: string;
  sent_at: string;
  delivery_date?: string;
  special_instructions?: string;
  created_at: string;
}

class ClientPortalService {
  // Generate a secure 6-digit access code
  generateAccessCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate portal URL
  generatePortalUrl(accessCode: string): string {
    // Use production URL for portal links
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname.includes('webcontainer')
      ? 'https://ewpgroep.nl'
      : window.location.origin;
    return `${baseUrl}/client-portal/${accessCode}`;
  }

  // Create client portal when project status changes to "Levering"
  async createClientPortal(projectId: string, clientId?: string, sharedFolders?: string[], verdelerIds?: string[]): Promise<ClientPortal> {
    try {
      // First check if portal already exists for this project
      const { data: existingPortals, error: checkError } = await supabase
        .from('client_portals')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true);

      if (checkError) {
        throw checkError;
      }

      if (existingPortals && existingPortals.length > 0) {
        console.log('Portal already exists for project:', projectId);
        return existingPortals[0];
      }

      const accessCode = this.generateAccessCode();
      const portalUrl = this.generatePortalUrl(accessCode);

      // Set expiration to far future date (unlimited access)
      const expiresAt = new Date('2099-12-31');

      // Use provided shared folders or default ones
      const defaultFolders = ['Verdeler aanzicht', 'Test certificaat', 'Installatie schema', 'Warmte berekening', 'RVS behuizing'];
      const folders = sharedFolders && sharedFolders.length > 0 ? sharedFolders : defaultFolders;

      const portalData = {
        project_id: projectId,
        client_id: clientId,
        access_code: accessCode,
        portal_url: portalUrl,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        delivery_status: 'preparing',
        shared_folders: folders,
        verdeler_ids: verdelerIds || null
      };

      const { data, error } = await supabase
        .from('client_portals')
        .insert([portalData])
        .select()
        .single();

      if (error) throw error;
      console.log('New portal created for project:', projectId);
      return data;
    } catch (error) {
      console.error('Error creating client portal:', error);
      throw new Error(`Failed to create client portal: ${error.message}`);
    }
  }

  // Update shared folders for an existing portal
  async updatePortalFolders(
    portalId: string,
    sharedFolders: string[],
    sharedProjectFolders: string[] = []
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('client_portals')
        .update({
          shared_folders: sharedFolders,
          shared_project_folders: sharedProjectFolders
        })
        .eq('id', portalId);

      if (error) throw error;
      console.log('Portal folders updated:', portalId);
    } catch (error) {
      console.error('Error updating portal folders:', error);
      throw new Error(`Failed to update portal folders: ${error.message}`);
    }
  }

  // Update selected verdelers for an existing portal
  async updatePortalVerdelers(portalId: string, verdelerIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('client_portals')
        .update({ verdeler_ids: verdelerIds })
        .eq('id', portalId);

      if (error) throw error;
      console.log('Portal verdelers updated:', portalId, verdelerIds);
    } catch (error) {
      console.error('Error updating portal verdelers:', error);
      throw new Error(`Failed to update portal verdelers: ${error.message}`);
    }
  }

  // Generate email template
  generateEmailTemplate(project: any, portal: ClientPortal, verdelers: any[], customDeliveryDate?: string): string {
    let deliveryDateText = 'Zoals afgesproken';
    
    if (customDeliveryDate) {
      const deliveryDate = new Date(customDeliveryDate);
      deliveryDateText = deliveryDate.toLocaleDateString('nl-NL', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric'
      });
    }

    return `
Beste ${project.client || 'klant'},

Goed nieuws! Uw verdelers voor project ${project.project_number} zijn succesvol getest en gereed voor levering.

LEVERING DETAILS:
- Project: ${project.project_number}
- Locatie: ${project.location || 'Zoals afgesproken'}
- Verwachte leverdatum: ${deliveryDateText}
- Aantal verdelers: ${verdelers.length}

DOCUMENTATIE PORTAL:
Voor uw gemak hebben wij alle testdocumenten, certificaten en technische informatie beschikbaar gesteld in een beveiligde online portal.

Portal toegang:
Link: ${portal.portal_url}
Toegangscode: ${portal.access_code}

In de portal vindt u:
- Alle testcertificaten en keuringsrapporten
- Technische specificaties per verdeler
- Installatie-instructies en handleidingen

TOEGANG:
De portal blijft onbeperkt toegankelijk voor uw project. U kunt altijd terugkeren om documenten te raadplegen of te downloaden.

Met vriendelijke groet,

EWP Paneelbouw

www.ewp-paneelbouw.nl
levering@ewpgroep.nl

EWP Paneelbouw Utrecht
Gildenstraat | 4143HS Leerdam
k.v.k. 91074460
    `.trim();
  }

  // Send delivery notification email
  async sendDeliveryNotification(portalId: string, project: any, verdelers: any[], customDeliveryDate?: string): Promise<void> {
    try {
      // Get portal data
      const { data: portal, error: portalError } = await supabase
        .from('client_portals')
        .select('*')
        .eq('id', portalId)
        .single();

      if (portalError) throw portalError;

      // Helper function to validate email format
      const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email?.trim());
      };

      // Get email - prioritize project contact person email, fallback to client email
      let recipientEmail = null;

      // First, try to get the contact person email directly from the project (with validation)
      if (project.contactpersoon_email && isValidEmail(project.contactpersoon_email)) {
        recipientEmail = project.contactpersoon_email;
        console.log('Using project contact person email:', recipientEmail);
      }

      // If no direct email, try to find it in the client's contacts by matching the contact person name
      const contactPersonName = project.contactpersoon || project.contact_person;
      if (!recipientEmail && portal.client_id && contactPersonName) {
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('first_name, last_name, email')
          .eq('client_id', portal.client_id);

        if (contactsError) {
          console.error('Error fetching client contacts:', contactsError);
        } else if (contacts && Array.isArray(contacts)) {
          // Look for a contact that matches the contact person name (case-insensitive and punctuation-insensitive)
          const normalizeString = (str: string) => str.toLowerCase().replace(/[.\s]/g, '');

          const contactPerson = contacts.find((contact: any) => {
            const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
            const firstName = contact.first_name || '';
            const lastName = contact.last_name || '';

            // Normalize all strings for comparison (remove spaces and periods)
            const normalizedFullName = normalizeString(fullName);
            const normalizedFirstName = normalizeString(firstName);
            const normalizedLastName = normalizeString(lastName);
            const normalizedSearch = normalizeString(contactPersonName);

            // Match full name, first name, or last name
            return normalizedFullName === normalizedSearch ||
                   normalizedFirstName === normalizedSearch ||
                   normalizedLastName === normalizedSearch;
          });

          if (contactPerson?.email) {
            recipientEmail = contactPerson.email;
            console.log('Found contact person email from contacts table:', recipientEmail);
          }
        }
      }

      // If no contact person email, try to get client email
      if (!recipientEmail && portal.client_id) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('email, name')
          .eq('id', portal.client_id)
          .maybeSingle();

        if (clientError) {
          console.error('Error fetching client email by ID:', clientError);
        } else if (client?.email) {
          recipientEmail = client.email;
          console.log('Using client email from client_id:', recipientEmail);
        }
      }

      // If still no email, try finding client by name
      if (!recipientEmail) {
        const { data: clients, error: clientError } = await supabase
          .from('clients')
          .select('email, name')
          .eq('name', project.client)
          .limit(1)
          .maybeSingle();

        if (clientError) {
          console.error('Error fetching client email by name:', clientError);
        } else if (clients?.email) {
          recipientEmail = clients.email;
          console.log('Using client email from client name:', recipientEmail);
        }
      }

      if (!recipientEmail) {
        throw new Error('Geen email adres gevonden. Voeg een email adres toe aan de contactpersoon van het project of aan de klant.');
      }

      const emailTemplate = this.generateEmailTemplate(project, portal, verdelers, customDeliveryDate);
      const emailSubject = `Verdelers gereed voor levering - Project ${project.project_number}`;

      const siteUrl = window.location.origin;
      const logoUrl = `${siteUrl}/EWP%20logo%20test.png`;

      let deliveryDateText = 'Zoals afgesproken';
      if (customDeliveryDate) {
        const deliveryDate = new Date(customDeliveryDate);
        deliveryDateText = deliveryDate.toLocaleDateString('nl-NL', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      const emailHtml = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Logo -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <img src="${logoUrl}" alt="EWP Paneelbouw" width="120" style="display:block;height:auto;border:0;" />
            </td>
          </tr>
          <!-- Main Content Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:8px;border:1px solid #e2e5e9;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <!-- Blue top accent -->
                <tr>
                  <td style="height:4px;background-color:#0066cc;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:36px 40px;">
                    <!-- Greeting -->
                    <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#1a1a1a;">
                      Beste ${project.client || 'klant'},
                    </p>
                    <p style="margin:0 0 28px 0;font-size:16px;line-height:1.6;color:#1a1a1a;">
                      Goed nieuws! Uw verdelers voor project <strong>${project.project_number}</strong> zijn succesvol getest en gereed voor levering.
                    </p>

                    <!-- Delivery Details -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background-color:#f8f9fb;border-radius:6px;border:1px solid #e8eaed;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:#0066cc;text-transform:uppercase;letter-spacing:0.5px;">Levering Details</p>
                          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                            <tr>
                              <td style="padding:4px 0;font-size:14px;color:#555;width:160px;">Project:</td>
                              <td style="padding:4px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${project.project_number}</td>
                            </tr>
                            <tr>
                              <td style="padding:4px 0;font-size:14px;color:#555;width:160px;">Locatie:</td>
                              <td style="padding:4px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${project.location || 'Zoals afgesproken'}</td>
                            </tr>
                            <tr>
                              <td style="padding:4px 0;font-size:14px;color:#555;width:160px;">Verwachte leverdatum:</td>
                              <td style="padding:4px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${deliveryDateText}</td>
                            </tr>
                            <tr>
                              <td style="padding:4px 0;font-size:14px;color:#555;width:160px;">Aantal verdelers:</td>
                              <td style="padding:4px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${verdelers.length}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Documentation Portal -->
                    <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.5px;">Documentatie Portal</p>
                    <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#444;">
                      Voor uw gemak hebben wij alle testdocumenten, certificaten en technische informatie beschikbaar gesteld in een beveiligde online portal.
                    </p>

                    <!-- Portal Access Box -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background-color:#eef4ff;border-radius:6px;border:1px solid #c5d9f5;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#0066cc;text-transform:uppercase;letter-spacing:0.5px;">Portal Toegang</p>
                          <p style="margin:0 0 6px 0;font-size:14px;color:#1a1a1a;">
                            Link: <a href="${portal.portal_url}" style="color:#0066cc;text-decoration:underline;">${portal.portal_url}</a>
                          </p>
                          <p style="margin:0;font-size:14px;color:#1a1a1a;">
                            Toegangscode: <strong style="font-size:16px;color:#0066cc;">${portal.access_code}</strong>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- What you'll find -->
                    <p style="margin:0 0 10px 0;font-size:14px;color:#444;">In de portal vindt u:</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="padding:3px 10px 3px 0;font-size:14px;color:#0066cc;vertical-align:top;">&#8226;</td>
                        <td style="padding:3px 0;font-size:14px;color:#444;">Alle testcertificaten en keuringsrapporten</td>
                      </tr>
                      <tr>
                        <td style="padding:3px 10px 3px 0;font-size:14px;color:#0066cc;vertical-align:top;">&#8226;</td>
                        <td style="padding:3px 0;font-size:14px;color:#444;">Technische specificaties per verdeler</td>
                      </tr>
                      <tr>
                        <td style="padding:3px 10px 3px 0;font-size:14px;color:#0066cc;vertical-align:top;">&#8226;</td>
                        <td style="padding:3px 0;font-size:14px;color:#444;">Installatie-instructies en handleidingen</td>
                      </tr>
                    </table>

                    <p style="margin:0 0 28px 0;font-size:14px;line-height:1.6;color:#444;">
                      De portal blijft onbeperkt toegankelijk voor uw project. U kunt altijd terugkeren om documenten te raadplegen of te downloaden.
                    </p>

                    <!-- Divider -->
                    <hr style="border:none;border-top:1px solid #e2e5e9;margin:0 0 24px 0;" />

                    <!-- Signature -->
                    <p style="margin:0 0 16px 0;font-size:14px;color:#1a1a1a;">Met vriendelijke groet,</p>
                    <p style="margin:0 0 14px 0;font-size:15px;font-weight:700;color:#1a1a1a;">EWP Paneelbouw</p>
                    <p style="margin:0 0 4px 0;font-size:13px;">
                      <a href="https://www.ewp-paneelbouw.nl" style="color:#0066cc;text-decoration:none;">www.ewp-paneelbouw.nl</a>
                    </p>
                    <p style="margin:0 0 14px 0;font-size:13px;">
                      <a href="mailto:levering@ewpgroep.nl" style="color:#0066cc;text-decoration:none;">levering@ewpgroep.nl</a>
                    </p>
                    <p style="margin:0 0 2px 0;font-size:13px;font-weight:700;color:#0066cc;">EWP Paneelbouw Utrecht</p>
                    <p style="margin:0 0 2px 0;font-size:13px;color:#555;">Gildenstraat | 4143HS Leerdam</p>
                    <p style="margin:0 0 0 0;font-size:13px;color:#555;">k.v.k. 91074460</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer Banner -->
          <tr>
            <td style="padding:24px 0 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:6px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 24px;" align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 16px;font-size:13px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                          <span style="color:#f59e0b;">EW</span><span style="color:#ef4444;">P</span><span style="color:#ffffff;"> | GROEP</span>
                        </td>
                        <td style="padding:0 16px;font-size:13px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                          <span style="color:#f59e0b;">EW</span><span style="color:#ef4444;">P</span><span style="color:#ffffff;"> | PANEELBOUW</span>
                        </td>
                        <td style="padding:0 16px;font-size:13px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                          <span style="color:#f59e0b;">EW</span><span style="color:#ef4444;">P</span><span style="color:#ffffff;"> | SERVICES</span>
                        </td>
                        <td style="padding:0 16px;font-size:13px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                          <span style="color:#f59e0b;">EW</span><span style="color:#ef4444;">P</span><span style="color:#ffffff;"> | MEET &amp; REGEL</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailSubject,
          html: emailHtml,
          text: emailTemplate,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.error || 'Email kon niet worden verzonden');
      }

      // Save notification record
      const { error: notificationError } = await supabase
        .from('delivery_notifications')
        .insert([{
          portal_id: portalId,
          email_template: emailTemplate,
          email_subject: emailSubject,
          delivery_date: customDeliveryDate || null
        }]);

      if (notificationError) throw notificationError;

      // Update portal as email sent
      const { error: updateError } = await supabase
        .from('client_portals')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          delivery_status: 'ready'
        })
        .eq('id', portalId);

      if (updateError) throw updateError;

      console.log('Delivery notification sent successfully to:', recipientEmail);

    } catch (error) {
      console.error('Error sending delivery notification:', error);
      throw new Error(`Failed to send delivery notification: ${error.message}`);
    }
  }

  // Get client portal by access code
  async getPortalByAccessCode(accessCode: string): Promise<ClientPortal | null> {
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
            name,
            visit_street,
            visit_city,
            visit_postcode,
            logo_url
          )
        `)
        .eq('access_code', accessCode)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }

      // No expiration check - portals have unlimited access
      return data;
    } catch (error) {
      console.error('Error getting portal by access code:', error);
      return null;
    }
  }

  // Update portal access tracking
  async trackPortalAccess(portalId: string): Promise<void> {
    try {
      // First get the current access count
      const { data: currentData, error: fetchError } = await supabase
        .from('client_portals')
        .select('access_count')
        .eq('id', portalId)
        .single();

      if (fetchError) throw fetchError;

      // Then update with incremented count
      const { error } = await supabase
        .from('client_portals')
        .update({
          last_accessed: new Date().toISOString(),
          access_count: (currentData?.access_count || 0) + 1
        })
        .eq('id', portalId);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking portal access:', error);
    }
  }

  // Get project verdelers for client portal
  // If verdelerIds is provided, only return those specific verdelers
  // If verdelerIds is null/empty, return all verdelers (legacy behavior)
  async getPortalVerdelers(projectId: string, verdelerIds?: string[] | null): Promise<any[]> {
    try {
      let query = supabase
        .from('distributors')
        .select('*')
        .eq('project_id', projectId)
        .neq('status', 'Vervallen')
        .order('created_at', { ascending: true });

      // If specific verdeler IDs are provided, filter by them
      if (verdelerIds && verdelerIds.length > 0) {
        query = query.in('id', verdelerIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting portal verdelers:', error);
      return [];
    }
  }

  // Get all client portals (for admin management)
  async getAllClientPortals(): Promise<ClientPortal[]> {
    try {
      const { data, error } = await supabase
        .from('client_portals')
        .select(`
          *,
          projects (
            project_number,
            client,
            location
          ),
          clients (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting client portals:', error);
      return [];
    }
  }

  // Update delivery status
  async updateDeliveryStatus(portalId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('client_portals')
        .update({ delivery_status: status })
        .eq('id', portalId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  }

  // Reactivate portal (now only updates status, no expiration changes)
  async reactivatePortal(portalId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('client_portals')
        .update({
          is_active: true,
          delivery_status: 'ready'
        })
        .eq('id', portalId);

      if (error) throw error;
    } catch (error) {
      console.error('Error reactivating portal:', error);
      throw error;
    }
  }

  // Legacy function - no longer deactivates portals (unlimited access)
  async deactivateExpiredPortals(): Promise<number> {
    console.log('Portal expiration disabled - all portals have unlimited access');
    return 0;
  }
}

export const clientPortalService = new ClientPortalService();