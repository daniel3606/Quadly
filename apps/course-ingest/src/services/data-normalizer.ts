import type {
  RawCSVRow,
  NormalizedCourse,
  NormalizedSection,
  NormalizedMeeting,
  NormalizedSubject,
  NormalizedData,
} from '../types.js';
import { parseTimeRange } from '../utils/time-parser.js';
import { parseDays } from '../utils/day-parser.js';

/**
 * Normalize raw CSV rows into deduplicated subjects, courses, sections, and meetings.
 */
export function normalizeData(rows: RawCSVRow[], termCode: string): NormalizedData {
  const subjectMap = new Map<string, NormalizedSubject>();
  const courseMap = new Map<string, NormalizedCourse>();
  const sectionMap = new Map<string, NormalizedSection>();
  const meetingMap = new Map<string, NormalizedMeeting>();

  for (const row of rows) {
    const subjectCode = row.Subject?.trim();
    const catalogNumber = row['Catalog Nbr']?.trim();
    const classNumber = row['Class Nbr']?.trim();

    if (!subjectCode || !catalogNumber || !classNumber) continue;

    // Subjects — dedupe by code
    if (!subjectMap.has(subjectCode)) {
      subjectMap.set(subjectCode, {
        code: subjectCode,
        name: subjectCode, // SOC CSV doesn't include full subject names
        acad_group: row['Acad Group']?.trim() || null,
      });
    }

    // Courses — dedupe by subject+catalog
    const courseKey = `${subjectCode}|${catalogNumber}`;
    if (!courseMap.has(courseKey)) {
      const { min, max } = parseCredits(row.CR);
      courseMap.set(courseKey, {
        subject_code: subjectCode,
        catalog_number: catalogNumber,
        title: row['Course Title']?.trim() || '',
        credits_min: min,
        credits_max: max,
        prereqs_text: row.Prereq?.trim() || null,
      });
    }

    // Sections — dedupe by term+class_number
    const sectionKey = `${termCode}|${classNumber}`;
    if (!sectionMap.has(sectionKey)) {
      const enrollCap = parseInt(row['Enrl Cap']) || 0;
      const enrollTotal = parseInt(row['Tot Enrl']) || 0;

      sectionMap.set(sectionKey, {
        subject_code: subjectCode,
        catalog_number: catalogNumber,
        term_code: termCode,
        class_number: classNumber,
        section_number: row.Section?.trim() || '',
        component: normalizeComponent(row.Component?.trim()),
        instructor: row.Instructor?.trim() || null,
        enrollment_cap: enrollCap,
        enrollment_total: enrollTotal,
        waitlist_cap: parseInt(row['Wait Cap']) || 0,
        waitlist_total: parseInt(row['Wait Tot']) || 0,
        is_open: enrollTotal < enrollCap,
      });
    }

    // Meetings — dedupe by (class_number, days, start_time, end_time, location)
    // to match the unique index meetings_unique_pattern_idx
    const days = parseDays(row.Days || '');
    const time = parseTimeRange(row.Time || '');
    const location = normalizeLocation(row.Location?.trim());
    const isArranged = !days && !time;

    // Build a dedupe key matching the DB unique index
    const meetingKey = `${termCode}|${classNumber}|${days ?? 'NULL'}|${time?.start ?? 'NULL'}|${time?.end ?? 'NULL'}|${location ?? 'NULL'}`;

    if (!meetingMap.has(meetingKey)) {
      meetingMap.set(meetingKey, {
        class_number: classNumber,
        term_code: termCode,
        days,
        start_time: time?.start || null,
        end_time: time?.end || null,
        location,
        is_arranged: isArranged,
      });
    }
  }

  return {
    subjects: Array.from(subjectMap.values()),
    courses: Array.from(courseMap.values()),
    sections: Array.from(sectionMap.values()),
    meetings: Array.from(meetingMap.values()),
  };
}

function parseCredits(raw: string): { min: number | null; max: number | null } {
  if (!raw || raw.trim() === '') return { min: null, max: null };

  const cleaned = raw.trim();
  // Range: "1.00-4.00"
  const rangeMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
  }

  // Single: "4.00"
  const single = parseFloat(cleaned);
  if (!isNaN(single)) {
    return { min: single, max: single };
  }

  return { min: null, max: null };
}

const VALID_COMPONENTS = new Set(['LEC', 'DIS', 'LAB', 'SEM', 'IND', 'REC', 'CLN', 'FLD']);

function normalizeComponent(raw: string): string {
  const upper = raw?.toUpperCase() || 'LEC';
  return VALID_COMPONENTS.has(upper) ? upper : 'LEC';
}

function normalizeLocation(raw: string | undefined): string | null {
  if (!raw || raw === '' || raw.toUpperCase() === 'ARR' || raw.toUpperCase() === 'TBA') {
    return null;
  }
  return raw;
}
