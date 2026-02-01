-- =====================================================
-- AgriLink System Products Seed Data Script
-- Creates: AgriLink system user and system-managed products
-- =====================================================

-- =====================================================
-- AUTH SERVICE DATABASE (agrilink_auth)
-- =====================================================
\c agrilink_auth;

-- Create AgriLink System User (for managing products without specific farmers)
-- Password: AgriLink@2024 - BCrypt encoded
INSERT INTO users (id, email, phone, password, enabled, account_non_expired, account_non_locked, credentials_non_expired, created_at, updated_at) VALUES
('a0000000-0000-0000-0000-000000000000', 'products@agrilink.com', '+919000000000', '$2a$10$N9qo8uLOickgx2ZMRZoMye7Ij.w9./FfC2HHCS8eY0qRgSYK.qZz.', true, true, true, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Add FARMER role to AgriLink system user (so it can have listings)
INSERT INTO user_roles (user_id, role_id) VALUES
('a0000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- =====================================================
-- USER SERVICE DATABASE (agrilink_user)
-- =====================================================
\c agrilink_user;

-- AgriLink System User Profile
INSERT INTO user_profiles (id, user_id, first_name, last_name, date_of_birth, address, city, state, country, postal_code, profile_picture_url, bio, created_at, updated_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000000', 'AgriLink', 'Products', '2020-01-01', 'AgriLink Headquarters, Tech Park', 'Bangalore', 'Karnataka', 'India', '560001', 'https://ui-avatars.com/api/?name=AgriLink&background=16a34a&color=fff&size=200', 'Official AgriLink product management account. We ensure quality products from trusted sources reach you directly.', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- FARM SERVICE DATABASE (agrilink_farm)
-- =====================================================
\c agrilink_farm;

-- AgriLink Virtual Farm (for system-managed products)
INSERT INTO farms (id, farmer_id, name, description, location, total_area, area_unit, latitude, longitude, active, created_at, updated_at) VALUES
('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000000', 'AgriLink Direct Sourcing', 'Products sourced and quality-checked by AgriLink from multiple verified farmers across India.', 'Pan-India Sourcing Network', 1000.00, 'HECTARE', 20.5937, 78.9629, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MARKETPLACE SERVICE DATABASE (agrilink_marketplace)
-- =====================================================
\c agrilink_marketplace;

-- =====================================================
-- AgriLink System-Managed Listings (Products without specific farmers)
-- These are managed directly by AgriLink
-- =====================================================

-- Premium Combo Packs (AgriLink Exclusive)
INSERT INTO listings (id, seller_id, farm_id, category_id, title, description, crop_type, quantity, quantity_unit, price_per_unit, currency, minimum_order, harvest_date, expiry_date, location, latitude, longitude, organic_certified, quality_grade, status, view_count, average_rating, review_count, created_at, updated_at) VALUES
('a1a10001-a1a1-0001-a1a1-000000000001', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0001-eeee-0001-eeee-000000000001', 'AgriLink Fresh Vegetable Box - 5kg Assorted', 'Curated selection of 8-10 seasonal vegetables. Farm-fresh, handpicked and quality-checked. Perfect for weekly family needs. Includes leafy greens, root vegetables, and cooking essentials.', 'Mixed Vegetables', 500.00, 'BOX', 399.00, 'INR', 1.00, '2026-01-20', '2026-01-27', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A+', 'ACTIVE', 1234, 4.85, 156, NOW(), NOW()),

('a1a10002-a1a1-0002-a1a1-000000000002', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0002-eeee-0002-eeee-000000000002', 'AgriLink Premium Fruit Basket - 3kg Seasonal Mix', 'Handpicked premium seasonal fruits including mangoes, apples, pomegranates, and grapes. Gift-quality presentation. Perfect for special occasions or healthy snacking.', 'Mixed Fruits', 300.00, 'BOX', 699.00, 'INR', 1.00, '2026-01-20', '2026-01-30', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A+', 'ACTIVE', 987, 4.90, 134, NOW(), NOW()),

('a1a10003-a1a1-0003-a1a1-000000000003', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0003-eeee-0003-eeee-000000000003', 'AgriLink Healthy Grains Combo - 5kg Pack', 'Complete grain essentials: Basmati Rice (2kg), Whole Wheat Atta (2kg), Organic Oats (500g), Ragi Flour (500g). All organic and stone-ground.', 'Mixed Grains', 400.00, 'PACK', 549.00, 'INR', 1.00, '2025-12-01', '2026-06-01', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A+', 'ACTIVE', 756, 4.80, 98, NOW(), NOW()),

('a1a10004-a1a1-0004-a1a1-000000000004', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0004-eeee-0004-eeee-000000000004', 'AgriLink Dal Variety Pack - 4kg (8 types)', 'Complete protein pack with 500g each of: Toor, Moong, Masoor, Chana, Urad Dal, Kabuli Chana, Rajma, and Green Moong. Premium quality, hand-sorted.', 'Mixed Pulses', 350.00, 'PACK', 799.00, 'INR', 1.00, '2025-11-15', '2026-05-15', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A', 'ACTIVE', 645, 4.75, 87, NOW(), NOW()),

('a1a10005-a1a1-0005-a1a1-000000000005', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0005-eeee-0005-eeee-000000000005', 'AgriLink Premium Spice Collection - 12 Spices', 'Chef-curated spice box with: Red Chilli, Turmeric, Cumin, Coriander, Garam Masala, Black Pepper, Cardamom, Cinnamon, Cloves, Mustard Seeds, Fenugreek, and Bay Leaves.', 'Mixed Spices', 250.00, 'BOX', 899.00, 'INR', 1.00, '2025-12-01', '2026-12-01', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A+', 'ACTIVE', 534, 4.88, 76, NOW(), NOW()),

-- Ready-to-Cook Products
('a1a10006-a1a1-0006-a1a1-000000000006', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0007-eeee-0007-eeee-000000000007', 'AgriLink Farm-Fresh Salad Kit', 'Pre-washed and chopped salad ingredients: Lettuce, Cucumber, Cherry Tomatoes, Carrots, Bell Peppers, Olives. Comes with special dressing. Ready to serve!', 'Salad Mix', 200.00, 'PACK', 199.00, 'INR', 1.00, '2026-01-20', '2026-01-25', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A+', 'ACTIVE', 423, 4.70, 65, NOW(), NOW()),

('a1a10007-a1a1-0007-a1a1-000000000007', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0007-eeee-0007-eeee-000000000007', 'AgriLink Immunity Booster Pack', 'Natural immunity essentials: Organic Honey (500g), Fresh Turmeric (250g), Ginger (250g), Amla (500g), and Giloy. All certified organic.', 'Health Pack', 180.00, 'PACK', 599.00, 'INR', 1.00, '2026-01-15', '2026-03-15', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A+', 'ACTIVE', 567, 4.92, 89, NOW(), NOW()),

('a1a10008-a1a1-0008-a1a1-000000000008', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0006-eeee-0006-eeee-000000000006', 'AgriLink Pure Dairy Combo', 'Farm-fresh dairy: A2 Cow Milk (1L), Paneer (500g), Curd (500g), Desi Ghee (200ml). All from grass-fed cows. No preservatives.', 'Dairy Combo', 150.00, 'PACK', 449.00, 'INR', 1.00, '2026-01-20', '2026-01-28', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A+', 'ACTIVE', 389, 4.85, 72, NOW(), NOW()),

-- Subscription-style Products
('a1a10009-a1a1-0009-a1a1-000000000009', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0007-eeee-0007-eeee-000000000007', 'AgriLink Weekly Grocery Essentials', 'Complete weekly grocery pack: Rice (2kg), Atta (2kg), Dal (1kg), Cooking Oil (1L), Salt, Sugar, and 6 essential spices. One order for all your weekly needs!', 'Grocery Pack', 600.00, 'PACK', 999.00, 'INR', 1.00, '2025-12-15', '2026-06-15', 'Pan-India Delivery', 20.5937, 78.9629, false, 'A', 'ACTIVE', 834, 4.78, 145, NOW(), NOW()),

('a1a10010-a1a1-0010-a1a1-000000000010', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0007-eeee-0007-eeee-000000000007', 'AgriLink Baby Food Essentials', 'Certified organic baby food ingredients: Ragi Flour (250g), Rice Cereal (250g), Banana Powder (100g), Apple Puree (200g), Ghee (100ml). 6+ months safe.', 'Baby Food', 100.00, 'PACK', 399.00, 'INR', 1.00, '2026-01-10', '2026-04-10', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A+', 'ACTIVE', 267, 4.95, 56, NOW(), NOW()),

-- Regional Specialty Products
('a1a10011-a1a1-0011-a1a1-000000000011', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0002-eeee-0002-eeee-000000000002', 'Kashmir Premium Saffron Gift Box', 'Authentic Kashmiri Kesar (1g) in elegant gift packaging. Lab-tested for purity. Includes recipe booklet. Perfect for gifting or special occasions.', 'Saffron', 50.00, 'BOX', 999.00, 'INR', 1.00, '2025-11-01', '2027-11-01', 'Pan-India Delivery', 34.0837, 74.7973, true, 'A+', 'ACTIVE', 456, 4.98, 67, NOW(), NOW()),

('a1a10012-a1a1-0012-a1a1-000000000012', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0005-eeee-0005-eeee-000000000005', 'Kerala Spice Trail Collection', 'Premium South Indian spices: Black Pepper (100g), Cardamom (50g), Cloves (50g), Cinnamon (100g), Star Anise (50g), Nutmeg (5 pcs). Sourced from Wayanad.', 'Kerala Spices', 120.00, 'BOX', 1299.00, 'INR', 1.00, '2025-12-10', '2026-12-10', 'Pan-India Delivery', 11.2588, 75.7804, true, 'A+', 'ACTIVE', 312, 4.90, 45, NOW(), NOW()),

('a1a10013-a1a1-0013-a1a1-000000000013', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0002-eeee-0002-eeee-000000000002', 'Ratnagiri Alphonso Mangoes - Premium', 'GI-tagged Ratnagiri Alphonso mangoes. 12 pieces per box (approximately 3kg). Naturally ripened, no carbide. Tracked from farm to doorstep.', 'Alphonso Mango', 200.00, 'BOX', 1499.00, 'INR', 1.00, '2026-04-01', '2026-06-30', 'Pan-India Delivery', 16.9902, 73.3120, true, 'A+', 'ACTIVE', 789, 4.92, 134, NOW(), NOW()),

('a1a10014-a1a1-0014-a1a1-000000000014', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0003-eeee-0003-eeee-000000000003', 'Assam Black Rice (Forbidden Rice)', 'Rare black rice from Assam. High in antioxidants and fiber. Naturally colored, no dyes. Great for health-conscious cooking.', 'Black Rice', 100.00, 'KG', 280.00, 'INR', 0.50, '2025-11-20', '2026-05-20', 'Pan-India Delivery', 26.2006, 92.9376, true, 'A+', 'ACTIVE', 234, 4.80, 38, NOW(), NOW()),

('a1a10015-a1a1-0015-a1a1-000000000015', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0007-eeee-0007-eeee-000000000007', 'Himalayan Pink Salt & Rock Sugar Combo', 'Pure Himalayan Pink Salt (500g) and Mishri/Rock Sugar (500g). Unprocessed and mineral-rich. Perfect for healthy cooking.', 'Salt & Sugar', 200.00, 'PACK', 299.00, 'INR', 1.00, '2025-12-01', '2027-12-01', 'Pan-India Delivery', 31.1048, 77.1734, true, 'A', 'ACTIVE', 178, 4.75, 42, NOW(), NOW()),

-- Eco-Friendly Products
('a1a10016-a1a1-0016-a1a1-000000000016', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0008-eeee-0008-eeee-000000000008', 'AgriLink Kitchen Garden Starter Kit', 'Everything to start your kitchen garden: 10 seed varieties (tomato, chilli, spinach, coriander, etc.), organic soil mix (5kg), 10 biodegradable pots, and growing guide.', 'Garden Kit', 150.00, 'KIT', 499.00, 'INR', 1.00, '2025-10-01', '2026-10-01', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A', 'ACTIVE', 345, 4.82, 54, NOW(), NOW()),

('a1a10017-a1a1-0017-a1a1-000000000017', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0008-eeee-0008-eeee-000000000008', 'Organic Fertilizer & Compost Combo', 'Natural plant nutrition: Vermicompost (2kg), Neem Cake (1kg), Bone Meal (500g), Seaweed Extract (250ml). Chemical-free gardening essentials.', 'Fertilizer Pack', 300.00, 'PACK', 349.00, 'INR', 1.00, '2025-09-01', '2026-09-01', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A', 'ACTIVE', 189, 4.70, 32, NOW(), NOW()),

-- Special Diet Products
('a1a10018-a1a1-0018-a1a1-000000000018', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0007-eeee-0007-eeee-000000000007', 'AgriLink Diabetic-Friendly Pack', 'Low glycemic index foods: Bajra Atta (1kg), Ragi Flour (1kg), Quinoa (500g), Flax Seeds (250g), Karela Powder (100g). Certified by nutritionists.', 'Health Pack', 120.00, 'PACK', 649.00, 'INR', 1.00, '2025-12-15', '2026-06-15', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A+', 'ACTIVE', 267, 4.88, 48, NOW(), NOW()),

('a1a10019-a1a1-0019-a1a1-000000000019', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0007-eeee-0007-eeee-000000000007', 'AgriLink Protein Power Pack', 'Plant-based protein sources: Soya Chunks (500g), Peanuts (500g), Chana (500g), Moong Dal (500g), Quinoa (250g). High-protein vegetarian foods.', 'Protein Pack', 180.00, 'PACK', 549.00, 'INR', 1.00, '2025-12-01', '2026-06-01', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A', 'ACTIVE', 312, 4.76, 56, NOW(), NOW()),

('a1a10020-a1a1-0020-a1a1-000000000020', 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'eeee0007-eeee-0007-eeee-000000000007', 'AgriLink Gluten-Free Essentials', 'Complete gluten-free kit: Rice Flour (1kg), Besan (500g), Jowar Atta (500g), Corn Flour (250g), Tapioca Pearls (250g). Perfect for celiac-friendly cooking.', 'Gluten-Free Pack', 100.00, 'PACK', 449.00, 'INR', 1.00, '2025-12-20', '2026-06-20', 'Pan-India Delivery', 20.5937, 78.9629, true, 'A', 'ACTIVE', 156, 4.82, 34, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- LISTING IMAGES for AgriLink Products
-- =====================================================
INSERT INTO listing_images (id, listing_id, image_url, is_primary, sort_order, created_at) VALUES
(uuid_generate_v4(), 'a1a10001-a1a1-0001-a1a1-000000000001', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10002-a1a1-0002-a1a1-000000000002', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10003-a1a1-0003-a1a1-000000000003', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10004-a1a1-0004-a1a1-000000000004', 'https://images.unsplash.com/photo-1515543904323-87f7c86e6bc3?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10005-a1a1-0005-a1a1-000000000005', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10006-a1a1-0006-a1a1-000000000006', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10007-a1a1-0007-a1a1-000000000007', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10008-a1a1-0008-a1a1-000000000008', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10009-a1a1-0009-a1a1-000000000009', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10010-a1a1-0010-a1a1-000000000010', 'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10011-a1a1-0011-a1a1-000000000011', 'https://images.unsplash.com/photo-1599909533402-72d7a8208e8a?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10012-a1a1-0012-a1a1-000000000012', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10013-a1a1-0013-a1a1-000000000013', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10014-a1a1-0014-a1a1-000000000014', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10015-a1a1-0015-a1a1-000000000015', 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10016-a1a1-0016-a1a1-000000000016', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10017-a1a1-0017-a1a1-000000000017', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10018-a1a1-0018-a1a1-000000000018', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10019-a1a1-0019-a1a1-000000000019', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400', true, 0, NOW()),
(uuid_generate_v4(), 'a1a10020-a1a1-0020-a1a1-000000000020', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400', true, 0, NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- END OF AGRILINK SYSTEM PRODUCTS SEED DATA
-- =====================================================
