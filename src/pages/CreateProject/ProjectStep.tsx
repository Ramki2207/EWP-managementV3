import React, { useState, useEffect } from 'react';
import { Building, Calendar, MapPin, User, FileText, Briefcase, Plus, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataService } from '../../lib/supabase';
import ClientSearchSelect from '../../components/ClientSearchSelect';

interface ProjectStepProps {
  projectData: any;
  onProjectChange: (data: any) => void;
  onNext: () => void;
}

const ProjectStep: React.FC<ProjectStepProps> = ({ projectData, onProjectChange, onNext }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [projectNumberYear, setProjectNumberYear] = useState('');
  const [projectNumberSuffix, setProjectNumberSuffix] = useState('');
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [newContactData, setNewContactData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    function: ''
  });
  const [newClientData, setNewClientData] = useState({
    name: '',
    visit_street: '',
    visit_postcode: '',
    visit_city: '',
    delivery_street: '',
    delivery_postcode: '',
    delivery_city: '',
    vat_number: '',
    kvk_number: '',
    contacts: [{ first_name: '', last_name: '', email: '', phone: '', department: '', function: '' }]
  });
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [intakeFormData, setIntakeFormData] = useState({
    // Kast specificaties
    merk: '',
    uitvoering: '',
    breedte: '',
    hoogte: '',
    diepte: '',
    ipKlasse: '',
    amperage: '',
    hoofdschakelaar1: '',
    
    // Kabel configuratie
    inkomendeKabel: '',
    afgaandeKabels: '',
    wartels: false,
    draai: false,
    
    // Extra opties
    meterbord: false,
    pvGroepen: false,
    pvSubsidie: false,
    pvMeettrafo: false,
    totaalMeting: false,
    laadpaalGroepen: false,
    laadpaalAfschakeling: false,
    uitbedradenOpKlemmen: false,
    
    // Afgaande velden
    afgaandeVelden1: Array(10).fill(null).map(() => ({
      aantal: '',
      type: '',
      amp: '',
      aut: '',
      ma: '',
      imp: '',
      mag: '',
      ala: false,
      als: false
    })),
    afgaandeVelden2: Array(10).fill(null).map(() => ({
      aantal: '',
      type: '',
      amp: '',
      aut: '',
      ma: '',
      imp: '',
      mag: '',
      ala: false,
      als: false
    })),
    
    // Opmerkingen
    opmerkingen: ''
  });

  useEffect(() => {
    loadClients();
    loadExistingProjects();
    
    // Extract year and suffix from existing project number if editing
    if (projectData.projectNumber) {
      const match = projectData.projectNumber.match(/^P[MDR](\d{2})(\d{3})$/);
      if (match) {
        setProjectNumberYear(match[1]);
        setProjectNumberSuffix(match[2]);
      }
    }
  }, []);

  const loadClients = async () => {
    try {
      const data = await dataService.getClients();
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      // Fallback to localStorage
      const storedClients = JSON.parse(localStorage.getItem('clients') || '[]');
      setClients(storedClients);
    }
  };

  const loadExistingProjects = async () => {
    try {
      const data = await dataService.getProjects();
      setExistingProjects(data || []);
    } catch (error) {
      console.error('Error loading existing projects:', error);
      // Fallback to localStorage
      const storedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      setExistingProjects(storedProjects);
    }
  };

  const generateProjectNumber = (location: string, year: string, suffix: string) => {
    let prefix = '';
    switch (location) {
      case 'Leerdam':
        prefix = 'PM';
        break;
      case 'Naaldwijk':
        prefix = 'PD';
        break;
      case 'Rotterdam':
        prefix = 'PR';
        break;
      default:
        prefix = 'PM'; // Default to PM if no location selected
    }

    return `${prefix}${year}${suffix}`;
  };

  const checkProjectNumberExists = (projectNumber: string) => {
    return existingProjects.some(project => 
      project.project_number === projectNumber || project.projectNumber === projectNumber
    );
  };

  const validateProjectNumber = async (year: string, suffix: string, location: string) => {
    if (!year || !suffix || !location) {
      setDuplicateError('');
      return;
    }

    // Validate year format (exactly 2 digits)
    if (!/^\d{2}$/.test(year)) {
      setDuplicateError('Jaar moet precies 2 cijfers bevatten (bijv. 25 voor 2025)');
      return;
    }

    // Validate suffix format (exactly 3 digits)
    if (!/^\d{3}$/.test(suffix)) {
      setDuplicateError('Projectnummer moet precies 3 cijfers bevatten (001-999)');
      return;
    }

    setIsCheckingDuplicate(true);

    // Generate full project number and check for duplicates
    const fullProjectNumber = generateProjectNumber(location, year, suffix);

    // Check against existing projects
    const exists = checkProjectNumberExists(fullProjectNumber);

    if (exists) {
      setDuplicateError(`Projectnummer ${fullProjectNumber} bestaat al. Kies een ander nummer.`);
    } else {
      setDuplicateError('');

      // Update project data with new number
      const updatedData = {
        ...projectData,
        projectNumber: fullProjectNumber
      };
      onProjectChange(updatedData);
    }

    setIsCheckingDuplicate(false);
  };

  const handleProjectNumberYearChange = (year: string) => {
    // Only allow digits and limit to 2 characters
    const cleanYear = year.replace(/\D/g, '').slice(0, 2);
    setProjectNumberYear(cleanYear);

    // Validate if we have all required fields
    if (cleanYear.length === 2 && projectNumberSuffix.length === 3 && projectData.location) {
      validateProjectNumber(cleanYear, projectNumberSuffix, projectData.location);
    } else {
      setDuplicateError('');
    }
  };

  const handleProjectNumberSuffixChange = (suffix: string) => {
    // Only allow digits and limit to 3 characters
    const cleanSuffix = suffix.replace(/\D/g, '').slice(0, 3);
    setProjectNumberSuffix(cleanSuffix);

    // Validate if we have all required fields
    if (projectNumberYear.length === 2 && cleanSuffix.length === 3 && projectData.location) {
      validateProjectNumber(projectNumberYear, cleanSuffix, projectData.location);
    } else {
      setDuplicateError('');
    }
  };

  const handleLocationChange = (location: string) => {
    // When location changes, validate if we have complete number
    if (projectNumberYear.length === 2 && projectNumberSuffix.length === 3) {
      validateProjectNumber(projectNumberYear, projectNumberSuffix, location);
    } else {
      // Clear project number if not complete
      const updatedData = {
        ...projectData,
        location: location,
        projectNumber: ''
      };
      onProjectChange(updatedData);
    }

    // Always update location
    const updatedData = {
      ...projectData,
      location: location
    };

    onProjectChange(updatedData);
  };

  const handleInputChange = (field: string, value: string) => {
    const updatedData = {
      ...projectData,
      [field]: value
    };
    onProjectChange(updatedData);
  };

  const handleAddContact = () => {
    setNewClientData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { first_name: '', last_name: '', email: '', phone: '', department: '', function: '' }]
    }));
  };

  const handleRemoveContact = (index: number) => {
    setNewClientData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const handleContactChange = (index: number, field: string, value: string) => {
    setNewClientData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const handleSaveNewClient = async () => {
    if (!newClientData.name.trim()) {
      toast.error('Vul tenminste de organisatienaam in!');
      return;
    }

    try {
      const savedClient = await dataService.createClient(newClientData);
      setClients(prev => [savedClient, ...prev]);
      
      // Set the new client as selected
      const updatedData = {
        ...projectData,
        client: savedClient.name
      };
      onProjectChange(updatedData);
      
      // Reset form
      setNewClientData({
        name: '',
        visit_street: '',
        visit_postcode: '',
        visit_city: '',
        delivery_street: '',
        delivery_postcode: '',
        delivery_city: '',
        vat_number: '',
        kvk_number: '',
        contacts: [{ first_name: '', last_name: '', email: '', phone: '', department: '', function: '' }]
      });
      setShowClientForm(false);
      toast.success('Nieuwe klant succesvol toegevoegd!');
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de klant');
    }
  };

  const handleSaveNewContact = async () => {
    if (!newContactData.first_name.trim() || !newContactData.last_name.trim()) {
      toast.error('Vul tenminste voor- en achternaam in!');
      return;
    }

    const selectedClient = clients.find(c => c.name === projectData.client);
    if (!selectedClient) {
      toast.error('Selecteer eerst een klant!');
      return;
    }

    try {
      const newContact = await dataService.createContact(selectedClient.id, newContactData);

      const updatedClient = {
        ...selectedClient,
        contacts: [...(selectedClient.contacts || []), newContact]
      };
      setClients(prev => prev.map(c => c.id === selectedClient.id ? updatedClient : c));

      const contactFullName = `${newContactData.first_name} ${newContactData.last_name}`;
      const updatedData = {
        ...projectData,
        contact_person: contactFullName
      };
      onProjectChange(updatedData);

      setNewContactData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        department: '',
        function: ''
      });
      setShowContactForm(false);
      toast.success('Nieuwe contactpersoon succesvol toegevoegd!');
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de contactpersoon');
    }
  };

  const handleIntakeFormChange = (field: string, value: any) => {
    setIntakeFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAfgaandeVeldChange = (section: 'afgaandeVelden1' | 'afgaandeVelden2', index: number, field: string, value: any) => {
    setIntakeFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleNext = () => {
    if (!projectData.projectNumber || !projectData.date || !projectData.location || !projectNumberYear || !projectNumberSuffix) {
      toast.error('Vul alle verplichte velden in!');
      return;
    }

    if (duplicateError) {
      toast.error('Los eerst de projectnummer fout op voordat je verder gaat');
      return;
    }

    // Include intake form data if it was filled out
    const finalProjectData = {
      ...projectData,
      contactPerson: projectData.contact_person, // Ensure contact person is included
      intakeForm: showIntakeForm ? intakeFormData : null
    };
    
    onProjectChange(finalProjectData);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-white mb-2">Project Details</h2>
        <p className="text-gray-400">Voer de basisgegevens van het project in</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-2">
            Projectnummer <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Locatie selecteren voor prefix</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  className="input-field pl-10"
                  value={projectData.location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                >
                  <option value="">Selecteer locatie</option>
                  <option value="Leerdam">Leerdam (PM)</option>
                  <option value="Naaldwijk">Naaldwijk (PD)</option>
                  <option value="Rotterdam">Rotterdam (PR)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jaar (2 cijfers)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  className={`input-field pl-10 ${duplicateError ? 'border-red-500' : ''}`}
                  value={projectNumberYear}
                  onChange={(e) => handleProjectNumberYearChange(e.target.value)}
                  placeholder="25"
                  maxLength={2}
                  pattern="\d{2}"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">3-cijferig projectnummer</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  className={`input-field pl-10 ${duplicateError ? 'border-red-500' : ''}`}
                  value={projectNumberSuffix}
                  onChange={(e) => handleProjectNumberSuffixChange(e.target.value)}
                  placeholder="001"
                  maxLength={3}
                  pattern="\d{3}"
                />
                {isCheckingDuplicate && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {duplicateError && (
            <p className="text-red-400 text-xs mt-2">{duplicateError}</p>
          )}

          {/* Project Number Preview */}
          {projectData.location && projectNumberYear.length === 2 && projectNumberSuffix.length === 3 && !duplicateError && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Briefcase size={16} className="text-green-400" />
                <span className="text-sm text-green-400">
                  Projectnummer: <strong>{projectData.projectNumber}</strong>
                </span>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            Format: [Locatie Prefix][Jaar][3 cijfers] (bijv. PM25001, PD25123, PR25999)
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Datum <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              className="input-field pl-10"
              value={projectData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Verwachte leverdatum
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              className="input-field pl-10"
              value={projectData.expectedDeliveryDate || ''}
              onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Verwachte leverdatum voor het hele project
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Klant</label>
          <ClientSearchSelect
            clients={clients}
            selectedClientName={projectData.client}
            onSelect={(clientName) => handleInputChange('client', clientName)}
            placeholder="Selecteer een klant"
            required={true}
          />
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowClientForm(true)}
              className="btn-secondary flex items-center space-x-2 text-sm"
            >
              <Plus size={16} />
              <span>Nieuwe klant aanmaken</span>
            </button>
          </div>
        </div>

        {/* Contact Person Selection */}
        {projectData.client && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Contactpersoon</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                className="input-field pl-10"
                value={projectData.contact_person || ''}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
              >
                <option value="">Selecteer een contactpersoon</option>
                {(() => {
                  const selectedClient = clients.find(c => c.name === projectData.client);
                  return selectedClient?.contacts?.map((contact: any) => (
                    <option key={contact.id} value={`${contact.first_name} ${contact.last_name}`}>
                      {contact.first_name} {contact.last_name}
                      {contact.department && ` (${contact.department})`}
                      {contact.email && ` - ${contact.email}`}
                    </option>
                  )) || [];
                })()}
              </select>
            </div>
            {(() => {
              const selectedClient = clients.find(c => c.name === projectData.client);
              const contactCount = selectedClient?.contacts?.length || 0;
              return contactCount === 0 ? (
                <p className="text-xs text-yellow-400 mt-1">
                  ⚠️ Deze klant heeft nog geen contactpersonen
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  {contactCount} contactpersoon{contactCount !== 1 ? 'en' : ''} beschikbaar
                </p>
              );
            })()}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowContactForm(true)}
                className="btn-secondary flex items-center space-x-2 text-sm"
              >
                <Plus size={16} />
                <span>Nieuwe contactpersoon aanmaken</span>
              </button>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Status</label>
          <select
            className="input-field"
            value={projectData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
          >
            <option value="">Selecteer status</option>
            <option value="Intake">Intake</option>
            <option value="Offerte">Offerte</option>
            <option value="Order">Order</option>
            <option value="Werkvoorbereiding">Werkvoorbereiding</option>
            <option value="Productie">Productie</option>
            <option value="Testen">Testen</option>
            <option value="Levering">Levering</option>
            <option value="Gereed voor facturatie">Gereed voor facturatie</option>
            <option value="Opgeleverd">Opgeleverd</option>
            <option value="Verloren">Verloren</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-2">Omschrijving</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
            <textarea
              className="input-field pl-10 h-24"
              value={projectData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Beschrijf het project..."
            />
          </div>
        </div>
      </div>

      {/* Intake Form Toggle */}
      <div className="bg-[#2A303C] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-blue-400">Intake Formulier</h3>
            <p className="text-sm text-gray-400">Optioneel: Vul gedetailleerde project specificaties in</p>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showIntakeForm}
              onChange={(e) => setShowIntakeForm(e.target.checked)}
              className="form-checkbox"
            />
            <span className="text-gray-400">Intake formulier invullen</span>
          </label>
        </div>

        {showIntakeForm && (
          <div className="space-y-8 mt-6">
            {/* Kast Specificaties */}
            <div className="bg-[#1E2530] p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-green-400 mb-4">Kast Specificaties</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Merk</label>
                  <input
                    type="text"
                    className="input-field"
                    value={intakeFormData.merk}
                    onChange={(e) => handleIntakeFormChange('merk', e.target.value)}
                    placeholder="Bijv. Schneider"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Uitvoering</label>
                  <input
                    type="text"
                    className="input-field"
                    value={intakeFormData.uitvoering}
                    onChange={(e) => handleIntakeFormChange('uitvoering', e.target.value)}
                    placeholder="Bijv. Wandmontage"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Breedte (cm)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={intakeFormData.breedte}
                    onChange={(e) => handleIntakeFormChange('breedte', e.target.value)}
                    placeholder="80"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Hoogte (cm)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={intakeFormData.hoogte}
                    onChange={(e) => handleIntakeFormChange('hoogte', e.target.value)}
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Diepte (cm)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={intakeFormData.diepte}
                    onChange={(e) => handleIntakeFormChange('diepte', e.target.value)}
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">IP Klasse</label>
                  <select
                    className="input-field"
                    value={intakeFormData.ipKlasse}
                    onChange={(e) => handleIntakeFormChange('ipKlasse', e.target.value)}
                  >
                    <option value="">Selecteer IP klasse</option>
                    <option value="IP20">IP20</option>
                    <option value="IP30">IP30</option>
                    <option value="IP40">IP40</option>
                    <option value="IP54">IP54</option>
                    <option value="IP65">IP65</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amperage</label>
                  <input
                    type="number"
                    className="input-field"
                    value={intakeFormData.amperage}
                    onChange={(e) => handleIntakeFormChange('amperage', e.target.value)}
                    placeholder="400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Hoofdschakelaar</label>
                  <input
                    type="text"
                    className="input-field"
                    value={intakeFormData.hoofdschakelaar1}
                    onChange={(e) => handleIntakeFormChange('hoofdschakelaar1', e.target.value)}
                    placeholder="400A"
                  />
                </div>
              </div>
            </div>

            {/* Kabel Configuratie */}
            <div className="bg-[#1E2530] p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-purple-400 mb-4">Kabel Configuratie</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Inkomende kabel</label>
                  <input
                    type="text"
                    className="input-field"
                    value={intakeFormData.inkomendeKabel}
                    onChange={(e) => handleIntakeFormChange('inkomendeKabel', e.target.value)}
                    placeholder="Bijv. 4x95mm²"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Afgaande kabels</label>
                  <input
                    type="text"
                    className="input-field"
                    value={intakeFormData.afgaandeKabels}
                    onChange={(e) => handleIntakeFormChange('afgaandeKabels', e.target.value)}
                    placeholder="Bijv. 12x 5x2.5mm²"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={intakeFormData.wartels}
                    onChange={(e) => handleIntakeFormChange('wartels', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="text-gray-400">Wartels</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={intakeFormData.draai}
                    onChange={(e) => handleIntakeFormChange('draai', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="text-gray-400">Draai</span>
                </label>
              </div>
            </div>

            {/* Extra Opties */}
            <div className="bg-[#1E2530] p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-orange-400 mb-4">Extra Opties</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'meterbord', label: 'Meterbord' },
                  { key: 'pvGroepen', label: 'PV Groepen' },
                  { key: 'pvSubsidie', label: 'PV Subsidie' },
                  { key: 'pvMeettrafo', label: 'PV Meettrafo' },
                  { key: 'totaalMeting', label: 'Totaal Meting' },
                  { key: 'laadpaalGroepen', label: 'Laadpaal Groepen' },
                  { key: 'laadpaalAfschakeling', label: 'Laadpaal Afschakeling' },
                  { key: 'uitbedradenOpKlemmen', label: 'Uitbedraden op klemmen' }
                ].map((option) => (
                  <label key={option.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={intakeFormData[option.key as keyof typeof intakeFormData] as boolean}
                      onChange={(e) => handleIntakeFormChange(option.key, e.target.checked)}
                      className="form-checkbox"
                    />
                    <span className="text-gray-400 text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Afgaande Velden 1 */}
            <div className="bg-[#1E2530] p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-400 mb-4">Afgaande Velden 1</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-2 text-gray-400">Aantal</th>
                      <th className="text-left p-2 text-gray-400">Type</th>
                      <th className="text-left p-2 text-gray-400">Amp</th>
                      <th className="text-left p-2 text-gray-400">Aut</th>
                      <th className="text-left p-2 text-gray-400">MA</th>
                      <th className="text-left p-2 text-gray-400">Imp</th>
                      <th className="text-left p-2 text-gray-400">Mag</th>
                      <th className="text-left p-2 text-gray-400">ALA</th>
                      <th className="text-left p-2 text-gray-400">ALS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intakeFormData.afgaandeVelden1.map((veld, index) => (
                      <tr key={index} className="border-b border-gray-700">
                        <td className="p-2">
                          <input
                            type="number"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.aantal}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden1', index, 'aantal', e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.type}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden1', index, 'type', e.target.value)}
                            placeholder="Type"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.amp}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden1', index, 'amp', e.target.value)}
                            placeholder="A"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.aut}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden1', index, 'aut', e.target.value)}
                            placeholder="Aut"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.ma}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden1', index, 'ma', e.target.value)}
                            placeholder="MA"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.imp}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden1', index, 'imp', e.target.value)}
                            placeholder="Imp"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.mag}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden1', index, 'mag', e.target.value)}
                            placeholder="Mag"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={veld.ala}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden1', index, 'ala', e.target.checked)}
                            className="form-checkbox"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={veld.als}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden1', index, 'als', e.target.checked)}
                            className="form-checkbox"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Afgaande Velden 2 */}
            <div className="bg-[#1E2530] p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-400 mb-4">Afgaande Velden 2</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-2 text-gray-400">Aantal</th>
                      <th className="text-left p-2 text-gray-400">Type</th>
                      <th className="text-left p-2 text-gray-400">Amp</th>
                      <th className="text-left p-2 text-gray-400">Aut</th>
                      <th className="text-left p-2 text-gray-400">MA</th>
                      <th className="text-left p-2 text-gray-400">Imp</th>
                      <th className="text-left p-2 text-gray-400">Mag</th>
                      <th className="text-left p-2 text-gray-400">ALA</th>
                      <th className="text-left p-2 text-gray-400">ALS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intakeFormData.afgaandeVelden2.map((veld, index) => (
                      <tr key={index} className="border-b border-gray-700">
                        <td className="p-2">
                          <input
                            type="number"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.aantal}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden2', index, 'aantal', e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.type}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden2', index, 'type', e.target.value)}
                            placeholder="Type"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.amp}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden2', index, 'amp', e.target.value)}
                            placeholder="A"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.aut}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden2', index, 'aut', e.target.value)}
                            placeholder="Aut"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.ma}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden2', index, 'ma', e.target.value)}
                            placeholder="MA"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.imp}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden2', index, 'imp', e.target.value)}
                            placeholder="Imp"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-sm"
                            value={veld.mag}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden2', index, 'mag', e.target.value)}
                            placeholder="Mag"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={veld.ala}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden2', index, 'ala', e.target.checked)}
                            className="form-checkbox"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={veld.als}
                            onChange={(e) => handleAfgaandeVeldChange('afgaandeVelden2', index, 'als', e.target.checked)}
                            className="form-checkbox"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Opmerkingen */}
            <div className="bg-[#1E2530] p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-400 mb-4">Opmerkingen</h4>
              <textarea
                className="input-field h-32"
                value={intakeFormData.opmerkingen}
                onChange={(e) => handleIntakeFormChange('opmerkingen', e.target.value)}
                placeholder="Aanvullende opmerkingen of speciale eisen..."
              />
            </div>
          </div>
        )}
      </div>

      {/* New Client Form Modal */}
      {showClientForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-blue-400">Nieuwe klant aanmaken</h2>
              <button
                onClick={() => setShowClientForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">
                    Organisatienaam <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={newClientData.name}
                    onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                    placeholder="Bedrijfsnaam"
                  />
                </div>

                {/* Visit Address */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Bezoekadres</h3>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Straat</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newClientData.visit_street}
                    onChange={(e) => setNewClientData({ ...newClientData, visit_street: e.target.value })}
                    placeholder="Straatnaam + huisnummer"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Postcode</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newClientData.visit_postcode}
                    onChange={(e) => setNewClientData({ ...newClientData, visit_postcode: e.target.value })}
                    placeholder="1234AB"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Plaats</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newClientData.visit_city}
                    onChange={(e) => setNewClientData({ ...newClientData, visit_city: e.target.value })}
                    placeholder="Plaatsnaam"
                  />
                </div>

                {/* Delivery Address */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-purple-400 mb-4">Afleveradres</h3>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Straat</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newClientData.delivery_street}
                    onChange={(e) => setNewClientData({ ...newClientData, delivery_street: e.target.value })}
                    placeholder="Straatnaam + huisnummer"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Postcode</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newClientData.delivery_postcode}
                    onChange={(e) => setNewClientData({ ...newClientData, delivery_postcode: e.target.value })}
                    placeholder="1234AB"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Plaats</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newClientData.delivery_city}
                    onChange={(e) => setNewClientData({ ...newClientData, delivery_city: e.target.value })}
                    placeholder="Plaatsnaam"
                  />
                </div>

                {/* Business Information */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">BTW-nummer</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newClientData.vat_number}
                    onChange={(e) => setNewClientData({ ...newClientData, vat_number: e.target.value })}
                    placeholder="NL123456789B01"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">KvK-nummer</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newClientData.kvk_number}
                    onChange={(e) => setNewClientData({ ...newClientData, kvk_number: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
              </div>

              {/* Contact Persons */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-orange-400">Contactpersonen</h3>
                  <button
                    type="button"
                    onClick={handleAddContact}
                    className="btn-secondary flex items-center space-x-2 text-sm"
                  >
                    <Plus size={16} />
                    <span>Contact toevoegen</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {newClientData.contacts.map((contact, index) => (
                    <div key={index} className="bg-[#2A303C] p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-medium text-gray-400">
                          Contactpersoon {index + 1}
                        </h4>
                        {newClientData.contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveContact(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Voornaam</label>
                          <input
                            type="text"
                            className="input-field text-sm"
                            value={contact.first_name}
                            onChange={(e) => handleContactChange(index, 'first_name', e.target.value)}
                            placeholder="Voornaam"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Achternaam</label>
                          <input
                            type="text"
                            className="input-field text-sm"
                            value={contact.last_name}
                            onChange={(e) => handleContactChange(index, 'last_name', e.target.value)}
                            placeholder="Achternaam"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">E-mail</label>
                          <input
                            type="email"
                            className="input-field text-sm"
                            value={contact.email}
                            onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                            placeholder="email@bedrijf.nl"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Telefoon</label>
                          <input
                            type="text"
                            className="input-field text-sm"
                            value={contact.phone}
                            onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                            placeholder="0612345678"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Afdeling</label>
                          <input
                            type="text"
                            className="input-field text-sm"
                            value={contact.department}
                            onChange={(e) => handleContactChange(index, 'department', e.target.value)}
                            placeholder="IT / Inkoop"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Functie</label>
                          <input
                            type="text"
                            className="input-field text-sm"
                            value={contact.function}
                            onChange={(e) => handleContactChange(index, 'function', e.target.value)}
                            placeholder="Manager / Technicus"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowClientForm(false)}
                  className="btn-secondary"
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewClient}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save size={20} />
                  <span>Klant opslaan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-blue-400">Nieuwe contactpersoon aanmaken</h2>
              <button
                onClick={() => setShowContactForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <strong>Klant:</strong> {projectData.client}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Deze contactpersoon wordt toegevoegd aan bovenstaande klant
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Voornaam <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={newContactData.first_name}
                    onChange={(e) => setNewContactData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Jan"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Achternaam <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={newContactData.last_name}
                    onChange={(e) => setNewContactData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="de Vries"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">E-mail</label>
                  <input
                    type="email"
                    className="input-field"
                    value={newContactData.email}
                    onChange={(e) => setNewContactData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="jan@bedrijf.nl"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Telefoon</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={newContactData.phone}
                    onChange={(e) => setNewContactData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="06 12345678"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Afdeling</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newContactData.department}
                    onChange={(e) => setNewContactData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Inkoop"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Functie</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newContactData.function}
                    onChange={(e) => setNewContactData(prev => ({ ...prev, function: e.target.value }))}
                    placeholder="Manager"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="btn-secondary"
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewContact}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save size={20} />
                  <span>Contactpersoon opslaan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="btn-primary"
        >
          Volgende stap
        </button>
      </div>
    </div>
  );
};

export default ProjectStep;