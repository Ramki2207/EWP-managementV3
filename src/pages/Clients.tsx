import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, FolderOpen, Trash2, UserPlus, X, Upload } from 'lucide-react';
import { Building } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Papa from 'papaparse';
import { dataService } from '../lib/supabase';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { hasLocationAccess } from '../lib/locationUtils';

const Clients = () => {
  const navigate = useNavigate();
  const { currentUser } = useEnhancedPermissions();
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientData, setClientData] = useState({
    name: "",
    status: "Actief",
    location: "",
    visit_street: "",
    visit_postcode: "",
    visit_city: "",
    delivery_street: "",
    delivery_postcode: "",
    delivery_city: "",
    vat_number: "",
    kvk_number: "",
    logo_url: "",
    contacts: [{ first_name: "", last_name: "", email: "", phone: "", department: "", function: "" }],
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  useEffect(() => {
    if (currentUser) {
      loadClients();
    }
  }, [currentUser]);

  const loadClients = async () => {
    try {
      let data = await dataService.getClients();

      console.log('🏢 CLIENTS: Loaded clients:', data?.length);
      console.log('🏢 CLIENTS: Current user:', currentUser?.username, 'Role:', currentUser?.role);
      console.log('🏢 CLIENTS: Assigned locations:', currentUser?.assignedLocations);

      // Location-based filtering for users with assigned locations
      if (currentUser?.assignedLocations?.length > 0) {
        const beforeFilter = data?.length || 0;
        data = data?.filter((client: any) => {
          // Always show clients created by the user
          const isCreator = client.created_by === currentUser.id;

          if (isCreator) {
            console.log(`📍 CLIENTS LOCATION FILTER: Showing client ${client.name} to ${currentUser.username} - USER IS CREATOR`);
            return true;
          }

          // Check if user has access based on location (with backward compatibility)
          const shouldShow = hasLocationAccess(client.location, currentUser.assignedLocations);

          if (!shouldShow) {
            console.log(`📍 CLIENTS LOCATION FILTER: Hiding client ${client.name} (location: ${client.location || 'NONE'}) from ${currentUser.username} with locations: ${currentUser.assignedLocations.join(', ')}`);
          } else {
            console.log(`📍 CLIENTS LOCATION FILTER: Showing client ${client.name} (location: ${client.location})`);
          }

          return shouldShow;
        });
        console.log(`📍 CLIENTS LOCATION FILTER: Filtered ${beforeFilter} clients down to ${data?.length || 0} for ${currentUser.username}`);
      }

      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
     toast.error(error.message || 'Er is een fout opgetreden bij het laden van de klanten');
    }
  };

  const handleAddContact = () => {
    setClientData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, { first_name: "", last_name: "", email: "", phone: "", department: "", function: "" }],
    }));
  };

  const handleRemoveContact = (index: number) => {
    const updated = clientData.contacts.filter((_, i) => i !== index);
    setClientData({ ...clientData, contacts: updated });
  };

  const handleContactChange = (index: number, field: string, value: string) => {
    const updated = [...clientData.contacts];
    updated[index] = { ...updated[index], [field]: value };
    setClientData({ ...clientData, contacts: updated });
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setClientData({ ...clientData, logo_url: "" });
  };

  const handleSaveClient = async () => {
    if (!clientData.name.trim()) {
      toast.error('Vul tenminste de organisatienaam in!');
      return;
    }

    if (!clientData.location) {
      toast.error('Selecteer een locatie voor deze klant!');
      return;
    }

    try {
      let logoUrl = clientData.logo_url;

      if (logoFile) {
        const uploadResult = await dataService.uploadClientLogo(logoFile);
        if (uploadResult) {
          logoUrl = uploadResult;
        }
      }

      const savedClient = await dataService.createClient({
        ...clientData,
        logo_url: logoUrl,
        created_by: currentUser?.id
      });
      setClients([savedClient, ...clients]);
      setShowClientForm(false);
      setClientData({
        name: "",
        status: "Actief",
        location: "",
        visit_street: "",
        visit_postcode: "",
        visit_city: "",
        delivery_street: "",
        delivery_postcode: "",
        delivery_city: "",
        vat_number: "",
        kvk_number: "",
        logo_url: "",
        contacts: [{ first_name: "", last_name: "", email: "", phone: "", department: "", function: "" }],
      });
      setLogoFile(null);
      setLogoPreview("");
      toast.success('Klant succesvol toegevoegd!');
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de klant');
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: async (results) => {
        try {
          const validClients: any[] = [];

          for (const row of results.data) {
            const client = {
              name: row['Organisatienaam'],
              status: row['Status'] || 'Actief',
              visit_street: row['Bezoekadres Straat'],
              visit_postcode: row['Bezoekadres Postcode'],
              visit_city: row['Bezoekadres Plaats'],
              delivery_street: row['Afleveradres Straat'],
              delivery_postcode: row['Afleveradres Postcode'],
              delivery_city: row['Afleveradres Plaats'],
              vat_number: row['BTW-nummer'],
              kvk_number: row['KvK-nummer'],
              contacts: [{
                first_name: row['Voornaam'],
                last_name: row['Achternaam'],
                email: row['Email'],
                phone: row['Telefoon'],
                department: row['Afdeling'],
                function: row['Functie']
              }]
            };

            if (!client.name) {
              console.warn('Row missing organization name:', row);
              continue;
            }

            try {
              const savedClient = await dataService.createClient(client);
              validClients.push(savedClient);
            } catch (error) {
              console.error('Error saving client:', error);
              continue;
            }
          }

          if (validClients.length > 0) {
            setClients(prev => [...validClients, ...prev]);
            toast.success(`${validClients.length} klanten succesvol geïmporteerd!`);
          } else {
            toast.error('Geen geldige klantgegevens gevonden in het CSV-bestand');
          }
        } catch (error) {
          console.error('CSV Processing Error:', error);
          toast.error('Fout bij het verwerken van het CSV-bestand');
        }
      },
      error: (error) => {
        console.error('CSV Parse Error:', error);
        toast.error('Fout bij het importeren van het CSV-bestand');
      }
    });

    event.target.value = '';
  };

  const handleDeleteAllClients = async () => {
    if (window.confirm('Weet je zeker dat je ALLE klanten wilt verwijderen? Dit kan niet ongedaan worden gemaakt!')) {
      try {
        for (const client of clients) {
          await dataService.deleteClient(client.id);
        }
        setClients([]);
        toast.success('Alle klanten zijn verwijderd!');
      } catch (error) {
        console.error('Error deleting clients:', error);
        toast.error('Er is een fout opgetreden bij het verwijderen van de klanten');
      }
    }
  };

  const filteredClients = clients
    .filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' }));

  return (
    <div className="min-h-screen p-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">Klantenoverzicht</h1>
            <p className="text-gray-400">Beheer al je klanten op één plek</p>
          </div>
          <div className="flex space-x-4">
            <div>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="btn-secondary flex items-center space-x-2 cursor-pointer"
              >
                <Upload size={20} />
                <span>Importeer CSV</span>
              </label>
            </div>
            <button
              onClick={() => setShowClientForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <UserPlus size={20} />
              <span>Klant toevoegen</span>
            </button>
            {clients.length > 0 && (
              <button
                onClick={handleDeleteAllClients}
                className="btn-secondary flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400"
              >
                <Trash2 size={20} />
                <span>Alle klanten verwijderen</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Client Form */}
      {showClientForm && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg text-gradient mb-6">Nieuwe klant toevoegen</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Organisatienaam", name: "name" },
                {
                  label: "Status",
                  name: "status",
                  type: "select",
                  options: ["Actief", "Inactief"]
                },
                {
                  label: "Locatie",
                  name: "location",
                  type: "select",
                  options: ["Leerdam", "Naaldwijk"]
                },
                { label: "Bezoekadres Straat", name: "visit_street" },
                { label: "Bezoekadres Postcode", name: "visit_postcode" },
                { label: "Bezoekadres Plaats", name: "visit_city" },
                { label: "Afleveradres Straat", name: "delivery_street" },
                { label: "Afleveradres Postcode", name: "delivery_postcode" },
                { label: "Afleveradres Plaats", name: "delivery_city" },
                { label: "BTW-nummer", name: "vat_number" },
                { label: "KvK-nummer", name: "kvk_number" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm text-gray-400 mb-1">{field.label}:</label>
                  {field.type === "select" ? (
                    <select
                      className="input-field"
                      value={(clientData as any)[field.name]}
                      onChange={(e) =>
                        setClientData({ ...clientData, [field.name]: e.target.value })
                      }
                    >
                      {field.options?.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="input-field"
                      value={(clientData as any)[field.name]}
                      onChange={(e) =>
                        setClientData({ ...clientData, [field.name]: e.target.value })
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-md text-gradient">Logo</h3>
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="btn-secondary flex items-center space-x-2 cursor-pointer inline-flex"
                  >
                    <Upload size={20} />
                    <span>Upload Logo</span>
                  </label>
                  {logoPreview && (
                    <div className="mt-4 relative inline-block">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-24 w-auto object-contain bg-white p-2 rounded"
                      />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md text-gradient">Contactpersonen</h3>
                <button
                  onClick={handleAddContact}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Contact toevoegen</span>
                </button>
              </div>

              {clientData.contacts.map((contact, index) => (
                <div key={index} className="card p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-400">
                      Contact {index + 1}
                    </h4>
                    <button
                      onClick={() => handleRemoveContact(index)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-4">
                    <input
                      type="text"
                      placeholder="Voornaam"
                      value={contact.first_name}
                      onChange={(e) => handleContactChange(index, "first_name", e.target.value)}
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Achternaam"
                      value={contact.last_name}
                      onChange={(e) => handleContactChange(index, "last_name", e.target.value)}
                      className="input-field"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={contact.email}
                      onChange={(e) => handleContactChange(index, "email", e.target.value)}
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Telefoon"
                      value={contact.phone}
                      onChange={(e) => handleContactChange(index, "phone", e.target.value)}
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Afdeling"
                      value={contact.department}
                      onChange={(e) => handleContactChange(index, "department", e.target.value)}
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Functie"
                      value={contact.function}
                      onChange={(e) => handleContactChange(index, "function", e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowClientForm(false)}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveClient}
                className="btn-primary"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Zoek op klantnaam..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-6">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto pr-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="table-header text-left">Logo</th>
                <th className="table-header text-left">Naam</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Aangemaakt op</th>
                <th className="table-header text-left">Contactpersoon</th>
                <th className="table-header text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="table-row cursor-pointer"
                  onClick={() => navigate(`/client/${client.id}`)}
                >
                  <td className="py-4">
                    {client.logo_url ? (
                      <img
                        src={client.logo_url}
                        alt={`${client.name} logo`}
                        className="h-10 w-auto object-contain bg-white p-1 rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-700 rounded flex items-center justify-center">
                        <Building size={20} className="text-gray-500" />
                      </div>
                    )}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="font-medium text-purple-400">{client.name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      client.status === 'Actief' 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="py-4 text-gray-300">{new Date(client.created_at).toLocaleString('nl-NL')}</td>
                  <td className="py-4 text-gray-300">{client.contacts?.[0]?.first_name || "-"}</td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/client/${client.id}`);
                        }}
                        className="p-2 bg-[#2A303C] hover:bg-purple-500/20 rounded-lg transition-colors group"
                        title="Openen"
                      >
                        <FolderOpen size={16} className="text-gray-400 group-hover:text-purple-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Building size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">Geen klanten gevonden</p>
              <p className="text-gray-500 text-sm mt-2">Probeer een andere zoekterm of voeg een nieuwe klant toe</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;