// Creates (or resets the password of) one admin user. Needed after
// scripts/runMigration.js, since DROP TABLE ... CASCADE removes every row,
// including whatever account you used to log into the app.
//
// Run with:
//   DATABASE_URL=postgres://... ADMIN_USERNAME=admin ADMIN_PASSWORD=changeme node scripts/seedAdmin.js
//
// Safe to re-run: if the username already exists, it updates that user's
// password_hash instead of inserting a duplicate.
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME || 'Administrator';

  if (!databaseUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }
  if (!password) {
    console.error('ADMIN_PASSWORD is not set.');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);

    if (rows[0]) {
      await pool.query('UPDATE users SET password_hash = $1, user_type = $2, status = $3 WHERE id = $4',
        [passwordHash, 'admin', 'active', rows[0].id]);
      console.log(`Updated existing user "${username}" (id ${rows[0].id}) — set as active admin with new password.`);
    } else {
      const { rows: inserted } = await pool.query(
        `INSERT INTO users (full_name, username, password_hash, user_type, status)
         VALUES ($1, $2, $3, 'admin', 'active') RETURNING id`,
        [fullName, username, passwordHash]
      );
      console.log(`Created admin user "${username}" (id ${inserted[0].id}).`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
