// ── Raw CSV row from UMich Schedule of Classes ──
export interface RawCSVRow {
  Term: string;
  Session: string;
  'Acad Group': string;
  Subject: string;
  'Catalog Nbr': string;
  Section: string;
  'Class Nbr': string;
  'Course Title': string;
  Component: string;
  Days: string;
  Time: string;
  Location: string;
  Instructor: string;
  CR: string;
  'Enrl Cap': string;
  'Tot Enrl': string;
  'Wait Cap': string;
  'Wait Tot': string;
  Code: string;
  Prereq: string;
  'Lab Fee': string;
}

// ── Normalized data types (match actual DB schema) ──
export interface NormalizedCourse {
  subject_code: string;
  catalog_number: string;
  title: string;
  credits_min: number | null;
  credits_max: number | null;
  prereqs_text: string | null;
}

export interface NormalizedSection {
  // Used during normalization; stripped before DB insert
  subject_code: string;
  catalog_number: string;
  term_code: string;
  class_number: string;
  section_number: string;
  component: string;
  instructor: string | null;
  enrollment_cap: number;
  enrollment_total: number;
  waitlist_cap: number;
  waitlist_total: number;
  is_open: boolean;
}

export interface NormalizedMeeting {
  // Used during normalization; class_number/term_code stripped before DB insert
  class_number: string;
  term_code: string;
  days: string | null;
  start_time: string | null; // "10:00:00" (TIME format)
  end_time: string | null;   // "11:30:00"
  location: string | null;
  is_arranged: boolean;
}

export interface NormalizedSubject {
  code: string;
  name: string | null;
  acad_group: string | null;
}

export interface NormalizedData {
  subjects: NormalizedSubject[];
  courses: NormalizedCourse[];
  sections: NormalizedSection[];
  meetings: NormalizedMeeting[];
}

// ── Time parsing ──
export interface ParsedTime {
  start: string; // "10:00:00" (TIME format for Postgres)
  end: string;   // "11:30:00"
}

// ── API response types ──
export interface TermResponse {
  code: string;
  name: string;
  year: number;
  season: string;
  is_current: boolean;
}

export interface CourseSearchResult {
  id: number;
  subject_code: string;
  catalog_number: string;
  title: string;
  credits_min: number | null;
  credits_max: number | null;
}

export interface MeetingResponse {
  days: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_arranged: boolean;
}

export interface SectionResponse {
  section_number: string;
  component: string;
  class_number: string;
  instructor: string | null;
  enrollment_cap: number;
  enrollment_total: number;
  waitlist_cap: number;
  waitlist_total: number;
  is_open: boolean;
  meetings: MeetingResponse[];
}

export interface CourseSectionsResponse {
  course: {
    subject_code: string;
    catalog_number: string;
    title: string;
    credits_min: number | null;
    credits_max: number | null;
  };
  sections: SectionResponse[];
}

export interface IngestResult {
  term_code: string;
  file_name: string;
  row_count: number;
  subjects_count: number;
  courses_count: number;
  sections_count: number;
  meetings_count: number;
  duration_ms: number;
}
