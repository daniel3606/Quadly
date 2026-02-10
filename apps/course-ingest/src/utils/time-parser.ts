import type { ParsedTime } from '../types.js';

/**
 * Parses time strings like "10:00AM-11:30AM" or "1:00PM- 2:30PM"
 * Returns Postgres TIME format: { start: "10:00:00", end: "11:30:00" }
 */
export function parseTimeRange(raw: string): ParsedTime | null {
  if (!raw || raw.trim() === '' || raw.trim().toUpperCase() === 'ARR') {
    return null;
  }

  const cleaned = raw.replace(/\s/g, '').toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})(AM|PM)-(\d{1,2}):(\d{2})(AM|PM)$/);
  if (!match) return null;

  const [, startH, startM, startP, endH, endM, endP] = match;
  return {
    start: to24Hour(parseInt(startH), parseInt(startM), startP),
    end: to24Hour(parseInt(endH), parseInt(endM), endP),
  };
}

function to24Hour(hours: number, minutes: number, period: string): string {
  let h = hours;
  if (period === 'AM' && h === 12) h = 0;
  if (period === 'PM' && h !== 12) h += 12;
  return `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
}
