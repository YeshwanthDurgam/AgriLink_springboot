--
-- PostgreSQL database dump
--

\restrict S8tUfRa6aZQKTcx8huenfETK9QxmAIiYemu7bdEVsFkwRH2aEnOLyExvRs9Rr40

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
-- Name: order_schema; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA order_schema;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cart_items; Type: TABLE; Schema: order_schema; Owner: -
--

CREATE TABLE order_schema.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cart_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    listing_title character varying(255) NOT NULL,
    listing_image_url character varying(255),
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    unit character varying(20),
    available_quantity integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: carts; Type: TABLE; Schema: order_schema; Owner: -
--

CREATE TABLE order_schema.carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: crop_plans; Type: TABLE; Schema: order_schema; Owner: -
--

CREATE TABLE order_schema.crop_plans (
    id uuid NOT NULL,
    actual_harvest_date date,
    actual_yield numeric(10,2),
    created_at timestamp(6) without time zone NOT NULL,
    crop_name character varying(255) NOT NULL,
    expected_harvest_date date,
    expected_yield numeric(10,2),
    notes text,
    planting_date date,
    status character varying(50) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    variety character varying(255),
    yield_unit character varying(20),
    field_id uuid NOT NULL,
    CONSTRAINT crop_plans_status_check CHECK (((status)::text = ANY ((ARRAY['PLANNED'::character varying, 'PLANTED'::character varying, 'GROWING'::character varying, 'HARVESTING'::character varying, 'HARVESTED'::character varying, 'CANCELLED'::character varying])::text[])))
);


--
-- Name: farms; Type: TABLE; Schema: order_schema; Owner: -
--

CREATE TABLE order_schema.farms (
    id uuid NOT NULL,
    active boolean NOT NULL,
    area_unit character varying(20),
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    farmer_id uuid NOT NULL,
    latitude numeric(10,8),
    location character varying(500),
    longitude numeric(11,8),
    name character varying(255) NOT NULL,
    total_area numeric(10,2),
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: fields; Type: TABLE; Schema: order_schema; Owner: -
--

CREATE TABLE order_schema.fields (
    id uuid NOT NULL,
    active boolean NOT NULL,
    area numeric(10,2),
    area_unit character varying(20),
    created_at timestamp(6) without time zone NOT NULL,
    irrigation_type character varying(100),
    name character varying(255) NOT NULL,
    polygon jsonb,
    soil_type character varying(100),
    updated_at timestamp(6) without time zone NOT NULL,
    farm_id uuid NOT NULL
);


--
-- Name: flyway_schema_history; Type: TABLE; Schema: order_schema; Owner: -
--

CREATE TABLE order_schema.flyway_schema_history (
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
-- Name: fraud_cases; Type: TABLE; Schema: order_schema; Owner: -
--

CREATE TABLE order_schema.fraud_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_number character varying(50) NOT NULL,
    reporter_id uuid NOT NULL,
    accused_id uuid NOT NULL,
    order_id uuid,
    fraud_type character varying(50) NOT NULL,
    priority character varying(20) DEFAULT 'MEDIUM'::character varying NOT NULL,
    status character varying(30) DEFAULT 'OPEN'::character varying NOT NULL,
    description text,
    evidence_details text,
    investigation_notes text,
    resolved_reason text,
    resolved_by_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    resolved_at timestamp without time zone
);


--
-- Name: TABLE fraud_cases; Type: COMMENT; Schema: order_schema; Owner: -
--

COMMENT ON TABLE order_schema.fraud_cases IS 'Stores fraud reports and investigation cases';


--
-- Name: COLUMN fraud_cases.case_number; Type: COMMENT; Schema: order_schema; Owner: -
--

COMMENT ON COLUMN order_schema.fraud_cases.case_number IS 'Unique case identifier for tracking';


--
-- Name: COLUMN fraud_cases.fraud_type; Type: COMMENT; Schema: order_schema; Owner: -
--

COMMENT ON COLUMN order_schema.fraud_cases.fraud_type IS 'Type of fraud: PAYMENT_FRAUD, IDENTITY_FRAUD, PRODUCT_FRAUD, NON_DELIVERY, NON_PAYMENT, ACCOUNT_COMPROMISE, SUSPICIOUS_ACTIVITY, OTHER';


--
-- Name: COLUMN fraud_cases.priority; Type: COMMENT; Schema: order_schema; Owner: -
--

COMMENT ON COLUMN order_schema.fraud_cases.priority IS 'Case priority: LOW, MEDIUM, HIGH, CRITICAL';


--
-- Name: COLUMN fraud_cases.status; Type: COMMENT; Schema: order_schema; Owner: -
--

COMMENT ON COLUMN order_schema.fraud_cases.status IS 'Investigation status: OPEN, INVESTIGATING, RESOLVED, CLOSED, ESCALATED';


--
-- Name: order_items; Type: TABLE; Schema: order_schema; Owner: -
--

CREATE TABLE order_schema.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    product_name character varying(255) NOT NULL,
    quantity numeric(12,2) NOT NULL,
    quantity_unit character varying(20) DEFAULT 'KG'::character varying,
    unit_price numeric(12,2) NOT NULL,
    subtotal numeric(14,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image_url character varying(500)
);


--
-- Name: order_status_history; Type: TABLE; Schema: order_schema; Owner: -
--

CREATE TABLE order_schema.order_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    status character varying(30) NOT NULL,
    notes text,
    changed_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: order_tracking; Type: TABLE; Schema: order_schema; Owner: -
--

CREATE TABLE order_schema.order_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    event_type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    location character varying(255),
    latitude double precision,
    longitude double precision,
    tracking_number character varying(255),
    carrier character varying(255),
    carrier_status character varying(255),
    estimated_delivery timestamp without time zone,
    event_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: orders; Type: TABLE; Schema: order_schema; Owner: -
--

CREATE TABLE order_schema.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number character varying(50) NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    status character varying(30) DEFAULT 'PENDING'::character varying,
    total_amount numeric(14,2) NOT NULL,
    currency character varying(3) DEFAULT 'INR'::character varying,
    shipping_address text,
    shipping_city character varying(100),
    shipping_state character varying(100),
    shipping_postal_code character varying(20),
    shipping_country character varying(100),
    shipping_phone character varying(20),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    buyer_email character varying(255),
    buyer_name character varying(255)
);


--
-- Name: payments; Type: TABLE; Schema: order_schema; Owner: -
--

CREATE TABLE order_schema.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    payment_method character varying(50) NOT NULL,
    payment_status character varying(30) DEFAULT 'PENDING'::character varying,
    amount numeric(14,2) NOT NULL,
    currency character varying(3) DEFAULT 'INR'::character varying,
    transaction_id character varying(100),
    payment_gateway character varying(50),
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    razorpay_order_id character varying(100),
    razorpay_payment_id character varying(100),
    razorpay_signature character varying(200),
    razorpay_receipt character varying(100),
    failure_reason character varying(500),
    refund_id character varying(100),
    refund_amount numeric(14,2),
    refunded_at timestamp without time zone,
    CONSTRAINT payments_payment_status_check CHECK (((payment_status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('PROCESSING'::character varying)::text, ('CREATED'::character varying)::text, ('AUTHORIZED'::character varying)::text, ('CAPTURED'::character varying)::text, ('COMPLETED'::character varying)::text, ('FAILED'::character varying)::text, ('REFUND_PENDING'::character varying)::text, ('REFUNDED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: order_schema; Owner: -
--

COPY order_schema.cart_items (id, cart_id, listing_id, seller_id, listing_title, listing_image_url, quantity, unit_price, unit, available_quantity, created_at, updated_at) FROM stdin;
cb755716-6676-4f14-afb3-99290d33da0c	d06d5872-7475-464e-aeb9-d4f5587251df	ffff0002-ffff-0002-ffff-000000000002	aaaa1111-aaaa-1111-aaaa-111111111111	Green Capsicum (Bell Pepper)	https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400	1	80.00	KG	200	2026-02-01 20:31:38.632265	2026-02-01 20:31:38.633748
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: order_schema; Owner: -
--

COPY order_schema.carts (id, user_id, created_at, updated_at) FROM stdin;
d06d5872-7475-464e-aeb9-d4f5587251df	0e3a72ef-6162-495f-b9ca-6a18cf390302	2026-02-01 19:29:47.235668	2026-02-01 19:29:47.236754
365507d9-b17f-435c-8431-f0f8453f5d8d	464ef840-5b5f-43c7-b191-7a29c450618f	2026-02-01 19:49:27.865649	2026-02-01 19:49:27.872752
40602d82-187a-49d5-aa22-af1d49434e1e	278ebb6c-0952-407c-ac3d-b8bc48e669dd	2026-02-01 21:10:38.042174	2026-02-01 21:10:38.047231
369cd9a7-3178-44c8-8609-2bef8d447917	71618ca6-ff4e-418c-b339-9f3b67ea860f	2026-02-04 14:28:32.71737	2026-02-04 14:28:32.720864
\.


--
-- Data for Name: crop_plans; Type: TABLE DATA; Schema: order_schema; Owner: -
--

COPY order_schema.crop_plans (id, actual_harvest_date, actual_yield, created_at, crop_name, expected_harvest_date, expected_yield, notes, planting_date, status, updated_at, variety, yield_unit, field_id) FROM stdin;
\.


--
-- Data for Name: farms; Type: TABLE DATA; Schema: order_schema; Owner: -
--

COPY order_schema.farms (id, active, area_unit, created_at, description, farmer_id, latitude, location, longitude, name, total_area, updated_at) FROM stdin;
\.


--
-- Data for Name: fields; Type: TABLE DATA; Schema: order_schema; Owner: -
--

COPY order_schema.fields (id, active, area, area_unit, created_at, irrigation_type, name, polygon, soil_type, updated_at, farm_id) FROM stdin;
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: order_schema; Owner: -
--

COPY order_schema.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init order schema	SQL	V1__init_order_schema.sql	1552591450	neondb_owner	2026-02-01 12:46:24.402441	3428	t
2	2	add cart tables	SQL	V2__add_cart_tables.sql	-1268661504	neondb_owner	2026-02-01 12:46:32.004822	2123	t
3	3	add order tracking table	SQL	V3__add_order_tracking_table.sql	57340032	neondb_owner	2026-02-01 12:46:37.531741	2602	t
4	4	add razorpay payment fields	SQL	V4__add_razorpay_payment_fields.sql	-1594146015	neondb_owner	2026-02-01 12:46:43.503457	6150	t
5	5	fix payment status constraint	SQL	V5__fix_payment_status_constraint.sql	1202573141	neondb_owner	2026-02-01 12:46:53.536683	1462	t
6	6	fix payment status constraint v2	SQL	V6__fix_payment_status_constraint_v2.sql	530475220	neondb_owner	2026-02-01 12:46:59.287081	1427	t
7	7	remove all payment status constraints	SQL	V7__remove_all_payment_status_constraints.sql	206917510	neondb_owner	2026-02-01 12:47:04.678393	1427	t
8	8	add buyer email to orders	SQL	V8__add_buyer_email_to_orders.sql	-899142036	neondb_owner	2026-02-01 12:47:09.249775	1621	t
9	9	add image url to order items	SQL	V9__add_image_url_to_order_items.sql	-1792744498	neondb_owner	2026-02-02 06:06:26.068444	1615	t
10	10	add fraud case table	SQL	V10__add_fraud_case_table.sql	-938076080	neondb_owner	2026-04-02 03:16:15.557341	4190	t
\.


--
-- Data for Name: fraud_cases; Type: TABLE DATA; Schema: order_schema; Owner: -
--

COPY order_schema.fraud_cases (id, case_number, reporter_id, accused_id, order_id, fraud_type, priority, status, description, evidence_details, investigation_notes, resolved_reason, resolved_by_id, created_at, updated_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: order_schema; Owner: -
--

COPY order_schema.order_items (id, order_id, listing_id, product_name, quantity, quantity_unit, unit_price, subtotal, created_at, image_url) FROM stdin;
51e0d62b-32bf-4dcd-a04d-a65d9325c313	c637b8a5-c975-4608-9e81-617c479dfba4	ffff0002-ffff-0002-ffff-000000000002	Green Capsicum (Bell Pepper)	1.00	KG	80.00	80.00	2026-02-01 19:59:05.730676	\N
c3e2e47c-6a30-417f-b266-f002ac50606e	23d3d800-f46f-47b9-b5e8-665f50c5d610	ffff0002-ffff-0002-ffff-000000000002	Green Capsicum (Bell Pepper)	1.00	KG	80.00	80.00	2026-02-01 21:24:13.497167	\N
117f8345-13bf-466e-b00f-4f086a8d44d6	23d3d800-f46f-47b9-b5e8-665f50c5d610	ffff0003-ffff-0003-ffff-000000000003	Fresh Spinach (Palak)	1.00	KG	35.00	35.00	2026-02-01 21:24:13.773431	\N
9ad43d3a-a495-4a7a-9272-a890e89376a1	7d5705af-5ea1-42a0-86a7-01b9cdcdc654	ffff0093-ffff-0093-ffff-000000000093	Fresh Butter	1.00	KG	800.00	800.00	2026-02-01 21:55:20.14058	\N
18342dc1-155c-4b90-bc8a-d2843a7a6cd6	474ee0cc-bd18-42cf-b35c-ca203b9f77ab	ffff0052-ffff-0052-ffff-000000000052	Kesar Mangoes	1.00	KG	450.00	450.00	2026-02-02 16:44:44.899442	https://images.unsplash.com/photo-1553279768-865429fa0078?w=400
7db52035-4595-4292-9b6e-c095d81bbedc	f8427c56-c6a7-4dcc-9e46-d93012dd5eb2	ffff0093-ffff-0093-ffff-000000000093	Fresh Butter	1.00	KG	800.00	800.00	2026-02-07 10:12:56.729501	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: order_schema; Owner: -
--

COPY order_schema.order_status_history (id, order_id, status, notes, changed_by, created_at) FROM stdin;
ba438c24-90ce-4938-b35d-bef8a9755ee4	c637b8a5-c975-4608-9e81-617c479dfba4	PENDING	Order created, awaiting payment	0e3a72ef-6162-495f-b9ca-6a18cf390302	2026-02-01 19:59:05.968273
58eabd05-5618-4e19-9322-ba4c6f20d50a	c637b8a5-c975-4608-9e81-617c479dfba4	CONFIRMED	Payment received via Razorpay. Transaction ID: pay_SAumBIpNqSnAOk	0e3a72ef-6162-495f-b9ca-6a18cf390302	2026-02-01 20:00:03.609673
67bbc28d-0465-488e-8b86-639528277306	23d3d800-f46f-47b9-b5e8-665f50c5d610	PENDING	Order created, awaiting payment	278ebb6c-0952-407c-ac3d-b8bc48e669dd	2026-02-01 21:24:14.039351
6102fc6d-b650-4fcc-af65-f7d11caba83b	23d3d800-f46f-47b9-b5e8-665f50c5d610	CONFIRMED	Payment received via Razorpay. Transaction ID: pay_SAwE2HxVPRguta	278ebb6c-0952-407c-ac3d-b8bc48e669dd	2026-02-01 21:24:53.054319
8b647f0f-0581-43db-8fdc-3aa9c385e044	7d5705af-5ea1-42a0-86a7-01b9cdcdc654	PENDING	Order created, awaiting payment	278ebb6c-0952-407c-ac3d-b8bc48e669dd	2026-02-01 21:55:20.373811
fbcbe93a-34ca-4ba9-af5d-12776a1378f3	7d5705af-5ea1-42a0-86a7-01b9cdcdc654	CONFIRMED	Payment received via Razorpay. Transaction ID: pay_SAwkrjv9YzL8rL	278ebb6c-0952-407c-ac3d-b8bc48e669dd	2026-02-01 21:55:59.638768
e93b5c4d-01d3-4ef5-ad51-63b19301d23e	474ee0cc-bd18-42cf-b35c-ca203b9f77ab	PENDING	Order created, awaiting payment	278ebb6c-0952-407c-ac3d-b8bc48e669dd	2026-02-02 16:44:45.19405
7f00ab10-012e-4656-a90c-54f80623ee91	474ee0cc-bd18-42cf-b35c-ca203b9f77ab	CONFIRMED	Payment received via Razorpay. Transaction ID: pay_SBLcSrlwurBeOI	278ebb6c-0952-407c-ac3d-b8bc48e669dd	2026-02-02 16:45:20.457609
ad7e49f8-7e17-4c8e-ba25-cdc1db3eefd7	f8427c56-c6a7-4dcc-9e46-d93012dd5eb2	PENDING	Order created, awaiting payment	71618ca6-ff4e-418c-b339-9f3b67ea860f	2026-02-07 10:12:57.021122
acd18735-3ed9-4510-9ee9-8d9760097886	f8427c56-c6a7-4dcc-9e46-d93012dd5eb2	CONFIRMED	Payment received via Razorpay. Transaction ID: pay_SD80Ew14CqbRSF	71618ca6-ff4e-418c-b339-9f3b67ea860f	2026-02-07 10:13:39.796824
\.


--
-- Data for Name: order_tracking; Type: TABLE DATA; Schema: order_schema; Owner: -
--

COPY order_schema.order_tracking (id, order_id, event_type, title, description, location, latitude, longitude, tracking_number, carrier, carrier_status, estimated_delivery, event_timestamp, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: order_schema; Owner: -
--

COPY order_schema.orders (id, order_number, buyer_id, seller_id, listing_id, status, total_amount, currency, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_phone, notes, created_at, updated_at, buyer_email, buyer_name) FROM stdin;
c637b8a5-c975-4608-9e81-617c479dfba4	ORD202602011958518935	0e3a72ef-6162-495f-b9ca-6a18cf390302	aaaa1111-aaaa-1111-aaaa-111111111111	ffff0002-ffff-0002-ffff-000000000002	CONFIRMED	124.00	INR	Hyderabad, Hyderabad	Hyderabad	Telangana	501510	India	6304510431		2026-02-01 19:59:05.280093	2026-02-01 20:00:04.732214	arunteja2385@gmail.com	Arunteja
23d3d800-f46f-47b9-b5e8-665f50c5d610	ORD202602012124116615	278ebb6c-0952-407c-ac3d-b8bc48e669dd	aaaa1111-aaaa-1111-aaaa-111111111111	ffff0002-ffff-0002-ffff-000000000002	CONFIRMED	160.75	INR	Hyderabad, Hyderabad	Hyderabad	Telangana	501510	India	6304510431		2026-02-01 21:24:13.153577	2026-02-01 21:24:53.58403	arunteja2385@gmail.com	Arunteja
7d5705af-5ea1-42a0-86a7-01b9cdcdc654	ORD202602012155170132	278ebb6c-0952-407c-ac3d-b8bc48e669dd	aaaa2222-aaaa-2222-aaaa-222222222222	ffff0093-ffff-0093-ffff-000000000093	CONFIRMED	840.00	INR	Hyderabad, Hyderabad	Hyderabad	Telangana	501510	India	6304510431		2026-02-01 21:55:19.857041	2026-02-01 21:56:00.076771	arunteja2385@gmail.com	Arunteja
474ee0cc-bd18-42cf-b35c-ca203b9f77ab	ORD202602021644439190	278ebb6c-0952-407c-ac3d-b8bc48e669dd	aaaa2222-aaaa-2222-aaaa-222222222222	ffff0052-ffff-0052-ffff-000000000052	CONFIRMED	512.50	INR	Hyderabad, Hyderabad	Hyderabad	Telangana	501510	India	6304510431		2026-02-02 16:44:44.87617	2026-02-02 16:45:20.713153	arunteja2385@gmail.com	Arunteja
f8427c56-c6a7-4dcc-9e46-d93012dd5eb2	ORD202602071012555965	71618ca6-ff4e-418c-b339-9f3b67ea860f	aaaa2222-aaaa-2222-aaaa-222222222222	ffff0093-ffff-0093-ffff-000000000093	CONFIRMED	840.00	INR	h, hyderabad	Hyderabad	Telangana	501510	India	9000000000		2026-02-07 10:12:56.666505	2026-02-07 10:13:40.068437	buyer@gmail.com	Buyer
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: order_schema; Owner: -
--

COPY order_schema.payments (id, order_id, payment_method, payment_status, amount, currency, transaction_id, payment_gateway, paid_at, created_at, updated_at, razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpay_receipt, failure_reason, refund_id, refund_amount, refunded_at) FROM stdin;
d9a1ccd2-43e1-4216-8d83-4db0bce33742	c637b8a5-c975-4608-9e81-617c479dfba4	RAZORPAY	COMPLETED	124.00	INR	pay_SAumBIpNqSnAOk	RAZORPAY	2026-02-01 20:00:01.534805	2026-02-01 19:59:06.237814	2026-02-01 20:00:04.332127	order_SAulhAVKmxYqKr	pay_SAumBIpNqSnAOk	2678639a2760ab7133f82c971095401b04b06db60dac556777ac36d322ec1bab	rcpt_c637b8a5_956132714	\N	\N	\N	\N
f60dff0f-aae7-42d5-bdf8-5333063119a2	23d3d800-f46f-47b9-b5e8-665f50c5d610	RAZORPAY	COMPLETED	160.75	INR	pay_SAwE2HxVPRguta	RAZORPAY	2026-02-01 21:24:52.220893	2026-02-01 21:24:14.547366	2026-02-01 21:24:53.316946	order_SAwDcjAGO5Gf1B	pay_SAwE2HxVPRguta	eb7ce16282c98049dc4538d99905aac593f22517fca7165c9e3d8456f916e6b2	rcpt_23d3d800_961251687	\N	\N	\N	\N
7dfa6675-31ff-4f33-bf80-c2daea8fa97a	7d5705af-5ea1-42a0-86a7-01b9cdcdc654	RAZORPAY	COMPLETED	840.00	INR	pay_SAwkrjv9YzL8rL	RAZORPAY	2026-02-01 21:55:58.857814	2026-02-01 21:55:20.600532	2026-02-01 21:55:59.857105	order_SAwkUZT70luny4	pay_SAwkrjv9YzL8rL	591728fbf3712fa3357e1cec5496c627c04e24ed32e5f2792ae3476561e8ba3b	rcpt_7d5705af_963118062	\N	\N	\N	\N
8e4d1336-8946-440d-8d04-35756e90cdb7	474ee0cc-bd18-42cf-b35c-ca203b9f77ab	RAZORPAY	COMPLETED	512.50	INR	pay_SBLcSrlwurBeOI	RAZORPAY	2026-02-02 16:45:19.296312	2026-02-02 16:44:45.515094	2026-02-02 16:45:20.71848	order_SBLc8O3ehwyc5F	pay_SBLcSrlwurBeOI	e2b1ab53ebcd27dc99698115242863f5a7329c0b1d3e664062d3ba52574c4938	rcpt_474ee0cc_50683477	\N	\N	\N	\N
042773ee-c2af-400d-8455-8271778d2bca	f8427c56-c6a7-4dcc-9e46-d93012dd5eb2	RAZORPAY	COMPLETED	840.00	INR	pay_SD80Ew14CqbRSF	RAZORPAY	2026-02-07 10:13:38.861306	2026-02-07 10:12:57.302699	2026-02-07 10:13:40.07532	order_SD7zmLjAqiTTNS	pay_SD80Ew14CqbRSF	c166987a193cfcc7928cf9784a0ab7b38292180b80b9295f5e2bceeee1afa04a	rcpt_f8427c56_439376056	\N	\N	\N	\N
\.


--
-- Name: cart_items cart_items_cart_id_listing_id_key; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.cart_items
    ADD CONSTRAINT cart_items_cart_id_listing_id_key UNIQUE (cart_id, listing_id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: carts carts_user_id_key; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.carts
    ADD CONSTRAINT carts_user_id_key UNIQUE (user_id);


--
-- Name: crop_plans crop_plans_pkey; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.crop_plans
    ADD CONSTRAINT crop_plans_pkey PRIMARY KEY (id);


--
-- Name: farms farms_pkey; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.farms
    ADD CONSTRAINT farms_pkey PRIMARY KEY (id);


--
-- Name: fields fields_pkey; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.fields
    ADD CONSTRAINT fields_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: fraud_cases fraud_cases_case_number_key; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.fraud_cases
    ADD CONSTRAINT fraud_cases_case_number_key UNIQUE (case_number);


--
-- Name: fraud_cases fraud_cases_pkey; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.fraud_cases
    ADD CONSTRAINT fraud_cases_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: order_tracking order_tracking_pkey; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.order_tracking
    ADD CONSTRAINT order_tracking_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: cart_items uk5c2xwequ0svy819ealcqf3lbj; Type: CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.cart_items
    ADD CONSTRAINT uk5c2xwequ0svy819ealcqf3lbj UNIQUE (cart_id, listing_id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON order_schema.flyway_schema_history USING btree (success);


--
-- Name: idx_cart_item_listing_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_cart_item_listing_id ON order_schema.cart_items USING btree (listing_id);


--
-- Name: idx_cart_item_seller_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_cart_item_seller_id ON order_schema.cart_items USING btree (seller_id);


--
-- Name: idx_cart_items_cart_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_cart_items_cart_id ON order_schema.cart_items USING btree (cart_id);


--
-- Name: idx_cart_items_listing_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_cart_items_listing_id ON order_schema.cart_items USING btree (listing_id);


--
-- Name: idx_cart_user_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_cart_user_id ON order_schema.carts USING btree (user_id);


--
-- Name: idx_carts_user_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_carts_user_id ON order_schema.carts USING btree (user_id);


--
-- Name: idx_fraud_accused_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_fraud_accused_id ON order_schema.fraud_cases USING btree (accused_id);


--
-- Name: idx_fraud_created_at; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_fraud_created_at ON order_schema.fraud_cases USING btree (created_at);


--
-- Name: idx_fraud_order_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_fraud_order_id ON order_schema.fraud_cases USING btree (order_id);


--
-- Name: idx_fraud_reporter_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_fraud_reporter_id ON order_schema.fraud_cases USING btree (reporter_id);


--
-- Name: idx_fraud_status; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_fraud_status ON order_schema.fraud_cases USING btree (status);


--
-- Name: idx_order_buyer_email; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_order_buyer_email ON order_schema.orders USING btree (buyer_email);


--
-- Name: idx_order_buyer_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_order_buyer_id ON order_schema.orders USING btree (buyer_id);


--
-- Name: idx_order_created_at; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_order_created_at ON order_schema.orders USING btree (created_at);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_order_items_order ON order_schema.order_items USING btree (order_id);


--
-- Name: idx_order_seller_date; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_order_seller_date ON order_schema.orders USING btree (seller_id, created_at);


--
-- Name: idx_order_seller_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_order_seller_id ON order_schema.orders USING btree (seller_id);


--
-- Name: idx_order_seller_status; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_order_seller_status ON order_schema.orders USING btree (seller_id, status);


--
-- Name: idx_order_status; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_order_status ON order_schema.orders USING btree (status);


--
-- Name: idx_order_tracking_created_at; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_order_tracking_created_at ON order_schema.order_tracking USING btree (created_at DESC);


--
-- Name: idx_order_tracking_event_type; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_order_tracking_event_type ON order_schema.order_tracking USING btree (event_type);


--
-- Name: idx_order_tracking_order_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_order_tracking_order_id ON order_schema.order_tracking USING btree (order_id);


--
-- Name: idx_order_tracking_tracking_number; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_order_tracking_tracking_number ON order_schema.order_tracking USING btree (tracking_number);


--
-- Name: idx_orders_buyer; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_orders_buyer ON order_schema.orders USING btree (buyer_id);


--
-- Name: idx_orders_buyer_created; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_orders_buyer_created ON order_schema.orders USING btree (buyer_id, created_at DESC);


--
-- Name: idx_orders_number; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_orders_number ON order_schema.orders USING btree (order_number);


--
-- Name: idx_orders_seller; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_orders_seller ON order_schema.orders USING btree (seller_id);


--
-- Name: idx_orders_seller_created; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_orders_seller_created ON order_schema.orders USING btree (seller_id, created_at DESC);


--
-- Name: idx_orders_status; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_orders_status ON order_schema.orders USING btree (status);


--
-- Name: idx_payments_order; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_payments_order ON order_schema.payments USING btree (order_id);


--
-- Name: idx_payments_razorpay_order_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_payments_razorpay_order_id ON order_schema.payments USING btree (razorpay_order_id);


--
-- Name: idx_payments_razorpay_payment_id; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_payments_razorpay_payment_id ON order_schema.payments USING btree (razorpay_payment_id);


--
-- Name: idx_status_history_order; Type: INDEX; Schema: order_schema; Owner: -
--

CREATE INDEX idx_status_history_order ON order_schema.order_status_history USING btree (order_id);


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES order_schema.carts(id) ON DELETE CASCADE;


--
-- Name: fields fkomv5dbq49wptvwmnlhg4ieubh; Type: FK CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.fields
    ADD CONSTRAINT fkomv5dbq49wptvwmnlhg4ieubh FOREIGN KEY (farm_id) REFERENCES order_schema.farms(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES order_schema.orders(id) ON DELETE CASCADE;


--
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES order_schema.orders(id) ON DELETE CASCADE;


--
-- Name: order_tracking order_tracking_order_id_fkey; Type: FK CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.order_tracking
    ADD CONSTRAINT order_tracking_order_id_fkey FOREIGN KEY (order_id) REFERENCES order_schema.orders(id) ON DELETE CASCADE;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: order_schema; Owner: -
--

ALTER TABLE ONLY order_schema.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES order_schema.orders(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict S8tUfRa6aZQKTcx8huenfETK9QxmAIiYemu7bdEVsFkwRH2aEnOLyExvRs9Rr40

