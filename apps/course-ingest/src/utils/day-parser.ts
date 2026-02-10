/**
 * Normalizes day strings from the CSV.
 * "MWF" -> "MWF", "TTH" -> "TTH", "ARR" -> null
 */
export function parseDays(raw: string): string | null {
  if (!raw || raw.trim() === '') return null;

  const cleaned = raw.trim().toUpperCase();
  if (cleaned === 'ARR' || cleaned === 'TBA') return null;

  return cleaned;
}
