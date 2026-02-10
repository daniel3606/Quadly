import { supabase } from '../lib/supabase.js';
import { retry } from '../utils/retry.js';
import type { NormalizedData } from '../types.js';

const BATCH_SIZE = 500;
const PAGE_SIZE = 1000; // Supabase default row limit

/**
 * Fetch all rows from a table, paginating past the 1000-row default limit.
 */
async function fetchAll<T extends Record<string, any>>(
  table: string,
  columns: string
): Promise<T[]> {
  const allRows: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allRows.push(...(data as unknown as T[]));

    if (data.length < PAGE_SIZE) break; // last page
    offset += PAGE_SIZE;
  }

  return allRows;
}

/**
 * Batch upsert normalized data into Supabase.
 * Returns counts of upserted records.
 */
export async function upsertAll(data: NormalizedData): Promise<{
  subjects_count: number;
  courses_count: number;
  sections_count: number;
  meetings_count: number;
}> {
  // 1. Upsert subjects (PK = code)
  const subjectsCount = await batchUpsert('subjects', data.subjects as any[], 'code');
  console.log(`  Upserted ${subjectsCount} subjects`);

  // 2. Upsert courses (unique on subject_code, catalog_number)
  const coursesCount = await batchUpsert('courses', data.courses as any[], 'subject_code,catalog_number');
  console.log(`  Upserted ${coursesCount} courses`);

  // 3. Resolve course_ids (bigint) for sections, then upsert
  const sectionsWithIds = await resolveCourseIds(data.sections);
  const sectionsCount = await batchUpsert('sections', sectionsWithIds, 'term_code,class_number');
  console.log(`  Upserted ${sectionsCount} sections`);

  // 4. Resolve section_ids for meetings, delete old, insert fresh
  const meetingsWithIds = await resolveSectionIds(data.meetings);

  // Delete existing meetings for affected sections, then insert fresh
  const sectionIds = [...new Set(meetingsWithIds.map((m) => m.section_id))];
  for (let i = 0; i < sectionIds.length; i += BATCH_SIZE) {
    const batch = sectionIds.slice(i, i + BATCH_SIZE);
    await retry(async () => {
      const { error } = await supabase.from('meetings').delete().in('section_id', batch);
      if (error) throw error;
    });
  }

  let meetingsCount = 0;
  for (let i = 0; i < meetingsWithIds.length; i += BATCH_SIZE) {
    const batch = meetingsWithIds.slice(i, i + BATCH_SIZE);
    await retry(async () => {
      const { error } = await supabase.from('meetings').insert(batch);
      if (error) throw error;
    });
    meetingsCount += batch.length;
  }
  console.log(`  Inserted ${meetingsCount} meetings`);

  return {
    subjects_count: subjectsCount,
    courses_count: coursesCount,
    sections_count: sectionsCount,
    meetings_count: meetingsCount,
  };
}

async function batchUpsert(
  table: string,
  records: any[],
  onConflict: string
): Promise<number> {
  let count = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await retry(async () => {
      const { error } = await supabase.from(table).upsert(batch, { onConflict });
      if (error) throw error;
    });
    count += batch.length;
  }
  return count;
}

async function resolveCourseIds(sections: NormalizedData['sections']): Promise<any[]> {
  // Paginated fetch of all courses
  const courses = await fetchAll<{ id: number; subject_code: string; catalog_number: string }>(
    'courses', 'id, subject_code, catalog_number'
  );
  console.log(`  Fetched ${courses.length} courses for ID resolution`);

  const courseIdMap = new Map<string, number>();
  for (const c of courses) {
    courseIdMap.set(`${c.subject_code}|${c.catalog_number}`, c.id);
  }

  const result: any[] = [];
  let skipped = 0;
  for (const s of sections) {
    const courseId = courseIdMap.get(`${s.subject_code}|${s.catalog_number}`);
    if (!courseId) {
      skipped++;
      continue;
    }
    const { subject_code, catalog_number, ...rest } = s;
    result.push({ ...rest, course_id: courseId });
  }
  if (skipped > 0) {
    console.warn(`  Skipped ${skipped} sections (no matching course)`);
  }
  return result;
}

async function resolveSectionIds(meetings: NormalizedData['meetings']): Promise<any[]> {
  // Paginated fetch of all sections
  const sections = await fetchAll<{ id: number; term_code: string; class_number: string }>(
    'sections', 'id, term_code, class_number'
  );
  console.log(`  Fetched ${sections.length} sections for ID resolution`);

  const sectionIdMap = new Map<string, number>();
  for (const s of sections) {
    sectionIdMap.set(`${s.term_code}|${s.class_number}`, s.id);
  }

  const result: any[] = [];
  let skipped = 0;
  for (const m of meetings) {
    const sectionId = sectionIdMap.get(`${m.term_code}|${m.class_number}`);
    if (!sectionId) {
      skipped++;
      continue;
    }
    const { class_number, term_code, ...rest } = m;
    result.push({ ...rest, section_id: sectionId });
  }
  if (skipped > 0) {
    console.warn(`  Skipped ${skipped} meetings (no matching section)`);
  }
  return result;
}
