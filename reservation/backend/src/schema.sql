--
-- PostgreSQL database dump
--

\restrict 4S0XB7VjQaTdM0hs3wgeGQd83CQcUXtk10stnx8c937zh2n5UmUzElQihKlgt3P

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

-- Started on 2026-06-03 18:12:54

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 16406)
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id character varying(50) NOT NULL,
    guest_name character varying(200),
    phone character varying(20),
    email character varying(200),
    nationality character varying(50),
    room_name character varying(50),
    room_category character varying(100),
    arrival date,
    departure date,
    arrival_time character varying(10),
    departure_time character varying(10),
    num_guests integer DEFAULT 1,
    num_children integer DEFAULT 0,
    children_ages jsonb DEFAULT '[]'::jsonb,
    meal_plan character varying(10),
    status character varying(50),
    source character varying(50),
    ota_platform character varying(100),
    booking_id character varying(100),
    agent_name character varying(200),
    base_rate numeric(10,2),
    extra_child_charge numeric(10,2),
    extra_bed character varying(20),
    extra_bed_charge numeric(10,2),
    discount numeric(10,2) DEFAULT 0,
    advance_particulars numeric(10,2) DEFAULT 0,
    advance_payment_type character varying(50),
    payment_status character varying(50),
    payment_mode character varying(50),
    total_amount numeric(10,2),
    paid_amount numeric(10,2) DEFAULT 0,
    balance numeric(10,2) DEFAULT 0,
    tags text[] DEFAULT '{}'::text[],
    dnc boolean DEFAULT false,
    is_multi_room boolean DEFAULT false,
    rooms jsonb DEFAULT '[]'::jsonb,
    comments jsonb DEFAULT '[]'::jsonb,
    audit_trail jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 24576)
-- Name: floors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.floors (
    id character varying(50) NOT NULL,
    floor_no integer NOT NULL
);


ALTER TABLE public.floors OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16480)
-- Name: room_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_categories (
    id integer NOT NULL,
    category character varying(100) NOT NULL,
    num_rooms integer DEFAULT 0,
    color character varying(30)
);


ALTER TABLE public.room_categories OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16479)
-- Name: room_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_categories_id_seq OWNER TO postgres;

--
-- TOC entry 4969 (class 0 OID 0)
-- Dependencies: 222
-- Name: room_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_categories_id_seq OWNED BY public.room_categories.id;


--
-- TOC entry 225 (class 1259 OID 16491)
-- Name: rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rooms (
    room_id integer NOT NULL,
    room_no character varying(50) NOT NULL,
    category character varying(100),
    floor_no character varying(20),
    capacity integer DEFAULT 2,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.rooms OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16490)
-- Name: rooms_room_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rooms_room_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rooms_room_id_seq OWNER TO postgres;

--
-- TOC entry 4970 (class 0 OID 0)
-- Dependencies: 224
-- Name: rooms_room_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rooms_room_id_seq OWNED BY public.rooms.room_id;


--
-- TOC entry 220 (class 1259 OID 16445)
-- Name: seasons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seasons (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    from_date date,
    to_date date
);


ALTER TABLE public.seasons OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16436)
-- Name: third_parties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.third_parties (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    company character varying(200),
    email character varying(200),
    mobile character varying(20),
    gst character varying(50)
);


ALTER TABLE public.third_parties OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16450)
-- Name: travel_agent_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_agent_rates (
    id character varying(50) NOT NULL,
    agent_name character varying(200),
    room_category character varying(100),
    season_id character varying(50),
    season_name character varying(200),
    room_rate numeric(10,2),
    extra_person_rate numeric(10,2) DEFAULT 0
);


ALTER TABLE public.travel_agent_rates OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16427)
-- Name: travel_agents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_agents (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    company character varying(200),
    email character varying(200),
    mobile character varying(20),
    gst character varying(50)
);


ALTER TABLE public.travel_agents OWNER TO postgres;

--
-- TOC entry 4786 (class 2604 OID 16483)
-- Name: room_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_categories ALTER COLUMN id SET DEFAULT nextval('public.room_categories_id_seq'::regclass);


--
-- TOC entry 4788 (class 2604 OID 16494)
-- Name: rooms room_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms ALTER COLUMN room_id SET DEFAULT nextval('public.rooms_room_id_seq'::regclass);


--
-- TOC entry 4794 (class 2606 OID 16426)
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- TOC entry 4816 (class 2606 OID 24582)
-- Name: floors floors_floor_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT floors_floor_no_key UNIQUE (floor_no);


--
-- TOC entry 4818 (class 2606 OID 24580)
-- Name: floors floors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT floors_pkey PRIMARY KEY (id);


--
-- TOC entry 4808 (class 2606 OID 16488)
-- Name: room_categories room_categories_category_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_categories
    ADD CONSTRAINT room_categories_category_key UNIQUE (category);


--
-- TOC entry 4810 (class 2606 OID 16486)
-- Name: room_categories room_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_categories
    ADD CONSTRAINT room_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4812 (class 2606 OID 16500)
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (room_id);


--
-- TOC entry 4814 (class 2606 OID 16502)
-- Name: rooms rooms_room_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_room_no_key UNIQUE (room_no);


--
-- TOC entry 4804 (class 2606 OID 16449)
-- Name: seasons seasons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seasons
    ADD CONSTRAINT seasons_pkey PRIMARY KEY (id);


--
-- TOC entry 4800 (class 2606 OID 16444)
-- Name: third_parties third_parties_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.third_parties
    ADD CONSTRAINT third_parties_name_key UNIQUE (name);


--
-- TOC entry 4802 (class 2606 OID 16442)
-- Name: third_parties third_parties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.third_parties
    ADD CONSTRAINT third_parties_pkey PRIMARY KEY (id);


--
-- TOC entry 4806 (class 2606 OID 16457)
-- Name: travel_agent_rates travel_agent_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_agent_rates
    ADD CONSTRAINT travel_agent_rates_pkey PRIMARY KEY (id);


--
-- TOC entry 4796 (class 2606 OID 16435)
-- Name: travel_agents travel_agents_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_agents
    ADD CONSTRAINT travel_agents_name_key UNIQUE (name);


--
-- TOC entry 4798 (class 2606 OID 16433)
-- Name: travel_agents travel_agents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_agents
    ADD CONSTRAINT travel_agents_pkey PRIMARY KEY (id);


-- Completed on 2026-06-03 18:12:55

--
-- PostgreSQL database dump complete
--

\unrestrict 4S0XB7VjQaTdM0hs3wgeGQd83CQcUXtk10stnx8c937zh2n5UmUzElQihKlgt3P

