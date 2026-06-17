-- ============================================================
-- Reservation Management System — Full Schema (Neon-compatible)
-- Run this on a fresh database to set up all tables
-- ============================================================

-- ── BOOKINGS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
    id                   character varying(50)  NOT NULL,
    guest_name           character varying(200),
    phone                character varying(20),
    email                character varying(200),
    nationality          character varying(50),
    room_name            character varying(50),
    room_category        character varying(100),
    arrival              date,
    departure            date,
    arrival_time         character varying(10),
    departure_time       character varying(10),
    num_guests           integer                DEFAULT 1,
    num_children         integer                DEFAULT 0,
    children_ages        jsonb                  DEFAULT '[]'::jsonb,
    meal_plan            character varying(10),
    status               character varying(50),
    source               character varying(50),
    ota_platform         character varying(100),
    booking_id           character varying(100),
    agent_name           character varying(200),
    base_rate            numeric(10,2),
    extra_child_charge   numeric(10,2),
    extra_bed            character varying(20),
    extra_bed_charge     numeric(10,2),
    discount             numeric(10,2)          DEFAULT 0,
    advance_particulars  numeric(10,2)          DEFAULT 0,
    advance_payment_type character varying(50),
    payment_status       character varying(50),
    payment_mode         character varying(50),
    total_amount         numeric(10,2),
    paid_amount          numeric(10,2)          DEFAULT 0,
    balance              numeric(10,2)          DEFAULT 0,
    tags                 text[]                 DEFAULT '{}'::text[],
    dnc                  boolean                DEFAULT false,
    is_multi_room        boolean                DEFAULT false,
    rooms                jsonb                  DEFAULT '[]'::jsonb,
    comments             jsonb                  DEFAULT '[]'::jsonb,
    audit_trail          jsonb                  DEFAULT '[]'::jsonb,
    created_at           timestamp with time zone DEFAULT now(),
    CONSTRAINT bookings_pkey PRIMARY KEY (id)
);

-- ── ROOM CATEGORIES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.room_categories (
    id        serial        NOT NULL,
    category  character varying(100) NOT NULL,
    num_rooms integer       DEFAULT 0,
    color     character varying(30),
    CONSTRAINT room_categories_pkey           PRIMARY KEY (id),
    CONSTRAINT room_categories_category_key   UNIQUE (category)
);

-- ── ROOMS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rooms (
    room_id    serial        NOT NULL,
    room_no    character varying(50)  NOT NULL,
    category   character varying(100),
    floor_no   character varying(20),
    capacity   integer       DEFAULT 2,
    is_active  boolean       DEFAULT true,
    created_at timestamp     DEFAULT now(),
    updated_at timestamp     DEFAULT now(),
    CONSTRAINT rooms_pkey        PRIMARY KEY (room_id),
    CONSTRAINT rooms_room_no_key UNIQUE (room_no)
);

-- ── FLOORS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.floors (
    id   serial NOT NULL,
    name character varying(100) NOT NULL,
    CONSTRAINT floors_pkey     PRIMARY KEY (id),
    CONSTRAINT floors_name_key UNIQUE (name)
);

-- ── SEASONS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seasons (
    id        character varying(50)  NOT NULL,
    name      character varying(200) NOT NULL,
    from_date date,
    to_date   date,
    CONSTRAINT seasons_pkey PRIMARY KEY (id)
);

-- ── THIRD PARTIES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.third_parties (
    id      character varying(50)  NOT NULL,
    name    character varying(200) NOT NULL,
    company character varying(200),
    email   character varying(200),
    mobile  character varying(20),
    gst     character varying(50),
    CONSTRAINT third_parties_pkey     PRIMARY KEY (id),
    CONSTRAINT third_parties_name_key UNIQUE (name)
);

-- ── TRAVEL AGENTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.travel_agents (
    id      character varying(50)  NOT NULL,
    name    character varying(200) NOT NULL,
    company character varying(200),
    email   character varying(200),
    mobile  character varying(20),
    gst     character varying(50),
    CONSTRAINT travel_agents_pkey     PRIMARY KEY (id),
    CONSTRAINT travel_agents_name_key UNIQUE (name)
);

-- ── TRAVEL AGENT RATES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.travel_agent_rates (
    id                character varying(50)  NOT NULL,
    agent_name        character varying(200),
    room_category     character varying(100),
    season_id         character varying(50),
    season_name       character varying(200),
    room_rate         numeric(10,2),
    extra_person_rate numeric(10,2) DEFAULT 0,
    CONSTRAINT travel_agent_rates_pkey PRIMARY KEY (id)
);

-- ── SPECIAL DATES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.special_dates (
    id         serial NOT NULL,
    name       character varying(200) NOT NULL,
    type       character varying(50),
    from_date  date NOT NULL,
    to_date    date NOT NULL,
    color      character varying(20) DEFAULT '#e74c3c',
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT special_dates_pkey PRIMARY KEY (id)
);

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id          serial        NOT NULL,
    full_name   character varying(200) NOT NULL,
    gender      character varying(20),
    mobile      character varying(20),
    email       character varying(200),
    designation character varying(200),
    username    character varying(100) NOT NULL,
    password    character varying(255) NOT NULL,
    user_type   character varying(50)  NOT NULL,
    status      character varying(20)  DEFAULT 'active',
    created_at  timestamp with time zone DEFAULT now(),
    CONSTRAINT users_pkey         PRIMARY KEY (id),
    CONSTRAINT users_username_key UNIQUE (username)
);

-- ── DESIGNATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.designations (
    id   serial NOT NULL,
    name character varying(200) NOT NULL,
    CONSTRAINT designations_pkey     PRIMARY KEY (id),
    CONSTRAINT designations_name_key UNIQUE (name)
);
