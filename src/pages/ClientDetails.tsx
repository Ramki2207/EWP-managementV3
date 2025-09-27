import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { dataService } from '../lib/supabase';

// Generate UUID for new contacts
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const ClientDetails = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    try {
      const data = await dataService.getClients();
      const foundClient = data.find((c: any) => c.id === clientId);
      setClient(foundClient || null);
    } catch (error) {
      console.error('Error loading client:', error);
      toast.error('Er is een fout opgetreden bij het laden van de klant');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setClient({ ...client, [field]: value });
  };

  const handleContactChange = (index: number, field: string, value: string) => {
    const updatedContacts = [...client.contacts];
    updatedContacts[index][field] = value;
    setClient({ ...client, contacts: updatedContacts });
  };

  const handleRemoveContact = (index: number) => {
    const updatedContacts = client.contacts.filter((_: any, i: number) => i !== index);
    setClient({ ...client, contacts: updatedContacts });
    toast.success("Contactpersoon verwijderd!");
  };

  const handleAddContact = () => {
    const newContact = { 
      id: generateUUID(),
      client_id: client.id,
      first_name: "", 
      last_name: "", 
      email: "", 
      phone: "", 
      department: "",
      function: "",
      created_at: new Date().toISOString()
    };
    setClient({ ...client, contacts: [...client.contacts, newContact] });
  };

  const handleSaveChanges = async () => {
    try {
      await dataService.updateClient(client.id, client);
      toast.success("Wijzigingen opgeslagen!");
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de wijzigingen');
    }
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
        <h1 className="text-2xl mb-4">Klant niet gevonden</h1>
        <button
          onClick={() => navigate("/clients")}
          className="bg-[#4169e1] hover:bg-blue-600 transition text-white px-4 py-2 rounded-xl"
        >
          Terug naar klanten
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
      {/* Terug knop */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl">Klantdetails</h1>
        <button
          onClick={() => navigate("/clients")}
          className="bg-[#4169e1] hover:bg-blue-600 transition text-white px-4 py-2 rounded-xl"
        >
          Terug naar klanten
        </button>
      </div>

      {/* Klant info */}
      <div className="bg-[#1E2530] rounded-xl p-6 shadow-lg space-y-6 mb-8">
        <h2 className="text-lg text-[#4169e1] mb-4">Klantgegevens</h2>
        {[
          { label: "Organisatienaam", name: "name" },
          { label: "Bezoekadres Straat", name: "visit_street" },
          { label: "Bezoekadres Postcode", name: "visit_postcode" },
          { label: "Bezoekadres Plaats", name: "visit_city" },
          { label: "Afleveradres Straat", name: "delivery_street" },
          { label: "Afleveradres Postcode", name: "delivery_postcode" },
          { label: "Afleveradres Plaats", name: "delivery_city" },
          { label: "BTW-nummer", name: "vat_number" },
          { label: "KvK-nummer", name: "kvk_number" },
        ].map((field) => (
          <div key={field.name} className="flex items-center mb-2">
            <label className="w-48 text-right mr-4">{field.label}:</label>
            {isEditing ? (
              <input
                type="text"
                value={client[field.name]}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className="flex-1 bg-[#2A303C] text-white p-2 rounded"
              />
            ) : (
              <p>{client[field.name] || "-"}</p>
            )}
          </div>
        ))}
      </div>

      {/* Contactpersonen */}
      <div className="bg-[#1E2530] rounded-xl p-6 shadow-lg space-y-6 mb-8">
        <h2 className="text-lg text-[#4169e1] mb-4">Contactpersonen</h2>
        {client.contacts.map((contact: any, index: number) => (
          <div key={index} className="grid grid-cols-6 gap-2 items-center mb-2">
            {["first_name", "last_name", "email", "phone", "department"].map((field) => (
              <input
                key={field}
                type="text"
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={contact[field]}
                onChange={(e) => handleContactChange(index, field, e.target.value)}
                className={`bg-[#2A303C] text-white p-2 rounded ${!isEditing && "pointer-events-none opacity-70"}`}
                disabled={!isEditing}
              />
            ))}
            {isEditing && (
              <button
                onClick={() => handleRemoveContact(index)}
                className="bg-red-500 hover:bg-red-600 transition text-white px-2 py-1 rounded"
              >
                Verwijderen
              </button>
            )}
          </div>
        ))}
        {isEditing && (
          <button
            onClick={handleAddContact}
            className="bg-[#4169e1] hover:bg-blue-600 transition text-white px-4 py-2 rounded"
          >
            Contactpersoon toevoegen
          </button>
        )}
      </div>

      {/* Acties */}
      <div className="flex justify-end space-x-4">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-[#4169e1] hover:bg-blue-600 transition text-white px-6 py-2 rounded-xl"
          >
            Klantgegevens bewerken
          </button>
        ) : (
          <button
            onClick={handleSaveChanges}
            className="bg-green-500 hover:bg-green-600 transition text-white px-6 py-2 rounded-xl"
          >
            Wijzigingen opslaan
          </button>
        )}
      </div>
    </div>
  );
};

export default ClientDetails;