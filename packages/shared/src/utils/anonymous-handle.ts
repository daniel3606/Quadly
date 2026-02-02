/**
 * Generate an anonymous handle ID for a user within a specific context
 * This ensures the same user appears as the same anonymous user within the same post/thread
 */
export function generateAnonymousHandleId(userId: string, contextId: string): string {
  // Simple hash-based approach: combine userId and contextId
  // In production, you might want to use a more sophisticated approach
  const combined = `${userId}:${contextId}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and create a short identifier
  const positiveHash = Math.abs(hash);
  const handleId = `anon_${positiveHash.toString(36).substring(0, 8)}`;
  
  return handleId;
}

/**
 * Generate a display name for anonymous users
 * Returns a consistent name like "Anonymous1", "Anonymous2" etc. based on handle ID
 */
export function getAnonymousDisplayName(handleId: string): string {
  // Extract numeric part from handle ID
  const match = handleId.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 36) % 1000; // Limit to 0-999
    return `Anonymous${num + 1}`;
  }
  return 'Anonymous';
}
