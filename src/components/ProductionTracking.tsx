import React, { useState, useEffect } from 'react';
import { Clock, User, Package, Plus, FileEdit as Edit, Trash2, Save, X, Calendar, DollarSign, Camera, FileText, AlertTriangle, CheckCircle, TrendingUp, Users, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataService } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface Material {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
}

interface WorkEntry {
  id: string;
  distributor_id: string;
  worker_id: string;
  worker_name: string;
  date: string;
  hours: number;
  status: 'in_progress' | 'completed' | 'paused';
  notes: string;
  materials: Material[];
  photos: string[];
  created_at: string;
}

interface ProductionTrackingProps {
  project: any;
}

const ProductionTracking: React.FC<ProductionTrackingProps> = ({ project }) => {
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
  const [selectedDistributor, setSelectedDistributor] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    distributor_id: '',
    worker_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    hours: 0,
    status: 'in_progress' as const,
    notes: '',
    materials: [] as Material[],
    photos: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, [project.id]);

  // Auto-calculate hours when start_time or end_time changes
  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(`2000-01-01T${formData.start_time}`);
      const end = new Date(`2000-01-01T${formData.end_time}`);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.max(0, diffMs / (1000 * 60 * 60));
      const roundedHours = Math.round(hours * 100) / 100;
      console.log('🕐 Auto-calculating hours:', { start: formData.start_time, end: formData.end_time, hours: roundedHours });
      if (roundedHours !== formData.hours) {
        setFormData(prev => ({ ...prev, hours: roundedHours }));
      }
    }
  }, [formData.start_time, formData.end_time]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load users from database instead of localStorage
      const usersData = await dataService.getUsers();
      setUsers(usersData);

      // Load work entries for all distributors in this project
      if (project.distributors && project.distributors.length > 0) {
        const allWorkEntries: WorkEntry[] = [];

        for (const distributor of project.distributors) {
          try {
            const entries = await dataService.getWorkEntries(distributor.id);

            // Convert database entries to our format
            const formattedEntries = entries.map((entry: any) => ({
              id: entry.id,
              distributor_id: entry.distributor_id,
              worker_id: entry.worker_id,
              worker_name: usersData.find((u: any) => u.id === entry.worker_id)?.username || 'Onbekend',
              date: entry.date,
              hours: parseFloat(entry.hours) || 0,
              status: entry.status || 'in_progress',
              notes: entry.notes || '',
              materials: [], // Will be loaded from test_data if needed
              photos: [], // Will be loaded from test_data if needed
              created_at: entry.created_at
            }));

            allWorkEntries.push(...formattedEntries);
          } catch (error) {
            console.error(`Error loading work entries for distributor ${distributor.id}:`, error);
          }
        }

        setWorkEntries(allWorkEntries);
      }
    } catch (error) {
      console.error('Error loading production data:', error);
      toast.error('Er is een fout opgetreden bij het laden van de productiegegevens');
    } finally {
      setLoading(false);
    }
  };


  const handleAddMaterial = () => {
    const newMaterial: Material = {
      id: uuidv4(),
      description: '',
      quantity: 1,
      unit: 'stuks',
      price: 0
    };
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, newMaterial]
    }));
  };

  const handleRemoveMaterial = (materialId: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m.id !== materialId)
    }));
  };

  const handleMaterialChange = (materialId: string, field: keyof Material, value: any) => {
    console.log('🔧 Material change:', { materialId, field, value });
    
    // Special handling for price field to prevent leading zeros
    if (field === 'price') {
      const numericValue = parseFloat(value) || 0;
      console.log('💰 Price change:', { original: value, parsed: numericValue });
      
      setFormData(prev => ({
        ...prev,
        materials: prev.materials.map(m => 
          m.id === materialId ? { ...m, [field]: numericValue } : m
        )
      }));
      return;
    }
    
    // Special handling for quantity field
    if (field === 'quantity') {
      const numericValue = parseFloat(value) || 0;
      setFormData(prev => ({
        ...prev,
        materials: prev.materials.map(m => 
          m.id === materialId ? { ...m, [field]: numericValue } : m
        )
      }));
      return;
    }
    
    // Default handling for other fields
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map(m => 
        m.id === materialId ? { ...m, [field]: value } : m
      )
    }));
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
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, base64String]
        }));
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

  const handleSaveWorkEntry = async () => {
    console.log('🔥 SAVE BUTTON CLICKED - handleSaveWorkEntry called');
    console.log('🔥 Form data:', formData);
    
    // Prevent double submission
    if (isSubmitting) {
      console.log('⚠️ Already submitting, ignoring duplicate click');
      return;
    }
    
    // Validate required fields
    if (!formData.distributor_id || !formData.worker_id || !formData.date) {
      console.log('❌ Validation failed - missing required fields');
      console.log('❌ Missing fields:', {
        distributor_id: !formData.distributor_id,
        worker_id: !formData.worker_id,
        date: !formData.date
      });
      toast.error('Vul alle verplichte velden in!');
      return;
    }

    if (formData.hours <= 0) {
      console.log('❌ Validation failed - invalid hours:', formData.hours);
      toast.error('Voer een geldig aantal uren in (groter dan 0)!');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('✅ Validation passed, attempting to save...');
      console.log('📝 Saving work entry with data:', formData);
      
      const workEntryData = {
        distributorId: formData.distributor_id,
        workerId: formData.worker_id,
        date: formData.date,
        hours: formData.hours,
        status: formData.status,
        notes: formData.notes
      };

      console.log('📤 Work entry data being sent to database:', workEntryData);

      if (editingEntry) {
        // Update existing entry
        console.log('📝 Updating existing entry:', editingEntry.id);
        await dataService.updateWorkEntry(editingEntry.id, workEntryData);
        console.log('✅ Work entry updated successfully');
        toast.success('Werk registratie bijgewerkt!');
      } else {
        // Create new entry
        console.log('📝 Creating new work entry...');
        const savedEntry = await dataService.createWorkEntry(workEntryData);
        console.log('✅ New work entry created successfully:', savedEntry);
        toast.success('Werk registratie toegevoegd!');
      }

      // Save materials and photos as test data if any
      if (formData.materials.length > 0 || formData.photos.length > 0) {
        console.log('📦 Saving materials and photos as test data...');
        const testData = {
          distributorId: formData.distributor_id,
          testType: 'production_materials',
          data: {
            materials: formData.materials,
            photos: formData.photos,
            workDate: formData.date,
            workerId: formData.worker_id
          }
        };
        
        try {
          await dataService.createTestData(testData);
          console.log('✅ Materials and photos saved successfully');
        } catch (materialError) {
          console.error('Error saving materials/photos:', materialError);
          // Don't fail the whole operation for this
        }
      }

      // Reset form and reload data
      console.log('🔄 Resetting form and reloading data...');
      handleCancelForm();
      await loadData();
      console.log('✅ Form reset and data reloaded successfully');
    } catch (error) {
      console.error('Error saving work entry:', error);
      toast.error(`Er is een fout opgetreden bij het opslaan: ${error.message || 'Onbekende fout'}`);
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Save operation completed');
    }
  };

  const handleEditEntry = (entry: WorkEntry) => {
    setEditingEntry(entry);
    setFormData({
      distributor_id: entry.distributor_id,
      worker_id: entry.worker_id,
      date: entry.date,
      start_time: '', // Will be calculated from hours if needed
      end_time: '',
      hours: entry.hours,
      status: entry.status,
      notes: entry.notes,
      materials: entry.materials,
      photos: entry.photos
    });
    setShowWorkForm(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (window.confirm('Weet je zeker dat je deze werk registratie wilt verwijderen?')) {
      try {
        console.log('🗑️ Deleting work entry:', entryId);
        await dataService.deleteWorkEntry(entryId);
        console.log('✅ Work entry deleted successfully');
        toast.success('Werk registratie verwijderd!');
        await loadData();
      } catch (error) {
        console.error('Error deleting work entry:', error);
        toast.error(`Er is een fout opgetreden bij het verwijderen: ${error.message || 'Onbekende fout'}`);
      }
    }
  };

  const handleCancelForm = () => {
    setShowWorkForm(false);
    setEditingEntry(null);
    setFormData({
      distributor_id: '',
      worker_id: '',
      date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      hours: 0,
      status: 'in_progress',
      notes: '',
      materials: [],
      photos: []
    });
  };

  const getTotalHours = () => {
    return workEntries.reduce((total, entry) => total + entry.hours, 0);
  };


  const getWorkerStats = () => {
    const workerHours: { [key: string]: { name: string; hours: number; entries: number } } = {};
    
    workEntries.forEach(entry => {
      if (!workerHours[entry.worker_id]) {
        workerHours[entry.worker_id] = {
          name: entry.worker_name,
          hours: 0,
          entries: 0
        };
      }
      workerHours[entry.worker_id].hours += entry.hours;
      workerHours[entry.worker_id].entries += 1;
    });
    
    return Object.values(workerHours);
  };

  const getDistributorProgress = () => {
    const distributorWork: { [key: string]: { id: string; name: string; hours: number; status: string; expectedHours: number } } = {};

    project.distributors?.forEach((distributor: any) => {
      const distributorEntries = workEntries.filter(entry => entry.distributor_id === distributor.id);
      const totalHours = distributorEntries.reduce((sum, entry) => sum + entry.hours, 0);
      const hasCompleted = distributorEntries.some(entry => entry.status === 'completed');

      distributorWork[distributor.id] = {
        id: distributor.id,
        name: `${distributor.distributor_id} - ${distributor.kast_naam || 'Naamloos'}`,
        hours: totalHours,
        status: hasCompleted ? 'completed' : totalHours > 0 ? 'in_progress' : 'not_started',
        expectedHours: parseFloat(distributor.expected_hours) || 0
      };
    });

    return Object.values(distributorWork);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Productiegegevens laden...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Production Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Totale Uren</h3>
              <p className="text-2xl font-bold text-white">{getTotalHours().toFixed(1)}</p>
            </div>
          </div>
        </div>


        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Actieve Medewerkers</h3>
              <p className="text-2xl font-bold text-white">{getWorkerStats().length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Werk Sessies</h3>
              <p className="text-2xl font-bold text-white">{workEntries.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distributor Progress */}
      <div className="bg-[#2A303C] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-400 mb-4">Verdeler Voortgang</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getDistributorProgress().map((dist, index) => {
            const expectedHours = dist.expectedHours;
            const loggedHours = dist.hours;
            const remainingHours = expectedHours - loggedHours;
            const percentageComplete = expectedHours > 0 ? (loggedHours / expectedHours) * 100 : 0;

            return (
              <div key={dist.id} className="bg-[#1E2530] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white text-sm">{dist.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    dist.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    dist.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {dist.status === 'completed' ? 'Voltooid' :
                     dist.status === 'in_progress' ? 'Bezig' : 'Niet gestart'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Gelogd:</span>
                    <span className="text-white font-medium">{loggedHours.toFixed(1)} uur</span>
                  </div>

                  {expectedHours > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Verwacht:</span>
                        <span className="text-gray-300">{expectedHours.toFixed(1)} uur</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Resterend:</span>
                        <span className={`font-medium ${
                          remainingHours > 0 ? 'text-blue-400' :
                          remainingHours < 0 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {remainingHours > 0 ? '+' : ''}{remainingHours.toFixed(1)} uur
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              percentageComplete >= 100 ? 'bg-green-500' :
                              percentageComplete >= 75 ? 'bg-blue-500' :
                              'bg-yellow-500'
                            }`}
                            style={{ width: `${Math.min(percentageComplete, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {percentageComplete.toFixed(0)}%
                        </p>
                      </div>
                    </>
                  )}

                  {expectedHours === 0 && (
                    <p className="text-xs text-gray-500 italic mt-2">
                      Geen voorcalculatorische uren ingesteld
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Worker Statistics */}
      <div className="bg-[#2A303C] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-400 mb-4">Medewerker Statistieken</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getWorkerStats().map((worker, index) => (
            <div key={index} className="bg-[#1E2530] rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {worker.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-white">{worker.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{worker.hours.toFixed(1)} uur</span>
                    <span>{worker.entries} sessies</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Work Entry Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-orange-400">Werk Registraties</h3>
        <button
          onClick={() => setShowWorkForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Werk Registreren</span>
        </button>
      </div>

      {/* Work Entries Table */}
      <div className="bg-[#2A303C] rounded-xl p-6">
        {workEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="table-header text-left">Verdeler</th>
                  <th className="table-header text-left">Medewerker</th>
                  <th className="table-header text-left">Datum</th>
                  <th className="table-header text-left">Uren</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Opmerkingen</th>
                  <th className="table-header text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {workEntries.map((entry) => {
                  const distributor = project.distributors?.find((d: any) => d.id === entry.distributor_id);
                  return (
                    <tr key={entry.id} className="table-row">
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="font-medium text-green-400">
                            {distributor?.distributor_id || 'Onbekend'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-gray-300">{entry.worker_name}</td>
                      <td className="py-4 text-gray-300">
                        {new Date(entry.date).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <Clock size={14} className="text-blue-400" />
                          <span className="font-medium text-blue-400">{entry.hours}h</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          entry.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          entry.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {entry.status === 'completed' ? 'Voltooid' :
                           entry.status === 'paused' ? 'Gepauzeerd' : 'Bezig'}
                        </span>
                      </td>
                      <td className="py-4 text-gray-300 max-w-xs truncate">
                        {entry.notes || '-'}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="p-2 bg-[#1E2530] hover:bg-blue-500/20 rounded-lg transition-colors group"
                            title="Bewerken"
                          >
                            <Edit size={16} className="text-gray-400 group-hover:text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-2 bg-[#1E2530] hover:bg-red-500/20 rounded-lg transition-colors group"
                            title="Verwijderen"
                          >
                            <Trash2 size={16} className="text-gray-400 group-hover:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">Nog geen werk geregistreerd</p>
            <p className="text-gray-500 text-sm mt-2">Klik op "Werk Registreren" om te beginnen</p>
          </div>
        )}
      </div>

      {/* Work Entry Form Modal */}
      {showWorkForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-blue-400">
                {editingEntry ? 'Werk Registratie Bewerken' : 'Nieuwe Werk Registratie'}
              </h2>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveWorkEntry(); }} className="space-y-6">
              {/* Basic Work Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Verdeler <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="input-field"
                    value={formData.distributor_id}
                    onChange={(e) => setFormData({ ...formData, distributor_id: e.target.value })}
                    required
                  >
                    <option value="">Selecteer verdeler</option>
                    {project.distributors?.map((distributor: any) => (
                      <option key={distributor.id} value={distributor.id}>
                        {distributor.distributor_id} - {distributor.kast_naam || 'Naamloos'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Medewerker <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="input-field"
                    value={formData.worker_id}
                    onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
                    required
                  >
                    <option value="">Selecteer medewerker</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Datum <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.date}
                    onChange={(e) => {
                      setFormData({ ...formData, date: e.target.value });
                      // Use setTimeout to ensure state is updated before calculation
                      setTimeout(() => {
                        calculateHours();
                      }, 50);
                    }}
                    required
                  />
                </div>
              </div>

              {/* Time Tracking */}
              <div className="bg-[#2A303C] rounded-lg p-4">
                <h4 className="font-medium text-gray-300 mb-4">Tijd Registratie</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Start tijd</label>
                    <input
                      type="time"
                      className="input-field"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Eind tijd</label>
                    <input
                      type="time"
                      className="input-field"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Totale uren <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="input-field"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Status and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status</label>
                  <select
                    className="input-field"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="in_progress">Bezig</option>
                    <option value="completed">Voltooid</option>
                    <option value="paused">Gepauzeerd</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Opmerkingen</label>
                  <textarea
                    className="input-field h-20"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Beschrijf de uitgevoerde werkzaamheden..."
                  />
                </div>
              </div>

              {/* Materials Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm text-gray-400">Gebruikte Materialen</label>
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Materiaal toevoegen</span>
                  </button>
                </div>

                {formData.materials.length > 0 && (
                  <div className="space-y-4">
                    {formData.materials.map((material, index) => (
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
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Beschrijving</label>
                            <input
                              type="text"
                              value={material.description}
                              onChange={(e) => handleMaterialChange(material.id, 'description', e.target.value)}
                              className="input-field text-sm"
                              placeholder="Bijv. Kabel 3x2.5mm²"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Aantal</label>
                            <input
                              type="number"
                              value={material.quantity}
                              onChange={(e) => handleMaterialChange(material.id, 'quantity', e.target.value)}
                              className="input-field text-sm"
                              min="0"
                              step="0.1"
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
                              <option value="set">Set</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Photos Section */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Voortgang Foto's</label>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="btn-secondary"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  onClick={handleSaveWorkEntry}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save size={20} />
                  <span>{editingEntry ? 'Bijwerken' : 'Registreren'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionTracking;