# Final Deliverables — Reservation Management System v2 Refactor

Branch: `refactor/production-architecture`. This document summarizes what
shipped against each of the seven requirements given for this refactor, and
points at the detailed doc for each area rather than repeating it. Nothing
in this branch has been merged to `main` — `main` still auto-deploys the
live Render services, so it stays untouched until explicitly approved.

## 1. Full project analysis

Done first, before any code changed. See `01-ANALYSIS.md` for the complete
finding-by-finding record: duplicate root `backend/`/`frontend/` copies,
four-concerns-in-one-file route handlers, three disagreeing schema files,
zero real foreign keys, and a `styles.css` with no working responsive
rules. Every finding there was verified directly (file reads, grep counts,
schema diffs) rather than assumed.

## 2. Backend refactor

`reservation/backend/src/` is now layered:

| Layer | Responsibility |
|---|---|
| `routes/` | path + verb declarations only |
| `controllers/` | parse `req`, call a service, shape the response — no SQL |
| `services/` | business rules (uniqueness checks, cascades the DB doesn't own) |
| `models/` | the only layer touching Postgres, one module per table |
| `validation/` | `zod` schemas, run before a controller touches the DB |
| `middleware/` | `requireAuth`, `requireRole`, single `errorHandler` |
| `utils/` | `caseMapper` (snake_case⇄camelCase, one place instead of four), `asyncHandler`, `apiResponse` |

12 resources migrated: auth, users, designations, room categories, floors,
rooms, travel agents, third parties, seasons, travel agent rates, bookings,
special dates. The unused, unfinished `tenantMiddleware.js` (checked an
`x-tenant-id` header, never wired into `index.js`, confirmed dead by grep)
was removed rather than carried forward.

Verified: `npm install` + `node --check` across all 72 backend source
files (clean), then a live boot with a dummy `DATABASE_URL` — server
starts, `/health` responds — confirming every route file imports and
wires correctly end to end.

## 3. Database redesign

Full detail in `02-SCHEMA.sql` (DDL) and `03-ER-DIAGRAM.md` (Mermaid ERD).
Highlights:

- Every previously-text-matched relationship is now an `INTEGER ...
  REFERENCES` foreign key: `rooms.category_id`, `rooms.floor_id`,
  `bookings.category_id`, `bookings.agent_id`, `bookings.third_party_id`,
  `travel_agent_rates.{agent_id, category_id, season_id}`.
- Cascade behavior is deliberate, not uniform: lookup tables (`floors`,
  `room_categories`) use `ON DELETE RESTRICT` so deleting one can't
  silently orphan live rooms; historical references on `bookings` use `ON
  DELETE SET NULL` so a five-year-old booking survives its agent record
  being deleted; `travel_agent_rates` uses `ON DELETE CASCADE` from all
  three parents since a rate with no agent/category/season is meaningless.
- Three jsonb blobs on `bookings` (`rooms`, `comments`, `audit_trail`)
  became real tables — `booking_rooms` (N:N), `booking_comments` and
  `booking_audit_log` (1:N) — all indexable and joinable, where before
  they could only be loaded whole and filtered in JavaScript.
  `bookings.tags` (`text[]`) became `booking_tags`, also N:N.
  `children_ages` was deliberately *kept* as jsonb — a fixed-shape
  attribute of one booking, not an entity with its own relationships.
- `CHECK` constraints now enforce what the application used to merely
  hope was true: `arrival <= departure`, `num_guests >= 1`, money columns
  `>= 0`, `status`/`payment_status` restricted to known values.
- Indexes on every FK column plus the columns actually filtered/sorted on:
  `bookings(arrival, departure)`, `bookings(status)`, `rooms(is_active)`,
  `special_dates(from_date, to_date)`.
- `room_categories.num_rooms`, a hand-maintained counter that could drift
  from reality, is gone — counts are derived with `COUNT(*) GROUP BY
  category_id`.

## 4. Database migration

Documented in `04-DB-CUTOVER.md`. Decision, confirmed directly with the
project owner: reset rather than migrate in place. The Neon data is test
data only, and with every table gaining or changing FKs plus three jsonb
columns splitting into child tables, a destructive rebuild (`DROP TABLE
... CASCADE` then `02-SCHEMA.sql`) is simpler and lower-risk than writing
a row-by-row migration for a schema changing this broadly. Neon's free
tier was confirmed sufficient for this project's size and stays the
hosting choice — no paid database needed.

## 5. Frontend improvements

- **`App.jsx`**, previously a 1425-line monolith mixing routing, data
  fetching, and business logic, is decomposed into eight hooks
  (`useAuth`, `useSearch`, `useReferenceData`, `useBookings`,
  `useDncOverride`, `useCategoryActions`, `useRoomActions`,
  `useBlockRoom`) under `src/hooks/`, plus pure helpers in `src/utils/`
  and static config in `src/constants/`. `App.jsx` is now 699 lines of
  composition and JSX only — no direct API calls. Every hook was checked
  against the original line-by-line (signatures, alert text, audit-trail
  field names) rather than reconstructed from memory, after an earlier
  draft of two hooks turned out to have wrong logic on first pass.
- **`api.js`** (144 lines, every resource in one file) split into
  `src/api/{auth,categories,rooms,bookings,agents,thirdParties,seasons,
  rates,floors,specialDates,users,designations}.js`, re-exported from
  `src/api/index.js`; the original `api.js` is now a one-line
  compatibility shim so no existing import had to change.
- **Responsive UI, actually wired up.** An earlier pass added `@media`
  rules to `styles.css` targeting class names that don't exist anywhere
  in the component tree — the app styles almost entirely through inline
  `style={{}}` objects, so those rules matched nothing and changed
  nothing on screen. Caught by grepping all of `src/` for `className`
  (4 real matches total, before this fix). Corrected by adding real class
  hooks to `App.jsx`'s structural containers (`topbar`, `topbar-left`,
  `topbar-right`, `sidebar-panel`, `main-content`, `stats-bar`,
  `calendar-main`, `page-breadcrumb`) and writing breakpoints against
  those instead: the header wraps onto a second row instead of clipping
  below 640px, the sidebar becomes a `position: fixed` overlay instead of
  squeezing the calendar into a sliver of the screen below 1024px, and
  panel padding scales down on mobile. Two related bugs fixed in the same
  pass: the calendar grid's day-cell widths already shrink to fit the
  viewport via a `ResizeObserver` (down to a 26px floor), but the scroll
  container had `overflowX: hidden`, silently clipping any month still
  wider than that floor instead of letting it scroll — changed to `auto`.
  The Block Room modal's form had a fixed `width: 340` that overflows the
  modal's own `max-width: 95vw` on phones under ~360px wide — changed to
  `width: min(340px, 100%)`.

## 6. Code quality

- One snake_case⇄camelCase mapping helper (`caseMapper`) instead of four
  hand-written copies across route files.
- One `asyncHandler` wrapper instead of repeated `try/catch → next(err)`
  boilerplate in every controller.
- Consistent error envelope (`apiResponse`) instead of a mix of
  `next(error)` and inline `res.status(500).json(...)`.
- Duplicate soft-delete/restore logic in the old `rooms.js` (hand-rolled
  in both POST and PUT) replaced by a single upsert path backed by a
  unique constraint.
- Compatibility shims (`api.js`) so the refactor doesn't require touching
  every consumer file at once, reducing regression surface.

## 7. Verification performed

- Frontend: `npm install` + `npm run build` (Vite) — builds clean, 1918
  modules transformed, no errors.
- Backend: `npm install` + `node --check` on all 72 source files, then a
  live boot against a dummy `DATABASE_URL` with a successful `/health`
  response — confirms all 12 migrated resources import and route
  correctly.
- This is build/boot-level verification (syntax, imports, wiring). It
  does not replace manually clicking through the deployed app after
  merge, which should still happen before/around the live cutover
  described in `04-DB-CUTOVER.md`.

## What's intentionally not done

- Merging `travel_agents`/`third_parties` into one `partners` table —
  technically possible, but changes business semantics nobody asked to
  change. Documented as a future option in `01-ANALYSIS.md`, not executed.
- Deep responsive pass on the 13 individual page components
  (`RoomCategoryPage`, `NewReservationPage`, etc.) beyond the app shell
  and calendar — those didn't show the same fixed-width overflow pattern
  on inspection (no `width: <fixed px>` matches found in `src/pages/`),
  so they were left as-is rather than touched speculatively.
