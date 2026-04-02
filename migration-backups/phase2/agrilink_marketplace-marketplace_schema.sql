CREATE SCHEMA IF NOT EXISTS marketplace_schema;
--
-- PostgreSQL database dump
--

\restrict DKDYazc4XlFXQGMrsoCKHmxnpDzvpFdT1uJSMyr0PYqbMI5EMIdysdUCDbyq90H

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
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE marketplace_schema.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    parent_id uuid,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: -
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
-- Name: listing_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE marketplace_schema.listing_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    listing_id uuid NOT NULL,
    image_url character varying(500) NOT NULL,
    is_primary boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: listing_price_update_proposals; Type: TABLE; Schema: public; Owner: -
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
-- Name: listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE marketplace_schema.listings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid NOT NULL,
    farm_id uuid,
    category_id uuid,
    title character varying(255) NOT NULL,
    description text,
    crop_type character varying(100),
    quantity numeric(12,2) NOT NULL,
    quantity_unit character varying(20) DEFAULT 'KG'::character varying,
    price_per_unit numeric(12,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    minimum_order numeric(12,2),
    harvest_date date,
    expiry_date date,
    location character varying(500),
    latitude numeric(10,8),
    longitude numeric(11,8),
    organic_certified boolean DEFAULT false,
    quality_grade character varying(20),
    status character varying(20) DEFAULT 'DRAFT'::character varying,
    view_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    average_rating numeric(3,2) DEFAULT 0,
    review_count integer DEFAULT 0
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
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
-- Name: saved_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE marketplace_schema.saved_listings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: seller_ratings; Type: TABLE; Schema: public; Owner: -
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
-- Name: wishlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE marketplace_schema.wishlists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY marketplace_schema.categories (id, name, description, parent_id, active, created_at, updated_at) FROM stdin;
9524a2f1-52bb-4f3f-bc0b-abd7ce2f26c6	Grains	Wheat, rice, corn, and other grains	\N	t	2026-02-02 16:23:37.573053	2026-02-02 16:23:37.573053
42cc0fe6-0997-4e1e-8eb7-7333030d6f17	Vegetables	Fresh vegetables	\N	t	2026-02-02 16:23:37.573053	2026-02-02 16:23:37.573053
23d96fbf-94c4-4889-bba0-3084ace4293b	Fruits	Fresh fruits	\N	t	2026-02-02 16:23:37.573053	2026-02-02 16:23:37.573053
4e06de04-360e-4884-8da5-ebcad364cf80	Dairy	Milk, cheese, and dairy products	\N	t	2026-02-02 16:23:37.573053	2026-02-02 16:23:37.573053
53327e80-8b97-47bb-b97f-163cb431acf2	Livestock	Cattle, poultry, and other livestock	\N	t	2026-02-02 16:23:37.573053	2026-02-02 16:23:37.573053
af9aac59-dc72-4d7a-9e0c-86d5bdb9d14f	Seeds	Planting seeds	\N	t	2026-02-02 16:23:37.573053	2026-02-02 16:23:37.573053
ec8efe27-a805-418f-bf08-1618b5124023	Fertilizers	Organic and chemical fertilizers	\N	t	2026-02-02 16:23:37.573053	2026-02-02 16:23:37.573053
d1dbe844-8186-4c11-9203-9b96ff6bc848	Equipment	Farm equipment and tools	\N	t	2026-02-02 16:23:37.573053	2026-02-02 16:23:37.573053
f3bae7bb-a314-49ee-b980-5684a0ad5de9	Organic	Certified organic produce	\N	t	2026-02-02 16:23:59.701426	2026-02-02 16:23:59.701484
c33edd30-59ca-4cb0-9345-c9c4c7bd6d17	Spices	Fresh and dried spices	\N	t	2026-02-02 16:23:59.730995	2026-02-02 16:23:59.731019
b1fb5f22-9334-4c15-9da6-322211f0b749	Pulses	Lentils, beans, and legumes	\N	t	2026-02-02 16:23:59.738613	2026-02-02 16:23:59.738635
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY marketplace_schema.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init marketplace schema	SQL	V1__init_marketplace_schema.sql	433337544	agrilink	2026-02-02 16:23:37.511239	273	t
2	2	add wishlist table	SQL	V2__add_wishlist_table.sql	-1867193774	agrilink	2026-02-02 16:23:37.875824	58	t
3	3	add reviews table	SQL	V3__add_reviews_table.sql	-1311475367	agrilink	2026-02-02 16:23:37.975612	110	t
4	4	add listing search indexes	SQL	V4__add_listing_search_indexes.sql	-1789329535	agrilink	2026-04-02 02:09:30.020352	392	t
5	5	add listing price update proposals	SQL	V5__add_listing_price_update_proposals.sql	-1269530555	agrilink	2026-04-02 02:09:30.663752	155	t
\.


--
-- Data for Name: listing_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY marketplace_schema.listing_images (id, listing_id, image_url, is_primary, sort_order, created_at) FROM stdin;
ca9d6fb1-f4fa-487a-b2f9-e769300d4ad7	5cf9087d-1f9f-47a8-8279-578f4d69cb1a	https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=800	t	0	2026-02-02 16:23:59.756083
56467e67-086c-4423-87d9-9d298075d4ff	5cf9087d-1f9f-47a8-8279-578f4d69cb1a	https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800	f	1	2026-02-02 16:23:59.759811
082bc577-c316-4285-9047-85673d317643	5337203a-0132-42ad-9390-9274977395b4	https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=800	t	0	2026-02-02 16:23:59.768387
2538a070-a91d-4aa2-a266-fdb681e11e5a	f125e501-74c9-4b58-bd19-b731481dccfd	https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800	t	0	2026-02-02 16:23:59.775056
bd5c1c33-6123-46a9-acf5-efe1dfeedcb2	67714479-bcdd-4b4f-bd54-cd8584aebee7	https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800	t	0	2026-02-02 16:23:59.780823
72e51361-3985-48fb-8ff9-33d2955c13d7	8bf44ae1-3eeb-47d3-95e0-5b20573ab27a	https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800	t	0	2026-02-02 16:23:59.788348
b34637fd-8ed8-4aeb-905f-f307cbb82673	491c905c-15df-4a56-91a4-e1aab60f06e5	https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=800	t	0	2026-02-02 16:23:59.796083
5011af01-45f1-43c5-a01e-7eda99e8c548	f7c07a40-0ed8-4f5f-a6c9-6925f0295009	https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800	t	0	2026-02-02 16:23:59.806575
1db1c6af-981d-4adf-a96a-8f9addddca2d	f7c07a40-0ed8-4f5f-a6c9-6925f0295009	https://images.unsplash.com/photo-1543158181-e6f9f6712055?w=800	f	1	2026-02-02 16:23:59.808444
b86b9191-4a87-4ce6-a671-9d1d3c8ec20d	239bcb07-11c4-450a-b2e9-c4fbc15dd1ea	https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800	t	0	2026-02-02 16:23:59.815241
124d5d7b-ec89-4860-ad4e-7cac9a775edc	d6cd458b-414a-4f04-aa87-852650cb75cb	https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800	t	0	2026-02-02 16:23:59.825145
5597eff8-8b98-4930-b5f0-199f4792f451	cce6b07c-3b42-4670-92ac-8ce05b78d26b	https://images.unsplash.com/photo-1569288052389-dac9b01c9c05?w=800	t	0	2026-02-02 16:23:59.833832
604690d6-5e61-4103-a446-9fe3d6d96c29	cce6b07c-3b42-4670-92ac-8ce05b78d26b	https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800	f	1	2026-02-02 16:23:59.835091
c89349d2-bb6c-472c-92b8-2965b1c7cb3d	6888b306-5a82-488d-8177-4f3d78df8c0c	https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800	t	0	2026-02-02 16:23:59.842481
2636091c-91e4-48a6-838d-354569b264ce	b0091f8e-a716-4986-bd0e-27eb8aab90ad	https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=800	t	0	2026-02-02 16:23:59.849392
5649cc43-b07a-4d97-8150-a44a7f7b3186	9e40215e-e92d-471b-be58-bf1d48bdcf19	https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800	t	0	2026-02-02 16:23:59.857048
a29a30c8-a7d0-45c4-96dd-4e1067d9cf44	8862a7ba-fb90-432b-a6f8-04f9675c0881	https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800	t	0	2026-02-02 16:23:59.863598
a9ff7ecd-d725-47e7-b2c7-1af2c944dcd8	8edbbf8e-7f97-414d-b231-e944c8623af5	https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?w=800	t	0	2026-02-02 16:23:59.869626
467116e5-f1ab-47c7-bfe1-0f5a26cf7885	5528e71d-a62a-4e62-9f2e-c849216069a8	https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800	t	0	2026-02-02 16:23:59.876152
745d2b84-079e-4e7f-8899-83bc00849fcd	e7744a0c-16b3-4af7-aafc-62f58cb7d07d	https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800	t	0	2026-02-02 16:23:59.881661
729243ce-fe51-4472-97c2-38904215c006	c5dc4c59-55ef-4690-8fd7-68e5a07c5d47	https://images.unsplash.com/photo-1518977676601-b53f82ber6e3?w=800	t	0	2026-02-02 16:23:59.888287
ece5b840-ecd7-43aa-976c-06f209fc5cca	70c6dec4-b521-4f3c-9ad2-320ef40c7e35	https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=800	t	0	2026-02-02 16:23:59.894748
ff10af64-3e71-4033-a14d-d7c1c0223c5b	4f744832-f084-4579-85eb-4e59c017362e	https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800	t	0	2026-02-02 16:23:59.900002
990b4d80-d1f8-4648-8c70-5c5314887f13	67641848-8c3e-44f1-8674-79798cd8027a	https://images.unsplash.com/photo-1547514701-42782101795e?w=800	t	0	2026-02-02 16:23:59.90637
f8b52dad-39d2-4650-9227-3f657a5b4a85	f194ffef-9a7d-4bd9-b185-c31b2eb80c52	https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800	t	0	2026-02-02 16:23:59.912043
131c837b-c967-49cd-826e-0d8385891752	6ca31989-1eb9-430e-b002-161c9747d30a	https://images.unsplash.com/photo-1553279768-865429fa0078?w=800	t	0	2026-02-02 16:23:59.9176
e886d674-6e19-46ed-b18b-6f825d11d716	0cb0560f-47f5-4cb9-804a-534337444298	https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800	t	0	2026-02-02 16:23:59.922874
afcee418-d2cc-40b7-a18c-9a5e1d407f47	d3851c01-7a18-4c34-8692-7554ade136ff	https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800	t	0	2026-02-02 16:23:59.929158
7932fbc9-618b-4562-8036-eb094b150198	63852cf9-490d-4671-95bc-79d5b1cf8b6a	https://images.unsplash.com/photo-1515543904269-c4fef373d04a?w=800	t	0	2026-02-02 16:23:59.935233
18d02aa4-dcb5-4b0a-8a59-03d6e7bf2790	9282cb63-1496-40e9-bdd2-9abf704cdfd2	https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800	t	0	2026-02-02 16:23:59.941712
d197c0b1-6ef5-4f65-ab6b-d3628066729e	56f3a790-99b6-4fe9-8474-3841baaab6cf	https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800	t	0	2026-02-02 16:23:59.947111
29fb3792-4d07-418e-a2f5-f1af9893d3c0	857c6bb7-895d-441c-8368-6198c4c7b2de	https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800	t	0	2026-02-02 16:23:59.952781
e667ced5-01cd-4bae-91aa-77e2e90e9b76	c2eb02f9-8c0a-4d25-a1d7-19c382737d1e	https://images.unsplash.com/photo-1540148426945-6cf22a6b2f85?w=800	t	0	2026-02-02 16:23:59.958115
8fdbc9bf-8073-4a5f-bbd8-db32c079985a	c6797a5f-1144-489e-ac22-88fc80fe1331	https://images.unsplash.com/photo-1615485291234-9d694218aeb3?w=800	t	0	2026-02-02 16:23:59.962838
4838c7e6-a272-446a-b543-15e96dc58ddf	f2b0dc27-c703-407c-aba2-f637b748e3fb	https://unsplash.com/photos/bunch-of-red-apples-wXuzS9xR49M	t	0	2026-03-26 04:41:15.694296
\.


--
-- Data for Name: listing_price_update_proposals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY marketplace_schema.listing_price_update_proposals (id, listing_id, seller_id, product_name, matched_commodity, current_price, suggested_price, currency, market_source, market_name, confidence_score, reason, status, created_at, updated_at, expires_at, responded_at) FROM stdin;
\.


--
-- Data for Name: listings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY marketplace_schema.listings (id, seller_id, farm_id, category_id, title, description, crop_type, quantity, quantity_unit, price_per_unit, currency, minimum_order, harvest_date, expiry_date, location, latitude, longitude, organic_certified, quality_grade, status, view_count, created_at, updated_at, average_rating, review_count) FROM stdin;
5cf9087d-1f9f-47a8-8279-578f4d69cb1a	11111111-1111-1111-1111-111111111111	\N	42cc0fe6-0997-4e1e-8eb7-7333030d6f17	Fresh Organic Tomatoes	Vine-ripened organic tomatoes, grown without pesticides. Perfect for salads, sauces, and cooking. Our tomatoes are picked at peak ripeness for maximum flavor.	Tomato	150.00	KG	55.00	INR	2.00	2026-01-30	2026-02-10	Green Valley Farm, California	\N	\N	t	A	ACTIVE	373	2026-02-02 16:23:59.753001	2026-02-02 16:23:59.75303	3.50	12
5337203a-0132-42ad-9390-9274977395b4	11111111-1111-1111-1111-111111111111	\N	42cc0fe6-0997-4e1e-8eb7-7333030d6f17	Crispy Lettuce Mix	Fresh mix of romaine, butterhead, and leaf lettuce. Harvested daily for maximum freshness. Perfect for salads and sandwiches.	Lettuce	75.00	KG	80.00	INR	1.00	2026-01-26	2026-02-22	Green Valley Farm, California	\N	\N	t	A+	ACTIVE	56	2026-02-02 16:23:59.767682	2026-02-02 16:23:59.767707	3.90	19
f125e501-74c9-4b58-bd19-b731481dccfd	11111111-1111-1111-1111-111111111111	\N	42cc0fe6-0997-4e1e-8eb7-7333030d6f17	Fresh Spinach Bundle	Nutrient-rich spinach leaves, freshly picked. Excellent source of iron and vitamins. Great for salads, smoothies, and cooking.	Spinach	60.00	KG	60.00	INR	0.50	2026-01-31	2026-02-10	Green Valley Farm, California	\N	\N	t	A	ACTIVE	429	2026-02-02 16:23:59.774307	2026-02-02 16:23:59.774329	3.90	11
8bf44ae1-3eeb-47d3-95e0-5b20573ab27a	11111111-1111-1111-1111-111111111111	\N	42cc0fe6-0997-4e1e-8eb7-7333030d6f17	Fresh Broccoli	Farm-fresh broccoli florets, packed with vitamins and fiber. Perfect for steaming, roasting, or adding to stir-fries.	Broccoli	45.00	KG	90.00	INR	1.00	2026-01-27	2026-02-16	Green Valley Farm, California	\N	\N	t	A	ACTIVE	402	2026-02-02 16:23:59.787253	2026-02-02 16:23:59.78728	4.00	18
491c905c-15df-4a56-91a4-e1aab60f06e5	11111111-1111-1111-1111-111111111111	\N	42cc0fe6-0997-4e1e-8eb7-7333030d6f17	Organic Cucumbers	Crisp and refreshing cucumbers, grown organically. Perfect for salads, sandwiches, and pickling.	Cucumber	90.00	KG	35.00	INR	2.00	2026-01-27	2026-02-18	Green Valley Farm, California	\N	\N	t	A	ACTIVE	391	2026-02-02 16:23:59.795361	2026-02-02 16:23:59.795407	3.80	12
f7c07a40-0ed8-4f5f-a6c9-6925f0295009	11111111-1111-1111-1111-111111111111	\N	23d96fbf-94c4-4889-bba0-3084ace4293b	Sweet Strawberries	Hand-picked strawberries at peak ripeness. Sweet, juicy, and perfect for desserts, smoothies, or eating fresh.	Strawberry	40.00	KG	280.00	INR	0.50	2026-02-01	2026-02-19	Green Valley Farm, California	\N	\N	t	A	ACTIVE	63	2026-02-02 16:23:59.80493	2026-02-02 16:23:59.805005	3.50	10
239bcb07-11c4-450a-b2e9-c4fbc15dd1ea	11111111-1111-1111-1111-111111111111	\N	23d96fbf-94c4-4889-bba0-3084ace4293b	Fresh Blueberries	Plump and sweet blueberries, packed with antioxidants. Perfect for breakfast, baking, or snacking.	Blueberry	25.00	KG	450.00	INR	0.25	2026-01-27	2026-02-12	Green Valley Farm, California	\N	\N	t	A+	ACTIVE	3	2026-02-02 16:23:59.814413	2026-02-02 16:23:59.814437	3.50	28
d6cd458b-414a-4f04-aa87-852650cb75cb	11111111-1111-1111-1111-111111111111	\N	23d96fbf-94c4-4889-bba0-3084ace4293b	Organic Avocados	Creamy Hass avocados, perfectly ripe. Rich in healthy fats and perfect for guacamole, toast, or salads.	Avocado	50.00	KG	180.00	INR	3.00	2026-02-01	2026-02-16	Green Valley Farm, California	\N	\N	t	A	ACTIVE	107	2026-02-02 16:23:59.824144	2026-02-02 16:23:59.824166	3.90	39
b0091f8e-a716-4986-bd0e-27eb8aab90ad	22222222-2222-2222-2222-222222222222	\N	9524a2f1-52bb-4f3f-bc0b-abd7ce2f26c6	Premium Basmati Rice	Long-grain aromatic basmati rice aged for 12 months. Fluffy texture and delicate aroma. Perfect for biryanis and pilafs.	Rice	500.00	KG	120.00	INR	5.00	2026-01-26	2026-02-15	Sunrise Farm, Texas	\N	\N	f	Premium	ACTIVE	439	2026-02-02 16:23:59.848706	2026-02-02 16:23:59.848739	3.90	27
8862a7ba-fb90-432b-a6f8-04f9675c0881	22222222-2222-2222-2222-222222222222	\N	9524a2f1-52bb-4f3f-bc0b-abd7ce2f26c6	Yellow Corn	Fresh sweet corn, perfect for grilling, boiling, or adding to salads. Naturally sweet and tender.	Corn	200.00	KG	38.00	INR	10.00	2026-01-29	2026-02-13	Sunrise Farm, Texas	\N	\N	f	A	ACTIVE	211	2026-02-02 16:23:59.862947	2026-02-02 16:23:59.862982	5.00	49
8edbbf8e-7f97-414d-b231-e944c8623af5	22222222-2222-2222-2222-222222222222	\N	9524a2f1-52bb-4f3f-bc0b-abd7ce2f26c6	Organic Oats	Rolled oats from organically grown oat crops. Heart-healthy and perfect for breakfast or baking.	Oats	150.00	KG	95.00	INR	2.00	2026-01-30	2026-02-16	Sunrise Farm, Texas	\N	\N	t	A	ACTIVE	314	2026-02-02 16:23:59.869034	2026-02-02 16:23:59.869055	4.20	41
e7744a0c-16b3-4af7-aafc-62f58cb7d07d	22222222-2222-2222-2222-222222222222	\N	42cc0fe6-0997-4e1e-8eb7-7333030d6f17	Red Onions	Fresh red onions with a mild, sweet flavor. Perfect for salads, cooking, and grilling.	Onion	300.00	KG	40.00	INR	3.00	2026-01-30	2026-02-15	Sunrise Farm, Texas	\N	\N	f	A	ACTIVE	397	2026-02-02 16:23:59.881034	2026-02-02 16:23:59.881068	4.10	33
c5dc4c59-55ef-4690-8fd7-68e5a07c5d47	22222222-2222-2222-2222-222222222222	\N	42cc0fe6-0997-4e1e-8eb7-7333030d6f17	Fresh Potatoes	Versatile potatoes perfect for baking, mashing, frying, or roasting. Farm fresh quality.	Potato	400.00	KG	32.00	INR	5.00	2026-01-29	2026-02-11	Sunrise Farm, Texas	\N	\N	f	A	ACTIVE	189	2026-02-02 16:23:59.887733	2026-02-02 16:23:59.887749	3.50	17
70c6dec4-b521-4f3c-9ad2-320ef40c7e35	22222222-2222-2222-2222-222222222222	\N	42cc0fe6-0997-4e1e-8eb7-7333030d6f17	Green Cabbage	Fresh green cabbage, crisp and nutritious. Great for coleslaw, stir-fries, and soups.	Cabbage	120.00	KG	30.00	INR	2.00	2026-01-28	2026-02-21	Sunrise Farm, Texas	\N	\N	f	A	ACTIVE	20	2026-02-02 16:23:59.894156	2026-02-02 16:23:59.894172	4.10	19
0cb0560f-47f5-4cb9-804a-534337444298	22222222-2222-2222-2222-222222222222	\N	f3bae7bb-a314-49ee-b980-5684a0ad5de9	Raw Organic Honey	Pure raw honey from local beehives. Unprocessed and unfiltered, retaining all natural nutrients.	Honey	30.00	KG	420.00	INR	0.50	2026-01-26	2026-02-13	Sunrise Farm, Texas	\N	\N	t	Premium	ACTIVE	363	2026-02-02 16:23:59.922393	2026-02-02 16:23:59.92241	4.50	46
d3851c01-7a18-4c34-8692-7554ade136ff	22222222-2222-2222-2222-222222222222	\N	f3bae7bb-a314-49ee-b980-5684a0ad5de9	Organic Olive Oil	Cold-pressed extra virgin olive oil from organic olives. Rich flavor perfect for cooking and dressing.	Olive Oil	25.00	KG	890.00	INR	0.50	2026-01-30	2026-02-18	Sunrise Farm, Texas	\N	\N	t	Premium	ACTIVE	186	2026-02-02 16:23:59.928423	2026-02-02 16:23:59.928441	5.00	42
67714479-bcdd-4b4f-bd54-cd8584aebee7	11111111-1111-1111-1111-111111111111	\N	42cc0fe6-0997-4e1e-8eb7-7333030d6f17	Organic Bell Peppers	Colorful mix of red, yellow, and green bell peppers. Sweet and crunchy, perfect for salads, stir-fries, and stuffing.	Bell Pepper	80.00	KG	120.00	INR	1.00	2026-02-01	2026-02-13	Green Valley Farm, California	\N	\N	t	A	ACTIVE	459	2026-02-02 16:23:59.779963	2026-03-25 05:21:35.445696	4.70	14
f194ffef-9a7d-4bd9-b185-c31b2eb80c52	22222222-2222-2222-2222-222222222222	\N	23d96fbf-94c4-4889-bba0-3084ace4293b	Ripe Bananas	Sweet and nutritious bananas, perfect ripeness. Great for breakfast, smoothies, or baking.	Banana	100.00	KG	50.00	INR	1.00	2026-01-28	2026-02-18	Sunrise Farm, Texas	\N	\N	f	A	ACTIVE	318	2026-02-02 16:23:59.911464	2026-03-25 05:41:22.629405	4.60	10
6888b306-5a82-488d-8177-4f3d78df8c0c	11111111-1111-1111-1111-111111111111	\N	4e06de04-360e-4884-8da5-ebcad364cf80	Fresh Goat Cheese	Artisanal goat cheese made from our farm's goat milk. Creamy texture with tangy flavor.	Cheese	15.00	KG	650.00	INR	0.25	2026-01-26	2026-02-21	Green Valley Farm, California	\N	\N	f	Premium	ACTIVE	8	2026-02-02 16:23:59.841772	2026-03-25 05:47:16.928613	5.00	1
4f744832-f084-4579-85eb-4e59c017362e	22222222-2222-2222-2222-222222222222	\N	23d96fbf-94c4-4889-bba0-3084ace4293b	Golden Apples	Crisp and sweet golden delicious apples. Locally grown with care, perfect for snacking or baking.	Apple	180.00	KG	150.00	INR	2.00	2026-02-01	2026-02-19	Sunrise Farm, Texas	\N	\N	f	A	ACTIVE	219	2026-02-02 16:23:59.899265	2026-03-26 04:20:16.229599	4.30	7
9e40215e-e92d-471b-be58-bf1d48bdcf19	22222222-2222-2222-2222-222222222222	\N	9524a2f1-52bb-4f3f-bc0b-abd7ce2f26c6	Organic Wheat Flour	Stone-ground whole wheat flour from organically grown wheat. Perfect for bread, chapatis, and baking.	Wheat	300.00	KG	48.00	INR	5.00	2026-01-28	2026-02-14	Sunrise Farm, Texas	\N	\N	t	A	ACTIVE	152	2026-02-02 16:23:59.856227	2026-03-25 05:48:22.707126	3.60	43
cce6b07c-3b42-4670-92ac-8ce05b78d26b	11111111-1111-1111-1111-111111111111	\N	4e06de04-360e-4884-8da5-ebcad364cf80	Farm Fresh Eggs	Free-range eggs from happy hens. Rich golden yolks and superior taste. Sold by the dozen.	Eggs	200.00	KG	85.00	INR	1.00	2026-01-31	2026-02-13	Green Valley Farm, California	\N	\N	t	Premium	ACTIVE	416	2026-02-02 16:23:59.833098	2026-03-26 01:48:51.013356	4.70	31
67641848-8c3e-44f1-8674-79798cd8027a	22222222-2222-2222-2222-222222222222	\N	23d96fbf-94c4-4889-bba0-3084ace4293b	Fresh Oranges	Juicy navel oranges, bursting with vitamin C. Perfect for juicing or eating fresh.	Orange	150.00	KG	80.00	INR	3.00	2026-01-27	2026-02-11	Sunrise Farm, Texas	\N	\N	f	A	ACTIVE	65	2026-02-02 16:23:59.905768	2026-03-25 10:24:27.179404	3.80	18
6ca31989-1eb9-430e-b002-161c9747d30a	22222222-2222-2222-2222-222222222222	\N	23d96fbf-94c4-4889-bba0-3084ace4293b	Sweet Mangoes	Tropical mangoes with rich, sweet flavor. Perfect for eating fresh, smoothies, or desserts.	Mango	60.00	KG	150.00	INR	2.00	2026-01-31	2026-02-22	Sunrise Farm, Texas	\N	\N	f	A+	ACTIVE	137	2026-02-02 16:23:59.91705	2026-03-26 04:16:59.157642	4.20	6
9282cb63-1496-40e9-bdd2-9abf704cdfd2	22222222-2222-2222-2222-222222222222	\N	b1fb5f22-9334-4c15-9da6-322211f0b749	Black Beans	Dried black beans, packed with protein and fiber. Great for Mexican dishes, soups, and salads.	Beans	150.00	KG	130.00	INR	2.00	2026-01-26	2026-02-15	Sunrise Farm, Texas	\N	\N	f	A	ACTIVE	415	2026-02-02 16:23:59.940701	2026-02-02 16:23:59.940718	4.50	36
56f3a790-99b6-4fe9-8474-3841baaab6cf	22222222-2222-2222-2222-222222222222	\N	b1fb5f22-9334-4c15-9da6-322211f0b749	Chickpeas	Dried chickpeas, versatile and nutritious. Perfect for hummus, curries, and salads.	Chickpeas	180.00	KG	100.00	INR	2.00	2026-01-28	2026-02-09	Sunrise Farm, Texas	\N	\N	f	A	ACTIVE	134	2026-02-02 16:23:59.946613	2026-02-02 16:23:59.946629	4.20	25
c6797a5f-1144-489e-ac22-88fc80fe1331	22222222-2222-2222-2222-222222222222	\N	c33edd30-59ca-4cb0-9345-c9c4c7bd6d17	Fresh Turmeric	Vibrant fresh turmeric root with earthy flavor. Known for its health benefits and culinary uses.	Turmeric	40.00	KG	200.00	INR	0.25	2026-01-26	2026-02-17	Sunrise Farm, Texas	\N	\N	t	A	ACTIVE	154	2026-02-02 16:23:59.962324	2026-03-26 04:16:24.119934	3.80	3
63852cf9-490d-4671-95bc-79d5b1cf8b6a	22222222-2222-2222-2222-222222222222	\N	b1fb5f22-9334-4c15-9da6-322211f0b749	Red Lentils	High-protein red lentils, perfect for soups, stews, and curries. Quick cooking and nutritious.	Lentils	200.00	KG	110.00	INR	2.00	2026-01-26	2026-02-21	Sunrise Farm, Texas	\N	\N	f	A	ACTIVE	446	2026-02-02 16:23:59.934679	2026-03-25 04:53:36.265299	3.50	27
5528e71d-a62a-4e62-9f2e-c849216069a8	22222222-2222-2222-2222-222222222222	\N	42cc0fe6-0997-4e1e-8eb7-7333030d6f17	Fresh Carrots	Sweet and crunchy carrots, freshly harvested. Great for juicing, cooking, or eating raw as snacks.	Carrot	200.00	KG	45.00	INR	2.00	2026-01-26	2026-02-16	Sunrise Farm, Texas	\N	\N	f	A	ACTIVE	483	2026-02-02 16:23:59.874782	2026-03-25 05:21:24.716822	3.70	12
f2b0dc27-c703-407c-aba2-f637b748e3fb	ce9c7726-dc33-4e47-a505-873575deae79	\N	23d96fbf-94c4-4889-bba0-3084ace4293b	Apples	Apples		100.00	KG	45.00	INR	10.00	2026-03-18	2026-03-27	Hyderabad	\N	\N	f	A	ACTIVE	6	2026-03-26 04:41:15.620246	2026-03-26 04:44:02.652155	0.00	0
c2eb02f9-8c0a-4d25-a1d7-19c382737d1e	22222222-2222-2222-2222-222222222222	\N	c33edd30-59ca-4cb0-9345-c9c4c7bd6d17	Fresh Garlic	Pungent fresh garlic bulbs. Essential ingredient for countless recipes worldwide.	Garlic	80.00	KG	140.00	INR	0.50	2026-01-31	2026-02-16	Sunrise Farm, Texas	\N	\N	f	A	ACTIVE	63	2026-02-02 16:23:59.957536	2026-03-25 06:03:22.301198	4.60	18
857c6bb7-895d-441c-8368-6198c4c7b2de	22222222-2222-2222-2222-222222222222	\N	c33edd30-59ca-4cb0-9345-c9c4c7bd6d17	Fresh Ginger	Aromatic fresh ginger root. Essential for Asian cooking, teas, and natural remedies.	Ginger	50.00	KG	180.00	INR	0.25	2026-01-28	2026-02-19	Sunrise Farm, Texas	\N	\N	f	A	ACTIVE	315	2026-02-02 16:23:59.952135	2026-03-25 06:18:24.171525	4.00	4
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY marketplace_schema.reviews (id, listing_id, reviewer_id, seller_id, rating, comment, created_at, updated_at, order_id, title, is_verified_purchase, helpful_count) FROM stdin;
56838e6d-f6c4-4788-8217-efc8caeecbd2	6888b306-5a82-488d-8177-4f3d78df8c0c	083fc367-b5f9-3b49-98af-2bb99001ecfb	11111111-1111-1111-1111-111111111111	5	good	2026-03-25 05:47:16.704202	2026-03-25 05:47:30.739589	\N	\N	f	1
\.


--
-- Data for Name: saved_listings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY marketplace_schema.saved_listings (id, user_id, listing_id, created_at) FROM stdin;
\.


--
-- Data for Name: seller_ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY marketplace_schema.seller_ratings (id, seller_id, total_reviews, average_rating, five_star_count, four_star_count, three_star_count, two_star_count, one_star_count, created_at, updated_at) FROM stdin;
5b751e5b-c7e4-4f5a-9b66-c382e468dfbc	11111111-1111-1111-1111-111111111111	1	5.00	1	0	0	0	0	2026-03-25 05:47:16.842941	2026-03-25 05:47:16.842967
\.


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY marketplace_schema.wishlists (id, user_id, listing_id, created_at) FROM stdin;
\.


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: listing_images listing_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.listing_images
    ADD CONSTRAINT listing_images_pkey PRIMARY KEY (id);


--
-- Name: listing_price_update_proposals listing_price_update_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.listing_price_update_proposals
    ADD CONSTRAINT listing_price_update_proposals_pkey PRIMARY KEY (id);


--
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: saved_listings saved_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.saved_listings
    ADD CONSTRAINT saved_listings_pkey PRIMARY KEY (id);


--
-- Name: saved_listings saved_listings_user_id_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.saved_listings
    ADD CONSTRAINT saved_listings_user_id_listing_id_key UNIQUE (user_id, listing_id);


--
-- Name: seller_ratings seller_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.seller_ratings
    ADD CONSTRAINT seller_ratings_pkey PRIMARY KEY (id);


--
-- Name: seller_ratings seller_ratings_seller_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.seller_ratings
    ADD CONSTRAINT seller_ratings_seller_id_key UNIQUE (seller_id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_user_id_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.wishlists
    ADD CONSTRAINT wishlists_user_id_listing_id_key UNIQUE (user_id, listing_id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON marketplace_schema.flyway_schema_history USING btree (success);


--
-- Name: idx_listings_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_category ON marketplace_schema.listings USING btree (category_id);


--
-- Name: idx_listings_crop_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_crop_type ON marketplace_schema.listings USING btree (crop_type);


--
-- Name: idx_listings_crop_type_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_crop_type_trgm ON marketplace_schema.listings USING gin (lower((COALESCE(crop_type, ''::character varying))::text) public.gin_trgm_ops);


--
-- Name: idx_listings_description_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_description_trgm ON marketplace_schema.listings USING gin (lower(COALESCE(description, ''::text)) public.gin_trgm_ops);


--
-- Name: idx_listings_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_location ON marketplace_schema.listings USING btree (latitude, longitude);


--
-- Name: idx_listings_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_price ON marketplace_schema.listings USING btree (price_per_unit);


--
-- Name: idx_listings_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_seller ON marketplace_schema.listings USING btree (seller_id);


--
-- Name: idx_listings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_status ON marketplace_schema.listings USING btree (status);


--
-- Name: idx_listings_status_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_status_created_at ON marketplace_schema.listings USING btree (status, created_at DESC);


--
-- Name: idx_listings_title_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_title_trgm ON marketplace_schema.listings USING gin (lower((title)::text) public.gin_trgm_ops);


--
-- Name: idx_price_update_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_price_update_created_at ON marketplace_schema.listing_price_update_proposals USING btree (created_at);


--
-- Name: idx_price_update_listing_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_price_update_listing_status ON marketplace_schema.listing_price_update_proposals USING btree (listing_id, status);


--
-- Name: idx_price_update_seller_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_price_update_seller_status ON marketplace_schema.listing_price_update_proposals USING btree (seller_id, status);


--
-- Name: idx_reviews_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_created_at ON marketplace_schema.reviews USING btree (created_at DESC);


--
-- Name: idx_reviews_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_listing ON marketplace_schema.reviews USING btree (listing_id);


--
-- Name: idx_reviews_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_rating ON marketplace_schema.reviews USING btree (rating);


--
-- Name: idx_reviews_reviewer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_reviewer_id ON marketplace_schema.reviews USING btree (reviewer_id);


--
-- Name: idx_reviews_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_seller ON marketplace_schema.reviews USING btree (seller_id);


--
-- Name: idx_saved_listings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_listings_user ON marketplace_schema.saved_listings USING btree (user_id);


--
-- Name: idx_seller_ratings_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seller_ratings_seller_id ON marketplace_schema.seller_ratings USING btree (seller_id);


--
-- Name: idx_wishlists_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wishlists_created_at ON marketplace_schema.wishlists USING btree (created_at DESC);


--
-- Name: idx_wishlists_listing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wishlists_listing_id ON marketplace_schema.wishlists USING btree (listing_id);


--
-- Name: idx_wishlists_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wishlists_user_id ON marketplace_schema.wishlists USING btree (user_id);


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES marketplace_schema.categories(id);


--
-- Name: listing_images listing_images_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.listing_images
    ADD CONSTRAINT listing_images_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES marketplace_schema.listings(id) ON DELETE CASCADE;


--
-- Name: listing_price_update_proposals listing_price_update_proposals_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.listing_price_update_proposals
    ADD CONSTRAINT listing_price_update_proposals_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES marketplace_schema.listings(id) ON DELETE CASCADE;


--
-- Name: listings listings_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.listings
    ADD CONSTRAINT listings_category_id_fkey FOREIGN KEY (category_id) REFERENCES marketplace_schema.categories(id);


--
-- Name: reviews reviews_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.reviews
    ADD CONSTRAINT reviews_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES marketplace_schema.listings(id) ON DELETE CASCADE;


--
-- Name: saved_listings saved_listings_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.saved_listings
    ADD CONSTRAINT saved_listings_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES marketplace_schema.listings(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY marketplace_schema.wishlists
    ADD CONSTRAINT wishlists_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES marketplace_schema.listings(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict DKDYazc4XlFXQGMrsoCKHmxnpDzvpFdT1uJSMyr0PYqbMI5EMIdysdUCDbyq90H

