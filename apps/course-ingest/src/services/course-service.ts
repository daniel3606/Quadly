import { supabase } from '../lib/supabase.js';
import { cacheGet, cacheSet, TTL } from '../lib/cache.js';
import type { CourseSearchResult, CourseSectionsResponse, TermResponse } from '../types.js';

/**
 * Get all terms, ordered by year desc + season.
 */
export async function getTerms(): Promise<TermResponse[]> {
  const cached = cacheGet<TermResponse[]>('terms:all');
  if (cached) return cached;

  const { data, error } = await supabase
    .from('terms')
    .select('code, name, year, season, is_current')
    .order('year', { ascending: false })
    .order('code', { ascending: false });

  if (error) throw error;
  const terms = (data || []) as TermResponse[];

  cacheSet('terms:all', terms, TTL.TERMS);
  return terms;
}

/**
 * Search courses by query string.
 * When term is provided, uses an RPC-style raw query to filter by term via subquery
 * to avoid the 1000-row Supabase client limit.
 */
export async function searchCourses(
  query: string,
  termCode?: string,
  limit = 20
): Promise<CourseSearchResult[]> {
  const cacheKey = `search:${query}:${termCode || 'all'}:${limit}`;
  const cached = cacheGet<CourseSearchResult[]>(cacheKey);
  if (cached) return cached;

  const q = query.trim();
  const subjectCatalogMatch = q.match(/^([A-Za-z]+)\s*(\d+\w*)$/);

  let results: CourseSearchResult[];

  if (subjectCatalogMatch) {
    const [, subject, catalog] = subjectCatalogMatch;

    if (termCode) {
      // Use raw SQL to avoid 1000-row limit on course_id fetch
      const { data, error } = await supabase.rpc('search_courses_by_code', {
        p_subject: subject.toUpperCase(),
        p_catalog: catalog,
        p_term: termCode,
        p_limit: limit,
      });
      // Fallback to regular query if RPC doesn't exist
      if (error) {
        results = await searchCoursesDirectly(subject, catalog, termCode, limit);
      } else {
        results = data || [];
      }
    } else {
      let qb = supabase
        .from('courses')
        .select('id, subject_code, catalog_number, title, credits_min, credits_max')
        .ilike('subject_code', subject)
        .ilike('catalog_number', `${catalog}%`)
        .limit(limit);
      const { data, error } = await qb;
      if (error) throw error;
      results = data || [];
    }
  } else {
    if (termCode) {
      const { data, error } = await supabase.rpc('search_courses_by_title', {
        p_query: q,
        p_term: termCode,
        p_limit: limit,
      });
      if (error) {
        results = await searchCoursesByTitleDirect(q, termCode, limit);
      } else {
        results = data || [];
      }
    } else {
      let qb = supabase
        .from('courses')
        .select('id, subject_code, catalog_number, title, credits_min, credits_max')
        .or(`title.ilike.%${q}%,subject_code.ilike.%${q}%`)
        .limit(limit);
      const { data, error } = await qb;
      if (error) throw error;
      results = data || [];
    }
  }

  cacheSet(cacheKey, results, TTL.SEARCH);
  return results;
}

/**
 * Fallback: direct query with term filter via inner join on sections.
 */
async function searchCoursesDirectly(
  subject: string,
  catalog: string,
  termCode: string,
  limit: number
): Promise<CourseSearchResult[]> {
  // Use sections to find course_ids for this term, paginating
  const courseIds = await fetchCourseIdsForTerm(termCode);
  if (courseIds.length === 0) return [];

  const { data, error } = await supabase
    .from('courses')
    .select('id, subject_code, catalog_number, title, credits_min, credits_max')
    .ilike('subject_code', subject)
    .ilike('catalog_number', `${catalog}%`)
    .in('id', courseIds)
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function searchCoursesByTitleDirect(
  q: string,
  termCode: string,
  limit: number
): Promise<CourseSearchResult[]> {
  const courseIds = await fetchCourseIdsForTerm(termCode);
  if (courseIds.length === 0) return [];

  const { data, error } = await supabase
    .from('courses')
    .select('id, subject_code, catalog_number, title, credits_min, credits_max')
    .or(`title.ilike.%${q}%,subject_code.ilike.%${q}%`)
    .in('id', courseIds)
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Fetch ALL course_ids for a given term, paginating past the 1000-row limit.
 */
async function fetchCourseIdsForTerm(termCode: string): Promise<number[]> {
  const allIds = new Set<number>();
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('sections')
      .select('course_id')
      .eq('term_code', termCode)
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      allIds.add(row.course_id);
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return [...allIds];
}

/**
 * Get all sections + meetings for a specific course in a term.
 */
export async function getCourseSections(
  subjectCode: string,
  catalogNumber: string,
  termCode: string
): Promise<CourseSectionsResponse | null> {
  const cacheKey = `sections:${subjectCode}:${catalogNumber}:${termCode}`;
  const cached = cacheGet<CourseSectionsResponse>(cacheKey);
  if (cached) return cached;

  // Find the course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, subject_code, catalog_number, title, credits_min, credits_max')
    .eq('subject_code', subjectCode.toUpperCase())
    .eq('catalog_number', catalogNumber)
    .single();

  if (courseError || !course) return null;

  // Get sections for this course+term, with nested meetings
  const { data: sections, error: secError } = await supabase
    .from('sections')
    .select(`
      section_number, component, class_number, instructor,
      enrollment_cap, enrollment_total, waitlist_cap, waitlist_total, is_open,
      meetings (days, start_time, end_time, location, is_arranged)
    `)
    .eq('course_id', course.id)
    .eq('term_code', termCode)
    .order('section_number');

  if (secError) throw secError;

  const result: CourseSectionsResponse = {
    course: {
      subject_code: course.subject_code,
      catalog_number: course.catalog_number,
      title: course.title,
      credits_min: course.credits_min,
      credits_max: course.credits_max,
    },
    sections: (sections || []).map((s: any) => ({
      section_number: s.section_number,
      component: s.component,
      class_number: s.class_number,
      instructor: s.instructor,
      enrollment_cap: s.enrollment_cap,
      enrollment_total: s.enrollment_total,
      waitlist_cap: s.waitlist_cap,
      waitlist_total: s.waitlist_total,
      is_open: s.is_open,
      meetings: (s.meetings || []).map((m: any) => ({
        days: m.days,
        start_time: m.start_time,
        end_time: m.end_time,
        location: m.location,
        is_arranged: m.is_arranged,
      })),
    })),
  };

  cacheSet(cacheKey, result, TTL.SECTIONS);
  return result;
}
