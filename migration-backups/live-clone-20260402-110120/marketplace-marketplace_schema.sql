--
-- PostgreSQL database dump
--

\restrict 9JzuxlgAloLokzppKkMnmt5sgAM8dfmH3VqyHA9B8oJU12HDvk3Zc9Buf3XX43p

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
-- Name: marketplace_schema; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA marketplace_schema;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.addresses (
    id uuid NOT NULL,
    address_line1 character varying(255) NOT NULL,
    address_line2 character varying(255),
    address_type character varying(255),
    city character varying(255) NOT NULL,
    country character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    delivery_instructions character varying(255),
    full_name character varying(255) NOT NULL,
    is_default boolean,
    latitude double precision,
    longitude double precision,
    phone_number character varying(255) NOT NULL,
    postal_code character varying(255) NOT NULL,
    state character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    user_id uuid NOT NULL,
    CONSTRAINT addresses_address_type_check CHECK (((address_type)::text = ANY ((ARRAY['SHIPPING'::character varying, 'BILLING'::character varying, 'BOTH'::character varying])::text[])))
);


--
-- Name: cart_items; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.cart_items (
    id uuid NOT NULL,
    available_quantity integer,
    created_at timestamp(6) without time zone,
    listing_id uuid NOT NULL,
    listing_image_url character varying(255),
    listing_title character varying(255) NOT NULL,
    quantity integer NOT NULL,
    seller_id uuid NOT NULL,
    unit character varying(20),
    unit_price numeric(12,2) NOT NULL,
    updated_at timestamp(6) without time zone,
    cart_id uuid NOT NULL
);


--
-- Name: carts; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.carts (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    user_id uuid NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    parent_id uuid,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: crop_plans; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.crop_plans (
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
-- Name: customers; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.customers (
    id uuid NOT NULL,
    age integer,
    city character varying(100),
    country character varying(100),
    created_at timestamp(6) without time zone NOT NULL,
    name character varying(100),
    phone character varying(20),
    profile_photo character varying(500),
    state character varying(100),
    status character varying(20) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id uuid NOT NULL,
    username character varying(50),
    CONSTRAINT customers_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);


--
-- Name: farmers; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.farmers (
    id uuid NOT NULL,
    age integer,
    approved_at timestamp(6) without time zone,
    approved_by uuid,
    certificates text,
    city character varying(100),
    country character varying(100),
    created_at timestamp(6) without time zone NOT NULL,
    crop_types text,
    farm_bio text,
    farm_name character varying(200),
    farm_photo character varying(500),
    name character varying(100),
    phone character varying(20),
    profile_photo character varying(500),
    rejection_reason text,
    state character varying(100),
    status character varying(20) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id uuid NOT NULL,
    username character varying(50),
    CONSTRAINT farmers_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);


--
-- Name: farms; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.farms (
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
-- Name: fields; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.fields (
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
-- Name: flyway_schema_history; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.flyway_schema_history (
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
-- Name: followed_farmers; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.followed_farmers (
    id uuid NOT NULL,
    farmer_id uuid NOT NULL,
    followed_at timestamp(6) without time zone NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: kyc_documents; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.kyc_documents (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    document_number character varying(100),
    document_type character varying(50) NOT NULL,
    document_url character varying(500),
    rejection_reason text,
    status character varying(20) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    verified_at timestamp(6) without time zone,
    verified_by uuid,
    user_id uuid NOT NULL,
    CONSTRAINT kyc_documents_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);


--
-- Name: listing_images; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.listing_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    listing_id uuid,
    image_url character varying(500) NOT NULL,
    is_primary boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: listing_price_update_proposals; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.listing_price_update_proposals (
    id uuid NOT NULL,
    listing_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    product_name character varying(255) NOT NULL,
    matched_commodity character varying(120),
    current_price numeric(12,2) NOT NULL,
    suggested_price numeric(12,2) NOT NULL,
    currency character varying(3) NOT NULL,
    market_source character varying(120),
    market_name character varying(255),
    confidence_score integer,
    reason character varying(500),
    status character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone,
    responded_at timestamp without time zone
);


--
-- Name: listings; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.listings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    seller_id uuid NOT NULL,
    farm_id uuid,
    category_id uuid,
    title character varying(255) NOT NULL,
    description text,
    crop_type character varying(100),
    quantity numeric(12,2),
    quantity_unit character varying(20),
    price_per_unit numeric(12,2),
    currency character varying(3) DEFAULT 'INR'::character varying,
    minimum_order numeric(12,2),
    harvest_date date,
    expiry_date date,
    location character varying(500),
    latitude numeric(10,8),
    longitude numeric(11,8),
    organic_certified boolean DEFAULT false,
    quality_grade character varying(20),
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    view_count integer DEFAULT 0,
    average_rating numeric(3,2) DEFAULT 0,
    review_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    suspension_reason text
);


--
-- Name: managers; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.managers (
    id uuid NOT NULL,
    age integer,
    approved_at timestamp(6) without time zone,
    approved_by uuid,
    city character varying(100),
    country character varying(100),
    created_at timestamp(6) without time zone NOT NULL,
    name character varying(100),
    phone character varying(20),
    profile_photo character varying(500),
    rejection_reason text,
    state character varying(100),
    status character varying(20) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id uuid NOT NULL,
    username character varying(50),
    CONSTRAINT managers_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);


--
-- Name: order_items; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.order_items (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    listing_id uuid NOT NULL,
    product_name character varying(255) NOT NULL,
    quantity numeric(12,2) NOT NULL,
    quantity_unit character varying(20),
    subtotal numeric(14,2) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    order_id uuid NOT NULL
);


--
-- Name: order_status_history; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.order_status_history (
    id uuid NOT NULL,
    changed_by uuid,
    created_at timestamp(6) without time zone,
    notes text,
    status character varying(30) NOT NULL,
    order_id uuid NOT NULL,
    CONSTRAINT order_status_history_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying, 'PROCESSING'::character varying, 'SHIPPED'::character varying, 'DELIVERED'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'REFUNDED'::character varying])::text[])))
);


--
-- Name: order_tracking; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.order_tracking (
    id uuid NOT NULL,
    carrier character varying(255),
    carrier_status character varying(255),
    created_at timestamp(6) without time zone,
    description text,
    estimated_delivery timestamp(6) without time zone,
    event_timestamp timestamp(6) without time zone,
    event_type character varying(50) NOT NULL,
    latitude double precision,
    location character varying(255),
    longitude double precision,
    title character varying(255) NOT NULL,
    tracking_number character varying(255),
    order_id uuid NOT NULL,
    CONSTRAINT order_tracking_event_type_check CHECK (((event_type)::text = ANY ((ARRAY['ORDER_PLACED'::character varying, 'ORDER_CONFIRMED'::character varying, 'PAYMENT_RECEIVED'::character varying, 'PREPARING'::character varying, 'PACKED'::character varying, 'READY_FOR_PICKUP'::character varying, 'PICKED_UP'::character varying, 'IN_TRANSIT'::character varying, 'OUT_FOR_DELIVERY'::character varying, 'DELIVERY_ATTEMPTED'::character varying, 'DELIVERED'::character varying, 'RETURNED'::character varying, 'CANCELLED'::character varying, 'REFUND_INITIATED'::character varying, 'REFUND_COMPLETED'::character varying])::text[])))
);


--
-- Name: orders; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.orders (
    id uuid NOT NULL,
    buyer_email character varying(255),
    buyer_id uuid NOT NULL,
    buyer_name character varying(255),
    created_at timestamp(6) without time zone,
    currency character varying(3),
    listing_id uuid NOT NULL,
    notes text,
    order_number character varying(50) NOT NULL,
    seller_id uuid NOT NULL,
    shipping_address text,
    shipping_city character varying(100),
    shipping_country character varying(100),
    shipping_phone character varying(20),
    shipping_postal_code character varying(20),
    shipping_state character varying(100),
    status character varying(30),
    total_amount numeric(14,2) NOT NULL,
    updated_at timestamp(6) without time zone,
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying, 'PROCESSING'::character varying, 'SHIPPED'::character varying, 'DELIVERED'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'REFUNDED'::character varying])::text[])))
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.password_reset_tokens (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    token character varying(255) NOT NULL,
    used boolean NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.payments (
    id uuid NOT NULL,
    amount numeric(14,2) NOT NULL,
    created_at timestamp(6) without time zone,
    currency character varying(3),
    failure_reason character varying(500),
    paid_at timestamp(6) without time zone,
    payment_gateway character varying(50),
    payment_method character varying(50) NOT NULL,
    payment_status character varying(30),
    razorpay_order_id character varying(100),
    razorpay_payment_id character varying(100),
    razorpay_receipt character varying(100),
    razorpay_signature character varying(200),
    refund_amount numeric(14,2),
    refund_id character varying(100),
    refunded_at timestamp(6) without time zone,
    transaction_id character varying(100),
    updated_at timestamp(6) without time zone,
    order_id uuid NOT NULL,
    CONSTRAINT payments_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['PENDING'::character varying, 'PROCESSING'::character varying, 'CREATED'::character varying, 'AUTHORIZED'::character varying, 'CAPTURED'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'REFUND_PENDING'::character varying, 'REFUNDED'::character varying, 'CANCELLED'::character varying])::text[])))
);


--
-- Name: reviews; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    listing_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    order_id uuid,
    title character varying(255),
    is_verified_purchase boolean DEFAULT false,
    helpful_count integer DEFAULT 0,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: roles; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.roles (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description character varying(255),
    name character varying(50) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: saved_listings; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.saved_listings (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    user_id uuid NOT NULL,
    listing_id uuid NOT NULL
);


--
-- Name: seller_ratings; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.seller_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid NOT NULL,
    total_reviews integer DEFAULT 0,
    average_rating numeric(3,2) DEFAULT 0,
    five_star_count integer DEFAULT 0,
    four_star_count integer DEFAULT 0,
    three_star_count integer DEFAULT 0,
    two_star_count integer DEFAULT 0,
    one_star_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_profiles; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.user_profiles (
    id uuid NOT NULL,
    address text,
    bio text,
    city character varying(100),
    country character varying(100),
    created_at timestamp(6) without time zone NOT NULL,
    date_of_birth date,
    first_name character varying(100),
    last_name character varying(100),
    postal_code character varying(20),
    profile_picture_url character varying(500),
    state character varying(100),
    updated_at timestamp(6) without time zone NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.users (
    id uuid NOT NULL,
    account_non_expired boolean NOT NULL,
    account_non_locked boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    credentials_non_expired boolean NOT NULL,
    email character varying(255) NOT NULL,
    enabled boolean NOT NULL,
    password character varying(255) NOT NULL,
    phone character varying(20),
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: wishlists; Type: TABLE; Schema: marketplace_schema; Owner: -
--

CREATE TABLE marketplace_schema.wishlists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.addresses (id, address_line1, address_line2, address_type, city, country, created_at, delivery_instructions, full_name, is_default, latitude, longitude, phone_number, postal_code, state, updated_at, user_id) FROM stdin;
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.cart_items (id, available_quantity, created_at, listing_id, listing_image_url, listing_title, quantity, seller_id, unit, unit_price, updated_at, cart_id) FROM stdin;
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.carts (id, created_at, updated_at, user_id) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.categories (id, name, description, parent_id, active, created_at, updated_at) FROM stdin;
eeee0001-eeee-0001-eeee-000000000001	Vegetables	Fresh vegetables directly from farms	\N	t	2026-02-01 12:38:16.908924	2026-02-01 12:38:16.908924
eeee0002-eeee-0002-eeee-000000000002	Fruits	Fresh and seasonal fruits	\N	t	2026-02-01 12:38:16.908924	2026-02-01 12:38:16.908924
eeee0003-eeee-0003-eeee-000000000003	Grains & Cereals	Rice, wheat, millets and other grains	\N	t	2026-02-01 12:38:16.908924	2026-02-01 12:38:16.908924
eeee0004-eeee-0004-eeee-000000000004	Pulses & Legumes	Lentils, beans, and other pulses	\N	t	2026-02-01 12:38:16.908924	2026-02-01 12:38:16.908924
eeee0005-eeee-0005-eeee-000000000005	Spices	Fresh and dried spices	\N	t	2026-02-01 12:38:16.908924	2026-02-01 12:38:16.908924
eeee0006-eeee-0006-eeee-000000000006	Dairy Products	Milk, cheese, butter and more	\N	t	2026-02-01 12:38:16.908924	2026-02-01 12:38:16.908924
eeee0007-eeee-0007-eeee-000000000007	Organic Products	Certified organic produce	\N	t	2026-02-01 12:38:16.908924	2026-02-01 12:38:16.908924
eeee0008-eeee-0008-eeee-000000000008	Seeds & Saplings	Seeds and plant saplings for farming	\N	t	2026-02-01 12:38:16.908924	2026-02-01 12:38:16.908924
\.


--
-- Data for Name: crop_plans; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.crop_plans (id, actual_harvest_date, actual_yield, created_at, crop_name, expected_harvest_date, expected_yield, notes, planting_date, status, updated_at, variety, yield_unit, field_id) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.customers (id, age, city, country, created_at, name, phone, profile_photo, state, status, updated_at, user_id, username) FROM stdin;
76486f0f-2281-4cc6-8aa5-94b2adda0c10	\N	\N	\N	2026-02-01 18:29:46.182449	\N	\N	\N	\N	APPROVED	2026-02-01 18:29:46.182994	0e3a72ef-6162-495f-b9ca-6a18cf390302	\N
\.


--
-- Data for Name: farmers; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.farmers (id, age, approved_at, approved_by, certificates, city, country, created_at, crop_types, farm_bio, farm_name, farm_photo, name, phone, profile_photo, rejection_reason, state, status, updated_at, user_id, username) FROM stdin;
\.


--
-- Data for Name: farms; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.farms (id, active, area_unit, created_at, description, farmer_id, latitude, location, longitude, name, total_area, updated_at) FROM stdin;
\.


--
-- Data for Name: fields; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.fields (id, active, area, area_unit, created_at, irrigation_type, name, polygon, soil_type, updated_at, farm_id) FROM stdin;
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	<< Flyway Baseline >>	BASELINE	<< Flyway Baseline >>	\N	neondb_owner	2026-02-01 12:43:18.661101	0	t
2	2	add wishlist table	SQL	V2__add_wishlist_table.sql	-1867193774	neondb_owner	2026-02-01 12:43:24.057124	2728	t
3	3	add reviews table	SQL	V3__add_reviews_table.sql	-1311475367	neondb_owner	2026-02-01 12:58:32.558523	4407	t
4	4	add listing search indexes	SQL	V4__add_listing_search_indexes.sql	-1789329535	neondb_owner	2026-03-25 10:04:30.555302	2400	t
5	5	add listing price update proposals	SQL	V5__add_listing_price_update_proposals.sql	-1269530555	neondb_owner	2026-04-02 03:16:15.970841	2729	t
\.


--
-- Data for Name: followed_farmers; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.followed_farmers (id, farmer_id, followed_at, user_id) FROM stdin;
\.


--
-- Data for Name: kyc_documents; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.kyc_documents (id, created_at, document_number, document_type, document_url, rejection_reason, status, updated_at, verified_at, verified_by, user_id) FROM stdin;
\.


--
-- Data for Name: listing_images; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.listing_images (id, listing_id, image_url, is_primary, sort_order, created_at) FROM stdin;
59d1b518-12e6-477c-b8e2-377c84d28c75	ffff0001-ffff-0001-ffff-000000000001	https://images.unsplash.com/photo-1546470427-227c8e4d8a1d?w=400	t	0	2026-02-01 12:38:17.442496
192df20b-8808-4359-aa5f-419d177da476	ffff0002-ffff-0002-ffff-000000000002	https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400	t	0	2026-02-01 12:38:17.442496
5196e11c-388d-46e2-9dcc-bebfcd2b4b8f	ffff0003-ffff-0003-ffff-000000000003	https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400	t	0	2026-02-01 12:38:17.442496
9864ce88-cfc7-4981-9307-86f1a50a4d9e	ffff0004-ffff-0004-ffff-000000000004	https://images.unsplash.com/photo-1518977676601-b53f82ber8a?w=400	t	0	2026-02-01 12:38:17.442496
c6d20e22-7109-4585-a1a2-973971ef131b	ffff0005-ffff-0005-ffff-000000000005	https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400	t	0	2026-02-01 12:38:17.442496
370ce86d-6394-443e-8a95-5bd6b30b907a	ffff0006-ffff-0006-ffff-000000000006	https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400	t	0	2026-02-01 12:38:17.442496
b2d0c18a-e845-455c-84c3-299c58616d53	ffff0007-ffff-0007-ffff-000000000007	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
c59c1891-bc09-4472-ae88-ba0960cb1480	ffff0008-ffff-0008-ffff-000000000008	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
f4153422-2532-4936-b33a-32a20a688d88	ffff0016-ffff-0016-ffff-000000000016	https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400	t	0	2026-02-01 12:38:17.442496
1ba3ba46-8a03-46e9-8bf0-e2d431ad8fd0	ffff0017-ffff-0017-ffff-000000000017	https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400	t	0	2026-02-01 12:38:17.442496
85220fa1-60cf-4a39-9bc9-d98cea921df6	ffff0018-ffff-0018-ffff-000000000018	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
db3e259a-f374-4226-867e-842141e5a8c9	ffff0028-ffff-0028-ffff-000000000028	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
bc3bc0c7-9c1e-4a22-b31c-08d3c704c242	ffff0029-ffff-0029-ffff-000000000029	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
b744fd33-e519-4076-a525-8320c43c7d05	ffff0041-ffff-0041-ffff-000000000041	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
93cf09b2-22e6-4d36-83e7-d73ca5937ad6	ffff0042-ffff-0042-ffff-000000000042	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
75b17a72-32ea-480f-9cd5-4c794da20597	ffff0043-ffff-0043-ffff-000000000043	https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400	t	0	2026-02-01 12:38:17.442496
d6929aa7-b0fd-4e3e-b11d-a1036d9d6086	ffff0044-ffff-0044-ffff-000000000044	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
5d565ca0-dead-4679-babe-9e08ef1b643a	ffff0045-ffff-0045-ffff-000000000045	https://images.unsplash.com/photo-1631898039984-fd5f61fe8730?w=400	t	0	2026-02-01 12:38:17.442496
21ec9941-3143-4af9-a5ad-d44e2552db2c	ffff0051-ffff-0051-ffff-000000000051	https://images.unsplash.com/photo-1553279768-865429fa0078?w=400	t	0	2026-02-01 12:38:17.442496
24ba9fdc-231e-4631-af20-1bb97babd630	ffff0052-ffff-0052-ffff-000000000052	https://images.unsplash.com/photo-1553279768-865429fa0078?w=400	t	0	2026-02-01 12:38:17.442496
835f0f6d-e746-42f6-bb63-5b45b1228e98	ffff0053-ffff-0053-ffff-000000000053	https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400	t	0	2026-02-01 12:38:17.442496
b3d07a68-6fa5-4644-befd-1b6a3c2721fd	ffff0054-ffff-0054-ffff-000000000054	https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400	t	0	2026-02-01 12:38:17.442496
83fdd870-5bf4-40c0-adea-16cbc1632efc	ffff0055-ffff-0055-ffff-000000000055	https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400	t	0	2026-02-01 12:38:17.442496
92d57721-304a-4c4a-a709-5a54a36d4886	ffff0056-ffff-0056-ffff-000000000056	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
6eaadb54-4bf6-45fb-bb72-020af5ca0c83	ffff0057-ffff-0057-ffff-000000000057	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
dafa833a-d58d-4228-bcda-ddfd29882a81	ffff0058-ffff-0058-ffff-000000000058	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
d6027712-d80d-4735-a69a-af39c81b8a03	ffff0071-ffff-0071-ffff-000000000071	https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400	t	0	2026-02-01 12:38:17.442496
d24a0a2c-3635-4f77-bb7c-7224f7921948	ffff0072-ffff-0072-ffff-000000000072	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
3329fbe7-bda0-4f7c-add5-cac99a645cef	ffff0073-ffff-0073-ffff-000000000073	https://images.unsplash.com/photo-1599909533402-72d7a8208e8a?w=400	t	0	2026-02-01 12:38:17.442496
a5341b47-3c9a-4d41-872e-c87050f4d6b7	ffff0074-ffff-0074-ffff-000000000074	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
f472331f-d19a-4e7f-afb1-c67331d3fc16	ffff0075-ffff-0075-ffff-000000000075	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400	t	0	2026-02-01 12:38:17.442496
a566025c-1b0a-4d15-916a-d65987377214	ffff0076-ffff-0076-ffff-000000000076	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
32dff694-7c27-4fa2-81e3-95d7cb158e32	ffff0091-ffff-0091-ffff-000000000091	https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400	t	0	2026-02-01 12:38:17.442496
a49f6fd7-43df-4a75-b6ff-6d568b27657d	ffff0092-ffff-0092-ffff-000000000092	https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400	t	0	2026-02-01 12:38:17.442496
ab2d9fbf-fea6-4bb7-a480-a13646006f00	ffff0093-ffff-0093-ffff-000000000093	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
46dfce24-2f91-4718-9e45-da82174e92c5	ffff0098-ffff-0098-ffff-000000000098	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
52b707bc-c975-41e5-9b39-ff1568cd1627	ffff0099-ffff-0099-ffff-000000000099	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
5579d4f6-a3af-4579-9ae7-ec7542f3bb77	ffff0100-ffff-0100-ffff-000000000100	https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400	t	0	2026-02-01 12:38:17.442496
\.


--
-- Data for Name: listing_price_update_proposals; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.listing_price_update_proposals (id, listing_id, seller_id, product_name, matched_commodity, current_price, suggested_price, currency, market_source, market_name, confidence_score, reason, status, created_at, updated_at, expires_at, responded_at) FROM stdin;
\.


--
-- Data for Name: listings; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.listings (id, seller_id, farm_id, category_id, title, description, crop_type, quantity, quantity_unit, price_per_unit, currency, minimum_order, harvest_date, expiry_date, location, latitude, longitude, organic_certified, quality_grade, status, view_count, average_rating, review_count, created_at, updated_at, suspension_reason) FROM stdin;
ffff0004-ffff-0004-ffff-000000000004	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0001-eeee-0001-eeee-000000000001	Organic Potatoes	Farm-fresh potatoes, perfect for curries, fries, and baking.	Potato	1000.00	KG	25.00	INR	10.00	2026-01-10	2026-02-28	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A	ACTIVE	234	4.40	22	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0005-ffff-0005-ffff-000000000005	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0001-eeee-0001-eeee-000000000001	Fresh Onions	Quality red onions with strong flavor. Essential for every kitchen.	Onion	800.00	KG	30.00	INR	5.00	2026-01-12	2026-03-15	Lucknow, Uttar Pradesh	26.84670000	80.94620000	f	A	ACTIVE	312	4.20	28	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0006-ffff-0006-ffff-000000000006	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0001-eeee-0001-eeee-000000000001	Organic Carrots	Sweet and crunchy organic carrots. Great for salads, juices, and cooking.	Carrot	300.00	KG	40.00	INR	2.00	2026-01-16	2026-02-10	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A	ACTIVE	178	4.60	14	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0007-ffff-0007-ffff-000000000007	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0001-eeee-0001-eeee-000000000001	Fresh Cauliflower	White, compact cauliflower heads. Perfect for gobi dishes.	Cauliflower	250.00	KG	35.00	INR	2.00	2026-01-17	2026-01-31	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A	ACTIVE	145	4.35	11	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0016-ffff-0016-ffff-000000000016	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0003-eeee-0003-eeee-000000000003	Premium Basmati Rice	Long-grain aromatic basmati rice. Aged for 2 years for best flavor.	Rice	2000.00	KG	120.00	INR	25.00	2025-11-15	2026-11-15	Lucknow, Uttar Pradesh	26.84670000	80.94620000	f	A+	ACTIVE	456	4.80	42	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0017-ffff-0017-ffff-000000000017	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0003-eeee-0003-eeee-000000000003	Organic Wheat Flour (Atta)	Stone-ground whole wheat flour from organic wheat.	Wheat	1500.00	KG	45.00	INR	10.00	2025-12-01	2026-06-01	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A	ACTIVE	389	4.55	35	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0018-ffff-0018-ffff-000000000018	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0003-eeee-0003-eeee-000000000003	Pearl Millet (Bajra)	Nutritious bajra grains. Excellent for rotis and porridge.	Millet	500.00	KG	55.00	INR	5.00	2025-11-20	2026-05-20	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A	ACTIVE	167	4.30	13	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0028-ffff-0028-ffff-000000000028	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0004-eeee-0004-eeee-000000000004	Toor Dal (Arhar)	Premium quality toor dal. Essential for sambar and dal fry.	Toor Dal	500.00	KG	140.00	INR	5.00	2025-11-01	2026-05-01	Lucknow, Uttar Pradesh	26.84670000	80.94620000	f	A	ACTIVE	345	4.55	32	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0029-ffff-0029-ffff-000000000029	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0004-eeee-0004-eeee-000000000004	Moong Dal (Yellow)	Easy to digest yellow moong dal. Perfect for khichdi and dal.	Moong Dal	400.00	KG	130.00	INR	5.00	2025-11-05	2026-05-05	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A	ACTIVE	289	4.60	26	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0041-ffff-0041-ffff-000000000041	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0007-eeee-0007-eeee-000000000007	Organic Jaggery (Gur)	Traditional unrefined jaggery. Natural sweetener with minerals.	Jaggery	200.00	KG	80.00	INR	1.00	2025-12-15	2026-12-15	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A+	ACTIVE	189	4.70	16	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0042-ffff-0042-ffff-000000000042	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0007-eeee-0007-eeee-000000000007	Cold Pressed Mustard Oil	Pure cold-pressed mustard oil. Traditional extraction method.	Mustard Oil	100.00	LITRE	220.00	INR	1.00	2025-12-20	2026-06-20	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A+	ACTIVE	345	4.80	31	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0043-ffff-0043-ffff-000000000043	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0007-eeee-0007-eeee-000000000007	Organic Honey	Raw, unprocessed honey from forest flowers. Rich in antioxidants.	Honey	50.00	KG	450.00	INR	0.50	2025-11-01	2027-11-01	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A+	ACTIVE	412	4.90	38	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0044-ffff-0044-ffff-000000000044	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0007-eeee-0007-eeee-000000000007	Organic Turmeric Powder	High curcumin organic turmeric. Ground fresh from our farm.	Turmeric	80.00	KG	280.00	INR	0.25	2025-12-10	2026-12-10	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A+	ACTIVE	289	4.75	26	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0045-ffff-0045-ffff-000000000045	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0007-eeee-0007-eeee-000000000007	Organic Ghee (Desi)	Pure A2 cow ghee made using traditional bilona method.	Ghee	30.00	KG	1500.00	INR	0.50	2026-01-01	2026-07-01	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A+	ACTIVE	523	4.95	48	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0053-ffff-0053-ffff-000000000053	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0002-eeee-0002-eeee-000000000002	Fresh Pomegranate	Ruby red pomegranates. Sweet and juicy with high antioxidants.	Pomegranate	300.00	KG	180.00	INR	2.00	2026-01-10	2026-02-28	Pune, Maharashtra	18.52040000	73.85670000	t	A+	ACTIVE	423	4.75	38	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0054-ffff-0054-ffff-000000000054	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0002-eeee-0002-eeee-000000000002	Organic Bananas	Fresh organic bananas. Naturally ripened, chemical-free.	Banana	800.00	KG	45.00	INR	5.00	2026-01-15	2026-01-30	Pune, Maharashtra	18.52040000	73.85670000	t	A	ACTIVE	356	4.60	32	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0055-ffff-0055-ffff-000000000055	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0002-eeee-0002-eeee-000000000002	Fresh Grapes (Thompson)	Sweet seedless Thompson grapes. Perfect for eating and juice.	Grapes	400.00	KG	120.00	INR	2.00	2026-01-12	2026-02-15	Pune, Maharashtra	18.52040000	73.85670000	t	A	ACTIVE	289	4.55	26	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0056-ffff-0056-ffff-000000000056	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0002-eeee-0002-eeee-000000000002	Fresh Strawberries	Sweet organic strawberries. Freshly picked from our farm.	Strawberry	100.00	KG	350.00	INR	0.50	2026-01-18	2026-01-28	Pune, Maharashtra	18.52040000	73.85670000	t	A+	ACTIVE	445	4.85	40	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0057-ffff-0057-ffff-000000000057	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0002-eeee-0002-eeee-000000000002	Dragon Fruit	Exotic pink dragon fruit. Mildly sweet with unique texture.	Dragon Fruit	80.00	KG	280.00	INR	0.50	2026-01-19	2026-02-05	Pune, Maharashtra	18.52040000	73.85670000	t	A+	ACTIVE	312	4.65	28	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0058-ffff-0058-ffff-000000000058	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0002-eeee-0002-eeee-000000000002	Fresh Avocado	Creamy Hass avocados. Perfect for guacamole and salads.	Avocado	50.00	KG	400.00	INR	0.50	2026-01-17	2026-02-01	Pune, Maharashtra	18.52040000	73.85670000	t	A+	ACTIVE	289	4.75	26	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0071-ffff-0071-ffff-000000000071	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0005-eeee-0005-eeee-000000000005	Red Chilli Powder	Premium red chilli powder. Perfect heat and color for curries.	Red Chilli	100.00	KG	350.00	INR	0.25	2025-12-01	2026-12-01	Pune, Maharashtra	18.52040000	73.85670000	t	A	ACTIVE	457	4.65	42	2026-02-01 12:38:17.175446	2026-02-01 22:30:03.028295	\N
ffff0002-ffff-0002-ffff-000000000002	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0001-eeee-0001-eeee-000000000001	Green Capsicum (Bell Pepper)	Crisp and fresh green bell peppers. Rich in vitamins.	Capsicum	200.00	KG	80.00	INR	2.00	2026-01-14	2026-01-28	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A	ACTIVE	98	5.00	1	2026-02-01 12:38:17.175446	2026-02-01 22:45:29.476019	\N
ffff0052-ffff-0052-ffff-000000000052	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0002-eeee-0002-eeee-000000000002	Kesar Mangoes	Sweet and aromatic Kesar mangoes from Gujarat.	Mango	400.00	KG	450.00	INR	5.00	2026-04-20	2026-07-15	Pune, Maharashtra	18.52040000	73.85670000	t	A	ACTIVE	536	4.80	48	2026-02-01 12:38:17.175446	2026-02-01 22:40:26.360081	\N
ffff0051-ffff-0051-ffff-000000000051	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0002-eeee-0002-eeee-000000000002	Alphonso Mangoes	Premium Ratnagiri Alphonso mangoes. King of fruits with rich aroma.	Mango	500.00	KG	600.00	INR	5.00	2026-04-15	2026-06-30	Pune, Maharashtra	18.52040000	73.85670000	t	A+	ACTIVE	688	4.90	62	2026-02-01 12:38:17.175446	2026-02-11 09:58:20.533721	\N
ffff0008-ffff-0008-ffff-000000000008	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0001-eeee-0001-eeee-000000000001	Green Peas (Matar)	Sweet and tender green peas, freshly shelled.	Peas	180.00	KG	90.00	INR	1.00	2026-01-15	2026-01-28	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A+	ACTIVE	203	4.75	18	2026-02-01 12:38:17.175446	2026-02-02 16:51:06.115215	\N
ffff0072-ffff-0072-ffff-000000000072	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0005-eeee-0005-eeee-000000000005	Kashmiri Red Chilli	Mild Kashmiri chilli for rich color without heat.	Kashmiri Chilli	50.00	KG	550.00	INR	0.25	2025-11-15	2026-11-15	Pune, Maharashtra	18.52040000	73.85670000	t	A+	ACTIVE	389	4.80	35	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0074-ffff-0074-ffff-000000000074	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0005-eeee-0005-eeee-000000000005	Black Pepper (Kali Mirch)	Premium Malabar black pepper. Strong aroma and flavor.	Black Pepper	50.00	KG	750.00	INR	0.25	2025-11-20	2026-11-20	Pune, Maharashtra	18.52040000	73.85670000	t	A+	ACTIVE	412	4.85	38	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0092-ffff-0092-ffff-000000000092	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0006-eeee-0006-eeee-000000000006	Fresh Paneer	Homemade fresh paneer from A2 milk. Soft and creamy.	Paneer	30.00	KG	400.00	INR	0.25	2026-01-19	2026-01-26	Pune, Maharashtra	18.52040000	73.85670000	t	A	ACTIVE	312	4.65	28	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0098-ffff-0098-ffff-000000000098	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0008-eeee-0008-eeee-000000000008	Mango Saplings (Alphonso)	Grafted Alphonso mango saplings. Start bearing fruit in 3-4 years.	Mango Sapling	500.00	PIECE	350.00	INR	5.00	2025-08-01	2026-08-01	Pune, Maharashtra	18.52040000	73.85670000	t	A+	ACTIVE	312	4.70	28	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0099-ffff-0099-ffff-000000000099	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0008-eeee-0008-eeee-000000000008	Tomato Seeds (Hybrid)	High-yield hybrid tomato seeds. Disease resistant variety.	Tomato Seeds	10.00	KG	2500.00	INR	0.10	2025-10-01	2026-10-01	Pune, Maharashtra	18.52040000	73.85670000	f	A	ACTIVE	234	4.50	21	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0100-ffff-0100-ffff-000000000100	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0008-eeee-0008-eeee-000000000008	Coconut Saplings	Hybrid coconut palm saplings. Drought resistant and high yield.	Coconut Sapling	200.00	PIECE	250.00	INR	5.00	2025-07-01	2026-07-01	Pune, Maharashtra	18.52040000	73.85670000	t	A	ACTIVE	156	4.40	13	2026-02-01 12:38:17.175446	2026-02-01 12:38:17.175446	\N
ffff0091-ffff-0091-ffff-000000000091	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0006-eeee-0006-eeee-000000000006	Fresh A2 Cow Milk	Pure A2 cow milk from grass-fed cows. No hormones or antibiotics.	Milk	100.00	LITRE	80.00	INR	1.00	2026-01-19	2026-01-22	Pune, Maharashtra	18.52040000	73.85670000	t	A+	ACTIVE	238	4.70	21	2026-02-01 12:38:17.175446	2026-02-11 10:13:06.347856	\N
ffff0093-ffff-0093-ffff-000000000093	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0006-eeee-0006-eeee-000000000006	Fresh Butter	Homemade white butter from A2 milk. Rich and creamy.	Butter	20.00	KG	800.00	INR	0.25	2026-01-19	2026-02-19	Pune, Maharashtra	18.52040000	73.85670000	t	A+	ACTIVE	269	4.75	24	2026-02-01 12:38:17.175446	2026-02-01 22:02:17.536749	\N
ffff0076-ffff-0076-ffff-000000000076	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0005-eeee-0005-eeee-000000000005	Saffron (Kesar)	Premium Kashmiri saffron. World's most precious spice.	Saffron	1.00	KG	250000.00	INR	0.00	2025-11-01	2027-11-01	Pune, Maharashtra	18.52040000	73.85670000	t	A+	ACTIVE	569	4.95	52	2026-02-01 12:38:17.175446	2026-02-01 22:29:45.839226	\N
ffff0075-ffff-0075-ffff-000000000075	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0005-eeee-0005-eeee-000000000005	Cardamom (Elaichi)	Green cardamom pods. Premium quality for desserts and chai.	Cardamom	20.00	KG	2500.00	INR	0.10	2025-11-25	2026-11-25	Pune, Maharashtra	18.52040000	73.85670000	t	A+	ACTIVE	524	4.90	48	2026-02-01 12:38:17.175446	2026-02-01 22:30:17.711139	\N
ffff0073-ffff-0073-ffff-000000000073	aaaa2222-aaaa-2222-aaaa-222222222222	dddd2222-dddd-2222-dddd-222222222222	eeee0005-eeee-0005-eeee-000000000005	Cumin Seeds (Jeera)	Aromatic cumin seeds. Essential for Indian cooking.	Cumin	80.00	KG	380.00	INR	0.25	2025-12-10	2026-12-10	Pune, Maharashtra	18.52040000	73.85670000	t	A	ACTIVE	346	4.70	31	2026-02-01 12:38:17.175446	2026-02-01 22:30:48.552956	\N
ffff0003-ffff-0003-ffff-000000000003	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0001-eeee-0001-eeee-000000000001	Fresh Spinach (Palak)	Tender organic spinach leaves, freshly harvested. Excellent source of iron.	Spinach	150.00	KG	35.00	INR	1.00	2026-01-18	2026-01-25	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A+	ACTIVE	158	4.70	15	2026-02-01 12:38:17.175446	2026-02-01 23:57:45.235209	\N
ffff0001-ffff-0001-ffff-000000000001	aaaa1111-aaaa-1111-aaaa-111111111111	dddd1111-dddd-1111-dddd-111111111111	eeee0001-eeee-0001-eeee-000000000001	Fresh Organic Tomatoes	Ripe, juicy organic tomatoes grown without pesticides. Perfect for salads and cooking.	Tomato	500.00	KG	45.00	INR	5.00	2026-01-15	2026-01-30	Lucknow, Uttar Pradesh	26.84670000	80.94620000	t	A	ACTIVE	128	4.50	12	2026-02-01 12:38:17.175446	2026-02-07 10:14:56.154802	\N
\.


--
-- Data for Name: managers; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.managers (id, age, approved_at, approved_by, city, country, created_at, name, phone, profile_photo, rejection_reason, state, status, updated_at, user_id, username) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.order_items (id, created_at, listing_id, product_name, quantity, quantity_unit, subtotal, unit_price, order_id) FROM stdin;
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.order_status_history (id, changed_by, created_at, notes, status, order_id) FROM stdin;
\.


--
-- Data for Name: order_tracking; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.order_tracking (id, carrier, carrier_status, created_at, description, estimated_delivery, event_timestamp, event_type, latitude, location, longitude, title, tracking_number, order_id) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.orders (id, buyer_email, buyer_id, buyer_name, created_at, currency, listing_id, notes, order_number, seller_id, shipping_address, shipping_city, shipping_country, shipping_phone, shipping_postal_code, shipping_state, status, total_amount, updated_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.password_reset_tokens (id, created_at, expires_at, token, used, user_id) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.payments (id, amount, created_at, currency, failure_reason, paid_at, payment_gateway, payment_method, payment_status, razorpay_order_id, razorpay_payment_id, razorpay_receipt, razorpay_signature, refund_amount, refund_id, refunded_at, transaction_id, updated_at, order_id) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.reviews (id, listing_id, reviewer_id, seller_id, rating, comment, created_at, updated_at, order_id, title, is_verified_purchase, helpful_count) FROM stdin;
527c101f-2bd3-4c28-9dce-6f2b736ba64e	ffff0002-ffff-0002-ffff-000000000002	083fc367-b5f9-3b49-98af-2bb99001ecfb	aaaa1111-aaaa-1111-aaaa-111111111111	5	very fresh	2026-02-01 22:15:44.570803	2026-02-01 22:16:06.845217	\N	\N	f	1
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.roles (id, created_at, description, name, updated_at) FROM stdin;
d8ce5c59-4ec9-4e8d-9247-37ba2835684c	2026-02-01 18:19:39.215156	Farmer role - can manage farms and create listings	FARMER	2026-02-01 18:19:39.215156
e35fc6a1-1f43-4cbe-bac9-739f3803d97c	2026-02-01 18:19:40.169788	Customer role - can browse and purchase products	CUSTOMER	2026-02-01 18:19:40.169788
0069f0c0-08a4-419c-b323-aeac4ad24190	2026-02-01 18:19:41.446276	Buyer role - can browse and purchase products	BUYER	2026-02-01 18:19:41.446276
3880b90b-624c-471b-8c2a-e096454b8225	2026-02-01 18:19:42.309952	Manager role - can verify farmers and view products	MANAGER	2026-02-01 18:19:42.309952
f10d551a-3549-4ef0-b21b-8fb759334301	2026-02-01 18:19:43.214804	Administrator role - full system access	ADMIN	2026-02-01 18:19:43.214804
\.


--
-- Data for Name: saved_listings; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.saved_listings (id, created_at, user_id, listing_id) FROM stdin;
\.


--
-- Data for Name: seller_ratings; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.seller_ratings (id, seller_id, total_reviews, average_rating, five_star_count, four_star_count, three_star_count, two_star_count, one_star_count, created_at, updated_at) FROM stdin;
18f983e8-260c-4119-b627-75935ba38313	aaaa1111-aaaa-1111-aaaa-111111111111	1	5.00	1	0	0	0	0	2026-02-01 22:15:45.739376	2026-02-01 22:15:45.739376
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.user_profiles (id, address, bio, city, country, created_at, date_of_birth, first_name, last_name, postal_code, profile_picture_url, state, updated_at, user_id) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.user_roles (user_id, role_id) FROM stdin;
0e3a72ef-6162-495f-b9ca-6a18cf390302	e35fc6a1-1f43-4cbe-bac9-739f3803d97c
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.users (id, account_non_expired, account_non_locked, created_at, credentials_non_expired, email, enabled, password, phone, updated_at) FROM stdin;
0e3a72ef-6162-495f-b9ca-6a18cf390302	t	t	2026-02-01 18:29:26.290124	t	arunteja2385@gmail.com	t	$2a$10$.okazxlaTpAlgPIW7iG3NuR6F9WgpjksGPpiQqNnssu7n9HGNnoCW	\N	2026-02-01 18:29:26.290124
\.


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: marketplace_schema; Owner: -
--

COPY marketplace_schema.wishlists (id, user_id, listing_id, created_at) FROM stdin;
\.


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: crop_plans crop_plans_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.crop_plans
    ADD CONSTRAINT crop_plans_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: farmers farmers_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.farmers
    ADD CONSTRAINT farmers_pkey PRIMARY KEY (id);


--
-- Name: farms farms_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.farms
    ADD CONSTRAINT farms_pkey PRIMARY KEY (id);


--
-- Name: fields fields_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.fields
    ADD CONSTRAINT fields_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: followed_farmers followed_farmers_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.followed_farmers
    ADD CONSTRAINT followed_farmers_pkey PRIMARY KEY (id);


--
-- Name: kyc_documents kyc_documents_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.kyc_documents
    ADD CONSTRAINT kyc_documents_pkey PRIMARY KEY (id);


--
-- Name: listing_images listing_images_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.listing_images
    ADD CONSTRAINT listing_images_pkey PRIMARY KEY (id);


--
-- Name: listing_price_update_proposals listing_price_update_proposals_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.listing_price_update_proposals
    ADD CONSTRAINT listing_price_update_proposals_pkey PRIMARY KEY (id);


--
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (id);


--
-- Name: managers managers_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.managers
    ADD CONSTRAINT managers_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: order_tracking order_tracking_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.order_tracking
    ADD CONSTRAINT order_tracking_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: saved_listings saved_listings_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.saved_listings
    ADD CONSTRAINT saved_listings_pkey PRIMARY KEY (id);


--
-- Name: seller_ratings seller_ratings_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.seller_ratings
    ADD CONSTRAINT seller_ratings_pkey PRIMARY KEY (id);


--
-- Name: seller_ratings seller_ratings_seller_id_key; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.seller_ratings
    ADD CONSTRAINT seller_ratings_seller_id_key UNIQUE (seller_id);


--
-- Name: managers uk47i207jqaocudxi77kquurcr4; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.managers
    ADD CONSTRAINT uk47i207jqaocudxi77kquurcr4 UNIQUE (username);


--
-- Name: cart_items uk5c2xwequ0svy819ealcqf3lbj; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.cart_items
    ADD CONSTRAINT uk5c2xwequ0svy819ealcqf3lbj UNIQUE (cart_id, listing_id);


--
-- Name: farmers uk5s6dxfdngshokstkf5s8s68gg; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.farmers
    ADD CONSTRAINT uk5s6dxfdngshokstkf5s8s68gg UNIQUE (user_id);


--
-- Name: carts uk64t7ox312pqal3p7fg9o503c2; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.carts
    ADD CONSTRAINT uk64t7ox312pqal3p7fg9o503c2 UNIQUE (user_id);


--
-- Name: users uk6dotkott2kjsp8vw4d0m25fb7; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.users
    ADD CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);


--
-- Name: managers uk6sl3ig444d4qy4c2kq6ju96pf; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.managers
    ADD CONSTRAINT uk6sl3ig444d4qy4c2kq6ju96pf UNIQUE (user_id);


--
-- Name: wishlists uk6t5xf2bga4y9gsl8xuiiadp36; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.wishlists
    ADD CONSTRAINT uk6t5xf2bga4y9gsl8xuiiadp36 UNIQUE (user_id, listing_id);


--
-- Name: password_reset_tokens uk71lqwbwtklmljk3qlsugr1mig; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.password_reset_tokens
    ADD CONSTRAINT uk71lqwbwtklmljk3qlsugr1mig UNIQUE (token);


--
-- Name: saved_listings uk78u9v6xcfqs8d06mbphcflrkn; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.saved_listings
    ADD CONSTRAINT uk78u9v6xcfqs8d06mbphcflrkn UNIQUE (user_id, listing_id);


--
-- Name: customers ukbepynu3b6l8k2ppuq6b33xfxc; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.customers
    ADD CONSTRAINT ukbepynu3b6l8k2ppuq6b33xfxc UNIQUE (username);


--
-- Name: user_profiles uke5h89rk3ijvdmaiig4srogdc6; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.user_profiles
    ADD CONSTRAINT uke5h89rk3ijvdmaiig4srogdc6 UNIQUE (user_id);


--
-- Name: customers ukeuat1oase6eqv195jvb71a93s; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.customers
    ADD CONSTRAINT ukeuat1oase6eqv195jvb71a93s UNIQUE (user_id);


--
-- Name: farmers ukhc9w62e6qdsrh81lp9s1scgj9; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.farmers
    ADD CONSTRAINT ukhc9w62e6qdsrh81lp9s1scgj9 UNIQUE (username);


--
-- Name: followed_farmers ukjfnh070fv5nihgyj8hfmybln; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.followed_farmers
    ADD CONSTRAINT ukjfnh070fv5nihgyj8hfmybln UNIQUE (user_id, farmer_id);


--
-- Name: orders uknthkiu7pgmnqnu86i2jyoe2v7; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.orders
    ADD CONSTRAINT uknthkiu7pgmnqnu86i2jyoe2v7 UNIQUE (order_number);


--
-- Name: roles ukofx66keruapi6vyqpv6f2or37; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.roles
    ADD CONSTRAINT ukofx66keruapi6vyqpv6f2or37 UNIQUE (name);


--
-- Name: reviews ukry77v71h1bxtslxqufceigv09; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.reviews
    ADD CONSTRAINT ukry77v71h1bxtslxqufceigv09 UNIQUE (listing_id, reviewer_id, order_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_user_id_listing_id_key; Type: CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.wishlists
    ADD CONSTRAINT wishlists_user_id_listing_id_key UNIQUE (user_id, listing_id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON marketplace_schema.flyway_schema_history USING btree (success);


--
-- Name: idx_cart_item_listing_id; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_cart_item_listing_id ON marketplace_schema.cart_items USING btree (listing_id);


--
-- Name: idx_cart_item_seller_id; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_cart_item_seller_id ON marketplace_schema.cart_items USING btree (seller_id);


--
-- Name: idx_cart_user_id; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_cart_user_id ON marketplace_schema.carts USING btree (user_id);


--
-- Name: idx_listing_category_id; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_listing_category_id ON marketplace_schema.listings USING btree (category_id);


--
-- Name: idx_listing_created_at; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_listing_created_at ON marketplace_schema.listings USING btree (created_at);


--
-- Name: idx_listing_seller_id; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_listing_seller_id ON marketplace_schema.listings USING btree (seller_id);


--
-- Name: idx_listing_seller_status; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_listing_seller_status ON marketplace_schema.listings USING btree (seller_id, status);


--
-- Name: idx_listing_status; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_listing_status ON marketplace_schema.listings USING btree (status);


--
-- Name: idx_listings_crop_type_trgm; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_listings_crop_type_trgm ON marketplace_schema.listings USING gin (lower((COALESCE(crop_type, ''::character varying))::text) public.gin_trgm_ops);


--
-- Name: idx_listings_description_trgm; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_listings_description_trgm ON marketplace_schema.listings USING gin (lower(COALESCE(description, ''::text)) public.gin_trgm_ops);


--
-- Name: idx_listings_status_created_at; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_listings_status_created_at ON marketplace_schema.listings USING btree (status, created_at DESC);


--
-- Name: idx_listings_title_trgm; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_listings_title_trgm ON marketplace_schema.listings USING gin (lower((title)::text) public.gin_trgm_ops);


--
-- Name: idx_order_buyer_id; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_order_buyer_id ON marketplace_schema.orders USING btree (buyer_id);


--
-- Name: idx_order_created_at; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_order_created_at ON marketplace_schema.orders USING btree (created_at);


--
-- Name: idx_order_seller_date; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_order_seller_date ON marketplace_schema.orders USING btree (seller_id, created_at);


--
-- Name: idx_order_seller_id; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_order_seller_id ON marketplace_schema.orders USING btree (seller_id);


--
-- Name: idx_order_seller_status; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_order_seller_status ON marketplace_schema.orders USING btree (seller_id, status);


--
-- Name: idx_order_status; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_order_status ON marketplace_schema.orders USING btree (status);


--
-- Name: idx_price_update_created_at; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_price_update_created_at ON marketplace_schema.listing_price_update_proposals USING btree (created_at);


--
-- Name: idx_price_update_listing_status; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_price_update_listing_status ON marketplace_schema.listing_price_update_proposals USING btree (listing_id, status);


--
-- Name: idx_price_update_seller_status; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_price_update_seller_status ON marketplace_schema.listing_price_update_proposals USING btree (seller_id, status);


--
-- Name: idx_reviews_created_at; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_reviews_created_at ON marketplace_schema.reviews USING btree (created_at DESC);


--
-- Name: idx_reviews_rating; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_reviews_rating ON marketplace_schema.reviews USING btree (rating);


--
-- Name: idx_reviews_reviewer_id; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_reviews_reviewer_id ON marketplace_schema.reviews USING btree (reviewer_id);


--
-- Name: idx_seller_ratings_seller_id; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_seller_ratings_seller_id ON marketplace_schema.seller_ratings USING btree (seller_id);


--
-- Name: idx_wishlists_created_at; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_wishlists_created_at ON marketplace_schema.wishlists USING btree (created_at DESC);


--
-- Name: idx_wishlists_listing_id; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_wishlists_listing_id ON marketplace_schema.wishlists USING btree (listing_id);


--
-- Name: idx_wishlists_user_id; Type: INDEX; Schema: marketplace_schema; Owner: -
--

CREATE INDEX idx_wishlists_user_id ON marketplace_schema.wishlists USING btree (user_id);


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES marketplace_schema.categories(id);


--
-- Name: payments fk81gagumt0r8y3rmudcgpbk42l; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.payments
    ADD CONSTRAINT fk81gagumt0r8y3rmudcgpbk42l FOREIGN KEY (order_id) REFERENCES marketplace_schema.orders(id);


--
-- Name: order_items fkbioxgbv59vetrxe0ejfubep1w; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.order_items
    ADD CONSTRAINT fkbioxgbv59vetrxe0ejfubep1w FOREIGN KEY (order_id) REFERENCES marketplace_schema.orders(id);


--
-- Name: crop_plans fkbruq12uncvhjhbt7phitavulg; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.crop_plans
    ADD CONSTRAINT fkbruq12uncvhjhbt7phitavulg FOREIGN KEY (field_id) REFERENCES marketplace_schema.fields(id);


--
-- Name: reviews fkef8fmvjeprcadspus2mmbo1aa; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.reviews
    ADD CONSTRAINT fkef8fmvjeprcadspus2mmbo1aa FOREIGN KEY (listing_id) REFERENCES marketplace_schema.listings(id);


--
-- Name: order_tracking fkeu0lumcx8bcx6lk035xiklty0; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.order_tracking
    ADD CONSTRAINT fkeu0lumcx8bcx6lk035xiklty0 FOREIGN KEY (order_id) REFERENCES marketplace_schema.orders(id);


--
-- Name: user_roles fkh8ciramu9cc9q3qcqiv4ue8a6; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.user_roles
    ADD CONSTRAINT fkh8ciramu9cc9q3qcqiv4ue8a6 FOREIGN KEY (role_id) REFERENCES marketplace_schema.roles(id);


--
-- Name: user_roles fkhfh9dx7w3ubf1co1vdev94g3f; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.user_roles
    ADD CONSTRAINT fkhfh9dx7w3ubf1co1vdev94g3f FOREIGN KEY (user_id) REFERENCES marketplace_schema.users(id);


--
-- Name: kyc_documents fkhy5rhjqn53kshrnfihivg922f; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.kyc_documents
    ADD CONSTRAINT fkhy5rhjqn53kshrnfihivg922f FOREIGN KEY (user_id) REFERENCES marketplace_schema.user_profiles(user_id);


--
-- Name: password_reset_tokens fkk3ndxg5xp6v7wd4gjyusp15gq; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.password_reset_tokens
    ADD CONSTRAINT fkk3ndxg5xp6v7wd4gjyusp15gq FOREIGN KEY (user_id) REFERENCES marketplace_schema.users(id);


--
-- Name: saved_listings fkkupce4lvswik928p8jxsbasjj; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.saved_listings
    ADD CONSTRAINT fkkupce4lvswik928p8jxsbasjj FOREIGN KEY (listing_id) REFERENCES marketplace_schema.listings(id);


--
-- Name: order_status_history fknmcbg3mmbt8wfva97ra40nmp3; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.order_status_history
    ADD CONSTRAINT fknmcbg3mmbt8wfva97ra40nmp3 FOREIGN KEY (order_id) REFERENCES marketplace_schema.orders(id);


--
-- Name: fields fkomv5dbq49wptvwmnlhg4ieubh; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.fields
    ADD CONSTRAINT fkomv5dbq49wptvwmnlhg4ieubh FOREIGN KEY (farm_id) REFERENCES marketplace_schema.farms(id);


--
-- Name: cart_items fkpcttvuq4mxppo8sxggjtn5i2c; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.cart_items
    ADD CONSTRAINT fkpcttvuq4mxppo8sxggjtn5i2c FOREIGN KEY (cart_id) REFERENCES marketplace_schema.carts(id);


--
-- Name: listing_images listing_images_listing_id_fkey; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.listing_images
    ADD CONSTRAINT listing_images_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES marketplace_schema.listings(id) ON DELETE CASCADE;


--
-- Name: listing_price_update_proposals listing_price_update_proposals_listing_id_fkey; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.listing_price_update_proposals
    ADD CONSTRAINT listing_price_update_proposals_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES marketplace_schema.listings(id) ON DELETE CASCADE;


--
-- Name: listings listings_category_id_fkey; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.listings
    ADD CONSTRAINT listings_category_id_fkey FOREIGN KEY (category_id) REFERENCES marketplace_schema.categories(id);


--
-- Name: wishlists wishlists_listing_id_fkey; Type: FK CONSTRAINT; Schema: marketplace_schema; Owner: -
--

ALTER TABLE ONLY marketplace_schema.wishlists
    ADD CONSTRAINT wishlists_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES marketplace_schema.listings(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 9JzuxlgAloLokzppKkMnmt5sgAM8dfmH3VqyHA9B8oJU12HDvk3Zc9Buf3XX43p

