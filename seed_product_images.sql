-- Seed product_images table with solar/energy-relevant Unsplash photos
-- Run in: Supabase Dashboard → SQL Editor

INSERT INTO product_images (product_id, url, is_primary, sort_order) VALUES

-- 5kVA Hybrid Solar Inverter
('b1111111-1111-4111-8111-111111111111', 'https://images.unsplash.com/photo-1629904853716-f0bc54eea481?w=800&q=80', true, 0),

-- 10kWh Lithium Battery
('b2222222-2222-4222-8222-222222222222', 'https://images.unsplash.com/photo-1600091166971-7f9faad6c498?w=800&q=80', true, 0),

-- 6kW Rooftop Solar Package
('b3333333-3333-4333-8333-333333333333', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', true, 0),

-- Solar Water Pump 1.5HP
('b4444444-4444-4444-8444-444444444444', 'https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=800&q=80', true, 0),

-- 6m³ Household Biogas Digester
('b5555555-5555-4555-8555-555555555555', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80', true, 0),

-- 10m³ Farm Biogas System
('b6666666-6666-4666-8666-666666666666', 'https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=800&q=80', true, 0),

-- Biogas Cooking Kit
('b7777777-7777-4777-8777-777777777777', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80', true, 0),

-- Institutional Biogas Plant 25m³
('b8888888-8888-4888-8888-888888888888', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80', true, 0),

-- 1.5kW Solar Home System
('b9999999-9999-4999-8999-999999999999', 'https://images.unsplash.com/photo-1591919052319-f1d56b7a2a4f?w=800&q=80', true, 0),

-- 3kW Solar Home System
('baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80', true, 0),

-- Portable Solar Kit 600W
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'https://images.unsplash.com/photo-1595437193398-f24279553f4f?w=800&q=80', true, 0),

-- Solar Borehole Pump 2HP
('bccccccc-cccc-4ccc-8ccc-cccccccccccc', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80', true, 0),

-- 8kVA Smart Hybrid Inverter
('bddddddd-dddd-4ddd-8ddd-dddddddddddd', 'https://images.unsplash.com/photo-1629904853716-f0bc54eea481?w=800&q=80', true, 0),

-- 15kWh Lithium Storage Bank
('beeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80', true, 0),

-- 25kW Commercial Solar System
('bfffffff-ffff-4fff-8fff-ffffffffffff', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', true, 0),

-- 12kW Rooftop Solar Package
('c0000000-0000-4000-8000-000000000000', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', true, 0)

ON CONFLICT DO NOTHING;
