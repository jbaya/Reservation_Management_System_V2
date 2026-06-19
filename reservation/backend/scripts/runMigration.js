// Applies docs/02-SCHEMA.sql against DATABASE_URL. Run with:
//   DATABASE_URL=postgres://... node scripts/runMigration.js
//
// This is destructive (DROP TABLE ... CASCADE) by design — see
// docs/04-DB-CUTOVER.md for why that's safe for this project right now.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../../docs/02-SCHEMA.sql');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  });

  console.log(`Applying ${schemaPath} ...`);
  try {
    await pool.query(sql);
    console.log('Schema applied successfully.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
