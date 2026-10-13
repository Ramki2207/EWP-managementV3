/*
  # Align IP-waarde default with the app

  The verdeler form uses 44 as the standard IP value, but the database default was 65.
  Any save that omitted the field silently stored 65. This only changes the default
  for future rows; existing values are untouched.
*/
ALTER TABLE distributors ALTER COLUMN ip_waarde SET DEFAULT '44';