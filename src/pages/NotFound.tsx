import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white space-y-6">
      <h1 className="text-4xl font-bold">404 - Pagina niet gevonden</h1>
      <p className="text-gray-400">Oeps! Deze pagina bestaat niet.</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="bg-[#4169e1] hover:bg-blue-600 transition text-white px-6 py-2 rounded-xl"
      >
        Ga naar dashboard
      </button>
    </div>
  );
};

export default NotFound;