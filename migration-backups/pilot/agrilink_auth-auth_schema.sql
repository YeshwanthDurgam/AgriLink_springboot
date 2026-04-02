CREATE SCHEMA IF NOT EXISTS auth_schema;
--
-- PostgreSQL database dump
--

\restrict a0V3Pt95hriMJYqQzbjTe7khJkRWvly8ZiJfMZaZlNwWbL0oNNa2J38chlRAZ3w

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
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE auth_schema.flyway_schema_history (
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
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE auth_schema.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE auth_schema.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE auth_schema.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE auth_schema.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    password character varying(255) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    account_non_expired boolean DEFAULT true NOT NULL,
    account_non_locked boolean DEFAULT true NOT NULL,
    credentials_non_expired boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY auth_schema.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init auth schema	SQL	V1__init_auth_schema.sql	560308966	agrilink	2026-02-02 16:23:32.248928	171	t
2	2	add customer role	SQL	V2__add_customer_role.sql	986629203	agrilink	2026-02-02 16:23:32.573295	13	t
3	3	add password reset tokens	SQL	V3__add_password_reset_tokens.sql	-1609950332	agrilink	2026-02-02 16:23:32.643482	72	t
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY auth_schema.password_reset_tokens (id, token, user_id, expires_at, used, created_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY auth_schema.roles (id, name, description, created_at, updated_at) FROM stdin;
7ff8e140-a73e-495d-afc6-97ec7da64a68	FARMER	Farmer role - can manage farms and create listings	2026-02-02 16:23:32.340684	2026-02-02 16:23:32.340684
21a7a661-321e-4672-9239-cfa90063b7a8	BUYER	Buyer role - can browse and purchase products	2026-02-02 16:23:32.340684	2026-02-02 16:23:32.340684
a295aea6-2321-4beb-85ea-a5471f22d815	CUSTOMER	Customer role - can browse and purchase products	2026-02-02 16:23:32.340684	2026-02-02 16:23:32.340684
9de83cfd-629e-46c3-92b1-275c2adc984c	ADMIN	Administrator role - full system access	2026-02-02 16:23:32.340684	2026-02-02 16:23:32.340684
2781f298-c427-4cac-b78f-5bbaf2fb707d	MANAGER	Manager role - can verify farmers and view products	2026-02-02 16:23:46.889607	2026-02-02 16:23:46.889723
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY auth_schema.user_roles (user_id, role_id) FROM stdin;
2f09dfc8-271a-4a40-bdf2-f1245a869507	a295aea6-2321-4beb-85ea-a5471f22d815
ce9c7726-dc33-4e47-a505-873575deae79	7ff8e140-a73e-495d-afc6-97ec7da64a68
e149a01e-41b6-43cb-92e9-05f26501dd1a	9de83cfd-629e-46c3-92b1-275c2adc984c
930c8730-c961-4a2d-a975-b93bb8fec753	7ff8e140-a73e-495d-afc6-97ec7da64a68
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY auth_schema.users (id, email, phone, password, enabled, account_non_expired, account_non_locked, credentials_non_expired, created_at, updated_at) FROM stdin;
2f09dfc8-271a-4a40-bdf2-f1245a869507	arunteja2385@gmail.com	\N	$2a$10$2arESOhigKSRzae.030dGu1dYeWV2y5Y.K94Auk0.YZE4Kqa0qnLi	t	t	t	t	2026-03-25 03:52:01.210445	2026-03-25 03:52:01.210846
ce9c7726-dc33-4e47-a505-873575deae79	aruncourse2@gmail.com	\N	$2a$10$WoFsF6Fwhn0jpQe6ak.NO.n98VRrsWsxlXyNJcieAHTefjKaIjOrS	t	t	t	t	2026-03-25 07:32:11.547269	2026-03-25 07:32:11.547306
e149a01e-41b6-43cb-92e9-05f26501dd1a	admin@agrilink.com	\N	$2a$10$3b2mVOVT38KxEzv2fc3Va.ZP/aNI1QKYQcnaHf0e79EQDPaYTucwK	t	t	t	t	2026-03-25 14:55:14.620987	2026-03-25 14:55:14.621092
930c8730-c961-4a2d-a975-b93bb8fec753	sharwanandathul@gmail.com	\N	$2a$10$BwUpIAltj373VPT231NXi.z53pNGGblBQvCsEbdtav7/.lKKqa0xO	t	t	t	t	2026-04-01 15:05:58.897319	2026-04-01 15:05:58.897592
\.


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY auth_schema.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY auth_schema.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY auth_schema.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY auth_schema.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY auth_schema.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY auth_schema.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY auth_schema.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY auth_schema.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON auth_schema.flyway_schema_history USING btree (success);


--
-- Name: idx_password_reset_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_expires_at ON auth_schema.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_password_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_token ON auth_schema.password_reset_tokens USING btree (token);


--
-- Name: idx_password_reset_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_user_id ON auth_schema.password_reset_tokens USING btree (user_id);


--
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_role_id ON auth_schema.user_roles USING btree (role_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON auth_schema.user_roles USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON auth_schema.users USING btree (email);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_phone ON auth_schema.users USING btree (phone);


--
-- Name: password_reset_tokens fk_password_reset_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY auth_schema.password_reset_tokens
    ADD CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES auth_schema.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY auth_schema.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth_schema.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY auth_schema.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES auth_schema.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY auth_schema.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth_schema.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict a0V3Pt95hriMJYqQzbjTe7khJkRWvly8ZiJfMZaZlNwWbL0oNNa2J38chlRAZ3w

