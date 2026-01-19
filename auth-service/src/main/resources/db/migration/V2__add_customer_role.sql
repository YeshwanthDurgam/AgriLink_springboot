-- V2: Add CUSTOMER role if not exists
INSERT INTO roles (name, description)
SELECT 'CUSTOMER', 'Customer role - can browse and purchase products'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'CUSTOMER');
