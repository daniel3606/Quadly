/**
 * CLI job for ingesting a CSV file.
 * Usage: npx tsx src/jobs/ingest.ts FA2025
 */
import { runIngestion } from '../services/ingest-orchestrator.js';

const termCode = process.argv[2];

if (!termCode) {
  console.error('Usage: npx tsx src/jobs/ingest.ts <TERM_CODE>');
  console.error('Example: npx tsx src/jobs/ingest.ts FA2025');
  process.exit(1);
}

if (!/^(FA|WN|SP|SU)\d{4}$/.test(termCode)) {
  console.error('Invalid term code format. Expected: FA2025, WN2025, SU2025, etc.');
  process.exit(1);
}

console.log(`Starting ingestion for term: ${termCode}`);

runIngestion(termCode)
  .then((result) => {
    console.log('\nIngestion completed successfully!');
    console.log(`  Subjects: ${result.subjects_count}`);
    console.log(`  Courses:  ${result.courses_count}`);
    console.log(`  Sections: ${result.sections_count}`);
    console.log(`  Meetings: ${result.meetings_count}`);
    console.log(`  Duration: ${result.duration_ms}ms`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nIngestion failed:', err);
    process.exit(1);
  });
