CREATE SCHEMA IF NOT EXISTS farm_schema;
--
-- PostgreSQL database dump
--

\restrict EpRSQHGAEUV40s8mIC9OLb0Wg1UclBeLatBWX15fcdVe46EtftaignVkZYFacQr

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: crop_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE farm_schema.crop_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    field_id uuid NOT NULL,
    crop_name character varying(255) NOT NULL,
    variety character varying(255),
    planting_date date,
    expected_harvest_date date,
    actual_harvest_date date,
    expected_yield numeric(10,2),
    actual_yield numeric(10,2),
    yield_unit character varying(20) DEFAULT 'KG'::character varying,
    status character varying(50) DEFAULT 'PLANNED'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: farms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE farm_schema.farms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    farmer_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    location character varying(500),
    total_area numeric(10,2),
    area_unit character varying(20) DEFAULT 'HECTARE'::character varying,
    latitude numeric(10,8),
    longitude numeric(11,8),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    crop_types text,
    farm_image_url text
);


--
-- Name: COLUMN farms.crop_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN farm_schema.farms.crop_types IS 'Types of crops grown on the farm (e.g., Rice, Wheat, Vegetables)';


--
-- Name: COLUMN farms.farm_image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN farm_schema.farms.farm_image_url IS 'URL or base64 encoded image of the farm';


--
-- Name: fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE farm_schema.fields (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    farm_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    area numeric(10,2),
    area_unit character varying(20) DEFAULT 'HECTARE'::character varying,
    soil_type character varying(100),
    irrigation_type character varying(100),
    polygon jsonb,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE farm_schema.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


--
-- Data for Name: crop_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY farm_schema.crop_plans (id, field_id, crop_name, variety, planting_date, expected_harvest_date, actual_harvest_date, expected_yield, actual_yield, yield_unit, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: farms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY farm_schema.farms (id, farmer_id, name, description, location, total_area, area_unit, latitude, longitude, active, created_at, updated_at, crop_types, farm_image_url) FROM stdin;
\.


--
-- Data for Name: fields; Type: TABLE DATA; Schema: public; Owner: -
--

COPY farm_schema.fields (id, farm_id, name, area, area_unit, soil_type, irrigation_type, polygon, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY farm_schema.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init farm schema	SQL	V1__init_farm_schema.sql	-1736547962	agrilink	2026-02-02 16:23:32.553648	232	t
2	2	add farm image columns	SQL	V2__add_farm_image_columns.sql	-1078726827	agrilink	2026-04-02 02:09:23.48446	95	t
\.


--
-- Name: crop_plans crop_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY farm_schema.crop_plans
    ADD CONSTRAINT crop_plans_pkey PRIMARY KEY (id);


--
-- Name: farms farms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY farm_schema.farms
    ADD CONSTRAINT farms_pkey PRIMARY KEY (id);


--
-- Name: fields fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY farm_schema.fields
    ADD CONSTRAINT fields_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY farm_schema.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON farm_schema.flyway_schema_history USING btree (success);


--
-- Name: idx_crop_plans_field_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crop_plans_field_id ON farm_schema.crop_plans USING btree (field_id);


--
-- Name: idx_crop_plans_planting_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crop_plans_planting_date ON farm_schema.crop_plans USING btree (planting_date);


--
-- Name: idx_crop_plans_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crop_plans_status ON farm_schema.crop_plans USING btree (status);


--
-- Name: idx_farms_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_farms_active ON farm_schema.farms USING btree (active);


--
-- Name: idx_farms_farmer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_farms_farmer_id ON farm_schema.farms USING btree (farmer_id);


--
-- Name: idx_fields_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fields_active ON farm_schema.fields USING btree (active);


--
-- Name: idx_fields_farm_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fields_farm_id ON farm_schema.fields USING btree (farm_id);


--
-- Name: crop_plans crop_plans_field_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY farm_schema.crop_plans
    ADD CONSTRAINT crop_plans_field_id_fkey FOREIGN KEY (field_id) REFERENCES farm_schema.fields(id) ON DELETE CASCADE;


--
-- Name: fields fields_farm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY farm_schema.fields
    ADD CONSTRAINT fields_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES farm_schema.farms(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict EpRSQHGAEUV40s8mIC9OLb0Wg1UclBeLatBWX15fcdVe46EtftaignVkZYFacQr

