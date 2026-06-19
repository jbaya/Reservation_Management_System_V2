# Database Cutover Strategy

## Decision

The live database is reset, not migrated in place. This was confirmed
directly with the project owner: the data currently on Neon is test data
only, so a destructive rebuild (`DROP TABLE ... CASCADE` then recreate,
exactly what `02-SCHEMA.sql` does) is acceptable and far simpler than
writing a data-preserving migration for a schema that's changing this
broadly — every table is gaining or changing foreign keys, several
columns are being dropped (`room_categories.num_rooms`, the various
`*_name` text duplicates), and three JSON-blob columns on `bookings` are
becoming separate tables. A row-by-row migration of test data buys
nothing here.

## Recommended rollout (do this on Render/Neon, not from this sandbox)

This sandbox session does not have the live Neon `DATABASE_URL` (it's
intentionally never extracted from Render's dashboard env-var field), so
the actual cutover has to be run by whoever has access to that value —
either from the Render dashboard's shell, or locally with the connection
string pasted into an environment variable for one command. Recommended
sequence:

1. **Create a new Neon branch** (Neon's dashboard → your project →
   Branches → "Create branch" from `main`/`production`). This gives you
   a free, instant, fully isolated copy of the current database to test
   against — if anything looks wrong you delete the branch and nothing
   on the real database was touched.
2. Point a local `.env` (or an exported shell var) at that branch's
   connection string and run:
   ```bash
   cd reservation/backend
   npm install
   DATABASE_URL="<neon-branch-connection-string>" npm run db:migrate
   ```
   This runs `scripts/runMigration.js`, which applies
   `../docs/02-SCHEMA.sql` in one transaction.
3. Smoke-test the new backend against that branch (`npm run dev`, hit a
   few endpoints) before touching the real database.
4. Once satisfied, repeat step 2 against the **real** Neon database
   connection string (the same one currently set as `DATABASE_URL` on
   the Render backend service). This drops and recreates every table in
   this project — confirm nothing outside this app depends on the
   current schema before running it there.
5. Re-seed at least one admin user (the old seed step from earlier in
   this project — bcrypt-hash a password and `INSERT INTO users`),
   since `DROP TABLE ... CASCADE` removes all rows including the login
   you use to get back into the app.
6. Deploy this branch's backend/frontend code to Render (see
   `05-CHANGES.md` for the deploy checklist) only after the schema above
   is live — the new backend code expects the new column/table names and
   will fail against the old schema.

## Hosting confirmation

Neon's free tier is what's already in use for this project's Postgres
database (confirmed via the existing `DATABASE_URL` pattern referencing
`neon.tech` in this codebase's history) and remains free for this
project's scale — no change needed there, it already satisfies the "find
a free place for the database" requirement.
