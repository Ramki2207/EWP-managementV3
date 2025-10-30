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
      ? 'https://ewp-management.nl' 
      : window.location.origin;
    return `${baseUrl}/client-portal/${accessCode}`;
  }

  // Create client portal when project status changes to "Levering"
  async createClientPortal(projectId: string, clientId?: string, sharedFolders?: string[]): Promise<ClientPortal> {
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

      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

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
        shared_folders: folders
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
  async updatePortalFolders(portalId: string, sharedFolders: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('client_portals')
        .update({ shared_folders: sharedFolders })
        .eq('id', portalId);

      if (error) throw error;
      console.log('Portal folders updated:', portalId);
    } catch (error) {
      console.error('Error updating portal folders:', error);
      throw new Error(`Failed to update portal folders: ${error.message}`);
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
De portal is 30 dagen toegankelijk vanaf vandaag. Wij adviseren u om alle documenten te downloaden voor uw archief.

VRAGEN?
Heeft u vragen over de levering of documentatie? Neem gerust contact met ons op:


Met vriendelijke groet,

EWP groep B.V.

---
Dit is een automatisch gegenereerd bericht. De portal link is uniek en persoonlijk voor uw project.
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

      const emailTemplate = this.generateEmailTemplate(project, portal, verdelers, customDeliveryDate);
      const emailSubject = `✅ Verdelers gereed voor levering - Project ${project.project_number}`;

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

      console.log('Delivery notification prepared:', {
        subject: emailSubject,
        portalUrl: portal.portal_url,
        accessCode: portal.access_code
      });

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

      // Check if portal has expired
      if (new Date() > new Date(data.expires_at)) {
        return null;
      }

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
  async getPortalVerdelers(projectId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('distributors')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

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

  // Reactivate expired portal
  async reactivatePortal(portalId: string): Promise<void> {
    try {
      // Extend expiration by 30 days from now
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + 30);

      const { error } = await supabase
        .from('client_portals')
        .update({
          is_active: true,
          expires_at: newExpiryDate.toISOString(),
          delivery_status: 'ready'
        })
        .eq('id', portalId);

      if (error) throw error;
    } catch (error) {
      console.error('Error reactivating portal:', error);
      throw error;
    }
  }

  // Deactivate expired portals (cleanup function)
  async deactivateExpiredPortals(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('client_portals')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true)
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error deactivating expired portals:', error);
      return 0;
    }
  }
}

export const clientPortalService = new ClientPortalService();