--
-- PostgreSQL database dump
--

\restrict dRaFwhP733bYPPIfs0vG4sk7WUnLn7rgLrZKOy6dHDn5B2OwW4jziyRau5LBeCs

-- Dumped from database version 17.8 (a284a84)
-- Dumped by pg_dump version 17.9

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

--
-- Name: auth_schema; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth_schema;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: flyway_schema_history; Type: TABLE; Schema: auth_schema; Owner: -
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
-- Name: password_reset_tokens; Type: TABLE; Schema: auth_schema; Owner: -
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
-- Name: roles; Type: TABLE; Schema: auth_schema; Owner: -
--

CREATE TABLE auth_schema.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: auth_schema; Owner: -
--

CREATE TABLE auth_schema.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: auth_schema; Owner: -
--

CREATE TABLE auth_schema.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    password character varying(255) NOT NULL,
    enabled boolean DEFAULT true,
    account_non_expired boolean DEFAULT true,
    account_non_locked boolean DEFAULT true,
    credentials_non_expired boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: auth_schema; Owner: -
--

COPY auth_schema.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	<< Flyway Baseline >>	BASELINE	<< Flyway Baseline >>	\N	neondb_owner	2026-02-01 12:40:43.351725	0	t
2	2	add customer role	SQL	V2__add_customer_role.sql	986629203	neondb_owner	2026-02-01 12:40:48.49083	1821	t
3	3	add password reset tokens	SQL	V3__add_password_reset_tokens.sql	-1609950332	neondb_owner	2026-02-01 12:40:54.43144	2860	t
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: auth_schema; Owner: -
--

COPY auth_schema.password_reset_tokens (id, token, user_id, expires_at, used, created_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: auth_schema; Owner: -
--

COPY auth_schema.roles (id, name, description, created_at, updated_at) FROM stdin;
11111111-1111-1111-1111-111111111111	FARMER	Farm owner who can list and sell products	2026-02-01 12:38:14.193594	2026-02-01 12:38:14.193594
22222222-2222-2222-2222-222222222222	BUYER	Customer who can purchase products	2026-02-01 12:38:14.193594	2026-02-01 12:38:14.193594
33333333-3333-3333-3333-333333333333	ADMIN	System administrator with full access	2026-02-01 12:38:14.193594	2026-02-01 12:38:14.193594
a6305c67-9402-4fee-bd53-6fadcf293685	CUSTOMER	Customer role - can browse and purchase products	2026-02-01 12:40:50.110007	2026-02-01 12:40:50.110007
2ceaaaed-674e-4ed4-b8ab-a95e3813c49a	MANAGER	Manager role - can verify farmers and view products	2026-02-01 19:22:56.582041	2026-02-01 19:22:56.582041
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: auth_schema; Owner: -
--

COPY auth_schema.user_roles (user_id, role_id) FROM stdin;
aaaa1111-aaaa-1111-aaaa-111111111111	11111111-1111-1111-1111-111111111111
aaaa2222-aaaa-2222-aaaa-222222222222	11111111-1111-1111-1111-111111111111
bbbb1111-bbbb-1111-bbbb-111111111111	22222222-2222-2222-2222-222222222222
464ef840-5b5f-43c7-b191-7a29c450618f	22222222-2222-2222-2222-222222222222
c8fc68c1-8932-479d-bc94-29c8d2628d92	11111111-1111-1111-1111-111111111111
278ebb6c-0952-407c-ac3d-b8bc48e669dd	a6305c67-9402-4fee-bd53-6fadcf293685
c89fa2b3-a6e0-403e-9819-981ab2eed0f2	33333333-3333-3333-3333-333333333333
a3b3edbe-5e4f-468f-8f63-516af88bfaee	11111111-1111-1111-1111-111111111111
71618ca6-ff4e-418c-b339-9f3b67ea860f	a6305c67-9402-4fee-bd53-6fadcf293685
85dcc07c-f098-4338-a73c-df72909eaaaa	11111111-1111-1111-1111-111111111111
615e31f7-a055-41eb-8dbd-a570cc3024ca	11111111-1111-1111-1111-111111111111
c98354cc-2be1-4a97-9cc6-aece0aa89d6d	11111111-1111-1111-1111-111111111111
7d53c1dd-37df-4f5d-8f6d-688ea6a55ca8	11111111-1111-1111-1111-111111111111
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth_schema; Owner: -
--

COPY auth_schema.users (id, email, phone, password, enabled, account_non_expired, account_non_locked, credentials_non_expired, created_at, updated_at) FROM stdin;
aaaa1111-aaaa-1111-aaaa-111111111111	rajesh.kumar@agrilink.com	+919876543210	$2a$10$N9qo8uLOickgx2ZMRZoMye7Ij.w9./FfC2HHCS8eY0qRgSYK.qZz.	t	t	t	t	2026-02-01 12:38:14.429664	2026-02-01 12:38:14.429664
aaaa2222-aaaa-2222-aaaa-222222222222	priya.sharma@agrilink.com	+919876543211	$2a$10$N9qo8uLOickgx2ZMRZoMye7Ij.w9./FfC2HHCS8eY0qRgSYK.qZz.	t	t	t	t	2026-02-01 12:38:14.429664	2026-02-01 12:38:14.429664
bbbb1111-bbbb-1111-bbbb-111111111111	amit.patel@agrilink.com	+919876543212	$2a$10$N9qo8uLOickgx2ZMRZoMye7Ij.w9./FfC2HHCS8eY0qRgSYK.qZz.	t	t	t	t	2026-02-01 12:38:14.429664	2026-02-01 12:38:14.429664
464ef840-5b5f-43c7-b191-7a29c450618f	testbuyer@test.com	\N	$2a$10$YRB4K8iqGSxO0tNLOZ4h6Oh2I4vXYrXnq7O48NNe4zpE3sUAItl6S	t	t	t	t	2026-02-01 19:33:55.148763	2026-02-01 19:33:55.148763
c8fc68c1-8932-479d-bc94-29c8d2628d92	testfarmer@test.com	\N	$2a$10$uJ.L9joFGlB4y7chYHIc9O82Q5dQu5EzTq7jhsiJOfjA1f0ms47pS	t	t	t	t	2026-02-01 19:50:26.829677	2026-02-01 19:50:26.829677
278ebb6c-0952-407c-ac3d-b8bc48e669dd	arunteja2385@gmail.com	\N	$2a$10$KNlCdVepRppCVXJHQ9Sao.TmAuFl6sCw6SUI/TNVudRaGRvpKqlYu	t	t	t	t	2026-02-01 21:08:18.820454	2026-02-01 21:08:18.820454
c89fa2b3-a6e0-403e-9819-981ab2eed0f2	admin@gmail.com	\N	$2a$10$1mcHQKZKEeXxp3BeuG87au/nqX9bwD71gdlcFqaaHwD56NLO/wzAe	t	t	t	t	2026-02-04 12:31:18.82897	2026-02-04 12:31:18.82897
a3b3edbe-5e4f-468f-8f63-516af88bfaee	yeshu5321@gmail.com	\N	$2a$10$pxZ4rGyt5Swx3AfsqcVnUuby11mcyvqvPqzJEbqANE5daiE4pSBVa	t	t	t	t	2026-02-04 12:34:07.868161	2026-02-04 12:34:07.868161
71618ca6-ff4e-418c-b339-9f3b67ea860f	buyer@gmail.com	\N	$2a$10$NHNNCCJmSWpZ8kcpb/uQ.eTxoVJyyOHWAsbB09WyxG.B.NITJy.fK	t	t	t	t	2026-02-04 14:25:03.261258	2026-02-04 14:25:03.261258
85dcc07c-f098-4338-a73c-df72909eaaaa	testfarmer2@test.com	\N	$2a$10$MOZXXr4qqM/Jl4dlrjuY2ey1CdlR1.ZyU.0sBCBe0MXStcu/V0yJS	t	t	t	t	2026-02-06 22:53:57.172485	2026-02-06 22:53:57.172485
615e31f7-a055-41eb-8dbd-a570cc3024ca	testfarmer3@test.com	\N	$2a$10$H9rrToZSaL1PAwulOoTAFuWjDK4swprvVDz0N/K0G72Kh9vznMu1.	t	t	t	t	2026-02-06 23:10:48.036983	2026-02-06 23:10:48.036983
c98354cc-2be1-4a97-9cc6-aece0aa89d6d	testfarmer6@test.com	\N	$2a$10$svhIAUtUqcUDwr5bpk44deY8HKM0pCw7CYg3OebNVSsSkogaD2T1q	t	t	t	t	2026-02-06 23:23:44.090272	2026-02-06 23:23:44.090272
7d53c1dd-37df-4f5d-8f6d-688ea6a55ca8	testfarmer7@test.com	\N	$2a$10$NMVN.JVtWMI5wUE1TcBdZugPHR.T18cxiNZ8TMThFl8r1L7U3PeWO	t	t	t	t	2026-02-06 23:23:54.205217	2026-02-06 23:23:54.205217
\.


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: auth_schema; Owner: -
--

ALTER TABLE ONLY auth_schema.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: auth_schema; Owner: -
--

ALTER TABLE ONLY auth_schema.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: auth_schema; Owner: -
--

ALTER TABLE ONLY auth_schema.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: auth_schema; Owner: -
--

ALTER TABLE ONLY auth_schema.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: auth_schema; Owner: -
--

ALTER TABLE ONLY auth_schema.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: auth_schema; Owner: -
--

ALTER TABLE ONLY auth_schema.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: auth_schema; Owner: -
--

ALTER TABLE ONLY auth_schema.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth_schema; Owner: -
--

ALTER TABLE ONLY auth_schema.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: auth_schema; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON auth_schema.flyway_schema_history USING btree (success);


--
-- Name: idx_password_reset_expires_at; Type: INDEX; Schema: auth_schema; Owner: -
--

CREATE INDEX idx_password_reset_expires_at ON auth_schema.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_password_reset_token; Type: INDEX; Schema: auth_schema; Owner: -
--

CREATE INDEX idx_password_reset_token ON auth_schema.password_reset_tokens USING btree (token);


--
-- Name: idx_password_reset_user_id; Type: INDEX; Schema: auth_schema; Owner: -
--

CREATE INDEX idx_password_reset_user_id ON auth_schema.password_reset_tokens USING btree (user_id);


--
-- Name: password_reset_tokens fk_password_reset_user; Type: FK CONSTRAINT; Schema: auth_schema; Owner: -
--

ALTER TABLE ONLY auth_schema.password_reset_tokens
    ADD CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES auth_schema.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth_schema; Owner: -
--

ALTER TABLE ONLY auth_schema.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth_schema.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: auth_schema; Owner: -
--

ALTER TABLE ONLY auth_schema.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES auth_schema.roles(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: auth_schema; Owner: -
--

ALTER TABLE ONLY auth_schema.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth_schema.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict dRaFwhP733bYPPIfs0vG4sk7WUnLn7rgLrZKOy6dHDn5B2OwW4jziyRau5LBeCs

