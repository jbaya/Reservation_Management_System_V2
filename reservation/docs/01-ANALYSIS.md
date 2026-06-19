# Full Project Analysis — Reservation Management System

Scope: backend (`reservation/backend`), frontend (`reservation/frontend`),
database (three competing schema files), and overall repo layout. This
document is the record of what was wrong and why each change in this
branch was made. It pairs with `02-SCHEMA.sql` (new DB design),
`03-ER-DIAGRAM.md` (relationships) and `05-CHANGES.md` (what shipped).

## 1. Repository structure

**Finding:** the repo root has *two full copies* of the app — `backend/`
and `frontend/` at the root, and `reservation/backend/` and
`reservation/frontend/` in a subfolder. They are near-byte-identical
(`db.js`, `index.js`, every route file, `tenantMiddleware.js` on the
backend side; `App.jsx`, `api.js`, every page/component on the frontend
side). The root `package.json` workspaces (`["backend", "frontend"]`)
point at the *stale* root copies, not the ones actually deployed —
Render's dashboard root-directory settings point at `reservation/backend`
and `reservation/frontend`. Nothing reads or writes the root copies in
production; they are dead weight that doubles the chance of editing the
wrong file.

**Fix:** root `backend/` and `frontend/` removed; root `package.json`
updated to reference `reservation/backend` and `reservation/frontend`
directly, so there is exactly one copy of the app on disk.

## 2. Backend architecture

**Finding:** every resource lived in a single flat file under
`routes/*.js` that mixed four concerns in one function: route definition,
raw parameterized SQL, snake_case ⇄ camelCase field mapping, and HTTP
response shaping. Concretely:

- `bookings.js` GET hand-maps all 38 columns to camelCase inline; POST is
  a 38-parameter positional INSERT with `ON CONFLICT (id) DO UPDATE`; PUT
  duplicates the *same* camelCase mapping block and a `toNumber` coercion
  helper a second time, visibly patched in later (comments read "✅
  Fixed"), evidence of ad-hoc bug fixes layered on top of each other
  rather than a structured change process.
- `seasons.js` and `bookings.js` both hand-roll the same date-formatting
  logic independently.
- `agents.js` and `thirdParties.js` are near-duplicate files — same
  shape, same fields (`name`, `company`, `email`, `mobile`, `gst`), same
  CRUD pattern, copy-pasted rather than shared.
- `rooms.js` reimplements soft-delete/restore by hand: POST and PUT each
  contain an "if a row exists but is inactive, restore it instead of
  inserting" branch, duplicated, instead of relying on a unique
  constraint plus a single upsert.
- Error handling is inconsistent — some handlers call `next(error)`,
  others return `res.status(500).json(...)` directly inline.
- `middleware/tenantMiddleware.js` checks an `x-tenant-id` header and
  rejects requests without one, but is never imported anywhere
  (confirmed: it doesn't appear in `index.js`'s middleware chain, and
  grepping the whole backend for any reference to it only matches the
  file itself). It's a dead, unfinished multi-tenancy feature.

**Fix:** the backend is reorganized into five layers under
`reservation/backend/src/`:

- `routes/` — declares paths and HTTP verbs only, no logic.
- `controllers/` — parses `req`, calls a service, shapes the HTTP
  response. No SQL.
- `services/` — business rules (uniqueness checks, totals, cascades that
  aren't enforced by the DB itself).
- `models/` — the only layer that talks to PostgreSQL; one query module
  per table.
- `validation/` — request-body schemas (using `zod`), run before a
  controller ever touches the database.
- `middleware/` — `requireAuth` (JWT, unchanged behavior), a new
  `requireRole` guard, and a single `errorHandler`.
- `utils/` — `caseMapper` (the one place snake_case ⇄ camelCase
  conversion happens, replacing four hand-written copies),
  `asyncHandler` (wraps async route handlers so `try/catch` ⇒ `next(err)`
  boilerplate isn't repeated in every controller), `apiResponse`
  (consistent success/error envelope).

`tenantMiddleware.js` is removed — it's unused, and multi-tenancy is out
of scope for this single-property system; reintroducing it properly
(with a real `tenants` table and FK chain) is a bigger feature than a
cleanup pass should absorb silently.

## 3. Database design

**Finding (schema drift):** three schema files exist and disagree with
each other and with the live Neon database:

| File | `users`/`designations`/`special_dates`? | `floors` shape |
|---|---|---|
| `reservation/backend/src/schema.sql` | missing | `id varchar` + `floor_no int` |
| `reservation/schema_full.sql` | present | `id serial` + `name varchar` |
| root `schema_full.sql` | missing | `id varchar` + `floor_no int` |

None of the three is a reliable source of truth for what's actually live.

**Finding (an active bug from the drift):** `routes/categories.js`'s
POST and PUT both write a `floor` column on `room_categories`
(`INSERT INTO room_categories (category, num_rooms, color, floor) ...`),
but **no schema file ever defines that column**. Either this throws on
every category save against a database that matches any of the three
schema files, or a `floor` column was added by hand directly on Neon
without anyone updating a schema file to match — undocumented either
way. Categories conceptually shouldn't have a floor at all: a category
("Deluxe", "Suite") spans many floors; it's *rooms* that belong to a
specific floor. The new schema removes this column entirely and the new
`room_categories` model never references it.

**Finding (no real relationships):** every "relationship" in the old
schema was a text copy, not a foreign key:

- `rooms.category` / `rooms.floor_no` were free-text, matched against
  `room_categories.category` / a separate floors table by string
  equality in application code, not by FK.
- `bookings.room_category`, `bookings.agent_name` stored a *copy* of the
  category/agent name at booking time — rename a category later and old
  bookings silently show the old name with no way to join back to the
  current category row.
- `travel_agent_rates.season_id` was stored as a `varchar`, paired with
  a redundant `season_name` *text copy* of the season it pointed to,
  instead of an integer FK plus a join.
- Multi-room bookings, comments, and an audit trail were all stored as
  `jsonb` blobs on the `bookings` row (`rooms`, `comments`,
  `audit_trail`) — none of these can be indexed, joined, or queried with
  SQL; they can only be loaded whole and filtered in JavaScript.

**Fix — `02-SCHEMA.sql`:** a fully normalized schema (see
`03-ER-DIAGRAM.md` for the diagram):

- Every text-matched relationship becomes an `INTEGER ... REFERENCES`
  foreign key: `rooms.category_id → room_categories.id`,
  `rooms.floor_id → floors.id`, `bookings.category_id →
  room_categories.id`, `bookings.agent_id → travel_agents.id`,
  `bookings.third_party_id → third_parties.id`,
  `travel_agent_rates.{agent_id,category_id,season_id}` all FK'd.
- Cascade rules are chosen deliberately, not uniformly: lookup/config
  tables (`floors`, `room_categories`) use `ON DELETE RESTRICT` while
  still referenced by active rooms, because silently orphaning live
  inventory is worse than blocking the delete. Historical/transactional
  references on `bookings` use `ON DELETE SET NULL`, because a booking
  made through an agent five years ago should still exist even if that
  agent's record is later deleted. `travel_agent_rates` uses `ON DELETE
  CASCADE` from all three of its parents, because a rate row with no
  agent/category/season is meaningless on its own.
- `bookings.rooms` (jsonb) becomes a real `booking_rooms` many-to-many
  association table (`booking_id, room_id`) — the textbook N:N the
  requirements asked for: one booking can span several rooms, and one
  room appears across many bookings over time.
- `bookings.tags` (`text[]`) becomes `booking_tags` (`booking_id, tag`),
  also N:N, and now indexable/filterable by tag.
- `bookings.comments` and `bookings.audit_trail` (jsonb) become
  `booking_comments` and `booking_audit_log`, both 1:N child tables —
  queryable, indexable, and able to carry their own `created_at`/
  `changed_at` timestamps instead of whatever shape the frontend
  happened to push into the array.
- `bookings.children_ages` is deliberately *kept* as `jsonb`. It's a
  small, fixed-shape attribute of a single booking (the ages of children
  on that one stay), not an independent entity with its own identity or
  relationships — normalizing it into a child table would add a join for
  no integrity benefit. Senior-level normalization means knowing where to
  stop, not maximizing table count.
- New `CHECK` constraints enforce invariants the application was
  previously trusting itself to maintain: `arrival <= departure`,
  `num_guests >= 1`, all money columns `>= 0`, and `status` /
  `payment_status` restricted to known enumerated values.
- Indexes added on every foreign key column plus the columns the UI
  actually filters/sorts by (`bookings(arrival, departure)`,
  `bookings(status)`, `rooms(is_active)`).
- `room_categories.num_rooms` (a manually-maintained counter) is
  dropped — counts are now derived with `COUNT(*) ... GROUP BY
  category_id`, which can never drift from reality the way a
  hand-updated counter can.

**Considered and rejected:** merging `travel_agents` and `third_parties`
into one polymorphic `partners` table (same columns: `name`, `company`,
`email`, `mobile`, `gst`). Technically temptig, but the existing product
has separate screens and workflows for the two concepts, and the request
was to fix FK correctness and remove manual relationship handling, not to
redesign business semantics the user didn't ask to change. Documented
here as a future option rather than executed, to avoid unnecessary scope
and regression risk.

## 4. Frontend

**Finding:** `reservation/frontend/src/styles.css` is 301 lines of global
CSS with **zero** `@media` queries — there is no responsive design at
all, not even a basic mobile breakpoint. `App.jsx` is a 1400+ line
monolith holding routing, state, and most page logic in one file.
`api.js` is a single 144-line file exporting every fetch call for every
resource with no separation between resources.

**Fix:**
- `api.js` split into one module per resource under `src/api/`
  (`bookings.js`, `rooms.js`, `categories.js`, etc.) re-exported from a
  single `src/api/index.js` so existing imports keep working.
- `App.jsx` (1425 lines) decomposed into eight hooks under `src/hooks/`
  (`useAuth`, `useSearch`, `useReferenceData`, `useBookings`,
  `useDncOverride`, `useCategoryActions`, `useRoomActions`,
  `useBlockRoom`) plus `src/utils/` (pure functions) and
  `src/constants/`. `App.jsx` itself is now composition + JSX only — no
  direct API calls.
- Real responsive breakpoints. The first pass at this added `@media`
  rules to `styles.css` targeting class names (`.app-shell`,
  `.main-layout`, `.room-cell`, `.booking-card`, etc.) that, on
  inspection, don't exist on any element in the actual component
  tree — the whole codebase styles through inline `style={{}}` objects,
  so those rules matched nothing and shipped no visible effect. Caught
  by grepping the entire `src/` tree for `className` (4 real matches:
  3 in `Modal.jsx`, 1 scrollbar hook in `CalendarView.jsx`) before
  trusting the earlier pass. Fixed by adding real class hooks to the
  structural containers in `App.jsx` (`topbar`, `topbar-left`,
  `topbar-right`, `sidebar-panel`, `main-content`, `stats-bar`,
  `calendar-main`, `page-breadcrumb`) and writing breakpoints against
  those: header wraps instead of clipping below 640px, the sidebar
  becomes a `position: fixed` overlay instead of squeezing the calendar
  to a sliver below 1024px, and panel padding scales down on mobile.
  Two related bugs fixed alongside it: the calendar's day-grid already
  resized cell widths to fit the viewport via `ResizeObserver` (down to
  a 26px floor) but the scroll container had `overflowX: hidden`, so
  any month still wider than that floor was silently clipped rather
  than scrollable — changed to `overflowX: auto`. The Block Room modal
  form had a fixed `width: 340` that overflows the modal's own
  `max-width: 95vw` on phones narrower than ~360px — changed to
  `width: min(340px, 100%)`.

## 5. Net effect

The findings above were each independently verifiable in the pre-refactor
code (file reads, `grep` counts, and a direct read of the three schema
files cited by name above) — this wasn't a guess at what *might* be
wrong, it's a list of what was actually found. `05-CHANGES.md` lists what
shipped against each item.
