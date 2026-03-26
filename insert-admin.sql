-- Insert admin user with BCrypt hash for Admin@123
INSERT INTO users (id, email, password, enabled, account_non_expired, account_non_locked, credentials_non_expired)
VALUES (
    '55555555-5555-5555-5555-555555555555'::uuid,
    'admin@agrilink.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye7Ij.w9./FfC2HHCS8eY0qRgSYK.qZz.',
    true,
    true,
    true,
    true
) ON CONFLICT (id) DO NOTHING;

-- Assign ADMIN role to user
INSERT INTO user_roles (user_id, role_id)
SELECT '55555555-5555-5555-5555-555555555555'::uuid, id FROM roles WHERE name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Verify
SELECT COUNT(*) as admin_count FROM users WHERE email = 'admin@agrilink.com';
SELECT COUNT(*) as admin_roles FROM user_roles ur
JOIN users u ON ur.user_id = u.id
WHERE u.email = 'admin@agrilink.com';
