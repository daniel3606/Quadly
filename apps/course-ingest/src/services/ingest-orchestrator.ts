import path from 'path';
import fs from 'fs';
import { config } from '../config.js';
import { supabase } from '../lib/supabase.js';
import { parseCSV } from './csv-parser.js';
import { normalizeData } from './data-normalizer.js';
import { upsertAll } from './upsert-service.js';
import { cacheFlush } from '../lib/cache.js';
import type { IngestResult } from '../types.js';

/**
 * Orchestrates the full ingestion pipeline:
 * 1. Find CSV file for term
 * 2. Parse CSV
 * 3. Normalize data
 * 4. Upsert to Supabase
 * 5. Log result to ingestion_log
 */
export async function runIngestion(termCode: string): Promise<IngestResult> {
  const startTime = Date.now();

  // Find CSV file
  const csvFile = findCSVFile(termCode);
  if (!csvFile) {
    throw new Error(`No CSV file found for term ${termCode} in ${config.csvDir}`);
  }

  const fileName = path.basename(csvFile);
  console.log(`Starting ingestion for ${termCode} from ${fileName}`);

  // Log start (status = 'started')
  const { data: logEntry, error: logError } = await supabase
    .from('ingestion_log')
    .insert({
      term_code: termCode,
      source: 'csv',
      file_name: fileName,
      status: 'started',
    })
    .select('id')
    .single();

  if (logError) throw logError;
  const logId = logEntry.id;

  try {
    // Ensure term exists
    await supabase.from('terms').upsert({
      code: termCode,
      name: formatTermName(termCode),
      year: parseInt(termCode.slice(2)),
      season: termCode.slice(0, 2),
      is_current: false,
    }, { onConflict: 'code' });

    // Parse
    const rows = await parseCSV(csvFile);

    // Normalize
    const normalized = normalizeData(rows, termCode);
    console.log(
      `Normalized: ${normalized.subjects.length} subjects, ` +
      `${normalized.courses.length} courses, ` +
      `${normalized.sections.length} sections, ` +
      `${normalized.meetings.length} meetings`
    );

    // Upsert
    const counts = await upsertAll(normalized);

    // Flush cache after successful ingestion
    cacheFlush();

    const durationMs = Date.now() - startTime;

    // Log completion (status = 'success')
    await supabase.from('ingestion_log').update({
      status: 'success',
      row_count: rows.length,
      courses_upserted: counts.courses_count,
      sections_upserted: counts.sections_count,
      meetings_upserted: counts.meetings_count,
      duration_ms: durationMs,
    }).eq('id', logId);

    const result: IngestResult = {
      term_code: termCode,
      file_name: fileName,
      row_count: rows.length,
      subjects_count: counts.subjects_count,
      courses_count: counts.courses_count,
      sections_count: counts.sections_count,
      meetings_count: counts.meetings_count,
      duration_ms: durationMs,
    };

    console.log(`Ingestion completed in ${durationMs}ms`);
    return result;
  } catch (err) {
    const durationMs = Date.now() - startTime;
    // Log failure (status = 'failed')
    await supabase.from('ingestion_log').update({
      status: 'failed',
      duration_ms: durationMs,
      error_summary: err instanceof Error ? err.message : String(err),
    }).eq('id', logId);

    throw err;
  }
}

function findCSVFile(termCode: string): string | null {
  if (!fs.existsSync(config.csvDir)) return null;

  const files = fs.readdirSync(config.csvDir);
  // Look for exact match first (e.g. FA2025.csv), then partial
  const exact = files.find((f) => f.toLowerCase() === `${termCode.toLowerCase()}.csv`);
  if (exact) return path.join(config.csvDir, exact);

  const partial = files.find((f) =>
    f.toLowerCase().includes(termCode.toLowerCase()) && f.endsWith('.csv')
  );
  if (partial) return path.join(config.csvDir, partial);

  return null;
}

function formatTermName(code: string): string {
  const season = code.slice(0, 2);
  const year = code.slice(2);
  const seasonNames: Record<string, string> = {
    FA: 'Fall', WN: 'Winter', SP: 'Spring', SU: 'Summer',
  };
  return `${seasonNames[season] || season} ${year}`;
}
