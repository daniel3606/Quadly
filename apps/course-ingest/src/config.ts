import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  port: parseInt(process.env.PORT || '3001', 10),
  ingestApiKey: requireEnv('INGEST_API_KEY'),
  csvDir: path.resolve(__dirname, '../data/csv'),
  seedDir: path.resolve(__dirname, '../data/seed'),
} as const;
