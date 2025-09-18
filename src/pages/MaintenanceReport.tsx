import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, X, Clock, Package, Plus, Trash2, Calculator, PenTool, Check } from 'lucide-react';
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

const MaintenanceReport = () => {
  const [searchParams] = useSearchParams();
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

  // Get URL parameters
  const verdeler_id = searchParams.get('verdeler_id');
  const project_number = searchParams.get('project_number');
  const kast_naam = searchParams.get('kast_naam');

  // Debug URL parameters
  console.log('🔍 MAINTENANCE URL PARAMS:', {
    verdeler_id,
    project_number,
    kast_naam,
    fullURL: window.location.href,
    searchParams: Object.fromEntries(searchParams.entries())
  });

  // Check required info from URL
  if (!verdeler_id || !project_number) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <p className="text-center text-gray-400">Ongeldige verdeler informatie</p>
        </div>
      </div>
    );
  }

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passcode.trim()) {
      toast.error('Voer een toegangscode in!');
      return;
    }

    try {
      setIsValidating(true);
      
      const cleanPasscode = passcode.trim().toUpperCase();
      console.log('🔍 MAINTENANCE: Validating passcode:', cleanPasscode);
      console.log('🔍 MAINTENANCE: For verdeler_id:', verdeler_id);
      console.log('🔍 MAINTENANCE: URL search params:', Object.fromEntries(searchParams.entries()));
      
      // Validate the access code with verdeler-specific validation
      const validation = await dataService.validateAccessCode(cleanPasscode, verdeler_id || undefined);
      
      console.log('🔍 MAINTENANCE: Validation result:', validation);
      
      if (validation.valid) {
        setIsAuthenticated(true);
        toast.success('Toegangscode gevalideerd!');
      } else {
        console.log('❌ MAINTENANCE: Validation failed:', validation.reason);
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

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Foto is te groot. Maximum grootte is 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64String = reader.result as string;
          if (typeof base64String === 'string' && base64String.startsWith('data:image/')) {
            setFormData(prev => ({
              ...prev,
              photos: [...prev.photos, base64String]
            }));
          } else {
            throw new Error('Invalid image format');
          }
        } catch (error) {
          console.error('Error processing photo:', error);
          toast.error('Er is een fout opgetreden bij het verwerken van de foto');
        }
      };

      reader.onerror = () => {
        toast.error('Er is een fout opgetreden bij het laden van de foto');
      };

      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const calculateHours = () => {
    if (werkbonData.startTime && werkbonData.endTime) {
      const start = new Date(`2000-01-01T${werkbonData.startTime}`);
      const end = new Date(`2000-01-01T${werkbonData.endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.max(0, diffMs / (1000 * 60 * 60));
      setWerkbonData(prev => ({ ...prev, totalHours: Math.round(hours * 100) / 100 }));
    }
  };

  const handleAddMaterial = () => {
    const newMaterial: Material = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: 'stuks',
      price: 0
    };
    setWerkbonData(prev => ({
      ...prev,
      materials: [...prev.materials, newMaterial]
    }));
  };

  const handleRemoveMaterial = (materialId: string) => {
    setWerkbonData(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m.id !== materialId)
    }));
  };

  const handleMaterialChange = (materialId: string, field: keyof Material, value: any) => {
    setWerkbonData(prev => ({
      ...prev,
      materials: prev.materials.map(m => 
        m.id === materialId ? { ...m, [field]: value } : m
      )
    }));
  };

  const handleWerkbonPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Foto is te groot. Maximum grootte is 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64String = reader.result as string;
          if (typeof base64String === 'string' && base64String.startsWith('data:image/')) {
            setWerkbonData(prev => ({
              ...prev,
              photos: [...prev.photos, base64String]
            }));
          } else {
            throw new Error('Invalid image format');
          }
        } catch (error) {
          console.error('Error processing photo:', error);
          toast.error('Er is een fout opgetreden bij het verwerken van de foto');
        }
      };

      reader.onerror = () => {
        toast.error('Er is een fout opgetreden bij het laden van de foto');
      };

      reader.readAsDataURL(file);
    }
  };

  const handleRemoveWerkbonPhoto = (index: number) => {
    setWerkbonData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const getTotalMaterialCost = () => {
    return werkbonData.materials.reduce((total, material) => 
      total + (material.quantity * material.price), 0
    );
  };

  const handleSignatureComplete = (signature: string) => {
    if (!signatureData.clientName.trim()) {
      toast.error('Vul de naam van de klant in voordat je ondertekent!');
      return;
    }

    const signatureInfo: ClientSignature = {
      signature,
      clientName: signatureData.clientName,
      clientTitle: signatureData.clientTitle,
      clientCompany: signatureData.clientCompany,
      signedAt: new Date().toISOString()
    };

    setClientSignature(signatureInfo);
    setShowSignature(false);
    toast.success('Handtekening succesvol opgeslagen!');
  };

  const handleClearSignature = () => {
    setClientSignature(null);
    setSignatureData({
      clientName: '',
      clientTitle: '',
      clientCompany: ''
    });
    toast.success('Handtekening gewist');
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (reportType === 'melding' && !formData.description.trim()) {
      toast.error('Vul een beschrijving in!');
      return;
    }

    if (!formData.worker_name.trim()) {
      toast.error('Vul de naam van de monteur in!');
      return;
    }

    if (reportType === 'werkbon' || reportType === 'both') {
      if (!werkbonData.startTime || !werkbonData.endTime || !werkbonData.description.trim()) {
        toast.error('Vul alle verplichte velden in voor de werkbon!');
        return;
      }
      if (werkbonData.totalHours <= 0) {
        toast.error('Controleer de start- en eindtijd!');
        return;
      }
    }

    if (reportType === 'both' && !formData.description.trim()) {
      toast.error('Vul een beschrijving in voor de melding!');
      return;
    }

    // For werkbon, require client signature
    if ((reportType === 'werkbon' || reportType === 'both') && !clientSignature) {
      toast.error('Klant handtekening is vereist voor werkbonnen!');
      return;
    }

    try {
      setIsSubmitting(true);

      const notifications = [];

      if (reportType === 'both') {
        // Create single combined notification for melding + werkbon
        const combinedNotification = {
          verdeler_id,
          project_number,
          kast_naam,
          type: 'melding_werkbon', // New combined type
          status: 'pending',
          description: `${formData.description.trim()}\n\n--- WERKBON DETAILS ---\nWerktijden: ${werkbonData.startTime} - ${werkbonData.endTime} (${werkbonData.totalHours} uur)\nBeschrijving: ${werkbonData.description.trim()}\n\nMateriaal gebruikt:\n${werkbonData.materials.map(m => `- ${m.description}: ${m.quantity} ${m.unit} à €${m.price.toFixed(2)} = €${(m.quantity * m.price).toFixed(2)}`).join('\n')}\n\nTotale materiaalkosten: €${getTotalMaterialCost().toFixed(2)}`,
          worker_name: formData.worker_name.trim(),
          photos: [...formData.photos, ...werkbonData.photos], // Combine all photos
          priority: 'medium',
          read: false,
          activity_log: [
            {
              id: Date.now().toString(),
              action: 'Melding aangemaakt',
              user_name: formData.worker_name.trim(),
              created_at: new Date().toISOString(),
              details: `Type: ${formData.type}`
            },
            {
              id: (Date.now() + 1).toString(),
              action: 'Werkbon aangemaakt',
              user_name: formData.worker_name.trim(),
              created_at: new Date().toISOString(),
              details: JSON.stringify({
                date: werkbonData.date,
                startTime: werkbonData.startTime,
                endTime: werkbonData.endTime,
                totalHours: werkbonData.totalHours,
                materials: werkbonData.materials,
                totalMaterialCost: getTotalMaterialCost(),
                description: werkbonData.description,
                clientSignature: clientSignature
              })
            },
            ...(clientSignature ? [{
              id: (Date.now() + 2).toString(),
              action: 'Klant handtekening',
              user_name: clientSignature.clientName,
              created_at: clientSignature.signedAt,
              details: `Ondertekend door: ${clientSignature.clientName}${clientSignature.clientTitle ? ` (${clientSignature.clientTitle})` : ''}${clientSignature.clientCompany ? ` - ${clientSignature.clientCompany}` : ''}`
            }] : [])
          ]
        };
        notifications.push(combinedNotification);
      } else if (reportType === 'melding') {
        // Create melding only
        const meldingNotification = {
          verdeler_id,
          project_number,
          kast_naam,
          type: formData.type,
          status: 'pending',
          description: formData.description.trim(),
          worker_name: formData.worker_name.trim(),
          photos: formData.photos,
          priority: 'medium',
          read: false,
          activity_log: [{
            id: Date.now().toString(),
            action: 'Melding aangemaakt',
            user_name: formData.worker_name.trim(),
            created_at: new Date().toISOString(),
            details: `Type: ${formData.type}`
          }]
        };
        notifications.push(meldingNotification);
      } else if (reportType === 'werkbon') {
        // Create werkbon only
        const werkbonNotification = {
          verdeler_id,
          project_number,
          kast_naam,
          type: 'werkbon',
          status: 'pending',
          description: `WERKBON - ${werkbonData.description.trim()}\n\nWerktijden: ${werkbonData.startTime} - ${werkbonData.endTime} (${werkbonData.totalHours} uur)\n\nMateriaal gebruikt:\n${werkbonData.materials.map(m => `- ${m.description}: ${m.quantity} ${m.unit} à €${m.price.toFixed(2)} = €${(m.quantity * m.price).toFixed(2)}`).join('\n')}\n\nTotale materiaalkosten: €${getTotalMaterialCost().toFixed(2)}`,
          worker_name: formData.worker_name.trim(),
          photos: werkbonData.photos,
          priority: 'medium',
          read: false,
          activity_log: [{
            id: Date.now().toString(),
            action: 'Werkbon aangemaakt',
            user_name: formData.worker_name.trim(),
            created_at: new Date().toISOString(),
            details: JSON.stringify({
              date: werkbonData.date,
              startTime: werkbonData.startTime,
              endTime: werkbonData.endTime,
              totalHours: werkbonData.totalHours,
              materials: werkbonData.materials,
              totalMaterialCost: getTotalMaterialCost(),
              clientSignature: clientSignature
            })
          }, ...(clientSignature ? [{
            id: (Date.now() + 1).toString(),
            action: 'Klant handtekening',
            user_name: clientSignature.clientName,
            created_at: clientSignature.signedAt,
            details: `Ondertekend door: ${clientSignature.clientName}${clientSignature.clientTitle ? ` (${clientSignature.clientTitle})` : ''}${clientSignature.clientCompany ? ` - ${clientSignature.clientCompany}` : ''}`
          }] : [])]
        };
        notifications.push(werkbonNotification);
      }

      // Insert all notifications
      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const successMessage = reportType === 'werkbon' ? 'Je werkbon is succesvol verstuurd!' : 
                           reportType === 'both' ? 'Je melding en werkbon zijn succesvol verstuurd!' : 
                           'Je melding is succesvol verstuurd!';
      toast.success(successMessage);
      setShowSuccessMessage(true);

      // Reset form
      setFormData({
        type: 'maintenance',
        description: '',
        worker_name: '',
        photos: []
      });
      setWerkbonData({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        totalHours: 0,
        description: '',
        materials: [],
        photos: []
      });
      setClientSignature(null);
      setSignatureData({
        clientName: '',
        clientTitle: '',
        clientCompany: ''
      });

      // Close window after delay
      setTimeout(() => {
        window.close();
      }, 3000);

    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de melding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccessMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-6 text-center">
          <h2 className="text-xl font-semibold mb-4 text-green-400">{reportType === 'werkbon' ? 'Je werkbon is succesvol verstuurd!' : 'Je melding is succesvol verstuurd!'}</h2>
          <p className="text-gray-400">Dit venster zal automatisch sluiten...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <div className="card p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-6">Toegangscode vereist</h2>
          <p className="text-gray-400 mb-4 text-sm">
            Voer de toegangscode in die je van EWP Paneelbouw hebt ontvangen voor verdeler <strong>{verdeler_id}</strong>.
          </p>
          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Toegangscode</label>
              <input
                type="text"
                className="input-field uppercase"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                placeholder="Voer toegangscode in"
                maxLength={10}
                required
                disabled={isValidating}
              />
            </div>
            <button 
              type="submit" 
              className={`btn-primary w-full ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
            <p className="text-xs text-blue-400">
              💡 Tip: Deze toegangscode is specifiek voor verdeler {verdeler_id} en tijdelijk geldig.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Toaster position="top-right" />
      <div className="card p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">{reportType === 'werkbon' ? 'Nieuwe werkbon' : 'Nieuwe onderhoudsmelding'}</h1>
        
        <div className="mb-6 p-4 bg-[#2A303C] rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Verdeler informatie</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Verdeler ID</p>
              <p className="font-medium">{verdeler_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Project</p>
              <p className="font-medium">{project_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Kastnaam</p>
              <p className="font-medium">{kast_naam || '-'}</p>
            </div>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="mb-6 p-4 bg-[#2A303C] rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Type rapport</h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setReportType('melding')}
              className={`p-4 rounded-lg border-2 transition-all ${
                reportType === 'melding' 
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                  : 'border-gray-600 bg-[#1E2530] text-gray-400 hover:border-gray-500'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Camera size={24} className="text-red-400" />
                </div>
                <div>
                  <h4 className="font-medium">Melding</h4>
                  <p className="text-xs opacity-75">Onderhoud, reparatie of inspectie</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setReportType('werkbon')}
              className={`p-4 rounded-lg border-2 transition-all ${
                reportType === 'werkbon' 
                  ? 'border-green-500 bg-green-500/20 text-green-400' 
                  : 'border-gray-600 bg-[#1E2530] text-gray-400 hover:border-gray-500'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Clock size={24} className="text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium">Werkbon</h4>
                  <p className="text-xs opacity-75">Uren en materiaal registratie</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setReportType('both')}
              className={`p-4 rounded-lg border-2 transition-all ${
                reportType === 'both' 
                  ? 'border-purple-500 bg-purple-500/20 text-purple-400' 
                  : 'border-gray-600 bg-[#1E2530] text-gray-400 hover:border-gray-500'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <Camera size={20} className="text-purple-400" />
                    <Clock size={20} className="text-purple-400" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Melding + Werkbon</h4>
                  <p className="text-xs opacity-75">Beide registreren</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Common Fields */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Naam monteur</label>
            <input
              type="text"
              value={formData.worker_name}
              onChange={(e) => setFormData({ ...formData, worker_name: e.target.value })}
              className="input-field"
              required
              placeholder="Voer je naam in"
            />
          </div>

          {(reportType === 'melding' || reportType === 'both') && (
            // Melding Form
            <>
              {reportType === 'both' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">Melding Gegevens</h3>
                  <p className="text-sm text-gray-400">Registreer het type melding en beschrijving</p>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Type melding</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field"
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
                  className="input-field h-32"
                  required
                  placeholder="Beschrijf de uitgevoerde werkzaamheden of het probleem"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Foto's</label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="btn-secondary flex items-center space-x-2 cursor-pointer"
                    >
                      <Camera size={20} />
                      <span>Foto toevoegen</span>
                    </label>
                    <span className="text-sm text-gray-400">(Max. 5MB per foto)</span>
                  </div>

                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                          >
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

          {(reportType === 'werkbon' || reportType === 'both') && (
            // Werkbon Form
            <>
              {reportType === 'both' && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Werkbon Gegevens</h3>
                  <p className="text-sm text-gray-400">Registreer werktijden, materialen en kosten</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Datum</label>
                  <input
                    type="date"
                    value={werkbonData.date}
                    onChange={(e) => setWerkbonData({ ...werkbonData, date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Start tijd</label>
                  <input
                    type="time"
                    value={werkbonData.startTime}
                    onChange={(e) => {
                      setWerkbonData({ ...werkbonData, startTime: e.target.value });
                      setTimeout(calculateHours, 100);
                    }}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Eind tijd</label>
                  <input
                    type="time"
                    value={werkbonData.endTime}
                    onChange={(e) => {
                      setWerkbonData({ ...werkbonData, endTime: e.target.value });
                      setTimeout(calculateHours, 100);
                    }}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="bg-[#2A303C] p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calculator size={20} className="text-blue-400" />
                  <span className="font-medium text-blue-400">Totale werktijd</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {werkbonData.totalHours} uur
                </div>
                <p className="text-sm text-gray-400">
                  Automatisch berekend op basis van start- en eindtijd
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Beschrijving werkzaamheden</label>
                <textarea
                  value={werkbonData.description}
                  onChange={(e) => setWerkbonData({ ...werkbonData, description: e.target.value })}
                  className="input-field h-32"
                  required
                  placeholder="Beschrijf de uitgevoerde werkzaamheden in detail..."
                />
              </div>

              {/* Materials Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm text-gray-400">Gebruikte materialen</label>
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Materiaal toevoegen</span>
                  </button>
                </div>

                {werkbonData.materials.length > 0 && (
                  <div className="space-y-4">
                    {werkbonData.materials.map((material, index) => (
                      <div key={material.id} className="bg-[#1E2530] p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-300">Materiaal {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterial(material.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Beschrijving</label>
                            <input
                              type="text"
                              value={material.description}
                              onChange={(e) => handleMaterialChange(material.id, 'description', e.target.value)}
                              className="input-field text-sm"
                              placeholder="Bijv. Kabel 3x2.5mm²"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Aantal</label>
                            <input
                              type="number"
                              value={material.quantity}
                              onChange={(e) => handleMaterialChange(material.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="input-field text-sm"
                              min="0"
                              step="0.1"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Eenheid</label>
                            <select
                              value={material.unit}
                              onChange={(e) => handleMaterialChange(material.id, 'unit', e.target.value)}
                              className="input-field text-sm"
                            >
                              <option value="stuks">Stuks</option>
                              <option value="meter">Meter</option>
                              <option value="kg">Kilogram</option>
                              <option value="liter">Liter</option>
                              <option value="uur">Uur</option>
                              <option value="set">Set</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Prijs per eenheid (€)</label>
                            <input
                              type="number"
                              value={material.price}
                              onChange={(e) => handleMaterialChange(material.id, 'price', parseFloat(e.target.value) || 0)}
                              className="input-field text-sm"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="md:col-span-4">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">Subtotaal:</span>
                              <span className="font-medium text-white">
                                €{(material.quantity * material.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-400">Totale materiaalkosten:</span>
                        <span className="text-xl font-bold text-green-400">
                          €{getTotalMaterialCost().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Werkbon Photos */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Foto's van uitgevoerde werkzaamheden</label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleWerkbonPhotoUpload}
                      className="hidden"
                      id="werkbon-photo-upload"
                    />
                    <label
                      htmlFor="werkbon-photo-upload"
                      className="btn-secondary flex items-center space-x-2 cursor-pointer"
                    >
                      <Camera size={20} />
                      <span>Foto toevoegen</span>
                    </label>
                    <span className="text-sm text-gray-400">(Max. 5MB per foto)</span>
                  </div>

                  {werkbonData.photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {werkbonData.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo}
                            alt={`Werkbon foto ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveWerkbonPhoto(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Client Signature Section */}
              {(reportType === 'werkbon' || reportType === 'both') && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <PenTool size={20} className="text-green-400" />
                      <h3 className="text-lg font-semibold text-green-400">Klant Handtekening</h3>
                      <span className="text-red-400 text-sm">*Vereist voor werkbon</span>
                    </div>
                    {clientSignature && (
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="btn-secondary flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      >
                        <X size={16} />
                        <span>Wis handtekening</span>
                      </button>
                    )}
                  </div>

                  {!clientSignature ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">
                            Naam klant <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            value={signatureData.clientName}
                            onChange={(e) => setSignatureData({ ...signatureData, clientName: e.target.value })}
                            placeholder="Volledige naam"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Functie</label>
                          <input
                            type="text"
                            className="input-field"
                            value={signatureData.clientTitle}
                            onChange={(e) => setSignatureData({ ...signatureData, clientTitle: e.target.value })}
                            placeholder="Bijv. Technisch Manager"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Bedrijf</label>
                          <input
                            type="text"
                            className="input-field"
                            value={signatureData.clientCompany}
                            onChange={(e) => setSignatureData({ ...signatureData, clientCompany: e.target.value })}
                            placeholder="Bedrijfsnaam"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowSignature(true)}
                        className="btn-primary flex items-center space-x-2"
                        disabled={!signatureData.clientName.trim()}
                      >
                        <PenTool size={20} />
                        <span>Ondertekenen</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#1E2530] rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <Check size={20} className="text-green-400" />
                        <h4 className="font-medium text-green-400">Werkbon ondertekend</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-400">Ondertekend door:</span>
                              <span className="text-white font-medium ml-2">{clientSignature.clientName}</span>
                            </div>
                            {clientSignature.clientTitle && (
                              <div>
                                <span className="text-gray-400">Functie:</span>
                                <span className="text-white ml-2">{clientSignature.clientTitle}</span>
                              </div>
                            )}
                            {clientSignature.clientCompany && (
                              <div>
                                <span className="text-gray-400">Bedrijf:</span>
                                <span className="text-white ml-2">{clientSignature.clientCompany}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-400">Datum & tijd:</span>
                              <span className="text-white ml-2">
                                {new Date(clientSignature.signedAt).toLocaleString('nl-NL')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Handtekening</label>
                          <div className="bg-white rounded-lg p-2 border-2 border-green-500/30">
                            <img 
                              src={clientSignature.signature} 
                              alt="Klant handtekening"
                              className="w-full h-24 object-contain"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="submit"
              className={`btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Bezig met verzenden...' : 
               reportType === 'werkbon' ? 'Werkbon indienen' : 
               reportType === 'both' ? 'Melding + Werkbon indienen' : 
               'Melding toevoegen'}
            </button>
          </div>
        </form>

        {/* Signature Modal */}
        {showSignature && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E2530] rounded-2xl p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-green-400">Klant Handtekening</h2>
                <button
                  onClick={() => setShowSignature(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bg-[#2A303C] rounded-lg p-4 mb-6">
                <h3 className="font-medium text-white mb-2">Werkbon Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Verdeler:</span>
                    <span className="text-white ml-2">{verdeler_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Project:</span>
                    <span className="text-white ml-2">{project_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Monteur:</span>
                    <span className="text-white ml-2">{formData.worker_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Datum:</span>
                    <span className="text-white ml-2">{new Date(werkbonData.date).toLocaleDateString('nl-NL')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Werktijd:</span>
                    <span className="text-white ml-2">{werkbonData.totalHours} uur</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Materiaalkosten:</span>
                    <span className="text-white ml-2">€{getTotalMaterialCost().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Door te ondertekenen bevestigt u dat de werkzaamheden naar tevredenheid zijn uitgevoerd 
                  en dat u akkoord gaat met de geregistreerde uren en materialen.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Naam <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={signatureData.clientName}
                      onChange={(e) => setSignatureData({ ...signatureData, clientName: e.target.value })}
                      placeholder="Volledige naam"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Functie</label>
                    <input
                      type="text"
                      className="input-field"
                      value={signatureData.clientTitle}
                      onChange={(e) => setSignatureData({ ...signatureData, clientTitle: e.target.value })}
                      placeholder="Bijv. Technisch Manager"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Bedrijf</label>
                    <input
                      type="text"
                      className="input-field"
                      value={signatureData.clientCompany}
                      onChange={(e) => setSignatureData({ ...signatureData, clientCompany: e.target.value })}
                      placeholder="Bedrijfsnaam"
                    />
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
    </div>
  );
};

export default MaintenanceReport;