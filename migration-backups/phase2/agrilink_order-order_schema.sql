CREATE SCHEMA IF NOT EXISTS order_schema;
--
-- PostgreSQL database dump
--

\restrict b86ANPF4jA5huShjyiLrWsPZugNpz7OBsYW298b8guc5ZURyOUtchxapghFSWhs

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
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
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
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE order_schema.carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: -
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
-- Name: fraud_cases; Type: TABLE; Schema: public; Owner: -
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
-- Name: TABLE fraud_cases; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE order_schema.fraud_cases IS 'Stores fraud reports and investigation cases';


--
-- Name: COLUMN fraud_cases.case_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN order_schema.fraud_cases.case_number IS 'Unique case identifier for tracking';


--
-- Name: COLUMN fraud_cases.fraud_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN order_schema.fraud_cases.fraud_type IS 'Type of fraud: PAYMENT_FRAUD, IDENTITY_FRAUD, PRODUCT_FRAUD, NON_DELIVERY, NON_PAYMENT, ACCOUNT_COMPROMISE, SUSPICIOUS_ACTIVITY, OTHER';


--
-- Name: COLUMN fraud_cases.priority; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN order_schema.fraud_cases.priority IS 'Case priority: LOW, MEDIUM, HIGH, CRITICAL';


--
-- Name: COLUMN fraud_cases.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN order_schema.fraud_cases.status IS 'Investigation status: OPEN, INVESTIGATING, RESOLVED, CLOSED, ESCALATED';


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
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
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: -
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
-- Name: order_tracking; Type: TABLE; Schema: public; Owner: -
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
-- Name: orders; Type: TABLE; Schema: public; Owner: -
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
-- Name: payments; Type: TABLE; Schema: public; Owner: -
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
    refunded_at timestamp without time zone
);


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY order_schema.cart_items (id, cart_id, listing_id, seller_id, listing_title, listing_image_url, quantity, unit_price, unit, available_quantity, created_at, updated_at) FROM stdin;
39041bb5-7d32-4ea5-84b3-0f7a1a4adcae	62f424a3-a81a-4358-8b59-661df094e233	5528e71d-a62a-4e62-9f2e-c849216069a8	22222222-2222-2222-2222-222222222222	Fresh Carrots	https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800	2	45.00	KG	200	2026-03-26 05:13:13.496505	2026-03-26 05:13:14.530923
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY order_schema.carts (id, user_id, created_at, updated_at) FROM stdin;
62f424a3-a81a-4358-8b59-661df094e233	2f09dfc8-271a-4a40-bdf2-f1245a869507	2026-03-25 03:52:13.16283	2026-03-25 03:52:13.163288
b611cf39-177e-4861-80ff-5eda6ae5fa05	ce9c7726-dc33-4e47-a505-873575deae79	2026-03-25 07:32:41.626252	2026-03-25 07:32:41.626639
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY order_schema.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init order schema	SQL	V1__init_order_schema.sql	1552591450	agrilink	2026-02-02 16:23:35.988854	219	t
2	2	add cart tables	SQL	V2__add_cart_tables.sql	-1268661504	agrilink	2026-02-02 16:23:36.310219	120	t
3	3	add order tracking table	SQL	V3__add_order_tracking_table.sql	57340032	agrilink	2026-02-02 16:23:36.47733	98	t
4	4	add razorpay payment fields	SQL	V4__add_razorpay_payment_fields.sql	-1594146015	agrilink	2026-02-02 16:23:36.615503	181	t
5	5	fix payment status constraint	SQL	V5__fix_payment_status_constraint.sql	1202573141	agrilink	2026-02-02 16:23:36.861841	11	t
6	6	fix payment status constraint v2	SQL	V6__fix_payment_status_constraint_v2.sql	530475220	agrilink	2026-02-02 16:23:36.907115	11	t
7	7	remove all payment status constraints	SQL	V7__remove_all_payment_status_constraints.sql	206917510	agrilink	2026-02-02 16:23:36.944898	13	t
8	8	add buyer email to orders	SQL	V8__add_buyer_email_to_orders.sql	-899142036	agrilink	2026-02-02 16:23:36.988045	33	t
9	9	add image url to order items	SQL	V9__add_image_url_to_order_items.sql	-1792744498	agrilink	2026-02-02 16:23:37.043602	44	t
10	10	add fraud case table	SQL	V10__add_fraud_case_table.sql	-938076080	agrilink	2026-04-02 02:09:28.532825	238	t
\.


--
-- Data for Name: fraud_cases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY order_schema.fraud_cases (id, case_number, reporter_id, accused_id, order_id, fraud_type, priority, status, description, evidence_details, investigation_notes, resolved_reason, resolved_by_id, created_at, updated_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY order_schema.order_items (id, order_id, listing_id, product_name, quantity, quantity_unit, unit_price, subtotal, created_at, image_url) FROM stdin;
6669b573-40b0-43d0-a8d1-04bb7ecdd47b	9e5724b4-a32d-474b-aa94-79e7486e90cd	63852cf9-490d-4671-95bc-79d5b1cf8b6a	Red Lentils	1.00	KG	110.00	110.00	2026-03-25 04:48:38.058029	https://images.unsplash.com/photo-1515543904269-c4fef373d04a?w=800
bdffebb3-5620-4f8b-a268-e7f4389c114d	840fa1ec-eab6-4543-908f-8bc3bab2e6e2	63852cf9-490d-4671-95bc-79d5b1cf8b6a	Red Lentils	1.00	KG	110.00	110.00	2026-03-25 04:50:21.954119	https://images.unsplash.com/photo-1515543904269-c4fef373d04a?w=800
3d540df0-a3f0-4faa-affb-0fd2c00de720	b2693344-ea83-4b16-8c52-0520ed5e7951	4f744832-f084-4579-85eb-4e59c017362e	Golden Apples	4.00	KG	150.00	600.00	2026-03-25 05:49:44.698651	https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800
1c51c0fe-991e-455a-9d2a-c12d17027f88	7f181432-5a08-4a4f-a428-8b4c0f1918a4	cce6b07c-3b42-4670-92ac-8ce05b78d26b	Farm Fresh Eggs	1.00	KG	85.00	85.00	2026-03-25 10:23:09.299188	https://images.unsplash.com/photo-1569288052389-dac9b01c9c05?w=800
e417bb21-9a31-4087-b96e-ceb73518318d	53c0a982-47fd-459f-9e1f-1845ddc31284	63852cf9-490d-4671-95bc-79d5b1cf8b6a	Red Lentils	1.00	KG	110.00	110.00	2026-03-26 04:18:31.293065	https://images.unsplash.com/photo-1515543904269-c4fef373d04a?w=800
028bb69b-dccf-4948-a509-d37cd0ee3556	45beb19b-62fb-4fb4-9c4e-5038aac8a8ab	f2b0dc27-c703-407c-aba2-f637b748e3fb	Apples	1.00	KG	45.00	45.00	2026-03-26 04:43:28.087598	https://unsplash.com/photos/bunch-of-red-apples-wXuzS9xR49M
6bcc9f7e-fc9d-4422-bf63-030a2f7451f8	a6fd6cfb-cf30-43c5-bcb1-93c14222899b	5528e71d-a62a-4e62-9f2e-c849216069a8	Fresh Carrots	2.00	KG	45.00	90.00	2026-04-01 15:03:22.504365	https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800
c54d0cb3-c04f-4a3d-be17-44d87bb3ad08	7c1c7d5f-4d0b-45dc-91f0-e64b476386da	5528e71d-a62a-4e62-9f2e-c849216069a8	Fresh Carrots	2.00	KG	45.00	90.00	2026-04-01 15:03:28.544769	https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800
07df966a-255b-499f-a371-75eee82f9fe3	b9ab0540-f74f-4737-80ca-9fc8e3e4d66c	5528e71d-a62a-4e62-9f2e-c849216069a8	Fresh Carrots	2.00	KG	45.00	90.00	2026-04-01 15:03:41.204312	https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY order_schema.order_status_history (id, order_id, status, notes, changed_by, created_at) FROM stdin;
1f2dfe73-3296-4a33-8f65-fee7bd7b4e8a	9e5724b4-a32d-474b-aa94-79e7486e90cd	PENDING	Order created, awaiting payment	2f09dfc8-271a-4a40-bdf2-f1245a869507	2026-03-25 04:48:38.079492
f3b83629-5fb2-49f9-9d35-242112f7c759	840fa1ec-eab6-4543-908f-8bc3bab2e6e2	PENDING	Order created, awaiting payment	2f09dfc8-271a-4a40-bdf2-f1245a869507	2026-03-25 04:50:21.958427
2e39f041-ac5a-415c-a1bc-863241f13545	840fa1ec-eab6-4543-908f-8bc3bab2e6e2	CONFIRMED	Payment received via Razorpay. Transaction ID: pay_SVKh1j4IWNf88O	2f09dfc8-271a-4a40-bdf2-f1245a869507	2026-03-25 04:50:57.41932
8877d30e-944a-4dfe-881d-0af08074cc4c	b2693344-ea83-4b16-8c52-0520ed5e7951	PENDING	Order created, awaiting payment	2f09dfc8-271a-4a40-bdf2-f1245a869507	2026-03-25 05:49:44.71088
0e44715a-f173-44e5-beed-b55e48436b8c	b2693344-ea83-4b16-8c52-0520ed5e7951	CONFIRMED	Payment received via Razorpay. Transaction ID: pay_SVLhcl0AD3cv37	2f09dfc8-271a-4a40-bdf2-f1245a869507	2026-03-25 05:50:13.896676
7e96bdce-903c-4bd1-94a0-6808fc592069	9e5724b4-a32d-474b-aa94-79e7486e90cd	CANCELLED	Cancelled by user	2f09dfc8-271a-4a40-bdf2-f1245a869507	2026-03-25 05:50:38.596414
40896ed8-14aa-41ca-9524-c52821cea3c3	7f181432-5a08-4a4f-a428-8b4c0f1918a4	PENDING	Order created, awaiting payment	ce9c7726-dc33-4e47-a505-873575deae79	2026-03-25 10:23:09.360112
4f9f9b9c-e905-4820-9211-ea471e0bd77e	7f181432-5a08-4a4f-a428-8b4c0f1918a4	CONFIRMED	Payment received via Razorpay. Transaction ID: pay_SVQMVcd77zl6OZ	ce9c7726-dc33-4e47-a505-873575deae79	2026-03-25 10:23:43.094743
69860eaf-f98b-4d1a-a7c6-c19832e5186e	53c0a982-47fd-459f-9e1f-1845ddc31284	PENDING	Order created, awaiting payment	2f09dfc8-271a-4a40-bdf2-f1245a869507	2026-03-26 04:18:31.340233
c1355a21-bd60-4921-bb10-5ba3bde6d4a1	53c0a982-47fd-459f-9e1f-1845ddc31284	CONFIRMED	Payment received via Razorpay. Transaction ID: pay_SVigpPOGfEIKNN	2f09dfc8-271a-4a40-bdf2-f1245a869507	2026-03-26 04:19:25.360102
9803f74e-110e-486e-b6c4-999d01494adc	45beb19b-62fb-4fb4-9c4e-5038aac8a8ab	PENDING	Order created, awaiting payment	ce9c7726-dc33-4e47-a505-873575deae79	2026-03-26 04:43:28.099113
c52b36a4-75d5-49d3-9eb3-6d3eb2e3f665	45beb19b-62fb-4fb4-9c4e-5038aac8a8ab	CONFIRMED	Payment received via Razorpay. Transaction ID: pay_SVj6hVHv7860YM	ce9c7726-dc33-4e47-a505-873575deae79	2026-03-26 04:43:53.162907
fbe7c8bb-d99d-4466-8305-2e8d170377ee	45beb19b-62fb-4fb4-9c4e-5038aac8a8ab	SHIPPED	Order shipped	ce9c7726-dc33-4e47-a505-873575deae79	2026-03-26 04:44:34.476574
8842fdde-3fed-44f2-bc2b-f8a07988b756	45beb19b-62fb-4fb4-9c4e-5038aac8a8ab	DELIVERED	Order delivered	ce9c7726-dc33-4e47-a505-873575deae79	2026-03-26 04:44:39.374664
450c59f0-cd26-402d-9e40-2898deb454e1	a6fd6cfb-cf30-43c5-bcb1-93c14222899b	PENDING	Order created, awaiting payment	2f09dfc8-271a-4a40-bdf2-f1245a869507	2026-04-01 15:03:22.532028
3ded4210-02d1-4d27-ad7a-56bd1c7af418	7c1c7d5f-4d0b-45dc-91f0-e64b476386da	PENDING	Order created, awaiting payment	2f09dfc8-271a-4a40-bdf2-f1245a869507	2026-04-01 15:03:28.546799
bb163cf7-e164-4645-9088-e3e851ebe224	b9ab0540-f74f-4737-80ca-9fc8e3e4d66c	PENDING	Order created, awaiting payment	2f09dfc8-271a-4a40-bdf2-f1245a869507	2026-04-01 15:03:41.206027
\.


--
-- Data for Name: order_tracking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY order_schema.order_tracking (id, order_id, event_type, title, description, location, latitude, longitude, tracking_number, carrier, carrier_status, estimated_delivery, event_timestamp, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY order_schema.orders (id, order_number, buyer_id, seller_id, listing_id, status, total_amount, currency, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_phone, notes, created_at, updated_at, buyer_email, buyer_name) FROM stdin;
840fa1ec-eab6-4543-908f-8bc3bab2e6e2	ORD202603250450218267	2f09dfc8-271a-4a40-bdf2-f1245a869507	22222222-2222-2222-2222-222222222222	63852cf9-490d-4671-95bc-79d5b1cf8b6a	CONFIRMED	155.50	INR	Hyderabad, Hyderabad	Hyderabad	Telangana	501510	India	6304510431		2026-03-25 04:50:21.938851	2026-03-25 04:50:57.423254	arunteja2385@gmail.com	arunteja2385
b2693344-ea83-4b16-8c52-0520ed5e7951	ORD202603250549434825	2f09dfc8-271a-4a40-bdf2-f1245a869507	22222222-2222-2222-2222-222222222222	4f744832-f084-4579-85eb-4e59c017362e	CONFIRMED	630.00	INR	Hyderabad, Hyderabad	Hyderabad	Telangana	501510	India	6304510431		2026-03-25 05:49:44.695869	2026-03-25 05:50:13.898239	arunteja2385@gmail.com	arunteja2385
9e5724b4-a32d-474b-aa94-79e7486e90cd	ORD202603250448376611	2f09dfc8-271a-4a40-bdf2-f1245a869507	22222222-2222-2222-2222-222222222222	63852cf9-490d-4671-95bc-79d5b1cf8b6a	CANCELLED	155.50	INR	Hyderabad, Hyderabad	Hyderabad	Telangana	501510	India	6304510431		2026-03-25 04:48:38.021621	2026-03-25 05:50:38.598292	arunteja2385@gmail.com	arunteja2385
7f181432-5a08-4a4f-a428-8b4c0f1918a4	ORD202603251023088051	ce9c7726-dc33-4e47-a505-873575deae79	11111111-1111-1111-1111-111111111111	cce6b07c-3b42-4670-92ac-8ce05b78d26b	CONFIRMED	129.25	INR	Hyderabad, Hyderabad	Hyderabad	Telangana	501510	India	6304510431		2026-03-25 10:23:09.245079	2026-03-25 10:23:43.098126	aruncourse2@gmail.com	aruncourse2
53c0a982-47fd-459f-9e1f-1845ddc31284	ORD202603260418186043	2f09dfc8-271a-4a40-bdf2-f1245a869507	22222222-2222-2222-2222-222222222222	63852cf9-490d-4671-95bc-79d5b1cf8b6a	CONFIRMED	155.50	INR	Hyderabad, Hyderabad	Hyderabad	Telangana	501510	India	6304510431		2026-03-26 04:18:31.267199	2026-03-26 04:19:25.36684	arunteja2385@gmail.com	arunteja2385
45beb19b-62fb-4fb4-9c4e-5038aac8a8ab	ORD202603260443276780	ce9c7726-dc33-4e47-a505-873575deae79	ce9c7726-dc33-4e47-a505-873575deae79	f2b0dc27-c703-407c-aba2-f637b748e3fb	DELIVERED	87.25	INR	Hyderabad, Hyderabad	Hyderabad	Telangana	501510	India	6304510431		2026-03-26 04:43:28.083576	2026-03-26 04:44:39.379011	aruncourse2@gmail.com	aruncourse2
a6fd6cfb-cf30-43c5-bcb1-93c14222899b	ORD202604011503199401	2f09dfc8-271a-4a40-bdf2-f1245a869507	22222222-2222-2222-2222-222222222222	5528e71d-a62a-4e62-9f2e-c849216069a8	PENDING	134.50	INR	Hyderabad, Hyderabad	Hyderabad	Telangana	501510	India	6304510431		2026-04-01 15:03:22.463017	2026-04-01 15:03:22.463149	arunteja2385@gmail.com	arunteja2385
7c1c7d5f-4d0b-45dc-91f0-e64b476386da	ORD202604011503284699	2f09dfc8-271a-4a40-bdf2-f1245a869507	22222222-2222-2222-2222-222222222222	5528e71d-a62a-4e62-9f2e-c849216069a8	PENDING	134.50	INR	Hyderabad, Hyderabad	Hyderabad	Telangana	501510	India	6304510431		2026-04-01 15:03:28.543837	2026-04-01 15:03:28.543862	arunteja2385@gmail.com	arunteja2385
b9ab0540-f74f-4737-80ca-9fc8e3e4d66c	ORD202604011503417365	2f09dfc8-271a-4a40-bdf2-f1245a869507	22222222-2222-2222-2222-222222222222	5528e71d-a62a-4e62-9f2e-c849216069a8	PENDING	134.50	INR	Hyderabad, Hyderabad	Hyderabad	Telangana	501510	India	6304510431		2026-04-01 15:03:41.20338	2026-04-01 15:03:41.203403	arunteja2385@gmail.com	arunteja2385
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY order_schema.payments (id, order_id, payment_method, payment_status, amount, currency, transaction_id, payment_gateway, paid_at, created_at, updated_at, razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpay_receipt, failure_reason, refund_id, refund_amount, refunded_at) FROM stdin;
419d2704-5bdb-4ba6-b6df-28f42cc11a25	9e5724b4-a32d-474b-aa94-79e7486e90cd	RAZORPAY	CREATED	155.50	INR	\N	MOCK	\N	2026-03-25 04:48:38.089475	2026-03-25 04:48:38.089523	order_8f84ae3bc45c4d	\N	\N	mock_rcpt_9e5724b4_414117967	\N	\N	\N	\N
dd0e1426-f7d5-48cb-bc00-f8c0cd3962f0	840fa1ec-eab6-4543-908f-8bc3bab2e6e2	RAZORPAY	COMPLETED	155.50	INR	pay_SVKh1j4IWNf88O	RAZORPAY	2026-03-25 04:50:57.342883	2026-03-25 04:50:21.960386	2026-03-25 04:50:57.43713	order_SVKgfq4Bya2CwF	pay_SVKh1j4IWNf88O	a206190df87aee2525b683e05793e43f20e5581c82033e0d28fddcb00382ef83	rcpt_840fa1ec_414221441	\N	\N	\N	\N
f7930c00-3dec-4a9b-896c-6773509930da	b2693344-ea83-4b16-8c52-0520ed5e7951	RAZORPAY	COMPLETED	630.00	INR	pay_SVLhcl0AD3cv37	RAZORPAY	2026-03-25 05:50:13.854628	2026-03-25 05:49:44.714413	2026-03-25 05:50:13.899603	order_SVLhOkjkTzK0Lp	pay_SVLhcl0AD3cv37	2c33db137dead23219344fa0327b7a44372c8d5d37fcfc181fea735cb1f437aa	rcpt_b2693344_417784025	\N	\N	\N	\N
49b993e9-5ad5-4334-a41b-6847f8c09553	7f181432-5a08-4a4f-a428-8b4c0f1918a4	RAZORPAY	COMPLETED	129.25	INR	pay_SVQMVcd77zl6OZ	RAZORPAY	2026-03-25 10:23:43.012693	2026-03-25 10:23:09.480539	2026-03-25 10:23:43.114011	order_SVQMEhfHNQWKQC	pay_SVQMVcd77zl6OZ	34217d08c583682252e04dd5ed9ffe930fe564822719c3701a3d8e7d3d3830f3	rcpt_7f181432_434188308	\N	\N	\N	\N
90fc6f82-c84b-4aa6-88e1-22fb17ace6e9	53c0a982-47fd-459f-9e1f-1845ddc31284	RAZORPAY	COMPLETED	155.50	INR	pay_SVigpPOGfEIKNN	RAZORPAY	2026-03-26 04:19:25.20335	2026-03-26 04:18:31.370667	2026-03-26 04:19:25.38205	order_SVigB5BgdHpW7r	pay_SVigpPOGfEIKNN	fc4e5faef04531fade82f281b2c128abe11e57cc024650386059dcc68f6dc0ba	rcpt_53c0a982_498699144	\N	\N	\N	\N
e68c1e54-089e-4d35-9739-a7f912dca570	45beb19b-62fb-4fb4-9c4e-5038aac8a8ab	RAZORPAY	COMPLETED	87.25	INR	pay_SVj6hVHv7860YM	RAZORPAY	2026-03-26 04:43:53.122666	2026-03-26 04:43:28.105177	2026-03-26 04:43:53.172067	order_SVj6X53yZqLTDM	pay_SVj6hVHv7860YM	96203fa8c4e069a7983f9e2fcf34d1b0fdb4b17f77eccf2b0ab7052b7b48bd31	rcpt_45beb19b_500207140	\N	\N	\N	\N
2bffac9e-0dd8-446d-8134-8301d3d5648a	a6fd6cfb-cf30-43c5-bcb1-93c14222899b	RAZORPAY	CREATED	134.50	INR	\N	MOCK	\N	2026-04-01 15:03:22.538681	2026-04-01 15:03:22.538704	order_4f2d75a46cc043	\N	\N	mock_rcpt_a6fd6cfb_55802432	\N	\N	\N	\N
d30d4a1e-2ac2-4371-88f1-34857c48882d	7c1c7d5f-4d0b-45dc-91f0-e64b476386da	RAZORPAY	CREATED	134.50	INR	\N	MOCK	\N	2026-04-01 15:03:28.548051	2026-04-01 15:03:28.548068	order_0a527fc38faa4b	\N	\N	mock_rcpt_7c1c7d5f_55808539	\N	\N	\N	\N
f4b15b88-a539-4d0d-a6ef-3438cb5454ab	b9ab0540-f74f-4737-80ca-9fc8e3e4d66c	RAZORPAY	CREATED	134.50	INR	\N	MOCK	\N	2026-04-01 15:03:41.207388	2026-04-01 15:03:41.207406	order_710474195af242	\N	\N	mock_rcpt_b9ab0540_55821200	\N	\N	\N	\N
\.


--
-- Name: cart_items cart_items_cart_id_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.cart_items
    ADD CONSTRAINT cart_items_cart_id_listing_id_key UNIQUE (cart_id, listing_id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: carts carts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.carts
    ADD CONSTRAINT carts_user_id_key UNIQUE (user_id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: fraud_cases fraud_cases_case_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.fraud_cases
    ADD CONSTRAINT fraud_cases_case_number_key UNIQUE (case_number);


--
-- Name: fraud_cases fraud_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.fraud_cases
    ADD CONSTRAINT fraud_cases_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: order_tracking order_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.order_tracking
    ADD CONSTRAINT order_tracking_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: cart_items uk5c2xwequ0svy819ealcqf3lbj; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.cart_items
    ADD CONSTRAINT uk5c2xwequ0svy819ealcqf3lbj UNIQUE (cart_id, listing_id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON order_schema.flyway_schema_history USING btree (success);


--
-- Name: idx_cart_item_listing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_item_listing_id ON order_schema.cart_items USING btree (listing_id);


--
-- Name: idx_cart_item_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_item_seller_id ON order_schema.cart_items USING btree (seller_id);


--
-- Name: idx_cart_items_cart_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_items_cart_id ON order_schema.cart_items USING btree (cart_id);


--
-- Name: idx_cart_items_listing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_items_listing_id ON order_schema.cart_items USING btree (listing_id);


--
-- Name: idx_cart_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_user_id ON order_schema.carts USING btree (user_id);


--
-- Name: idx_carts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carts_user_id ON order_schema.carts USING btree (user_id);


--
-- Name: idx_fraud_accused_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fraud_accused_id ON order_schema.fraud_cases USING btree (accused_id);


--
-- Name: idx_fraud_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fraud_created_at ON order_schema.fraud_cases USING btree (created_at);


--
-- Name: idx_fraud_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fraud_order_id ON order_schema.fraud_cases USING btree (order_id);


--
-- Name: idx_fraud_reporter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fraud_reporter_id ON order_schema.fraud_cases USING btree (reporter_id);


--
-- Name: idx_fraud_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fraud_status ON order_schema.fraud_cases USING btree (status);


--
-- Name: idx_order_buyer_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_buyer_email ON order_schema.orders USING btree (buyer_email);


--
-- Name: idx_order_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_buyer_id ON order_schema.orders USING btree (buyer_id);


--
-- Name: idx_order_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_created_at ON order_schema.orders USING btree (created_at);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_order ON order_schema.order_items USING btree (order_id);


--
-- Name: idx_order_seller_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_seller_date ON order_schema.orders USING btree (seller_id, created_at);


--
-- Name: idx_order_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_seller_id ON order_schema.orders USING btree (seller_id);


--
-- Name: idx_order_seller_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_seller_status ON order_schema.orders USING btree (seller_id, status);


--
-- Name: idx_order_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_status ON order_schema.orders USING btree (status);


--
-- Name: idx_order_tracking_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_tracking_created_at ON order_schema.order_tracking USING btree (created_at DESC);


--
-- Name: idx_order_tracking_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_tracking_event_type ON order_schema.order_tracking USING btree (event_type);


--
-- Name: idx_order_tracking_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_tracking_order_id ON order_schema.order_tracking USING btree (order_id);


--
-- Name: idx_order_tracking_tracking_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_tracking_tracking_number ON order_schema.order_tracking USING btree (tracking_number);


--
-- Name: idx_orders_buyer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_buyer ON order_schema.orders USING btree (buyer_id);


--
-- Name: idx_orders_buyer_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_buyer_created ON order_schema.orders USING btree (buyer_id, created_at DESC);


--
-- Name: idx_orders_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_number ON order_schema.orders USING btree (order_number);


--
-- Name: idx_orders_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_seller ON order_schema.orders USING btree (seller_id);


--
-- Name: idx_orders_seller_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_seller_created ON order_schema.orders USING btree (seller_id, created_at DESC);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON order_schema.orders USING btree (status);


--
-- Name: idx_payments_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_order ON order_schema.payments USING btree (order_id);


--
-- Name: idx_payments_razorpay_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_razorpay_order_id ON order_schema.payments USING btree (razorpay_order_id);


--
-- Name: idx_payments_razorpay_payment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_razorpay_payment_id ON order_schema.payments USING btree (razorpay_payment_id);


--
-- Name: idx_status_history_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_status_history_order ON order_schema.order_status_history USING btree (order_id);


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES order_schema.carts(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES order_schema.orders(id) ON DELETE CASCADE;


--
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES order_schema.orders(id) ON DELETE CASCADE;


--
-- Name: order_tracking order_tracking_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.order_tracking
    ADD CONSTRAINT order_tracking_order_id_fkey FOREIGN KEY (order_id) REFERENCES order_schema.orders(id) ON DELETE CASCADE;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY order_schema.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES order_schema.orders(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict b86ANPF4jA5huShjyiLrWsPZugNpz7OBsYW298b8guc5ZURyOUtchxapghFSWhs

