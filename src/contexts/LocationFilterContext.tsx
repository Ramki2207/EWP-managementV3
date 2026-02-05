import React, { createContext, useContext, useState, useEffect } from 'react';

type LocationFilterMode = 'all' | 'naaldwijk' | 'leerdam';

interface LocationFilterContextType {
  filterMode: LocationFilterMode;
  setFilterMode: (mode: LocationFilterMode) => void;
  getFilteredLocations: () => string[];
  isLocationVisible: (location: string | undefined) => boolean;
}

const LocationFilterContext = createContext<LocationFilterContextType | undefined>(undefined);

export const LocationFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filterMode, setFilterMode] = useState<LocationFilterMode>('all');

  // Save filter preference to localStorage
  useEffect(() => {
    const savedFilter = localStorage.getItem('location_filter_preference');
    if (savedFilter === 'naaldwijk' || savedFilter === 'leerdam' || savedFilter === 'all') {
      setFilterMode(savedFilter);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('location_filter_preference', filterMode);
  }, [filterMode]);

  const getFilteredLocations = (): string[] => {
    switch (filterMode) {
      case 'naaldwijk':
        return ['Naaldwijk (PD)', 'Naaldwijk (PW)', 'Rotterdam'];
      case 'leerdam':
        return ['Leerdam', 'Leerdam (PM)'];
      case 'all':
      default:
        return ['Naaldwijk (PD)', 'Naaldwijk (PW)', 'Rotterdam', 'Leerdam', 'Leerdam (PM)'];
    }
  };

  const isLocationVisible = (location: string | undefined): boolean => {
    if (!location) return true; // Show items without location
    const filteredLocations = getFilteredLocations();
    return filteredLocations.includes(location);
  };

  return (
    <LocationFilterContext.Provider
      value={{
        filterMode,
        setFilterMode,
        getFilteredLocations,
        isLocationVisible,
      }}
    >
      {children}
    </LocationFilterContext.Provider>
  );
};

export const useLocationFilter = () => {
  const context = useContext(LocationFilterContext);
  if (context === undefined) {
    throw new Error('useLocationFilter must be used within a LocationFilterProvider');
  }
  return context;
};
