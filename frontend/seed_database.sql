-- ReSeich Database Seed Script for Supabase
-- Run this script after database_setup.sql to populate tables with sample data for testing
-- This script includes realistic test data for all tables with proper relationships

-- WARNING: This will delete all existing data!
-- Only run this on development/testing databases

-- Clear existing data (in correct order to respect foreign key constraints)
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE chat_sessions CASCADE;
TRUNCATE TABLE marketplace_access CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE marketplace_listings CASCADE;
TRUNCATE TABLE research_items CASCADE;
TRUNCATE TABLE demo_usage CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- 1. Insert Sample Users
INSERT INTO users (id, wallet_address, email, username, display_name, avatar_url, credits, is_demo_user, demo_ip, research_count, created_at) VALUES
-- Regular users with wallets
('550e8400-e29b-41d4-a716-446655440001', '0x742d35Cc6634C0532925a3b8D22544Dd9e745fFd', 'alice@example.com', 'alice_researcher', 'Alice Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', 250, FALSE, NULL, 3, NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440002', '0x8ba1f109551bD432803012645Hac136c8D1234Ef', 'bob@example.com', 'bob_crypto', 'Bob Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', 150, FALSE, NULL, 2, NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440003', '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 'carol@example.com', 'carol_ai', 'Carol Martinez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol', 300, FALSE, NULL, 5, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440004', '0x6B175474E89094C44Da98b954EedeAC495271d0F', 'david@example.com', 'david_finance', 'David Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', 500, FALSE, NULL, 8, NOW() - INTERVAL '15 days'),
-- Demo users
('550e8400-e29b-41d4-a716-446655440005', '0x0000000000000000000000000000000000000001', NULL, 'demo_user_1', 'Demo User 1', NULL, 50, TRUE, '192.168.1.100', 1, NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440006', '0x0000000000000000000000000000000000000002', NULL, 'demo_user_2', 'Demo User 2', NULL, 25, TRUE, '192.168.1.101', 0, NOW() - INTERVAL '3 days');

-- 2. Insert Sample Research Items
INSERT INTO research_items (id, user_id, title, description, research_type, research_depth, query, result_content, result_file_url, result_metadata, credits_used, status, tags, category, estimated_completion, completed_at, created_at) VALUES
-- Alice's research
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'AI in Healthcare: Revolutionary Applications', 'Comprehensive analysis of AI applications transforming healthcare industry in 2024', 'public', 'full', 'AI healthcare trends machine learning diagnostics telemedicine', 'Detailed research on AI applications in healthcare including diagnostic imaging, drug discovery, personalized medicine, and telemedicine platforms. Key findings include 40% improvement in diagnostic accuracy and 60% reduction in drug discovery timelines.', 'https://storage.example.com/research/ai-healthcare-2024.pdf', '{"sources": 45, "pages": 28, "charts": 12, "citations": 89}', 15, 'completed', ARRAY['AI', 'Healthcare', 'Machine Learning', 'Diagnostics'], 'Healthcare', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days'),

('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Quantum Computing Market Analysis', 'Market trends and investment opportunities in quantum computing sector', 'private', 'max', 'quantum computing market trends investment opportunities IBM Google', 'In-depth analysis of quantum computing market including key players, investment trends, technological breakthroughs, and market projections through 2030.', 'https://storage.example.com/research/quantum-market-2024.pdf', '{"sources": 67, "pages": 42, "financial_models": 8, "projections": 15}', 25, 'completed', ARRAY['Quantum Computing', 'Investment', 'Technology', 'Market Analysis'], 'Technology', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '7 days'),

-- Bob's research
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'DeFi Protocol Security Analysis', 'Security assessment of major DeFi protocols and smart contract vulnerabilities', 'public', 'full', 'DeFi security smart contracts vulnerabilities Uniswap Compound Aave', 'Comprehensive security analysis of top DeFi protocols including smart contract audits, vulnerability assessments, and risk mitigation strategies.', 'https://storage.example.com/research/defi-security-2024.pdf', '{"protocols_analyzed": 15, "vulnerabilities_found": 23, "risk_score": 7.2}', 20, 'completed', ARRAY['DeFi', 'Security', 'Smart Contracts', 'Blockchain'], 'Blockchain', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days'),

-- Carol's research
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Climate Tech Investment Landscape', 'Analysis of climate technology investments and emerging green tech solutions', 'public', 'simple', 'climate technology green tech carbon capture renewable energy investment', 'Overview of climate tech investment trends, focusing on carbon capture, renewable energy storage, and sustainable transportation technologies.', NULL, '{"sources": 25, "companies_analyzed": 50, "investment_volume": "$12.5B"}', 10, 'completed', ARRAY['Climate Tech', 'Investment', 'Sustainability', 'Green Energy'], 'Environment', NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 days'),

-- David's research (in progress)
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'Central Bank Digital Currencies (CBDCs)', 'Global analysis of CBDC implementations and their economic impact', 'private', 'max', 'CBDC central bank digital currency monetary policy economic impact China EU USA', NULL, NULL, NULL, 30, 'processing', ARRAY['CBDC', 'Monetary Policy', 'Digital Currency', 'Economics'], 'Finance', NOW() + INTERVAL '2 hours', NULL, NOW() - INTERVAL '1 hour'),

-- Demo user research
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 'Demo Research: Web3 Gaming', 'Sample research on Web3 gaming trends for demonstration', 'public', 'simple', 'Web3 gaming NFT blockchain games play-to-earn', 'Sample research content for demonstration purposes. Web3 gaming market overview and trends.', NULL, '{"sources": 10, "games_analyzed": 20}', 5, 'completed', ARRAY['Web3', 'Gaming', 'NFT'], 'Gaming', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days');

-- 3. Insert Sample Marketplace Listings
INSERT INTO marketplace_listings (id, research_id, user_id, price_sei, price_usd, description, preview_content, is_active, views_count, purchase_count, rating_average, rating_count, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 50.00000000, 12.50, 'Comprehensive AI healthcare research with actionable insights', 'This research covers the latest AI applications in healthcare including diagnostic tools, treatment optimization, and patient care automation. Preview includes executive summary and key findings from 45 sources.', TRUE, 234, 15, 4.8, 12, NOW() - INTERVAL '5 days'),

('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 75.00000000, 18.75, 'DeFi security analysis - Essential for protocol developers', 'Critical security insights for DeFi protocols including vulnerability assessments and mitigation strategies. Essential reading for developers and investors.', TRUE, 156, 8, 4.9, 7, NOW() - INTERVAL '3 days'),

('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 25.00000000, 6.25, 'Climate tech investment opportunities report', 'Detailed analysis of emerging climate technologies and investment opportunities in the green tech sector.', TRUE, 89, 5, 4.6, 4, NOW() - INTERVAL '2 days'),

('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 10.00000000, 2.50, 'Web3 gaming trends - Demo research', 'Sample research on Web3 gaming market for demonstration purposes.', TRUE, 45, 2, 4.0, 2, NOW() - INTERVAL '1 day');

-- 4. Insert Sample Transactions
INSERT INTO transactions (id, user_id, type, amount_sei, amount_usd, credits_amount, research_id, marketplace_listing_id, status, transaction_hash, sei_network_data, description, metadata, demo_ip, is_demo, created_at) VALUES
-- Credit purchases
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'credit_purchase', 100.00000000, 25.00, 100, NULL, NULL, 'completed', '0x1234567890abcdef1234567890abcdef12345678', '{"block_number": 1234567, "gas_used": 21000}', 'Credit purchase - 100 credits', '{"payment_method": "sei", "exchange_rate": 0.25}', NULL, FALSE, NOW() - INTERVAL '30 days'),

('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'credit_purchase', 150.00000000, 37.50, 150, NULL, NULL, 'completed', '0x2345678901bcdef12345678901bcdef123456789', '{"block_number": 1234580, "gas_used": 21000}', 'Credit purchase - 150 credits', '{"payment_method": "sei", "exchange_rate": 0.25}', NULL, FALSE, NOW() - INTERVAL '25 days'),

-- Research purchases (credits spent)
('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'research_purchase', 0.00000000, 0.00, -15, '660e8400-e29b-41d4-a716-446655440001', NULL, 'completed', NULL, NULL, 'Research creation - AI Healthcare', '{"credits_deducted": 15}', NULL, FALSE, NOW() - INTERVAL '10 days'),

('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'research_purchase', 0.00000000, 0.00, -20, '660e8400-e29b-41d4-a716-446655440003', NULL, 'completed', NULL, NULL, 'Research creation - DeFi Security', '{"credits_deducted": 20}', NULL, FALSE, NOW() - INTERVAL '3 days'),

-- Marketplace purchases
('880e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'marketplace_purchase', 50.00000000, 12.50, NULL, '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'completed', '0x3456789012cdef123456789012cdef1234567890', '{"block_number": 1234600, "gas_used": 25000}', 'Purchased AI Healthcare research', '{"buyer_id": "550e8400-e29b-41d4-a716-446655440002"}', NULL, FALSE, NOW() - INTERVAL '4 days'),

('880e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'marketplace_purchase', 75.00000000, 18.75, NULL, '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', 'completed', '0x4567890123def1234567890123def12345678901', '{"block_number": 1234620, "gas_used": 25000}', 'Purchased DeFi Security research', '{"buyer_id": "550e8400-e29b-41d4-a716-446655440003"}', NULL, FALSE, NOW() - INTERVAL '2 days'),

-- Marketplace sales (revenue for sellers)
('880e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'marketplace_sale', 45.00000000, 11.25, NULL, '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'completed', '0x3456789012cdef123456789012cdef1234567890', '{"block_number": 1234600, "gas_used": 25000}', 'Sale of AI Healthcare research (90% of 50 SEI)', '{"seller_fee": "10%", "net_amount": 45}', NULL, FALSE, NOW() - INTERVAL '4 days'),

-- Demo transactions
('880e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440005', 'research_purchase', 0.00000000, 0.00, -5, '660e8400-e29b-41d4-a716-446655440006', NULL, 'completed', NULL, NULL, 'Demo research creation', '{"demo_usage": true}', '192.168.1.100', TRUE, NOW() - INTERVAL '2 days');

-- 5. Insert Sample Marketplace Access
INSERT INTO marketplace_access (id, listing_id, research_id, user_id, transaction_id, access_type, demo_ip, is_demo, created_at) VALUES
('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440005', 'purchased', NULL, FALSE, NOW() - INTERVAL '4 days'),

('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440006', 'purchased', NULL, FALSE, NOW() - INTERVAL '2 days'),

('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', NULL, 'granted', NULL, FALSE, NOW() - INTERVAL '1 day'),

-- Demo access
('990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440006', NULL, NULL, 'demo', '192.168.1.100', TRUE, NOW() - INTERVAL '1 day');

-- 6. Insert Sample Chat Sessions
INSERT INTO chat_sessions (id, user_id, title, is_demo, demo_ip, message_count, created_at) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'AI Research Discussion', FALSE, NULL, 5, NOW() - INTERVAL '2 days'),
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'DeFi Security Questions', FALSE, NULL, 8, NOW() - INTERVAL '1 day'),
('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Climate Tech Investment Strategy', FALSE, NULL, 3, NOW() - INTERVAL '3 hours'),
('aa0e8400-e29b-41d4-a716-446655440004', NULL, 'Demo Chat Session', TRUE, '192.168.1.100', 6, NOW() - INTERVAL '1 day');

-- 7. Insert Sample Chat Messages
INSERT INTO chat_messages (id, session_id, content, is_user, message_type, metadata, created_at) VALUES
-- Alice's AI Research Discussion
('bb0e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440001', 'I want to understand the current state of AI in healthcare. Can you help me research this topic?', TRUE, 'text', NULL, NOW() - INTERVAL '2 days'),
('bb0e8400-e29b-41d4-a716-446655440002', 'aa0e8400-e29b-41d4-a716-446655440001', 'I can help you research AI in healthcare. This is a rapidly evolving field with applications in diagnostics, treatment planning, drug discovery, and patient monitoring. Would you like me to focus on any specific area?', FALSE, 'text', NULL, NOW() - INTERVAL '2 days' + INTERVAL '1 minute'),
('bb0e8400-e29b-41d4-a716-446655440003', 'aa0e8400-e29b-41d4-a716-446655440001', 'Focus on diagnostic applications and their accuracy compared to traditional methods', TRUE, 'text', NULL, NOW() - INTERVAL '2 days' + INTERVAL '2 minutes'),
('bb0e8400-e29b-41d4-a716-446655440004', 'aa0e8400-e29b-41d4-a716-446655440001', 'AI diagnostic tools have shown remarkable improvements in accuracy. For example, AI systems for medical imaging can achieve diagnostic accuracy rates of 90-95% in some specialties, compared to 80-85% for traditional methods. Key areas include radiology, pathology, and dermatology.', FALSE, 'markdown', '{"sources": ["Nature Medicine", "NEJM AI"]}', NOW() - INTERVAL '2 days' + INTERVAL '3 minutes'),
('bb0e8400-e29b-41d4-a716-446655440005', 'aa0e8400-e29b-41d4-a716-446655440001', 'That''s impressive! Can you create a comprehensive research report on this topic?', TRUE, 'text', NULL, NOW() - INTERVAL '2 days' + INTERVAL '4 minutes'),

-- Bob's DeFi Security Questions  
('bb0e8400-e29b-41d4-a716-446655440006', 'aa0e8400-e29b-41d4-a716-446655440002', 'What are the most common security vulnerabilities in DeFi protocols?', TRUE, 'text', NULL, NOW() - INTERVAL '1 day'),
('bb0e8400-e29b-41d4-a716-446655440007', 'aa0e8400-e29b-41d4-a716-446655440002', 'The most common DeFi security vulnerabilities include: 1) Smart contract bugs and logical errors, 2) Flash loan attacks, 3) Oracle manipulation, 4) Governance attacks, 5) Front-running and MEV exploitation. Each category has specific attack vectors and mitigation strategies.', FALSE, 'markdown', '{"vulnerability_count": 5}', NOW() - INTERVAL '1 day' + INTERVAL '30 seconds'),
('bb0e8400-e29b-41d4-a716-446655440008', 'aa0e8400-e29b-41d4-a716-446655440002', 'Can you analyze the security of major protocols like Uniswap, Compound, and Aave?', TRUE, 'text', NULL, NOW() - INTERVAL '1 day' + INTERVAL '1 minute'),

-- Demo chat messages
('bb0e8400-e29b-41d4-a716-446655440009', 'aa0e8400-e29b-41d4-a716-446655440004', 'Hello! I''m trying out this demo. What can you help me research?', TRUE, 'text', NULL, NOW() - INTERVAL '1 day'),
('bb0e8400-e29b-41d4-a716-446655440010', 'aa0e8400-e29b-41d4-a716-446655440004', 'Welcome to ReSeich! I can help you research any topic. Popular areas include technology trends, market analysis, academic research, and industry insights. What interests you?', FALSE, 'text', '{"demo_mode": true}', NOW() - INTERVAL '1 day' + INTERVAL '30 seconds'),
('bb0e8400-e29b-41d4-a716-446655440011', 'aa0e8400-e29b-41d4-a716-446655440004', 'I''m interested in Web3 gaming trends', TRUE, 'text', NULL, NOW() - INTERVAL '1 day' + INTERVAL '1 minute');

-- 8. Insert Sample Demo Usage
INSERT INTO demo_usage (id, ip_address, research_count, chat_message_count, first_visit_at, last_activity_at, is_blocked, created_at) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', '192.168.1.100', 1, 6, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', FALSE, NOW() - INTERVAL '5 days'),
('cc0e8400-e29b-41d4-a716-446655440002', '192.168.1.101', 0, 3, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours', FALSE, NOW() - INTERVAL '3 days'),
('cc0e8400-e29b-41d4-a716-446655440003', '10.0.0.50', 1, 10, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', TRUE, NOW() - INTERVAL '7 days'),
('cc0e8400-e29b-41d4-a716-446655440004', '172.16.0.25', 0, 8, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 hour', FALSE, NOW() - INTERVAL '2 days');

-- Update user credits based on transactions
UPDATE users SET credits = 235 WHERE id = '550e8400-e29b-41d4-a716-446655440001'; -- Alice: 100 + 150 initial - 15 research
UPDATE users SET credits = 130 WHERE id = '550e8400-e29b-41d4-a716-446655440002'; -- Bob: 150 initial - 20 research  
UPDATE users SET credits = 300 WHERE id = '550e8400-e29b-41d4-a716-446655440003'; -- Carol: 300 initial (no purchases yet)
UPDATE users SET credits = 470 WHERE id = '550e8400-e29b-41d4-a716-446655440004'; -- David: 500 initial - 30 processing

-- Update marketplace listing stats
UPDATE marketplace_listings SET 
    views_count = 234, 
    purchase_count = 15, 
    rating_average = 4.8, 
    rating_count = 12 
WHERE id = '770e8400-e29b-41d4-a716-446655440001';

UPDATE marketplace_listings SET 
    views_count = 156, 
    purchase_count = 8, 
    rating_average = 4.9, 
    rating_count = 7 
WHERE id = '770e8400-e29b-41d4-a716-446655440002';

-- Update chat session message counts
UPDATE chat_sessions SET message_count = 5 WHERE id = 'aa0e8400-e29b-41d4-a716-446655440001';
UPDATE chat_sessions SET message_count = 8 WHERE id = 'aa0e8400-e29b-41d4-a716-446655440002';
UPDATE chat_sessions SET message_count = 3 WHERE id = 'aa0e8400-e29b-41d4-a716-446655440003';
UPDATE chat_sessions SET message_count = 6 WHERE id = 'aa0e8400-e29b-41d4-a716-446655440004';

-- Verify data integrity and show completion message
DO $$
BEGIN
    RAISE NOTICE 'Data seeding completed successfully!';
    RAISE NOTICE 'Database is ready for testing.';
END $$;

-- Show summary of seeded data
SELECT 
    'Users' as table_name, 
    COUNT(*) as record_count,
    COUNT(*) FILTER (WHERE is_demo_user = TRUE) as demo_users,
    COUNT(*) FILTER (WHERE is_demo_user = FALSE) as regular_users
FROM users
UNION ALL
SELECT 
    'Research Items' as table_name, 
    COUNT(*) as record_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'processing') as processing
FROM research_items
UNION ALL
SELECT 
    'Marketplace Listings' as table_name, 
    COUNT(*) as record_count,
    COUNT(*) FILTER (WHERE is_active = TRUE) as active_listings,
    NULL as processing
FROM marketplace_listings
UNION ALL
SELECT 
    'Transactions' as table_name, 
    COUNT(*) as record_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE is_demo = TRUE) as demo_transactions
FROM transactions
UNION ALL
SELECT 
    'Chat Sessions' as table_name, 
    COUNT(*) as record_count,
    COUNT(*) FILTER (WHERE is_demo = FALSE) as regular_sessions,
    COUNT(*) FILTER (WHERE is_demo = TRUE) as demo_sessions
FROM chat_sessions
UNION ALL
SELECT 
    'Chat Messages' as table_name, 
    COUNT(*) as record_count,
    COUNT(*) FILTER (WHERE is_user = TRUE) as user_messages,
    COUNT(*) FILTER (WHERE is_user = FALSE) as ai_messages
FROM chat_messages;
