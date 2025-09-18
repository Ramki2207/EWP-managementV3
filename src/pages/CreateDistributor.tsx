import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const CreateDistributor = () => {
  const navigate = useNavigate();

  const [distributorData, setDistributorData] = useState({
    distributorId: "",
    distributorName: "",
    system: "",
    powerSupply: "",
    buildYear: "",
    inspectionDate: new Date().toISOString().split('T')[0], // Set today's date as default
    testedBy: "",
    unInV: "",
    inInA: "",
    ikThInKA1s: "",
    ikDynInKA: "",
    freqInHz: "",
    typeNrHs: "",
    projectNumber: "",
    manufacturer: "",
    profilePhoto: null as File | null,
  });

  const handleSaveDistributor = () => {
    if (!distributorData.distributorId || !distributorData.distributorName) {
      toast.error("Vul alle verplichte velden in!");
      return;
    }

    const storedDistributors = JSON.parse(localStorage.getItem("distributors") || "[]");

    const newDistributor = {
      id: Date.now(),
      createdAt: new Date().toLocaleString(),
      ...distributorData,
    };

    localStorage.setItem(
      "distributors",
      JSON.stringify([...storedDistributors, newDistributor])
    );

    toast.success("Verdeler succesvol opgeslagen!");
    navigate("/verdelers");
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-6">
      <h1 className="text-2xl mb-6">Nieuwe Verdeler Toevoegen</h1>

      <div className="bg-[#1E2530] p-6 rounded-xl space-y-6">
        {/* Profiel foto upload */}
        <div>
          <label className="block mb-1 text-sm">Profiel foto:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setDistributorData({
                  ...distributorData,
                  profilePhoto: e.target.files[0]
                });
              }
            }}
            className="w-full bg-[#2A303C] text-white p-2 rounded"
          />
        </div>

        {/* Verdeler velden */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "ID Verdeler", name: "distributorId" },
            { label: "Verdeler naam", name: "distributorName" },
            { label: "Systeem", name: "system" },
            { label: "Voeding", name: "powerSupply" },
            { label: "Bouwjaar", name: "buildYear" },
            { 
              label: "Keuring datum", 
              name: "inspectionDate", 
              type: "date"
            },
            { label: "Getest door", name: "testedBy" },
            { label: "Un in V", name: "unInV" },
            { label: "In in A", name: "inInA" },
            { label: "Ik Th in KA 1s", name: "ikThInKA1s" },
            { label: "Ik Dyn in KA", name: "ikDynInKA" },
            { label: "Frequentie in Hz", name: "freqInHz" },
            { label: "Type nr. Hs", name: "typeNrHs" },
            { label: "Projectnummer", name: "projectNumber" },
            { label: "Fabrikant", name: "manufacturer" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block mb-1 text-sm">{field.label}:</label>
              <input
                type={field.type || "text"}
                value={(distributorData as any)[field.name]}
                onChange={(e) =>
                  setDistributorData({
                    ...distributorData,
                    [field.name]: e.target.value,
                  })
                }
                className="w-full bg-[#2A303C] text-white p-2 rounded"
              />
            </div>
          ))}
        </div>

        {/* Acties */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={() => navigate("/verdelers")}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 transition rounded"
          >
            Annuleren
          </button>
          <button
            onClick={handleSaveDistributor}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 transition rounded"
          >
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDistributor;