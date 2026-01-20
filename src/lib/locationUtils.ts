/**
 * Maps internal location names to their display names for documents and client portals
 */
export const getDisplayLocation = (location: string): string => {
  const locationMap: Record<string, string> = {
    'Leerdam': 'EWP Paneelbouw Utrecht',
    'Naaldwijk': 'EWP Paneelbouw Den Haag',
    'Naaldwijk (PD)': 'EWP Paneelbouw Den Haag',
    'Naaldwijk (PW)': 'EWP Paneelbouw Den Haag',
    'Rotterdam': 'EWP Paneelbouw Rotterdam'
  };

  return locationMap[location] || location;
};

/**
 * Checks if a user has access to a project based on location.
 * Handles backward compatibility:
 * - users with "Naaldwijk" can see both "Naaldwijk (PD)" and "Naaldwijk (PW)" projects
 * - users with "Rotterdam" can see "Rotterdam (PR)" projects
 */
export const hasLocationAccess = (projectLocation: string | undefined, userAssignedLocations: string[] | undefined): boolean => {
  if (!projectLocation || !userAssignedLocations || userAssignedLocations.length === 0) {
    return true;
  }

  // Check for exact match first
  if (userAssignedLocations.includes(projectLocation)) {
    return true;
  }

  // Backward compatibility: if user has "Naaldwijk", they can see both PD and PW variants
  if ((projectLocation === 'Naaldwijk (PD)' || projectLocation === 'Naaldwijk (PW)') &&
      userAssignedLocations.includes('Naaldwijk')) {
    return true;
  }

  // Backward compatibility: if user has "Rotterdam", they can see Rotterdam (PR)
  if (projectLocation === 'Rotterdam (PR)' && userAssignedLocations.includes('Rotterdam')) {
    return true;
  }

  return false;
};
