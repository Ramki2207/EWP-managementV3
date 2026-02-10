/**
 * Maps internal location names to their display names for documents and client portals
 */
export const getDisplayLocation = (location: string): string => {
  const locationMap: Record<string, string> = {
    'Leerdam': 'EWP Paneelbouw Utrecht',
    'Leerdam (PM)': 'EWP Paneelbouw Utrecht',
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
 * Also checks if the project is shared with any of the user's locations
 */
export const hasLocationAccess = (
  projectLocation: string | undefined,
  userAssignedLocations: string[] | undefined,
  projectSharedLocations?: Array<{ location: string }>
): boolean => {
  if (!projectLocation || !userAssignedLocations || userAssignedLocations.length === 0) {
    return true;
  }

  // Check for exact match with primary location
  if (userAssignedLocations.includes(projectLocation)) {
    return true;
  }

  // Backward compatibility: if user has "Leerdam", they can see Leerdam (PM) projects
  if (projectLocation === 'Leerdam (PM)' && userAssignedLocations.includes('Leerdam')) {
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

  // Check if project is shared with any of the user's locations
  if (projectSharedLocations && projectSharedLocations.length > 0) {
    const sharedLocationNames = projectSharedLocations.map(sl => sl.location);
    console.log('🔍 SHARING: Checking shared locations:', sharedLocationNames, 'against user locations:', userAssignedLocations);

    const hasSharedAccess = userAssignedLocations.some(userLoc => {
      // Direct match
      if (sharedLocationNames.includes(userLoc)) {
        console.log('✅ SHARING: Direct match found for', userLoc);
        return true;
      }

      // Backward compatibility for shared locations
      // If project is shared with "Naaldwijk", users with "Naaldwijk (PD)" or "Naaldwijk (PW)" can access
      if ((userLoc === 'Naaldwijk (PD)' || userLoc === 'Naaldwijk (PW)') &&
          sharedLocationNames.includes('Naaldwijk')) {
        console.log('✅ SHARING: Naaldwijk variant match found for', userLoc);
        return true;
      }

      // If project is shared with "Leerdam", users with "Leerdam (PM)" can access
      if (userLoc === 'Leerdam (PM)' && sharedLocationNames.includes('Leerdam')) {
        console.log('✅ SHARING: Leerdam variant match found for', userLoc);
        return true;
      }

      return false;
    });

    if (hasSharedAccess) {
      console.log('✅ SHARING: Access granted via shared location');
      return true;
    } else {
      console.log('❌ SHARING: No shared location match found');
    }
  }

  return false;
};
