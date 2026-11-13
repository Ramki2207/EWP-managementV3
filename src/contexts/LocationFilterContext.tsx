import React, { createContext, useContext, useState, useEffect } from 'react';

export type LocationGroup = 'naaldwijk' | 'leerdam' | 'rotterdam' | 'arnhem';

export const LOCATION_GROUP_OPTIONS: { value: LocationGroup; label: string }[] = [
  { value: 'naaldwijk', label: 'Den Haag' },
  { value: 'rotterdam', label: 'Rotterdam' },
  { value: 'leerdam', label: 'Utrecht' },
  { value: 'arnhem', label: 'Arnhem' },
];

const GROUP_LOCATIONS: Record<LocationGroup, string[]> = {
  naaldwijk: ['Naaldwijk (PD)', 'Naaldwijk (PW)', 'Rotterdam', 'Den Haag', 'Rotterdam (2P)'],
  leerdam: ['Leerdam', 'Leerdam (PM)', 'Utrecht', 'Arnhem', 'Service'],
  rotterdam: ['Rotterdam', 'Rotterdam (2P)', 'Rotterdam (PR)'],
  arnhem: ['Arnhem'],
};

const ALL_LOCATIONS = ['Naaldwijk (PD)', 'Naaldwijk (PW)', 'Rotterdam', 'Leerdam', 'Leerdam (PM)', 'Den Haag', 'Rotterdam (2P)', 'Rotterdam (PR)', 'Utrecht', 'Arnhem', 'Service'];

const STORAGE_KEY = 'location_filter_preference';

const isLocationGroup = (value: unknown): value is LocationGroup =>
  typeof value === 'string' && value in GROUP_LOCATIONS;

const loadSavedGroups = (): LocationGroup[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  if (isLocationGroup(saved)) return [saved];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(isLocationGroup) : [];
  } catch {
    return [];
  }
};

interface LocationFilterContextType {
  selectedGroups: LocationGroup[];
  setSelectedGroups: (groups: LocationGroup[]) => void;
  getFilteredLocations: () => string[];
  isLocationVisible: (location: string | undefined) => boolean;
}

const LocationFilterContext = createContext<LocationFilterContextType | undefined>(undefined);

export const LocationFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedGroups, setSelectedGroups] = useState<LocationGroup[]>(loadSavedGroups);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedGroups));
  }, [selectedGroups]);

  const getFilteredLocations = (): string[] => {
    if (selectedGroups.length === 0) return ALL_LOCATIONS;
    return Array.from(new Set(selectedGroups.flatMap(group => GROUP_LOCATIONS[group])));
  };

  const isLocationVisible = (location: string | undefined): boolean => {
    if (!location) return true;
    return getFilteredLocations().includes(location);
  };

  return (
    <LocationFilterContext.Provider
      value={{
        selectedGroups,
        setSelectedGroups,
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
