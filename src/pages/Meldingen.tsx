import React, { useState, useEffect } from 'react';
import {
  Bell, Search, AlertCircle, CheckCircle2, Clock, X,
  Filter, MessageSquare, UserCircle, Calendar, Building,
  FileDown, Eye, Edit, Wrench, ClipboardList, Package,
  ChevronRight, User, MapPin, Phone, Mail, Check
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import ewpLogo from '../assets/ewp-logo.png';
import ewp2Logo from '../assets/ewp2-logo.png';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { AVAILABLE_LOCATIONS } from '../types/userRoles';
import { useLocationFilter } from '../contexts/LocationFilterContext';

interface Notification {
  id: string;
  verdeler_id: string;
  project_number: string;
  kast_naam: string;
  type: 'maintenance' | 'repair' | 'inspection' | 'werkbon';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  description: string;
  created_at: string;
  completed_at?: string;
  worker_name: string;
  photos?: string[];
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  client_id?: string;
  client?: {
    id: string;
    name: string;
    visit_street?: string;
    visit_city?: string;
    visit_postcode?: string;
    contacts?: Array<{
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
    }>;
  };
  comments?: Comment[];
  activity_log?: ActivityLog[];
}

interface Comment {
  id: string;
  text: string;
  created_at: string;
  user_name: string;
}

interface ActivityLog {
  id: string;
  action: string;
  user_name: string;
  created_at: string;
  details?: string;
}

const Meldingen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const { currentUser } = useEnhancedPermissions();
  const { isLocationVisible } = useLocationFilter();

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        if (currentUser) {
          fetchNotifications();
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('project_number, client, location');

      const projectClientMap = projects?.reduce((acc: any, project) => {
        acc[project.project_number] = {
          client: project.client,
          location: project.location
        };
        return acc;
      }, {}) || {};

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select(`
          *,
          clients (
            id,
            name,
            visit_street,
            visit_city,
            visit_postcode,
            contacts (
              first_name,
              last_name,
              email,
              phone
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      let enrichedNotifications = notifications?.map(notification => ({
        ...notification,
        client: notification.clients || {
          name: projectClientMap[notification.project_number]?.client,
        },
        location: projectClientMap[notification.project_number]?.location
      })) || [];

      // Location filter for specific users (applies first)
      if (currentUser?.username === 'Lysander Koenraadt' ||
          currentUser?.username === 'Patrick Herman' ||
          currentUser?.username === 'Stefano de Weger') {
        const beforeFilter = enrichedNotifications.length;
        enrichedNotifications = enrichedNotifications.filter((notification: any) => {
          if (!isLocationVisible(notification.location)) {
            console.log(`📍 LOCATION FILTER: Hiding notification for project ${notification.project_number} (location: ${notification.location})`);
            return false;
          }
          return true;
        });
        console.log(`📍 LOCATION FILTER: Filtered ${beforeFilter} notifications down to ${enrichedNotifications.length} for ${currentUser.username}`);
      }

      // Filter by location based on user's assigned locations (admins see all)
      // Skip assignedLocations filter for users who use the location dropdown filter
      const usesDropdownFilter = currentUser?.username === 'Lysander Koenraadt' ||
                                  currentUser?.username === 'Patrick Herman' ||
                                  currentUser?.username === 'Stefano de Weger';

      if (!usesDropdownFilter && currentUser && currentUser.role !== 'admin' && currentUser.assignedLocations && currentUser.assignedLocations.length > 0) {
        const hasAllLocations =
          currentUser.assignedLocations.length >= AVAILABLE_LOCATIONS.length ||
          AVAILABLE_LOCATIONS.every(loc => currentUser.assignedLocations.includes(loc));

        if (!hasAllLocations) {
          const beforeFilter = enrichedNotifications.length;
          enrichedNotifications = enrichedNotifications.filter((notification: any) => {
            const notificationLocation = notification.location;
            // Only show notifications that have a location matching user's assigned locations
            const hasAccess = notificationLocation && currentUser.assignedLocations.includes(notificationLocation);

            if (!hasAccess) {
              console.log(`🌍 MELDINGEN FILTER: Hiding notification for project ${notification.project_number} (location: ${notificationLocation || 'none'}) from user ${currentUser.username}`);
            }

            return hasAccess;
          });
          console.log(`🌍 MELDINGEN FILTER: Filtered ${beforeFilter} notifications down to ${enrichedNotifications.length} for user ${currentUser.username}`);
        }
      }

      setNotifications(enrichedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Er is een fout opgetreden bij het laden van de meldingen');
    }
  };

  const handleStatusChange = async (notificationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
          activity_log: [
            ...(selectedNotification?.activity_log || []),
            {
              id: Date.now().toString(),
              action: 'Status gewijzigd',
              user_name: 'Current User',
              created_at: new Date().toISOString(),
              details: `Status gewijzigd naar ${newStatus}`
            }
          ]
        })
        .eq('id', notificationId);

      if (error) throw error;
      toast.success('Status bijgewerkt!');
      
      setNotifications(prev => prev.map(n => 
        n.id === notificationId 
          ? { 
              ...n, 
              status: newStatus as any, 
              completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
              activity_log: [
                ...(n.activity_log || []),
                {
                  id: Date.now().toString(),
                  action: 'Status gewijzigd',
                  user_name: 'Current User',
                  created_at: new Date().toISOString(),
                  details: `Status gewijzigd naar ${newStatus}`
                }
              ]
            }
          : n
      ));

      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(prev => prev ? {
          ...prev,
          status: newStatus as any,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
          activity_log: [
            ...(prev.activity_log || []),
            {
              id: Date.now().toString(),
              action: 'Status gewijzigd',
              user_name: 'Current User',
              created_at: new Date().toISOString(),
              details: `Status gewijzigd naar ${newStatus}`
            }
          ]
        } : null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Er is een fout opgetreden bij het bijwerken van de status');
    }
  };

  const isWerkbon = (notification: Notification) => {
    return notification.type === 'werkbon' || 
           notification.type === 'melding_werkbon' ||
           notification.description?.startsWith('WERKBON -') ||
           (notification.activity_log && notification.activity_log.some(activity => 
             activity.action === 'Werkbon aangemaakt'
           ));
  };

  const getClientSignature = (notification: Notification) => {
    if (!notification.activity_log) return null;
    
    const werkbonActivity = notification.activity_log.find(activity => 
      activity.action === 'Werkbon aangemaakt' && activity.details
    );
    
    if (!werkbonActivity || !werkbonActivity.details) return null;
    
    try {
      const werkbonData = JSON.parse(werkbonActivity.details);
      return werkbonData.clientSignature || null;
    } catch (error) {
      console.error('Error parsing werkbon data:', error);
      return null;
    }
  };

  const generateWerkbonPDF = async (notification: Notification) => {
    try {
      setGeneratingPDF(true);
      
      // Parse werkbon data from description and activity log
      const activityLog = notification.activity_log || [];
      const werkbonActivity = activityLog.find(activity => 
        activity.action === 'Werkbon aangemaakt' && activity.details
      );
      
      if (!werkbonActivity || !werkbonActivity.details) {
        toast.error('Geen werkbon gegevens gevonden voor deze melding');
        return;
      }
      
      const werkbonData = JSON.parse(werkbonActivity.details);
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      
      // Add EWP2 logo at top-right
      try {
        const ewp2LogoImg = new Image();
        ewp2LogoImg.crossOrigin = 'anonymous';
        ewp2LogoImg.onload = () => {
          try {
            pdf.addImage(ewp2LogoImg, 'PNG', pageWidth - 50, 10, 40, 20);
          } catch (logoError) {
            console.warn('Could not add ewp2-logo to PDF:', logoError);
          }
        };
        ewp2LogoImg.onerror = () => console.warn('EWP2 logo failed to load');
        ewp2LogoImg.src = ewp2Logo;
      } catch (logoError) {
        console.warn('EWP2 logo loading error:', logoError);
      }

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('WERKBON', 20, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Gegenereerd op: ${new Date().toLocaleDateString('nl-NL')}`, 20, yPosition);
      
      yPosition += 20;

      // Project Information
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Project Informatie', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Project: ${notification.project_number}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Verdeler: ${notification.verdeler_id}`, 20, yPosition);
      yPosition += 5;
      if (notification.kast_naam) {
        pdf.text(`Kastnaam: ${notification.kast_naam}`, 20, yPosition);
        yPosition += 5;
      }
      pdf.text(`Monteur: ${notification.worker_name}`, 20, yPosition);
      yPosition += 10;

      // Parse werkbon data
      let werkbonDataParsed = null;
      try {
        if (notification.activity_log) {
          const werkbonEntry = notification.activity_log.find((entry: any) => 
            entry.action === 'Werkbon aangemaakt' && entry.details
          );
          if (werkbonEntry && typeof werkbonEntry.details === 'string') {
            werkbonDataParsed = JSON.parse(werkbonEntry.details);
          }
        }
      } catch (error) {
        console.error('Error parsing werkbon data:', error);
      }

      if (werkbonDataParsed) {
        // Work Details
        pdf.setFontSize(14);
        pdf.text('Werkzaamheden', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.text(`Datum: ${new Date(werkbonDataParsed.date).toLocaleDateString('nl-NL')}`, 20, yPosition);
        yPosition += 5;
        pdf.text(`Werktijd: ${werkbonDataParsed.startTime} - ${werkbonDataParsed.endTime} (${werkbonDataParsed.totalHours} uur)`, 20, yPosition);
        yPosition += 5;
        
        // Description with word wrap
        const descriptionLines = pdf.splitTextToSize(werkbonDataParsed.description || 'Geen beschrijving', pageWidth - 40);
        pdf.text(descriptionLines, 20, yPosition);
        yPosition += descriptionLines.length * 5 + 10;

        // Materials table
        if (werkbonDataParsed.materials && werkbonDataParsed.materials.length > 0) {
          pdf.setFontSize(14);
          pdf.text('Gebruikte Materialen', 20, yPosition);
          yPosition += 10;
          
          // Table headers
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text('Beschrijving', 20, yPosition);
          pdf.text('Aantal', 100, yPosition);
          pdf.text('Eenheid', 130, yPosition);
          pdf.text('Prijs (EUR)', 155, yPosition);
          pdf.text('Totaal (EUR)', 185, yPosition);
          yPosition += 8;
          
          // Table content
          pdf.setTextColor(0, 0, 0);
          werkbonDataParsed.materials.forEach((material: any) => {
            const description = pdf.splitTextToSize(material.description, 75);
            pdf.text(description, 20, yPosition);
            pdf.text(material.quantity.toString(), 105, yPosition);
            pdf.text(material.unit, 130, yPosition);
            pdf.text(`€ ${material.price.toFixed(2)}`, 160, yPosition);
            pdf.text(`€ ${(material.quantity * material.price).toFixed(2)}`, 190, yPosition);
            yPosition += Math.max(description.length * 4, 6);
          });
          
          yPosition += 5;
          
          // Total cost
          pdf.setFontSize(11);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`Totale materiaalkosten: € ${werkbonDataParsed.totalMaterialCost?.toFixed(2) || '0.00'}`, 20, yPosition);
          yPosition += 15;
        }

        // Client signature section
        if (werkbonDataParsed.clientSignature) {
          // Check if we need a new page
          if (yPosition + 80 > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(14);
          pdf.setTextColor(0, 0, 0);
          pdf.text('Klant Goedkeuring', 20, yPosition);
          yPosition += 15;
          
          pdf.setFontSize(10);
          pdf.text(`Ondertekend door: ${werkbonDataParsed.clientSignature.clientName}`, 20, yPosition);
          yPosition += 5;
          
          if (werkbonDataParsed.clientSignature.clientTitle) {
            pdf.text(`Functie: ${werkbonDataParsed.clientSignature.clientTitle}`, 20, yPosition);
            yPosition += 5;
          }
          
          if (werkbonDataParsed.clientSignature.clientCompany) {
            pdf.text(`Bedrijf: ${werkbonDataParsed.clientSignature.clientCompany}`, 20, yPosition);
            yPosition += 5;
          }
          
          pdf.text(`Datum: ${new Date(werkbonDataParsed.clientSignature.signedAt).toLocaleString('nl-NL')}`, 20, yPosition);
          yPosition += 15;
          
          // Add signature image
          try {
            const signatureWidth = 120;
            const signatureHeight = 40;
            pdf.addImage(
              werkbonDataParsed.clientSignature.signature, 
              'PNG', 
              20, 
              yPosition, 
              signatureWidth, 
              signatureHeight
            );
            yPosition += signatureHeight + 15;
          } catch (error) {
            console.error('Error adding signature to PDF:', error);
            pdf.text('Handtekening kon niet worden toegevoegd', 20, yPosition);
            yPosition += 10;
          }
        }
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('© 2025 EWP Paneelbouw - Werkbon', 20, pageHeight - 10);
      
      // Generate filename
      const filename = `Werkbon_${notification.verdeler_id}_${new Date(werkbonData.date).toLocaleDateString('nl-NL').replace(/\//g, '-')}.pdf`;
      
      // Download
      pdf.save(filename);
      
      toast.success('Werkbon PDF gedownload!');
    } catch (error) {
      console.error('Error generating werkbon PDF:', error);
      toast.error('Er is een fout opgetreden bij het genereren van de werkbon PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedNotification || !newComment.trim()) return;

    try {
      const comment = {
        id: Date.now().toString(),
        text: newComment,
        created_at: new Date().toISOString(),
        user_name: 'Current User'
      };

      const updatedComments = [
        ...(selectedNotification.comments || []),
        comment
      ];

      const updatedActivityLog = [
        ...(selectedNotification.activity_log || []),
        {
          id: Date.now().toString(),
          action: 'Reactie toegevoegd',
          user_name: 'Current User',
          created_at: new Date().toISOString(),
          details: newComment
        }
      ];

      const { error } = await supabase
        .from('notifications')
        .update({ 
          comments: updatedComments,
          activity_log: updatedActivityLog
        })
        .eq('id', selectedNotification.id);

      if (error) throw error;

      setNewComment('');
      setSelectedNotification(prev => prev ? {
        ...prev,
        comments: updatedComments,
        activity_log: updatedActivityLog
      } : null);
      toast.success('Reactie toegevoegd!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Er is een fout opgetreden bij het toevoegen van de reactie');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.verdeler_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.project_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.worker_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'low':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'melding_werkbon') {
      return (
        <div className="flex items-center space-x-1">
          <ClipboardList size={14} className="text-blue-400" />
          <Package size={14} className="text-green-400" />
        </div>
      );
    }
    if (isWerkbon({ type } as Notification)) {
      return <ClipboardList size={16} className="text-blue-400" />;
    }
    switch (type) {
      case 'maintenance':
        return <Wrench size={16} className="text-orange-400" />;
      case 'repair':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'inspection':
        return <Eye size={16} className="text-blue-400" />;
      default:
        return <Bell size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen p-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">Meldingen</h1>
            <p className="text-gray-400">Beheer alle onderhouds- en servicemeldingen</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Filter size={20} />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Zoeken..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                className="input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Alle statussen</option>
                <option value="pending">In behandeling</option>
                <option value="in_progress">In uitvoering</option>
                <option value="completed">Voltooid</option>
                <option value="rejected">Afgewezen</option>
              </select>
            </div>
            <div>
              <select
                className="input-field"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">Alle prioriteiten</option>
                <option value="high">Hoog</option>
                <option value="medium">Gemiddeld</option>
                <option value="low">Laag</option>
              </select>
            </div>
            <div>
              <select
                className="input-field"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Alle types</option>
                <option value="maintenance">Onderhoud</option>
                <option value="repair">Reparatie</option>
                <option value="inspection">Inspectie</option>
                <option value="werkbon">Werkbon</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Table */}
      <div className="card p-6">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto pr-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="table-header text-left">Verdeler</th>
                <th className="table-header text-left">Project</th>
                <th className="table-header text-left">Type</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Prioriteit</th>
                <th className="table-header text-left">Monteur</th>
                <th className="table-header text-left">Datum</th>
                <th className="table-header text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.map((notification) => (
                <tr 
                  key={notification.id} 
                  className="table-row cursor-pointer"
                  onClick={() => setSelectedNotification(notification)}
                >
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="font-medium text-orange-400">{notification.verdeler_id}</span>
                    </div>
                  </td>
                  <td className="py-4 text-gray-300">{notification.project_number}</td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(notification.type)}
                      <span className="text-gray-300 capitalize">{notification.type}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(notification.status)}`}>
                      {notification.status === 'pending' ? 'In behandeling' :
                       notification.status === 'in_progress' ? 'In uitvoering' :
                       notification.status === 'completed' ? 'Voltooid' : 'Afgewezen'}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(notification.priority)}`}>
                      {notification.priority === 'high' ? 'Hoog' : 
                       notification.priority === 'medium' ? 'Gemiddeld' : 'Laag'}
                    </span>
                  </td>
                  <td className="py-4 text-gray-300">{notification.worker_name}</td>
                  <td className="py-4 text-gray-300">
                    {new Date(notification.created_at).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotification(notification);
                        }}
                        className="p-2 bg-[#2A303C] hover:bg-blue-500/20 rounded-lg transition-colors group"
                        title="Details bekijken"
                      >
                        <Eye size={16} className="text-gray-400 group-hover:text-blue-400" />
                      </button>
                      {isWerkbon(notification) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            generateWerkbonPDF(notification);
                          }}
                          disabled={generatingPDF}
                          className="p-2 bg-[#2A303C] hover:bg-green-500/20 rounded-lg transition-colors group"
                          title="Download werkbon PDF"
                        >
                          <FileDown size={16} className="text-gray-400 group-hover:text-green-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">Geen meldingen gevonden</p>
              <p className="text-gray-500 text-sm mt-2">Probeer een andere zoekterm of filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Details Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                {getTypeIcon(selectedNotification.type)}
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {selectedNotification.verdeler_id}
                  </h2>
                  <p className="text-gray-400">
                    {selectedNotification.project_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Status Management Card */}
                <div className="card p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Edit size={20} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-400">Status Beheer</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Status wijzigen</label>
                      <select
                        value={selectedNotification.status}
                        onChange={(e) => handleStatusChange(selectedNotification.id, e.target.value)}
                        className="input-field"
                      >
                        <option value="pending">In behandeling</option>
                        <option value="in_progress">In uitvoering</option>
                        <option value="completed">Voltooid</option>
                        <option value="rejected">Afgewezen</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Huidige prioriteit</label>
                      <span className={`inline-flex px-3 py-2 rounded-lg text-sm font-medium ${getPriorityColor(selectedNotification.priority)}`}>
                        {selectedNotification.priority === 'high' ? 'Hoog' : 
                         selectedNotification.priority === 'medium' ? 'Gemiddeld' : 'Laag'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description Card */}
                <div className="card p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <MessageSquare size={20} className="text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-400">Beschrijving</h3>
                  </div>
                  <div className="bg-[#2A303C] rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {selectedNotification.description}
                    </p>
                  </div>
                </div>

                {/* Photos Card */}
                {selectedNotification.photos && selectedNotification.photos.length > 0 && (
                  <div className="card p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Eye size={20} className="text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-purple-400">Foto's ({selectedNotification.photos.length})</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedNotification.photos.map((photo, index) => (
                        <div key={index} className="aspect-square bg-[#2A303C] rounded-lg overflow-hidden group cursor-pointer">
                          <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onClick={() => window.open(photo, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div className="card p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <MessageSquare size={20} className="text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-orange-400">Reacties</h3>
                  </div>
                  
                  {selectedNotification.comments && selectedNotification.comments.length > 0 && (
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                      {selectedNotification.comments.map((comment) => (
                        <div key={comment.id} className="bg-[#2A303C] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <UserCircle size={16} className="text-gray-400" />
                              <span className="font-medium text-white text-sm">{comment.user_name}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.created_at).toLocaleString('nl-NL')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Voeg een reactie toe..."
                      className="flex-1 input-field"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <MessageSquare size={16} />
                      <span>Verstuur</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Sidebar Information */}
              <div className="space-y-6">
                {/* Project Information Card */}
                <div className="card p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Building size={20} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-400">Project Info</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Project:</span>
                      <span className="font-medium text-white">{selectedNotification.project_number}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Verdeler:</span>
                      <span className="font-medium text-white">{selectedNotification.verdeler_id}</span>
                    </div>
                    {selectedNotification.kast_naam && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-700">
                        <span className="text-gray-400">Kastnaam:</span>
                        <span className="font-medium text-white">{selectedNotification.kast_naam}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Monteur:</span>
                      <span className="font-medium text-white">{selectedNotification.worker_name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400">Type:</span>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(selectedNotification.type)}
                        <span className="font-medium text-white capitalize">{selectedNotification.type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Information Card */}
                {selectedNotification.client && (
                  <div className="card p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <UserCircle size={20} className="text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-purple-400">Klant Info</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-700">
                        <span className="text-gray-400">Bedrijf:</span>
                        <span className="font-medium text-white">{selectedNotification.client.name}</span>
                      </div>
                      {selectedNotification.client.visit_street && (
                        <div className="py-2 border-b border-gray-700">
                          <span className="text-gray-400 block mb-1">Adres:</span>
                          <div className="text-white text-sm">
                            <div>{selectedNotification.client.visit_street}</div>
                            <div>{selectedNotification.client.visit_postcode} {selectedNotification.client.visit_city}</div>
                          </div>
                        </div>
                      )}
                      {selectedNotification.client.contacts && selectedNotification.client.contacts.length > 0 && (
                        <div className="py-2">
                          <span className="text-gray-400 block mb-2">Contactpersonen:</span>
                          <div className="space-y-2">
                            {selectedNotification.client.contacts.map((contact, index) => (
                              <div key={index} className="bg-[#2A303C] p-3 rounded-lg">
                                <div className="font-medium text-white text-sm">
                                  {contact.first_name} {contact.last_name}
                                </div>
                                {contact.email && (
                                  <div className="flex items-center text-xs text-gray-400 mt-1">
                                    <Mail size={12} className="mr-1" />
                                    {contact.email}
                                  </div>
                                )}
                                {contact.phone && (
                                  <div className="flex items-center text-xs text-gray-400 mt-1">
                                    <Phone size={12} className="mr-1" />
                                    {contact.phone}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline Card */}
                <div className="card p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gray-500/20 rounded-lg">
                      <Calendar size={20} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-400">Tijdlijn</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Aangemaakt:</span>
                      <span className="text-white text-sm">
                        {new Date(selectedNotification.created_at).toLocaleString('nl-NL')}
                      </span>
                    </div>
                    {selectedNotification.completed_at && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-400">Voltooid:</span>
                        <span className="text-white text-sm">
                          {new Date(selectedNotification.completed_at).toLocaleString('nl-NL')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Werkbon Actions */}
            {isWerkbon(selectedNotification) && (
              <div className="card p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <ClipboardList size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-400">Werkbon</h3>
                      <p className="text-sm text-gray-400">
                        {getClientSignature(selectedNotification) ? 'Ondertekend door klant' : 'Nog niet ondertekend'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => generateWerkbonPDF(selectedNotification)}
                    disabled={generatingPDF}
                    className={`btn-primary flex items-center space-x-2 ${
                      generatingPDF ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <FileDown size={16} />
                    <span>{generatingPDF ? 'Genereren...' : 'Download PDF'}</span>
                  </button>
                </div>
                {getClientSignature(selectedNotification) && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-400">
                      <Check size={16} />
                      <span className="text-sm">
                        Ondertekend door: {getClientSignature(selectedNotification).clientName}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activity Log */}
            {selectedNotification.activity_log && selectedNotification.activity_log.length > 0 && (
              <div className="card p-6 mt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Clock size={20} className="text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-yellow-400">Activiteiten Log</h3>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {selectedNotification.activity_log.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-4 bg-[#2A303C] rounded-lg">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{activity.action}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(activity.created_at).toLocaleString('nl-NL')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">Door: {activity.user_name}</p>
                        {activity.details && (
                          <p className="text-sm text-gray-300 bg-[#1E2530] p-2 rounded mt-2">{activity.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Meldingen;