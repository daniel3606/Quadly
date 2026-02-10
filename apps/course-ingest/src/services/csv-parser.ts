import fs from 'fs';
import Papa from 'papaparse';
import type { RawCSVRow } from '../types.js';

/**
 * Parse a UMich Schedule of Classes CSV file.
 */
export function parseCSV(filePath: string): Promise<RawCSVRow[]> {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    Papa.parse<RawCSVRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          const critical = results.errors.filter((e) => e.type === 'FieldMismatch');
          if (critical.length > 0) {
            console.warn(`CSV parse warnings: ${critical.length} field mismatches`);
          }
        }
        console.log(`Parsed ${results.data.length} rows from CSV`);
        resolve(results.data);
      },
      error: (err: Error) => reject(err),
    });
  });
}
