-- ============================================================================
-- Reservation Management System — Normalized Production Schema (v2)
-- Target: PostgreSQL 14+ (Neon-compatible)
--
-- This file fully replaces schema.sql / schema_full.sql. It is destructive
-- (DROP ... CASCADE) because the project owner confirmed live data is test
-- data only and a clean reset is acceptable. Run once against a fresh
-- database / Neon branch.
--
-- Design principles applied:
--   1. Every relationship is a real foreign key — no text-matched "joins".
--   2. Lookup/config tables (categories, floors, seasons, partners) use
--      RESTRICT on delete while referenced by operational rows (rooms),
--      so you can't silently orphan live inventory.
--   3. Historical/transactional tables (bookings) use SET NULL on delete
--      of a lookup row, so deleting a category/agent later never destroys
--      past booking history.
--   4. True many-to-many relationships (booking <-> room, booking <-> tag)
--      get real association tables instead of JSON blobs.
--   5. Semi-structured, append-only logs (comments, audit trail) become
--      proper child tables instead of jsonb arrays, so they're queryable
--      and indexable.
--   6. children_ages stays jsonb — it's a small attribute of one booking,
--      not an independent entity, so a join table would add overhead
--      without adding integrity.
-- ============================================================================

BEGIN;

DROP TABLE IF EXISTS booking_audit_log CASCADE;
DROP TABLE IF EXISTS booking_comments CASCADE;
DROP TABLE IF EXISTS booking_tags CASCADE;
DROP TABLE IF EXISTS booking_rooms CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS travel_agent_rates CASCADE;
DROP TABLE IF EXISTS special_dates CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS room_categories CASCADE;
DROP TABLE IF EXISTS floors CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS travel_agents CASCADE;
DROP TABLE IF EXISTS third_parties CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS designations CASCADE;

-- ============================================================================
-- LOOKUP / CONFIGURATION TABLES
-- ============================================================================

CREATE TABLE designations (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE floors (
    id          SERIAL PRIMARY KEY,
    floor_no    INTEGER NOT NULL UNIQUE,
    label       VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE room_categories (
    id          SERIAL PRIMARY KEY,
    category    VARCHAR(100) NOT NULL UNIQUE,
    color       VARCHAR(30),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- NOTE: the legacy schema's `num_rooms` column is intentionally dropped.
-- It was a manually-maintained counter that drifted from reality; room
-- counts per category are now always derived with COUNT(*) ... GROUP BY
-- category_id, which can never go stale. The legacy `floor` column that
-- categories.js referenced never existed in any shipped schema (a live
-- bug) — categories are not floor-scoped, individual rooms are, so that
-- attribute correctly belongs on `rooms.floor_id` only.

CREATE TABLE seasons (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    from_date   DATE NOT NULL,
    to_date     DATE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT seasons_date_range_chk CHECK (from_date <= to_date)
);

CREATE TABLE travel_agents (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL UNIQUE,
    company     VARCHAR(200),
    email       VARCHAR(200),
    mobile      VARCHAR(20),
    gst         VARCHAR(50),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE third_parties (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL UNIQUE,
    company     VARCHAR(200),
    email       VARCHAR(200),
    mobile      VARCHAR(20),
    gst         VARCHAR(50),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- third_parties and travel_agents are kept as separate tables (rather than
-- one polymorphic "partners" table) because the existing product treats
-- them as distinct business concepts with separate screens/workflows.
-- See docs/01-ANALYSIS.md "Considered and rejected" section for the
-- tradeoff if a future redesign wants to merge them.

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(200) NOT NULL,
    gender          VARCHAR(20),
    mobile          VARCHAR(20),
    email           VARCHAR(200),
    designation_id  INTEGER REFERENCES designations(id) ON DELETE SET NULL,
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    user_type       VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_status_chk CHECK (status IN ('active', 'inactive')),
    CONSTRAINT users_type_chk CHECK (user_type IN ('admin', 'manager', 'staff'))
);
CREATE INDEX idx_users_designation_id ON users(designation_id);

-- ============================================================================
-- INVENTORY
-- ============================================================================

CREATE TABLE rooms (
    room_id      SERIAL PRIMARY KEY,
    room_no      VARCHAR(50) NOT NULL UNIQUE,
    category_id  INTEGER NOT NULL REFERENCES room_categories(id) ON DELETE RESTRICT,
    floor_id     INTEGER NOT NULL REFERENCES floors(id) ON DELETE RESTRICT,
    capacity     INTEGER NOT NULL DEFAULT 2,
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT rooms_capacity_chk CHECK (capacity > 0)
);
CREATE INDEX idx_rooms_category_id ON rooms(category_id);
CREATE INDEX idx_rooms_floor_id ON rooms(floor_id);
CREATE INDEX idx_rooms_is_active ON rooms(is_active);

CREATE TABLE travel_agent_rates (
    id                 SERIAL PRIMARY KEY,
    agent_id           INTEGER NOT NULL REFERENCES travel_agents(id) ON DELETE CASCADE,
    category_id        INTEGER NOT NULL REFERENCES room_categories(id) ON DELETE CASCADE,
    season_id          INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    room_rate          NUMERIC(10,2) NOT NULL DEFAULT 0,
    extra_person_rate  NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT travel_agent_rates_unique UNIQUE (agent_id, category_id, season_id),
    CONSTRAINT travel_agent_rates_room_rate_chk CHECK (room_rate >= 0),
    CONSTRAINT travel_agent_rates_extra_chk CHECK (extra_person_rate >= 0)
);
CREATE INDEX idx_rates_agent_id ON travel_agent_rates(agent_id);
CREATE INDEX idx_rates_category_id ON travel_agent_rates(category_id);
CREATE INDEX idx_rates_season_id ON travel_agent_rates(season_id);

CREATE TABLE special_dates (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    type        VARCHAR(50),
    from_date   DATE NOT NULL,
    to_date     DATE NOT NULL,
    color       VARCHAR(20) NOT NULL DEFAULT '#e74c3c',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT special_dates_date_range_chk CHECK (from_date <= to_date)
);
CREATE INDEX idx_special_dates_range ON special_dates(from_date, to_date);

-- ============================================================================
-- BOOKINGS (core transactional entity)
-- ============================================================================

CREATE TABLE bookings (
    id                    VARCHAR(50) PRIMARY KEY,
    guest_name            VARCHAR(200) NOT NULL,
    phone                 VARCHAR(20),
    email                 VARCHAR(200),
    nationality           VARCHAR(50),

    category_id           INTEGER REFERENCES room_categories(id) ON DELETE SET NULL,
    agent_id              INTEGER REFERENCES travel_agents(id) ON DELETE SET NULL,
    third_party_id        INTEGER REFERENCES third_parties(id) ON DELETE SET NULL,

    arrival               DATE NOT NULL,
    departure             DATE NOT NULL,
    arrival_time          VARCHAR(10),
    departure_time        VARCHAR(10),

    num_guests            INTEGER NOT NULL DEFAULT 1,
    num_children          INTEGER NOT NULL DEFAULT 0,
    children_ages         JSONB NOT NULL DEFAULT '[]'::jsonb,

    meal_plan             VARCHAR(10),
    status                VARCHAR(50) NOT NULL DEFAULT 'tentative',
    source                VARCHAR(50),
    ota_platform          VARCHAR(100),
    external_booking_ref  VARCHAR(100),

    base_rate             NUMERIC(10,2) NOT NULL DEFAULT 0,
    extra_child_charge    NUMERIC(10,2) NOT NULL DEFAULT 0,
    extra_bed             VARCHAR(20),
    extra_bed_charge      NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount              NUMERIC(10,2) NOT NULL DEFAULT 0,
    advance_particulars   NUMERIC(10,2) NOT NULL DEFAULT 0,
    advance_payment_type  VARCHAR(50),
    payment_status        VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_mode          VARCHAR(50),
    total_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
    paid_amount           NUMERIC(10,2) NOT NULL DEFAULT 0,
    balance               NUMERIC(10,2) NOT NULL DEFAULT 0,

    dnc                   BOOLEAN NOT NULL DEFAULT false,
    is_multi_room         BOOLEAN NOT NULL DEFAULT false,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT bookings_date_range_chk CHECK (arrival <= departure),
    CONSTRAINT bookings_guests_chk CHECK (num_guests >= 1 AND num_children >= 0),
    CONSTRAINT bookings_amounts_chk CHECK (
        total_amount >= 0 AND paid_amount >= 0 AND discount >= 0
    ),
    CONSTRAINT bookings_status_chk CHECK (
        status IN ('tentative', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')
    ),
    CONSTRAINT bookings_payment_status_chk CHECK (
        payment_status IN ('pending', 'partial', 'paid', 'refunded')
    )
);
CREATE INDEX idx_bookings_arrival_departure ON bookings(arrival, departure);
CREATE INDEX idx_bookings_category_id ON bookings(category_id);
CREATE INDEX idx_bookings_agent_id ON bookings(agent_id);
CREATE INDEX idx_bookings_third_party_id ON bookings(third_party_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- booking <-> room is many-to-many: a multi-room booking spans several
-- rooms, and over time the same room appears on many different bookings.
-- This replaces the old `rooms jsonb` blob, which could not be joined,
-- indexed, or constrained.
CREATE TABLE booking_rooms (
    booking_id  VARCHAR(50) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    room_id     INTEGER NOT NULL REFERENCES rooms(room_id) ON DELETE RESTRICT,
    PRIMARY KEY (booking_id, room_id)
);
CREATE INDEX idx_booking_rooms_room_id ON booking_rooms(room_id);

-- booking <-> tag is many-to-many: replaces the old `tags text[]` column
-- with a real association table so tags are filterable/indexable.
CREATE TABLE booking_tags (
    booking_id  VARCHAR(50) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    tag         VARCHAR(50) NOT NULL,
    PRIMARY KEY (booking_id, tag)
);
CREATE INDEX idx_booking_tags_tag ON booking_tags(tag);

-- One booking has many comments — replaces the `comments jsonb` blob.
CREATE TABLE booking_comments (
    id           SERIAL PRIMARY KEY,
    booking_id   VARCHAR(50) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    author       VARCHAR(200),
    comment_text TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_booking_comments_booking_id ON booking_comments(booking_id);

-- One booking has many audit entries — replaces the `audit_trail jsonb` blob.
CREATE TABLE booking_audit_log (
    id          SERIAL PRIMARY KEY,
    booking_id  VARCHAR(50) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    action      VARCHAR(100) NOT NULL,
    changed_by  VARCHAR(200),
    details     JSONB,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_booking_audit_log_booking_id ON booking_audit_log(booking_id);

COMMIT;
