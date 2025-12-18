/**
 * Maps internal location names to their display names for documents and client portals
 */
export const getDisplayLocation = (location: string): string => {
  const locationMap: Record<string, string> = {
    'Leerdam': 'EWP Paneelbouw Utrecht',
    'Naaldwijk': 'EWP Paneelbouw Den Haag',
    'Rotterdam': 'EWP Paneelbouw Rotterdam'
  };

  return locationMap[location] || location;
};
