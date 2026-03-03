/**
 * User Alias Management
 *
 * This module handles user aliases where multiple usernames should be treated as the same person.
 * For example, "Marco" and "Marco Kokshoorn" are the same person and should see each other's work.
 */

// Define user aliases - each array contains usernames that should be treated as the same person
// To add more aliases, add another array to this list:
// Example: ['John', 'John Doe'], ['Jane', 'Jane Smith']
const USER_ALIASES: string[][] = [
  ['Marco', 'Marco Kokshoorn']
];

/**
 * Check if a username matches the current user, considering aliases
 * @param username - The username to check (e.g., from toegewezen_monteur or created_by)
 * @param currentUsername - The current user's username
 * @returns true if the username matches the current user or any of their aliases
 */
export function isUsernameMatch(username: string | undefined | null, currentUsername: string | undefined | null): boolean {
  if (!username || !currentUsername) {
    return false;
  }

  // Direct match
  if (username === currentUsername) {
    return true;
  }

  // Check if they're in the same alias group
  const currentUserAliases = getUserAliases(currentUsername);
  return currentUserAliases.includes(username);
}

/**
 * Get all aliases for a given username
 * @param username - The username to get aliases for
 * @returns Array of all usernames that should be treated as the same person (including the input username)
 */
export function getUserAliases(username: string | undefined | null): string[] {
  if (!username) {
    return [];
  }

  // Find the alias group that contains this username
  const aliasGroup = USER_ALIASES.find(group => group.includes(username));

  // Return the alias group if found, otherwise just return the username
  return aliasGroup || [username];
}

/**
 * Check if a user ID matches the current user, considering aliases
 * This requires a user map to convert IDs to usernames
 * @param userId - The user ID to check
 * @param currentUserId - The current user's ID
 * @param userMap - Map of user IDs to usernames
 * @returns true if the user ID matches the current user or any of their aliases
 */
export function isUserIdMatch(
  userId: string | undefined | null,
  currentUserId: string | undefined | null,
  userMap: Record<string, string>
): boolean {
  if (!userId || !currentUserId) {
    return false;
  }

  // Direct ID match
  if (userId === currentUserId) {
    return true;
  }

  // Get usernames for both IDs
  const username = userMap[userId];
  const currentUsername = userMap[currentUserId];

  // Check if usernames match (considering aliases)
  return isUsernameMatch(username, currentUsername);
}
