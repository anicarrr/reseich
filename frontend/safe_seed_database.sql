-- Safe ReSeich Database Seed Script for Supabase
-- This script checks if tables exist before trying to seed them
-- Run this ONLY after database_setup.sql has completed successfully

-- First, check if all required tables exist
DO $$
DECLARE
    missing_tables TEXT[];
    current_table TEXT;
    required_tables TEXT[] := ARRAY[
        'users', 'research_items', 'marketplace_listings', 'transactions', 
        'marketplace_access', 'chat_sessions', 'chat_messages', 'demo_usage'
    ];
BEGIN
    -- Check each required table
    FOREACH current_table IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = current_table
        ) THEN
            missing_tables := array_append(missing_tables, current_table);
        END IF;
    END LOOP;
    
    -- Report results
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'ERROR: Missing required tables: %. Please run clean_database_setup.sql first!', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: All required tables exist. Proceeding with seeding...';
    END IF;
END $$;

-- WARNING: This will delete all existing data!
-- Only run this on development/testing databases

-- Clear existing data (in correct order to respect foreign key constraints)
DO $$
BEGIN
    TRUNCATE TABLE chat_messages CASCADE;
    TRUNCATE TABLE chat_sessions CASCADE;
    TRUNCATE TABLE marketplace_access CASCADE;
    TRUNCATE TABLE transactions CASCADE;
    TRUNCATE TABLE marketplace_listings CASCADE;
    TRUNCATE TABLE research_items CASCADE;
    TRUNCATE TABLE demo_usage CASCADE;
    TRUNCATE TABLE users RESTART IDENTITY CASCADE;
    
    RAISE NOTICE 'Existing data cleared successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing data: %. Continuing...', SQLERRM;
END $$;

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

-- Check if users were inserted
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    RAISE NOTICE 'Inserted % users successfully', user_count;
END $$;

-- 2. Insert Sample Research Items (only if users exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        INSERT INTO research_items (id, user_id, title, description, research_type, research_depth, query, result_content, result_file_url, result_metadata, credits_used, status, tags, category, estimated_completion, completed_at, created_at) VALUES
        -- Alice's research
        ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'AI in Healthcare: Revolutionary Applications', 'Comprehensive analysis of AI applications transforming healthcare industry in 2024', 'public', 'full', 'AI healthcare trends machine learning diagnostics telemedicine', 'Detailed research on AI applications in healthcare including diagnostic imaging, drug discovery, personalized medicine, and telemedicine platforms.', 'https://storage.example.com/research/ai-healthcare-2024.pdf', '{"sources": 45, "pages": 28, "charts": 12, "citations": 89}', 15, 'completed', ARRAY['AI', 'Healthcare', 'Machine Learning', 'Diagnostics'], 'Healthcare', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days'),
        
        ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'DeFi Protocol Security Analysis', 'Security assessment of major DeFi protocols and smart contract vulnerabilities', 'public', 'full', 'DeFi security smart contracts vulnerabilities Uniswap Compound Aave', 'Comprehensive security analysis of top DeFi protocols including smart contract audits, vulnerability assessments, and risk mitigation strategies.', 'https://storage.example.com/research/defi-security-2024.pdf', '{"protocols_analyzed": 15, "vulnerabilities_found": 23, "risk_score": 7.2}', 20, 'completed', ARRAY['DeFi', 'Security', 'Smart Contracts', 'Blockchain'], 'Blockchain', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days'),
        
        ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Climate Tech Investment Landscape', 'Analysis of climate technology investments and emerging green tech solutions', 'public', 'simple', 'climate technology green tech carbon capture renewable energy investment', 'Overview of climate tech investment trends, focusing on carbon capture, renewable energy storage, and sustainable transportation technologies.', NULL, '{"sources": 25, "companies_analyzed": 50, "investment_volume": "$12.5B"}', 10, 'completed', ARRAY['Climate Tech', 'Investment', 'Sustainability', 'Green Energy'], 'Environment', NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 days');
        
        RAISE NOTICE 'Research items inserted successfully';
    ELSE
        RAISE NOTICE 'Skipping research items - no users found';
    END IF;
END $$;

-- 3. Insert Sample Marketplace Listings (only if research items exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM research_items LIMIT 1) THEN
        INSERT INTO marketplace_listings (id, research_id, user_id, price_sei, price_usd, description, preview_content, is_active, views_count, purchase_count, rating_average, rating_count, created_at) VALUES
        ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 50.00000000, 12.50, 'Comprehensive AI healthcare research with actionable insights', 'This research covers the latest AI applications in healthcare including diagnostic tools, treatment optimization, and patient care automation.', TRUE, 234, 15, 4.8, 12, NOW() - INTERVAL '5 days'),
        
        ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 75.00000000, 18.75, 'DeFi security analysis - Essential for protocol developers', 'Critical security insights for DeFi protocols including vulnerability assessments and mitigation strategies.', TRUE, 156, 8, 4.9, 7, NOW() - INTERVAL '3 days');
        
        RAISE NOTICE 'Marketplace listings inserted successfully';
    ELSE
        RAISE NOTICE 'Skipping marketplace listings - no research items found';
    END IF;
END $$;

-- 4. Insert Sample Transactions (only if users exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        INSERT INTO transactions (id, user_id, type, amount_sei, amount_usd, credits_amount, research_id, marketplace_listing_id, status, transaction_hash, sei_network_data, description, metadata, demo_ip, is_demo, created_at) VALUES
        -- Credit purchases
        ('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'credit_purchase', 100.00000000, 25.00, 100, NULL, NULL, 'completed', '0x1234567890abcdef1234567890abcdef12345678', '{"block_number": 1234567, "gas_used": 21000}', 'Credit purchase - 100 credits', '{"payment_method": "sei", "exchange_rate": 0.25}', NULL, FALSE, NOW() - INTERVAL '30 days'),
        
        ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'research_purchase', 0.00000000, 0.00, -15, '660e8400-e29b-41d4-a716-446655440001', NULL, 'completed', NULL, NULL, 'Research creation - AI Healthcare', '{"credits_deducted": 15}', NULL, FALSE, NOW() - INTERVAL '10 days');
        
        RAISE NOTICE 'Transactions inserted successfully';
    ELSE
        RAISE NOTICE 'Skipping transactions - no users found';
    END IF;
END $$;

-- 5. Insert Sample Chat Sessions (only if users exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        INSERT INTO chat_sessions (id, user_id, title, is_demo, demo_ip, message_count, created_at) VALUES
        ('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'AI Research Discussion', FALSE, NULL, 3, NOW() - INTERVAL '2 days'),
        ('aa0e8400-e29b-41d4-a716-446655440002', NULL, 'Demo Chat Session', TRUE, '192.168.1.100', 3, NOW() - INTERVAL '1 day');
        
        RAISE NOTICE 'Chat sessions inserted successfully';
    ELSE
        RAISE NOTICE 'Skipping chat sessions - no users found';
    END IF;
END $$;

-- 6. Insert Sample Chat Messages (only if chat sessions exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM chat_sessions LIMIT 1) THEN
        INSERT INTO chat_messages (id, session_id, content, is_user, message_type, metadata, created_at) VALUES
        ('bb0e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440001', 'I want to understand AI in healthcare. Can you help me research this?', TRUE, 'text', NULL, NOW() - INTERVAL '2 days'),
        ('bb0e8400-e29b-41d4-a716-446655440002', 'aa0e8400-e29b-41d4-a716-446655440001', 'I can help you research AI in healthcare. This is a rapidly evolving field with applications in diagnostics, treatment planning, and patient monitoring.', FALSE, 'text', NULL, NOW() - INTERVAL '2 days' + INTERVAL '1 minute'),
        ('bb0e8400-e29b-41d4-a716-446655440003', 'aa0e8400-e29b-41d4-a716-446655440002', 'Hello! This is a demo session. What would you like to research?', FALSE, 'text', '{"demo_mode": true}', NOW() - INTERVAL '1 day');
        
        RAISE NOTICE 'Chat messages inserted successfully';
    ELSE
        RAISE NOTICE 'Skipping chat messages - no chat sessions found';
    END IF;
END $$;

-- 7. Insert Sample Demo Usage
DO $$
BEGIN
    INSERT INTO demo_usage (id, ip_address, research_count, chat_message_count, first_visit_at, last_activity_at, is_blocked, created_at) VALUES
    ('cc0e8400-e29b-41d4-a716-446655440001', '192.168.1.100', 1, 6, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', FALSE, NOW() - INTERVAL '5 days'),
    ('cc0e8400-e29b-41d4-a716-446655440002', '192.168.1.101', 0, 3, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours', FALSE, NOW() - INTERVAL '3 days');
    
    RAISE NOTICE 'Demo usage data inserted successfully';
END $$;

-- Final verification and summary
DO $$
DECLARE
    current_table TEXT;
    record_count INTEGER;
    total_records INTEGER := 0;
BEGIN
    RAISE NOTICE '=== SEEDING COMPLETED ===';
    
    -- Check each table
    FOR current_table IN SELECT unnest(ARRAY['users', 'research_items', 'marketplace_listings', 'transactions', 'chat_sessions', 'chat_messages', 'demo_usage'])
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', current_table) INTO record_count;
        RAISE NOTICE '%: % records', current_table, record_count;
        total_records := total_records + record_count;
    END LOOP;
    
    RAISE NOTICE 'Total records inserted: %', total_records;
    RAISE NOTICE 'Database is ready for testing!';
END $$;
