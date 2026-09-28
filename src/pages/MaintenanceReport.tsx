import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Camera, X, Clock, Package, Plus, Trash2, Calculator, PenTool, Check,
  FileText, Download, Eye, Building, User, Zap, Wrench, Lock, Shield
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase, dataService } from '../lib/supabase';
import SignaturePad from '../components/SignaturePad';

interface Material {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
}

interface WorkEntry {
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  description: string;
  materials: Material[];
  photos: string[];
}

interface ClientSignature {
  signature: string;
  clientName: string;
  signedAt: string;
  clientTitle?: string;
  clientCompany?: string;
}

type TabKey = 'client' | 'documents' | 'verdeler' | 'monteur';

const MaintenanceReport = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>('client');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [reportType, setReportType] = useState<'melding' | 'werkbon' | 'both'>('melding');
  const [showSignature, setShowSignature] = useState(false);
  const [clientSignature, setClientSignature] = useState<ClientSignature | null>(null);
  const [signatureData, setSignatureData] = useState({
    clientName: '',
    clientTitle: '',
    clientCompany: ''
  });
  const [formData, setFormData] = useState({
    type: 'maintenance',
    description: '',
    worker_name: '',
    photos: [] as string[]
  });
  const [werkbonData, setWerkbonData] = useState<WorkEntry>({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    totalHours: 0,
    description: '',
    materials: [],
    photos: []
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [publicDocuments, setPublicDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [verdelerData, setVerdelerData] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const verdeler_id = searchParams.get('verdeler_id');
  const project_number = searchParams.get('project_number');
  const kast_naam = searchParams.get('kast_naam');

  useEffect(() => {
    const loadProjectAndVerdelerInfo = async () => {
      if (!verdeler_id || !project_number) {
        setLoadingInfo(false);
        return;
      }
      try {
        setLoadingInfo(true);

        const { data: project } = await supabase
          .from('projects')
          .select('*')
          .eq('project_number', project_number)
          .single();

        if (project) {
          setProjectData(project);

          if (project.client) {
            const { data: client } = await supabase
              .from('clients')
              .select('*')
              .eq('name', project.client)
              .single();
            if (client) setClientData(client);
          }

          const { data: distributor } = await supabase
            .from('distributors')
            .select('*')
            .eq('distributor_id', verdeler_id)
            .eq('project_id', project.id)
            .single();
          if (distributor) setVerdelerData(distributor);
        }
      } catch (error) {
        console.error('Error loading project/verdeler info:', error);
      } finally {
        setLoadingInfo(false);
      }
    };

    loadProjectAndVerdelerInfo();
  }, [verdeler_id, project_number]);

  useEffect(() => {
    const loadPublicDocuments = async () => {
      if (!verdeler_id || !project_number) {
        setLoadingDocuments(false);
        return;
      }
      try {
        setLoadingDocuments(true);

        const { data: project } = await supabase
          .from('projects')
          .select('id')
          .eq('project_number', project_number)
          .single();

        if (!project) { setLoadingDocuments(false); return; }

        const { data: distributor } = await supabase
          .from('distributors')
          .select('id')
          .eq('distributor_id', verdeler_id)
          .eq('project_id', project.id)
          .single();

        if (!distributor) { setLoadingDocuments(false); return; }

        const folders = ['Installatie schema', 'Verdeler aanzicht'];
        const allDocs: any[] = [];

        for (const folder of folders) {
          const docs = await dataService.getDocuments(project.id, distributor.id, folder);
          if (docs && docs.length > 0) {
            for (const doc of docs) {
              if (doc.storage_path) {
                doc.content = dataService.getStorageUrl(doc.storage_path);
              } else if (!doc.content) {
                try { doc.content = await dataService.getDocumentContent(doc.id); } catch {}
              }
              allDocs.push({ ...doc, folder });
            }
          }
        }
        setPublicDocuments(allDocs);
      } catch (error) {
        console.error('Error loading public documents:', error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadPublicDocuments();
  }, [verdeler_id, project_number]);

  if (!verdeler_id || !project_number) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-[#1a1a1a] to-[#111] flex items-center justify-center p-4">
        <div className="bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-8 text-center">
          <Shield size={48} className="mx-auto text-red-400 mb-4" />
          <p className="text-gray-400 text-lg">Ongeldige verdeler informatie</p>
        </div>
      </div>
    );
  }

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) { toast.error('Voer een toegangscode in!'); return; }
    try {
      setIsValidating(true);
      const cleanPasscode = passcode.trim().toUpperCase();
      const validation = await dataService.validateAccessCode(cleanPasscode, verdeler_id || undefined);
      if (validation.valid) {
        setIsAuthenticated(true);
        toast.success('Toegangscode gevalideerd!');
      } else {
        toast.error(validation.reason || 'Ongeldige toegangscode!');
        setPasscode('');
      }
    } catch (error) {
      console.error('Error validating passcode:', error);
      toast.error('Er is een fout opgetreden bij het valideren van de toegangscode');
      setPasscode('');
    } finally {
      setIsValidating(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 15 * 1024 * 1024) { toast.error('Foto is te groot. Maximum grootte is 15MB'); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (typeof base64String === 'string' && base64String.startsWith('data:image/')) {
          setFormData(prev => ({ ...prev, photos: [...prev.photos, base64String] }));
        } else { toast.error('Ongeldig afbeeldingsformaat'); }
      };
      reader.onerror = () => { toast.error('Er is een fout opgetreden bij het laden van de foto'); };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const calculateHours = () => {
    if (werkbonData.startTime && werkbonData.endTime) {
      const start = new Date(`2000-01-01T${werkbonData.startTime}`);
      const end = new Date(`2000-01-01T${werkbonData.endTime}`);
      const hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
      setWerkbonData(prev => ({ ...prev, totalHours: Math.round(hours * 100) / 100 }));
    }
  };

  const handleAddMaterial = () => {
    setWerkbonData(prev => ({
      ...prev,
      materials: [...prev.materials, { id: Date.now().toString(), description: '', quantity: 1, unit: 'stuks', price: 0 }]
    }));
  };

  const handleRemoveMaterial = (materialId: string) => {
    setWerkbonData(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== materialId) }));
  };

  const handleMaterialChange = (materialId: string, field: keyof Material, value: any) => {
    setWerkbonData(prev => ({
      ...prev,
      materials: prev.materials.map(m => m.id === materialId ? { ...m, [field]: value } : m)
    }));
  };

  const handleWerkbonPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 15 * 1024 * 1024) { toast.error('Foto is te groot. Maximum grootte is 15MB'); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (typeof base64String === 'string' && base64String.startsWith('data:image/')) {
          setWerkbonData(prev => ({ ...prev, photos: [...prev.photos, base64String] }));
        } else { toast.error('Ongeldig afbeeldingsformaat'); }
      };
      reader.onerror = () => { toast.error('Er is een fout opgetreden bij het laden van de foto'); };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveWerkbonPhoto = (index: number) => {
    setWerkbonData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const getTotalMaterialCost = () => {
    return werkbonData.materials.reduce((total, m) => total + (m.quantity * m.price), 0);
  };

  const handleSignatureComplete = (signature: string) => {
    if (!signatureData.clientName.trim()) { toast.error('Vul de naam van de klant in voordat je ondertekent!'); return; }
    setClientSignature({
      signature,
      clientName: signatureData.clientName,
      clientTitle: signatureData.clientTitle,
      clientCompany: signatureData.clientCompany,
      signedAt: new Date().toISOString()
    });
    setShowSignature(false);
    toast.success('Handtekening succesvol opgeslagen!');
  };

  const handleClearSignature = () => {
    setClientSignature(null);
    setSignatureData({ clientName: '', clientTitle: '', clientCompany: '' });
    toast.success('Handtekening gewist');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (reportType === 'melding' && !formData.description.trim()) { toast.error('Vul een beschrijving in!'); return; }
    if (!formData.worker_name.trim()) { toast.error('Vul de naam van de monteur in!'); return; }
    if (reportType === 'werkbon' || reportType === 'both') {
      if (!werkbonData.startTime || !werkbonData.endTime || !werkbonData.description.trim()) { toast.error('Vul alle verplichte velden in voor de werkbon!'); return; }
      if (werkbonData.totalHours <= 0) { toast.error('Controleer de start- en eindtijd!'); return; }
    }
    if (reportType === 'both' && !formData.description.trim()) { toast.error('Vul een beschrijving in voor de melding!'); return; }
    if ((reportType === 'werkbon' || reportType === 'both') && !clientSignature) { toast.error('Klant handtekening is vereist voor werkbonnen!'); return; }

    try {
      setIsSubmitting(true);
      const notifications = [];

      if (reportType === 'both') {
        notifications.push({
          verdeler_id, project_number, kast_naam,
          type: 'melding_werkbon', status: 'pending',
          description: `${formData.description.trim()}\n\n--- WERKBON DETAILS ---\nWerktijden: ${werkbonData.startTime} - ${werkbonData.endTime} (${werkbonData.totalHours} uur)\nBeschrijving: ${werkbonData.description.trim()}\n\nMateriaal gebruikt:\n${werkbonData.materials.map(m => `- ${m.description}: ${m.quantity} ${m.unit} à €${m.price.toFixed(2)} = €${(m.quantity * m.price).toFixed(2)}`).join('\n')}\n\nTotale materiaalkosten: €${getTotalMaterialCost().toFixed(2)}`,
          worker_name: formData.worker_name.trim(),
          photos: [...formData.photos, ...werkbonData.photos],
          priority: 'medium', read: false,
          activity_log: [
            { id: Date.now().toString(), action: 'Melding aangemaakt', user_name: formData.worker_name.trim(), created_at: new Date().toISOString(), details: `Type: ${formData.type}` },
            { id: (Date.now() + 1).toString(), action: 'Werkbon aangemaakt', user_name: formData.worker_name.trim(), created_at: new Date().toISOString(), details: JSON.stringify({ date: werkbonData.date, startTime: werkbonData.startTime, endTime: werkbonData.endTime, totalHours: werkbonData.totalHours, materials: werkbonData.materials, totalMaterialCost: getTotalMaterialCost(), description: werkbonData.description, clientSignature }) },
            ...(clientSignature ? [{ id: (Date.now() + 2).toString(), action: 'Klant handtekening', user_name: clientSignature.clientName, created_at: clientSignature.signedAt, details: `Ondertekend door: ${clientSignature.clientName}${clientSignature.clientTitle ? ` (${clientSignature.clientTitle})` : ''}${clientSignature.clientCompany ? ` - ${clientSignature.clientCompany}` : ''}` }] : [])
          ]
        });
      } else if (reportType === 'melding') {
        notifications.push({
          verdeler_id, project_number, kast_naam,
          type: formData.type, status: 'pending',
          description: formData.description.trim(),
          worker_name: formData.worker_name.trim(),
          photos: formData.photos, priority: 'medium', read: false,
          activity_log: [{ id: Date.now().toString(), action: 'Melding aangemaakt', user_name: formData.worker_name.trim(), created_at: new Date().toISOString(), details: `Type: ${formData.type}` }]
        });
      } else if (reportType === 'werkbon') {
        notifications.push({
          verdeler_id, project_number, kast_naam,
          type: 'werkbon', status: 'pending',
          description: `WERKBON - ${werkbonData.description.trim()}\n\nWerktijden: ${werkbonData.startTime} - ${werkbonData.endTime} (${werkbonData.totalHours} uur)\n\nMateriaal gebruikt:\n${werkbonData.materials.map(m => `- ${m.description}: ${m.quantity} ${m.unit} à €${m.price.toFixed(2)} = €${(m.quantity * m.price).toFixed(2)}`).join('\n')}\n\nTotale materiaalkosten: €${getTotalMaterialCost().toFixed(2)}`,
          worker_name: formData.worker_name.trim(),
          photos: werkbonData.photos, priority: 'medium', read: false,
          activity_log: [
            { id: Date.now().toString(), action: 'Werkbon aangemaakt', user_name: formData.worker_name.trim(), created_at: new Date().toISOString(), details: JSON.stringify({ date: werkbonData.date, startTime: werkbonData.startTime, endTime: werkbonData.endTime, totalHours: werkbonData.totalHours, materials: werkbonData.materials, totalMaterialCost: getTotalMaterialCost(), clientSignature }) },
            ...(clientSignature ? [{ id: (Date.now() + 1).toString(), action: 'Klant handtekening', user_name: clientSignature.clientName, created_at: clientSignature.signedAt, details: `Ondertekend door: ${clientSignature.clientName}${clientSignature.clientTitle ? ` (${clientSignature.clientTitle})` : ''}${clientSignature.clientCompany ? ` - ${clientSignature.clientCompany}` : ''}` }] : [])
          ]
        });
      }

      const { error } = await supabase.from('notifications').insert(notifications).select();
      if (error) throw error;

      const successMessage = reportType === 'werkbon' ? 'Je werkbon is succesvol verstuurd!' :
                             reportType === 'both' ? 'Je melding en werkbon zijn succesvol verstuurd!' :
                             'Je melding is succesvol verstuurd!';
      toast.success(successMessage);
      setShowSuccessMessage(true);

      setFormData({ type: 'maintenance', description: '', worker_name: '', photos: [] });
      setWerkbonData({ date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', totalHours: 0, description: '', materials: [], photos: [] });
      setClientSignature(null);
      setSignatureData({ clientName: '', clientTitle: '', clientCompany: '' });

      setTimeout(() => { window.close(); }, 3000);
    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de melding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      toast.loading('Document downloaden...', { id: 'download' });
      if (doc.content.startsWith('data:')) {
        const linkElement = document.createElement('a');
        linkElement.href = doc.content;
        linkElement.download = doc.name;
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        toast.success('Document gedownload!', { id: 'download' });
      } else if (doc.content.startsWith('http')) {
        const response = await fetch(doc.content);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const linkElement = document.createElement('a');
        linkElement.href = blobUrl;
        linkElement.download = doc.name;
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        toast.success('Document gedownload!', { id: 'download' });
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Download mislukt', { id: 'download' });
    }
  };

  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-[#1a1a1a] to-[#111] flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <div className="bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-green-400" />
          </div>
          <h2 className="text-xl font-semibold mb-3 text-green-400">
            {reportType === 'werkbon' ? 'Werkbon succesvol verstuurd!' : reportType === 'both' ? 'Melding en werkbon succesvol verstuurd!' : 'Melding succesvol verstuurd!'}
          </h2>
          <p className="text-gray-400">Dit venster zal automatisch sluiten...</p>
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'client', label: 'Klant Informatie', icon: <Building size={18} /> },
    { key: 'documents', label: 'Publieke Documenten', icon: <FileText size={18} /> },
    { key: 'verdeler', label: 'Verdeler Informatie', icon: <Zap size={18} /> },
    { key: 'monteur', label: 'Monteur', icon: <Wrench size={18} /> },
  ];

  const InfoField = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <p className="text-white font-medium">{value || '-'}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-[#1a1a1a] to-[#111] p-4 md:p-8">
      <Toaster position="top-right" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <img
              src="/EWP-Logo_blauw.png"
              alt="EWP Logo"
              className="h-10 w-auto"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Verdeler Portaal</h1>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <span className="text-blue-400 font-medium">{project_number}</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-300">{verdeler_id}</span>
            {kast_naam && (
              <>
                <span className="text-gray-500">|</span>
                <span className="text-gray-300">{kast_naam}</span>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-3 md:p-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-lg transition-all text-sm md:text-base ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/20'
                    : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Klant Informatie */}
        {activeTab === 'client' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Building size={24} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Project Informatie</h2>
              </div>

              {loadingInfo ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-400">Laden...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InfoField label="Projectnummer" value={project_number} />
                  <InfoField label="Klant" value={projectData?.client} />
                  <div className="sm:col-span-2">
                    <InfoField label="Locatie" value={projectData?.location} />
                  </div>
                  <div className="sm:col-span-2">
                    <InfoField label="Beschrijving" value={projectData?.description} />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <User size={24} className="text-teal-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Contactgegevens</h2>
              </div>

              {loadingInfo ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : clientData ? (
                <div className="space-y-4">
                  {clientData.logo_url && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={clientData.logo_url}
                        alt={clientData.name || 'Client logo'}
                        className="max-h-16 w-auto object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <InfoField label="Bedrijf" value={clientData.name || projectData?.client} />
                  {clientData.visit_street && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Adres</label>
                      <p className="text-white font-medium">
                        {clientData.visit_street}<br />
                        {clientData.visit_postcode} {clientData.visit_city}
                      </p>
                    </div>
                  )}
                  {clientData.telefoonnummer && <InfoField label="Telefoon" value={clientData.telefoonnummer} />}
                  {clientData.email && <InfoField label="E-mail" value={clientData.email} />}
                  {clientData.contact_person && <InfoField label="Contactpersoon" value={clientData.contact_person} />}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User size={40} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">Geen klantgegevens beschikbaar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Publieke Documenten */}
        {activeTab === 'documents' && (
          <div className="bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Publieke Documenten</h2>
                <p className="text-sm text-gray-400">Installatie schema en Verdeler aanzicht</p>
              </div>
            </div>

            {loadingDocuments ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-400">Documenten laden...</span>
              </div>
            ) : publicDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicDocuments.map((doc: any) => (
                  <div key={doc.id} className="bg-[#2A303C] rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/5">
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                        <FileText size={20} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">{doc.name}</h4>
                        <p className="text-xs text-gray-400 mt-1">{doc.folder}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedDocument(doc)}
                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
                      >
                        <Eye size={14} />
                        <span>Bekijken</span>
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(doc)}
                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">Geen publieke documenten beschikbaar</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Verdeler Informatie */}
        {activeTab === 'verdeler' && (
          <div className="bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Zap size={24} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Verdeler Specificaties</h2>
                <p className="text-sm text-gray-400">{verdeler_id}{kast_naam ? ` - ${kast_naam}` : ''}</p>
              </div>
            </div>

            {loadingInfo ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-400">Laden...</span>
              </div>
            ) : verdelerData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#2A303C] rounded-xl p-4 border border-gray-700">
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Verdeler ID</label>
                  <p className="text-white font-semibold text-lg">{verdelerData.distributor_id}</p>
                </div>
                {verdelerData.kast_naam && (
                  <div className="bg-[#2A303C] rounded-xl p-4 border border-gray-700">
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Kastnaam</label>
                    <p className="text-white font-semibold text-lg">{verdelerData.kast_naam}</p>
                  </div>
                )}
                {verdelerData.stelsel && (
                  <div className="bg-[#2A303C] rounded-xl p-4 border border-gray-700">
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Stelsel</label>
                    <p className="text-white font-semibold text-lg">{verdelerData.stelsel}</p>
                  </div>
                )}
                {verdelerData.voeding && (
                  <div className="bg-[#2A303C] rounded-xl p-4 border border-gray-700">
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Voeding</label>
                    <p className="text-white font-semibold text-lg">{verdelerData.voeding}</p>
                  </div>
                )}
                {verdelerData.stuurspanning && (
                  <div className="bg-[#2A303C] rounded-xl p-4 border border-gray-700">
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Stuurspanning</label>
                    <p className="text-white font-semibold text-lg">{verdelerData.stuurspanning}</p>
                  </div>
                )}
                {verdelerData.ka_waarde && (
                  <div className="bg-[#2A303C] rounded-xl p-4 border border-gray-700">
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">kA Waarde</label>
                    <p className="text-white font-semibold text-lg">{verdelerData.ka_waarde}</p>
                  </div>
                )}
                {verdelerData.ip_waarde && (
                  <div className="bg-[#2A303C] rounded-xl p-4 border border-gray-700">
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">IP Waarde</label>
                    <p className="text-white font-semibold text-lg">{verdelerData.ip_waarde}</p>
                  </div>
                )}
                {verdelerData.voorbeveiliging && (
                  <div className="bg-[#2A303C] rounded-xl p-4 border border-gray-700">
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Voorbeveiliging</label>
                    <p className="text-white font-semibold text-lg">{verdelerData.voorbeveiliging}</p>
                  </div>
                )}
                {verdelerData.bouwjaar && (
                  <div className="bg-[#2A303C] rounded-xl p-4 border border-gray-700">
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Bouwjaar</label>
                    <p className="text-white font-semibold text-lg">{verdelerData.bouwjaar}</p>
                  </div>
                )}
                {verdelerData.fabrikant && (
                  <div className="bg-[#2A303C] rounded-xl p-4 border border-gray-700">
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Fabrikant</label>
                    <p className="text-white font-semibold text-lg">{verdelerData.fabrikant}</p>
                  </div>
                )}
                {verdelerData.status && (
                  <div className="bg-[#2A303C] rounded-xl p-4 border border-gray-700">
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Status</label>
                    <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">{verdelerData.status}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Zap size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">Geen verdeler specificaties beschikbaar</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Monteur */}
        {activeTab === 'monteur' && (
          <div>
            {!isAuthenticated ? (
              <div className="max-w-md mx-auto">
                <div className="bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock size={28} className="text-amber-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Toegangscode vereist</h2>
                    <p className="text-gray-400 text-sm">
                      Voer de toegangscode in die je van EWP Paneelbouw hebt ontvangen voor verdeler <strong className="text-white">{verdeler_id}</strong>.
                    </p>
                  </div>

                  <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Toegangscode</label>
                      <input
                        type="text"
                        className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-center text-lg uppercase tracking-widest focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                        placeholder="* * * * *"
                        maxLength={10}
                        required
                        disabled={isValidating}
                      />
                    </div>
                    <button
                      type="submit"
                      className={`w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white py-3 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20 ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isValidating}
                    >
                      {isValidating ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          <span>Valideren...</span>
                        </div>
                      ) : (
                        'Bevestigen'
                      )}
                    </button>
                  </form>

                  <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-xs text-blue-400 text-center">
                      Deze toegangscode is specifiek voor verdeler {verdeler_id} en tijdelijk geldig.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Wrench size={24} className="text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Onderhoudsmelding / Werkbon</h2>
                    <p className="text-sm text-gray-400">Registreer een melding, werkbon of beide</p>
                  </div>
                </div>

                {/* Verdeler Info Banner */}
                <div className="mb-6 p-4 bg-[#2A303C] rounded-xl border border-gray-700">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Verdeler ID</p>
                      <p className="font-medium text-white">{verdeler_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Project</p>
                      <p className="font-medium text-white">{project_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Kastnaam</p>
                      <p className="font-medium text-white">{kast_naam || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Report Type Selection */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">Type rapport</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setReportType('melding')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        reportType === 'melding'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-gray-700 bg-[#2A303C] text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="p-2 bg-red-500/20 rounded-lg"><Camera size={22} className="text-red-400" /></div>
                        <h4 className="font-medium text-sm">Melding</h4>
                        <p className="text-xs opacity-75 hidden sm:block">Onderhoud of inspectie</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportType('werkbon')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        reportType === 'werkbon'
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-gray-700 bg-[#2A303C] text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="p-2 bg-green-500/20 rounded-lg"><Clock size={22} className="text-green-400" /></div>
                        <h4 className="font-medium text-sm">Werkbon</h4>
                        <p className="text-xs opacity-75 hidden sm:block">Uren & materiaal</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportType('both')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        reportType === 'both'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-gray-700 bg-[#2A303C] text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                          <div className="flex items-center space-x-1">
                            <Camera size={18} className="text-amber-400" />
                            <Clock size={18} className="text-amber-400" />
                          </div>
                        </div>
                        <h4 className="font-medium text-sm">Beide</h4>
                        <p className="text-xs opacity-75 hidden sm:block">Melding + Werkbon</p>
                      </div>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Common: Naam monteur */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Naam monteur</label>
                    <input
                      type="text"
                      value={formData.worker_name}
                      onChange={(e) => setFormData({ ...formData, worker_name: e.target.value })}
                      className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="Voer je naam in"
                    />
                  </div>

                  {/* Melding Form */}
                  {(reportType === 'melding' || reportType === 'both') && (
                    <>
                      {reportType === 'both' && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                          <h3 className="text-lg font-semibold text-blue-400 mb-1">Melding Gegevens</h3>
                          <p className="text-sm text-gray-400">Registreer het type melding en beschrijving</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Type melding</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                          required
                        >
                          <option value="maintenance">Onderhoud</option>
                          <option value="repair">Reparatie</option>
                          <option value="inspection">Inspectie</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Beschrijving</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white h-32 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                          required
                          placeholder="Beschrijf de uitgevoerde werkzaamheden of het probleem"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Foto's</label>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
                            <label htmlFor="photo-upload" className="flex items-center space-x-2 px-4 py-2 bg-[#2A303C] border border-gray-600 rounded-lg text-gray-300 hover:border-blue-500 transition-colors cursor-pointer">
                              <Camera size={20} />
                              <span>Foto toevoegen</span>
                            </label>
                            <span className="text-sm text-gray-400">(Max. 15MB)</span>
                          </div>
                          {formData.photos.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {formData.photos.map((photo, index) => (
                                <div key={index} className="relative rounded-lg overflow-hidden">
                                  <img src={photo} alt={`Uploaded ${index + 1}`} className="w-full h-32 object-cover" />
                                  <button type="button" onClick={() => handleRemovePhoto(index)} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors">
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Werkbon Form */}
                  {(reportType === 'werkbon' || reportType === 'both') && (
                    <>
                      {reportType === 'both' && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                          <h3 className="text-lg font-semibold text-green-400 mb-1">Werkbon Gegevens</h3>
                          <p className="text-sm text-gray-400">Registreer werktijden, materialen en kosten</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Datum</label>
                          <input type="date" value={werkbonData.date} onChange={(e) => setWerkbonData({ ...werkbonData, date: e.target.value })} className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" required />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Start tijd</label>
                          <input type="time" value={werkbonData.startTime} onChange={(e) => { setWerkbonData({ ...werkbonData, startTime: e.target.value }); setTimeout(calculateHours, 100); }} className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" required />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Eind tijd</label>
                          <input type="time" value={werkbonData.endTime} onChange={(e) => { setWerkbonData({ ...werkbonData, endTime: e.target.value }); setTimeout(calculateHours, 100); }} className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" required />
                        </div>
                      </div>

                      <div className="bg-[#2A303C] p-4 rounded-xl border border-gray-700">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calculator size={20} className="text-blue-400" />
                          <span className="font-medium text-blue-400">Totale werktijd</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{werkbonData.totalHours} uur</div>
                        <p className="text-sm text-gray-400">Automatisch berekend</p>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Beschrijving werkzaamheden</label>
                        <textarea value={werkbonData.description} onChange={(e) => setWerkbonData({ ...werkbonData, description: e.target.value })} className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white h-32 focus:outline-none focus:border-blue-500 transition-colors" required placeholder="Beschrijf de uitgevoerde werkzaamheden in detail..." />
                      </div>

                      {/* Materials */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm text-gray-400">Gebruikte materialen</label>
                          <button type="button" onClick={handleAddMaterial} className="flex items-center space-x-2 px-3 py-2 bg-[#2A303C] border border-gray-600 rounded-lg text-gray-300 hover:border-blue-500 transition-colors text-sm">
                            <Plus size={16} />
                            <span>Materiaal toevoegen</span>
                          </button>
                        </div>
                        {werkbonData.materials.length > 0 && (
                          <div className="space-y-4">
                            {werkbonData.materials.map((material, index) => (
                              <div key={material.id} className="bg-[#2A303C] p-4 rounded-xl border border-gray-700">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-gray-300">Materiaal {index + 1}</h4>
                                  <button type="button" onClick={() => handleRemoveMaterial(material.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={16} /></button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="md:col-span-2">
                                    <label className="block text-xs text-gray-400 mb-1">Beschrijving</label>
                                    <input type="text" value={material.description} onChange={(e) => handleMaterialChange(material.id, 'description', e.target.value)} className="w-full bg-[#1E2530] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" placeholder="Bijv. Kabel 3x2.5mm" required />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1">Aantal</label>
                                    <input type="number" value={material.quantity} onChange={(e) => handleMaterialChange(material.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-[#1E2530] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" min="0" step="0.1" required />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1">Eenheid</label>
                                    <select value={material.unit} onChange={(e) => handleMaterialChange(material.id, 'unit', e.target.value)} className="w-full bg-[#1E2530] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors">
                                      <option value="stuks">Stuks</option>
                                      <option value="meter">Meter</option>
                                      <option value="kg">Kilogram</option>
                                      <option value="liter">Liter</option>
                                      <option value="uur">Uur</option>
                                      <option value="set">Set</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1">Prijs (EUR)</label>
                                    <input type="number" value={material.price} onChange={(e) => handleMaterialChange(material.id, 'price', parseFloat(e.target.value) || 0)} className="w-full bg-[#1E2530] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" min="0" step="0.01" placeholder="0.00" />
                                  </div>
                                  <div className="md:col-span-4 flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Subtotaal:</span>
                                    <span className="font-medium text-white">EUR {(material.quantity * material.price).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex justify-between items-center">
                              <span className="font-medium text-green-400">Totale materiaalkosten:</span>
                              <span className="text-xl font-bold text-green-400">EUR {getTotalMaterialCost().toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Werkbon Photos */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Foto's van werkzaamheden</label>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <input type="file" accept="image/*" onChange={handleWerkbonPhotoUpload} className="hidden" id="werkbon-photo-upload" />
                            <label htmlFor="werkbon-photo-upload" className="flex items-center space-x-2 px-4 py-2 bg-[#2A303C] border border-gray-600 rounded-lg text-gray-300 hover:border-blue-500 transition-colors cursor-pointer">
                              <Camera size={20} />
                              <span>Foto toevoegen</span>
                            </label>
                            <span className="text-sm text-gray-400">(Max. 15MB)</span>
                          </div>
                          {werkbonData.photos.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {werkbonData.photos.map((photo, index) => (
                                <div key={index} className="relative rounded-lg overflow-hidden">
                                  <img src={photo} alt={`Werkbon foto ${index + 1}`} className="w-full h-32 object-cover" />
                                  <button type="button" onClick={() => handleRemoveWerkbonPhoto(index)} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"><X size={16} /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Client Signature */}
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <PenTool size={20} className="text-green-400" />
                            <h3 className="text-lg font-semibold text-green-400">Klant Handtekening</h3>
                            <span className="text-red-400 text-sm">*Vereist</span>
                          </div>
                          {clientSignature && (
                            <button type="button" onClick={handleClearSignature} className="flex items-center space-x-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors">
                              <X size={16} /><span>Wis</span>
                            </button>
                          )}
                        </div>

                        {!clientSignature ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm text-gray-400 mb-1">Naam klant <span className="text-red-400">*</span></label>
                                <input type="text" className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" value={signatureData.clientName} onChange={(e) => setSignatureData({ ...signatureData, clientName: e.target.value })} placeholder="Volledige naam" required />
                              </div>
                              <div>
                                <label className="block text-sm text-gray-400 mb-1">Functie</label>
                                <input type="text" className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" value={signatureData.clientTitle} onChange={(e) => setSignatureData({ ...signatureData, clientTitle: e.target.value })} placeholder="Bijv. Technisch Manager" />
                              </div>
                              <div>
                                <label className="block text-sm text-gray-400 mb-1">Bedrijf</label>
                                <input type="text" className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" value={signatureData.clientCompany} onChange={(e) => setSignatureData({ ...signatureData, clientCompany: e.target.value })} placeholder="Bedrijfsnaam" />
                              </div>
                            </div>
                            <button type="button" onClick={() => setShowSignature(true)} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/20" disabled={!signatureData.clientName.trim()}>
                              <PenTool size={20} /><span>Ondertekenen</span>
                            </button>
                          </div>
                        ) : (
                          <div className="bg-[#1E2530] rounded-xl p-4">
                            <div className="flex items-center space-x-3 mb-4">
                              <Check size={20} className="text-green-400" />
                              <h4 className="font-medium text-green-400">Werkbon ondertekend</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2 text-sm">
                                <div><span className="text-gray-400">Ondertekend door:</span><span className="text-white font-medium ml-2">{clientSignature.clientName}</span></div>
                                {clientSignature.clientTitle && <div><span className="text-gray-400">Functie:</span><span className="text-white ml-2">{clientSignature.clientTitle}</span></div>}
                                {clientSignature.clientCompany && <div><span className="text-gray-400">Bedrijf:</span><span className="text-white ml-2">{clientSignature.clientCompany}</span></div>}
                                <div><span className="text-gray-400">Datum & tijd:</span><span className="text-white ml-2">{new Date(clientSignature.signedAt).toLocaleString('nl-NL')}</span></div>
                              </div>
                              <div>
                                <label className="block text-sm text-gray-400 mb-2">Handtekening</label>
                                <div className="bg-white rounded-lg p-2 border-2 border-green-500/30">
                                  <img src={clientSignature.signature} alt="Klant handtekening" className="w-full h-24 object-contain" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Bezig met verzenden...' :
                       reportType === 'werkbon' ? 'Werkbon indienen' :
                       reportType === 'both' ? 'Melding + Werkbon indienen' :
                       'Melding toevoegen'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedDocument(null)}>
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedDocument.name}</h2>
                <p className="text-sm text-gray-400">{selectedDocument.folder}</p>
              </div>
              <button onClick={() => setSelectedDocument(null)} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="bg-[#2A303C] rounded-lg p-4 mb-4">
              {selectedDocument.type?.startsWith('image/') ? (
                <img src={selectedDocument.content} alt={selectedDocument.name} className="max-h-[500px] object-contain mx-auto" />
              ) : selectedDocument.type === 'application/pdf' ? (
                <iframe src={selectedDocument.content} className="w-full h-[500px]" title={selectedDocument.name} />
              ) : (
                <div className="flex flex-col items-center justify-center p-8">
                  <FileText size={64} className="text-gray-400 mb-4" />
                  <p className="text-gray-400">Preview niet beschikbaar voor dit bestandstype</p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setSelectedDocument(null)} className="px-4 py-2 bg-[#2A303C] text-gray-300 rounded-lg hover:bg-[#353B48] transition-colors">Sluiten</button>
              <button onClick={() => handleDownloadDocument(selectedDocument)} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/20">
                <Download size={20} /><span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignature && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-2xl w-full border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-green-400">Klant Handtekening</h2>
              <button onClick={() => setShowSignature(false)} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="bg-[#2A303C] rounded-xl p-4 mb-6">
              <h3 className="font-medium text-white mb-2">Werkbon Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400">Verdeler:</span><span className="text-white ml-2">{verdeler_id}</span></div>
                <div><span className="text-gray-400">Project:</span><span className="text-white ml-2">{project_number}</span></div>
                <div><span className="text-gray-400">Monteur:</span><span className="text-white ml-2">{formData.worker_name}</span></div>
                <div><span className="text-gray-400">Datum:</span><span className="text-white ml-2">{new Date(werkbonData.date).toLocaleDateString('nl-NL')}</span></div>
                <div><span className="text-gray-400">Werktijd:</span><span className="text-white ml-2">{werkbonData.totalHours} uur</span></div>
                <div><span className="text-gray-400">Materiaalkosten:</span><span className="text-white ml-2">EUR {getTotalMaterialCost().toFixed(2)}</span></div>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">Door te ondertekenen bevestigt u dat de werkzaamheden naar tevredenheid zijn uitgevoerd en dat u akkoord gaat met de geregistreerde uren en materialen.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Naam <span className="text-red-400">*</span></label>
                  <input type="text" className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" value={signatureData.clientName} onChange={(e) => setSignatureData({ ...signatureData, clientName: e.target.value })} placeholder="Volledige naam" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Functie</label>
                  <input type="text" className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" value={signatureData.clientTitle} onChange={(e) => setSignatureData({ ...signatureData, clientTitle: e.target.value })} placeholder="Bijv. Technisch Manager" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bedrijf</label>
                  <input type="text" className="w-full bg-[#2A303C] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" value={signatureData.clientCompany} onChange={(e) => setSignatureData({ ...signatureData, clientCompany: e.target.value })} placeholder="Bedrijfsnaam" />
                </div>
              </div>
              <SignaturePad
                onSignatureComplete={handleSignatureComplete}
                onCancel={() => setShowSignature(false)}
                disabled={!signatureData.clientName.trim()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceReport;
