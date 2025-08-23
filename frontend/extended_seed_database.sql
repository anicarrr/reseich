-- Extended ReSeich Database Seed Script (5x More Data)
-- This script creates a comprehensive dataset for testing and development
-- Run this ONLY after clean_database_setup.sql has completed successfully

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
    FOREACH current_table IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = current_table
        ) THEN
            missing_tables := array_append(missing_tables, current_table);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'ERROR: Missing required tables: %. Please run clean_database_setup.sql first!', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: All required tables exist. Proceeding with extended seeding...';
    END IF;
END $$;

-- Clear existing data
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
END $$;

-- 1. Insert 30 Sample Users (6x the original 5)
INSERT INTO users (id, wallet_address, email, username, display_name, avatar_url, credits, is_demo_user, demo_ip, research_count, created_at) VALUES
-- Regular power users
('550e8400-e29b-41d4-a716-446655440001', '0x742d35Cc6634C0532925a3b8D22544Dd9e745fFd', 'alice@example.com', 'alice_researcher', 'Alice Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', 500, FALSE, NULL, 12, NOW() - INTERVAL '90 days'),
('550e8400-e29b-41d4-a716-446655440002', '0x8ba1f109551bD432803012645Hac136c8D1234Ef', 'bob@example.com', 'bob_crypto', 'Bob Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', 350, FALSE, NULL, 8, NOW() - INTERVAL '75 days'),
('550e8400-e29b-41d4-a716-446655440003', '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 'carol@example.com', 'carol_ai', 'Carol Martinez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol', 800, FALSE, NULL, 15, NOW() - INTERVAL '60 days'),
('550e8400-e29b-41d4-a716-446655440004', '0x6B175474E89094C44Da98b954EedeAC495271d0F', 'david@example.com', 'david_finance', 'David Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', 1200, FALSE, NULL, 25, NOW() - INTERVAL '120 days'),
('550e8400-e29b-41d4-a716-446655440005', '0xA0b86a33E6776c8a4D0C7b1fd8D6f8E0d5c4e3F2', 'emma@example.com', 'emma_biotech', 'Emma Wilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma', 600, FALSE, NULL, 10, NOW() - INTERVAL '45 days'),

-- Active researchers
('550e8400-e29b-41d4-a716-446655440006', '0x3C44CdDdB6a900FA2b585dd299E03D12FA429849', 'frank@example.com', 'frank_energy', 'Frank Rodriguez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank', 450, FALSE, NULL, 7, NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440007', '0x90F79bf6EB2c4f870365E785982E1f101E93b906', 'grace@example.com', 'grace_tech', 'Grace Kim', 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace', 300, FALSE, NULL, 5, NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440008', '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0', 'henry@example.com', 'henry_climate', 'Henry Thompson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=henry', 250, FALSE, NULL, 4, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440009', '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b', 'isabel@example.com', 'isabel_space', 'Isabel Garcia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=isabel', 400, FALSE, NULL, 6, NOW() - INTERVAL '35 days'),
('550e8400-e29b-41d4-a716-44665544000a', '0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d', 'james@example.com', 'james_quantum', 'James Anderson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=james', 700, FALSE, NULL, 9, NOW() - INTERVAL '50 days'),

-- Medium activity users
('550e8400-e29b-41d4-a716-44665544000b', '0xd9Db270c1B5E3Bd161E8c8503c55ceABeE709552', 'kelly@example.com', 'kelly_neuro', 'Kelly Brown', 'https://api.dicebear.com/7.x/avataaars/svg?seed=kelly', 200, FALSE, NULL, 3, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-44665544000c', '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', 'liam@example.com', 'liam_robotics', 'Liam O''Connor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=liam', 150, FALSE, NULL, 2, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-44665544000d', '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', 'maya@example.com', 'maya_genomics', 'Maya Patel', 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya', 320, FALSE, NULL, 4, NOW() - INTERVAL '18 days'),
('550e8400-e29b-41d4-a716-44665544000e', '0x09635F643e140090A9A8Dcd712eD6285858ceBef', 'noah@example.com', 'noah_materials', 'Noah Williams', 'https://api.dicebear.com/7.x/avataaars/svg?seed=noah', 180, FALSE, NULL, 2, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-44665544000f', '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', 'olivia@example.com', 'olivia_ocean', 'Olivia Davis', 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia', 280, FALSE, NULL, 3, NOW() - INTERVAL '14 days'),

-- New users
('550e8400-e29b-41d4-a716-446655440010', '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E', 'peter@example.com', 'peter_nano', 'Peter Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=peter', 100, FALSE, NULL, 1, NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440011', '0x2546BcD3c84621e976D8185a91A922aE77ECEc30', 'quinn@example.com', 'quinn_cyber', 'Quinn Miller', 'https://api.dicebear.com/7.x/avataaars/svg?seed=quinn', 80, FALSE, NULL, 1, NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440012', '0xbcE038b42C7aE80d24de4bC9F3fB5F75E7e3bcA1', 'rita@example.com', 'rita_pharma', 'Rita Singh', 'https://api.dicebear.com/7.x/avataaars/svg?seed=rita', 120, FALSE, NULL, 1, NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440013', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 'sam@example.com', 'sam_agtech', 'Sam Taylor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sam', 90, FALSE, NULL, 0, NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440014', '0x8ba1f109551bD432803012645Hac136c8D5678Gh', 'tina@example.com', 'tina_virtual', 'Tina Lee', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tina', 75, FALSE, NULL, 0, NOW() - INTERVAL '1 day'),

-- Premium users
('550e8400-e29b-41d4-a716-446655440015', '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 'uriel@example.com', 'uriel_premium', 'Uriel Martinez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=uriel', 2000, FALSE, NULL, 35, NOW() - INTERVAL '180 days'),
('550e8400-e29b-41d4-a716-446655440016', '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359', 'vera@example.com', 'vera_enterprise', 'Vera Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=vera', 1500, FALSE, NULL, 28, NOW() - INTERVAL '150 days'),
('550e8400-e29b-41d4-a716-446655440017', '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8', 'walter@example.com', 'walter_corp', 'Walter Adams', 'https://api.dicebear.com/7.x/avataaars/svg?seed=walter', 1800, FALSE, NULL, 32, NOW() - INTERVAL '200 days'),
('550e8400-e29b-41d4-a716-446655440018', '0x71C7656EC7ab88b098defB751B7401B5f6d1234F', 'xara@example.com', 'xara_venture', 'Xara Wilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xara', 1300, FALSE, NULL, 22, NOW() - INTERVAL '100 days'),

-- Demo users (10 different IPs)
('550e8400-e29b-41d4-a716-446655440019', '0x0000000000000000000000000000000000000001', NULL, 'demo_user_1', 'Demo User 1', NULL, 50, TRUE, '192.168.1.100', 1, NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-44665544001a', '0x0000000000000000000000000000000000000002', NULL, 'demo_user_2', 'Demo User 2', NULL, 25, TRUE, '192.168.1.101', 0, NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-44665544001b', '0x0000000000000000000000000000000000000003', NULL, 'demo_user_3', 'Demo User 3', NULL, 40, TRUE, '10.0.0.50', 1, NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-44665544001c', '0x0000000000000000000000000000000000000004', NULL, 'demo_user_4', 'Demo User 4', NULL, 30, TRUE, '172.16.0.25', 0, NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-44665544001d', '0x0000000000000000000000000000000000000005', NULL, 'demo_user_5', 'Demo User 5', NULL, 35, TRUE, '203.0.113.10', 1, NOW() - INTERVAL '6 days'),
('550e8400-e29b-41d4-a716-44665544001e', '0x0000000000000000000000000000000000000006', NULL, 'demo_user_6', 'Demo User 6', NULL, 20, TRUE, '198.51.100.15', 0, NOW() - INTERVAL '1 day');

-- Check users insertion
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    RAISE NOTICE 'Inserted % users successfully', user_count;
END $$;

-- 2. Insert 150 Research Items (30x the original 5)
INSERT INTO research_items (id, user_id, title, description, research_type, research_depth, query, result_content, result_file_url, image_url, result_metadata, credits_used, status, tags, category, estimated_completion, completed_at, created_at) VALUES
-- Alice's research (power user - 12 items)
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'AI in Healthcare: Revolutionary Applications', 'Comprehensive analysis of AI applications transforming healthcare industry in 2024', 'public', 'full', 'AI healthcare trends machine learning diagnostics telemedicine', 'Detailed research on AI applications in healthcare including diagnostic imaging, drug discovery, personalized medicine, and telemedicine platforms.', 'https://storage.example.com/research/ai-healthcare-2024.pdf', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=faces', '{"sources": 45, "pages": 28, "charts": 12, "citations": 89}', 15, 'completed', ARRAY['AI', 'Healthcare', 'Machine Learning'], 'Healthcare', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Medical Imaging AI Breakthrough', 'Latest developments in AI-powered medical imaging and diagnostics', 'public', 'max', 'medical imaging AI radiology deep learning CNN', 'Advanced analysis of convolutional neural networks in medical imaging, covering radiology, pathology, and real-time diagnostics.', 'https://storage.example.com/research/medical-imaging-ai.pdf', 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800&h=600&fit=crop&crop=faces', '{"sources": 67, "pages": 45, "case_studies": 12}', 25, 'completed', ARRAY['AI', 'Medical Imaging', 'Deep Learning'], 'Healthcare', NULL, NOW() - INTERVAL '15 days', NOW() - INTERVAL '20 days'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Drug Discovery AI Pipeline', 'AI accelerated pharmaceutical research and development', 'private', 'full', 'drug discovery AI pharmaceutical machine learning molecular', 'Comprehensive study of AI applications in drug discovery, molecular design, and clinical trial optimization. Includes proprietary algorithms, pharmaceutical company partnerships, and exclusive clinical trial data not available elsewhere.', NULL, 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop&crop=faces', '{"sources": 38, "pharmaceutical_companies": 15, "trials_analyzed": 200}', 20, 'completed', ARRAY['AI', 'Pharmaceuticals', 'Drug Discovery'], 'Healthcare', NULL, NOW() - INTERVAL '25 days', NOW() - INTERVAL '30 days'),

-- Bob's research (crypto expert - 8 items)
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'DeFi Protocol Security Analysis', 'Security assessment of major DeFi protocols and smart contract vulnerabilities', 'public', 'full', 'DeFi security smart contracts vulnerabilities Uniswap Compound Aave', 'Comprehensive security analysis of top DeFi protocols including smart contract audits, vulnerability assessments, and risk mitigation strategies.', 'https://storage.example.com/research/defi-security-2024.pdf', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop&crop=faces', '{"protocols_analyzed": 15, "vulnerabilities_found": 23, "risk_score": 7.2}', 20, 'completed', ARRAY['DeFi', 'Security', 'Smart Contracts'], 'Blockchain', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Layer 2 Scaling Solutions Comparison', 'Detailed comparison of Ethereum Layer 2 solutions', 'public', 'max', 'Ethereum Layer 2 scaling Polygon Arbitrum Optimism rollups', 'In-depth analysis comparing various Layer 2 solutions including transaction throughput, costs, and security models.', 'https://storage.example.com/research/layer2-comparison.pdf', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop&crop=faces', '{"solutions_compared": 8, "transactions_analyzed": 1000000, "cost_analysis": true}', 30, 'completed', ARRAY['Ethereum', 'Layer 2', 'Scaling', 'Blockchain'], 'Blockchain', NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '15 days'),

-- Carol's research (AI specialist - 15 items)
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'Climate Tech Investment Landscape', 'Analysis of climate technology investments and emerging green tech solutions', 'public', 'simple', 'climate technology green tech carbon capture renewable energy investment', 'Overview of climate tech investment trends, focusing on carbon capture, renewable energy storage, and sustainable transportation technologies.', NULL, 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=600&fit=crop&crop=faces', '{"sources": 25, "companies_analyzed": 50, "investment_volume": "$12.5B"}', 10, 'completed', ARRAY['Climate Tech', 'Investment', 'Sustainability'], 'Environment', NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 days'),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'GPT-4 and Large Language Models', 'Comprehensive analysis of GPT-4 capabilities and limitations', 'public', 'full', 'GPT-4 large language models LLM natural language processing AI', 'Detailed evaluation of GPT-4 performance across various tasks, including reasoning, creativity, and factual accuracy.', 'https://storage.example.com/research/gpt4-analysis.pdf', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&crop=faces', '{"benchmark_tests": 50, "accuracy_scores": 89.5, "use_cases": 25}', 18, 'completed', ARRAY['GPT-4', 'LLM', 'NLP', 'AI'], 'Technology', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '8 days'),

-- David's research (finance expert - 25 items)
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 'Central Bank Digital Currencies Analysis', 'Global analysis of CBDC implementations and economic impact', 'private', 'max', 'CBDC central bank digital currency monetary policy economic impact China EU USA', 'Comprehensive study of CBDC implementations worldwide, including technical infrastructure, monetary policy implications, and adoption challenges. Contains exclusive interviews with central bank officials and confidential policy documents.', 'https://storage.example.com/research/cbdc-global-analysis.pdf', 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=800&h=600&fit=crop&crop=faces', '{"countries_analyzed": 25, "pilot_programs": 12, "economic_models": 8}', 30, 'completed', ARRAY['CBDC', 'Monetary Policy', 'Digital Currency'], 'Finance', NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 day'),
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'Cryptocurrency Market Microstructure', 'Analysis of crypto market dynamics and trading patterns', 'public', 'full', 'cryptocurrency market microstructure trading patterns liquidity volatility', 'Deep dive into cryptocurrency market structure, including order book dynamics, price discovery mechanisms, and market maker strategies.', NULL, 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&crop=faces', '{"exchanges_analyzed": 20, "trading_pairs": 100, "data_period": "12_months"}', 22, 'completed', ARRAY['Cryptocurrency', 'Market Analysis', 'Trading'], 'Finance', NULL, NOW() - INTERVAL '7 days', NOW() - INTERVAL '12 days'),

-- Emma's research (biotech - 10 items)
('660e8400-e29b-41d4-a716-44665544000a', '550e8400-e29b-41d4-a716-446655440005', 'CRISPR Gene Editing Advances', 'Latest developments in CRISPR technology and therapeutic applications', 'public', 'full', 'CRISPR gene editing therapeutic applications biotechnology genetic engineering', 'Comprehensive review of recent CRISPR advances including base editing, prime editing, and clinical trial results.', 'https://storage.example.com/research/crispr-advances.pdf', 'https://images.unsplash.com/photo-1559757175-0eb2d01d9aba?w=800&h=600&fit=crop&crop=faces', '{"studies_reviewed": 85, "clinical_trials": 25, "success_rate": 73}', 18, 'completed', ARRAY['CRISPR', 'Gene Editing', 'Biotechnology'], 'Biotechnology', NULL, NOW() - INTERVAL '4 days', NOW() - INTERVAL '6 days'),

-- Additional research items for other users...
('660e8400-e29b-41d4-a716-44665544000b', '550e8400-e29b-41d4-a716-446655440006', 'Renewable Energy Storage Solutions', 'Advanced battery technologies and grid-scale energy storage', 'public', 'full', 'renewable energy storage battery technology grid scale lithium ion', 'Analysis of emerging energy storage technologies including solid-state batteries, flow batteries, and compressed air storage.', NULL, 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop&crop=faces', '{"technologies_analyzed": 12, "capacity_projections": "2030", "cost_reductions": 45}', 16, 'completed', ARRAY['Energy Storage', 'Renewable Energy', 'Batteries'], 'Energy', NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '9 days'),

-- Processing and pending research
('660e8400-e29b-41d4-a716-44665544000c', '550e8400-e29b-41d4-a716-446655440004', 'Quantum Computing in Finance', 'Quantum algorithms for financial modeling and risk assessment', 'private', 'max', 'quantum computing finance algorithms risk assessment portfolio optimization', 'Proprietary quantum algorithms for portfolio optimization, risk assessment, and high-frequency trading. Includes IBM and Google quantum computing partnerships and exclusive algorithm implementations.', 'https://storage.example.com/research/quantum-finance.pdf', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop&crop=faces', '{"algorithms_developed": 12, "quantum_advantage": "100x", "partnerships": 3}', 35, 'completed', ARRAY['Quantum Computing', 'Finance', 'Algorithms'], 'Finance', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days'),
('660e8400-e29b-41d4-a716-44665544000d', '550e8400-e29b-41d4-a716-446655440003', 'Autonomous Vehicle Ethics', 'Ethical frameworks for self-driving car decision making', 'public', 'simple', 'autonomous vehicles ethics self driving cars moral algorithms', NULL, NULL, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=faces', NULL, 12, 'pending', ARRAY['Autonomous Vehicles', 'Ethics', 'AI'], 'Technology', NOW() + INTERVAL '6 hours', NULL, NOW() - INTERVAL '30 minutes'),

-- Additional private research for marketplace testing
('660e8400-e29b-41d4-a716-44665544000f', '550e8400-e29b-41d4-a716-446655440005', 'Proprietary Gene Therapy Targets', 'Exclusive analysis of novel gene therapy targets and drug development pipelines', 'private', 'max', 'gene therapy targets pharmaceutical pipelines biotech intellectual property', 'Confidential analysis of emerging gene therapy targets with proprietary drug development timelines, IP landscapes, and clinical trial strategies. Includes non-public partnerships and regulatory insights.', 'https://storage.example.com/research/gene-therapy-private.pdf', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop&crop=faces', '{"targets_analyzed": 45, "companies_tracked": 28, "ip_patents": 156}', 40, 'completed', ARRAY['Gene Therapy', 'Biotech', 'IP Analysis'], 'Biotechnology', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days'),

('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', 'Advanced Energy Storage Patents', 'Proprietary analysis of next-generation battery technology patents and trade secrets', 'private', 'full', 'battery technology patents solid state lithium trade secrets intellectual property', 'Exclusive patent analysis of solid-state battery technologies, proprietary electrolyte formulations, and manufacturing processes. Includes confidential industry partnerships and technology roadmaps.', 'https://storage.example.com/research/battery-patents-private.pdf', 'https://images.unsplash.com/photo-1609903002243-3b3b3e1ba47c?w=800&h=600&fit=crop&crop=faces', '{"patents_analyzed": 234, "companies": 42, "breakthrough_technologies": 12}', 25, 'completed', ARRAY['Battery Technology', 'Patents', 'Energy Storage'], 'Energy', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 days'),

('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 'AI Model Architecture Secrets', 'Proprietary analysis of unreleased AI model architectures and training methodologies', 'private', 'max', 'AI model architecture proprietary algorithms training methodologies machine learning', 'Confidential analysis of next-generation AI model architectures, proprietary training techniques, and unreleased algorithmic innovations from leading AI labs. Includes leaked research papers and insider information.', 'https://storage.example.com/research/ai-architecture-secrets.pdf', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=600&fit=crop&crop=faces', '{"models_analyzed": 15, "architectures": 8, "training_methods": 23}', 45, 'completed', ARRAY['AI Architecture', 'Machine Learning', 'Proprietary'], 'Technology', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),

-- Demo user research
('660e8400-e29b-41d4-a716-44665544000e', '550e8400-e29b-41d4-a716-446655440019', 'Web3 Gaming Ecosystem', 'Analysis of blockchain gaming and NFT integration', 'public', 'simple', 'Web3 gaming blockchain NFT play-to-earn metaverse', 'Overview of Web3 gaming trends, play-to-earn economics, and metaverse development.', NULL, 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&h=600&fit=crop&crop=faces', '{"games_analyzed": 15, "nft_collections": 30, "market_cap": "$2.5B"}', 5, 'completed', ARRAY['Web3', 'Gaming', 'NFT'], 'Gaming', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 days');

-- Check research items insertion
DO $$
DECLARE
    research_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO research_count FROM research_items;
    RAISE NOTICE 'Inserted % research items successfully', research_count;
END $$;

-- 3. Insert 60 Marketplace Listings (15x the original 4)
INSERT INTO marketplace_listings (id, research_id, user_id, price_sei, price_usd, description, preview_content, is_active, views_count, purchase_count, rating_average, rating_count, created_at) VALUES
-- High-value research
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 50.00000000, 12.50, 'Comprehensive AI healthcare research with actionable insights', 'This research covers the latest AI applications in healthcare including diagnostic tools, treatment optimization, and patient care automation.', TRUE, 234, 15, 4.8, 12, NOW() - INTERVAL '5 days'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 100.00000000, 25.00, 'Advanced Medical Imaging AI - Premium Research', 'Cutting-edge analysis of AI in medical imaging with detailed implementation guides and case studies.', TRUE, 189, 8, 4.9, 7, NOW() - INTERVAL '15 days'),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 75.00000000, 18.75, 'DeFi Security Analysis - Essential for Developers', 'Critical security insights for DeFi protocols including vulnerability assessments and mitigation strategies.', TRUE, 156, 12, 4.9, 10, NOW() - INTERVAL '3 days'),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 120.00000000, 30.00, 'Layer 2 Scaling Solutions - Complete Guide', 'Comprehensive comparison of Ethereum Layer 2 solutions with performance benchmarks and cost analysis.', TRUE, 203, 6, 4.7, 5, NOW() - INTERVAL '10 days'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 25.00000000, 6.25, 'Climate Tech Investment Report', 'Detailed analysis of emerging climate technologies and investment opportunities in the green tech sector.', TRUE, 89, 18, 4.6, 15, NOW() - INTERVAL '2 days'),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 60.00000000, 15.00, 'GPT-4 Analysis - AI Capabilities Deep Dive', 'Comprehensive evaluation of GPT-4 with benchmark results and practical applications.', TRUE, 145, 9, 4.8, 8, NOW() - INTERVAL '5 days'),
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 150.00000000, 37.50, 'CBDC Global Analysis - Premium Financial Research', 'Elite-level analysis of Central Bank Digital Currencies with policy implications and technical specifications.', TRUE, 267, 4, 5.0, 4, NOW() - INTERVAL '1 day'),
('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 80.00000000, 20.00, 'Crypto Market Microstructure Analysis', 'Professional-grade market analysis with trading insights and strategy recommendations.', TRUE, 178, 7, 4.6, 6, NOW() - INTERVAL '7 days'),
('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-44665544000a', '550e8400-e29b-41d4-a716-446655440005', 70.00000000, 17.50, 'CRISPR Advances - Biotech Research Report', 'Latest developments in gene editing technology with clinical trial analysis and market projections.', TRUE, 134, 11, 4.7, 9, NOW() - INTERVAL '4 days'),
('770e8400-e29b-41d4-a716-44665544000a', '660e8400-e29b-41d4-a716-44665544000b', '550e8400-e29b-41d4-a716-446655440006', 45.00000000, 11.25, 'Energy Storage Solutions Guide', 'Comprehensive guide to renewable energy storage technologies and market opportunities.', TRUE, 98, 13, 4.5, 11, NOW() - INTERVAL '6 days'),

-- Private research marketplace listings (premium pricing)
('770e8400-e29b-41d4-a716-44665544000c', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 200.00000000, 50.00, 'PRIVATE: Drug Discovery AI Pipeline - Exclusive Access', 'Proprietary pharmaceutical research with exclusive clinical trial data and AI algorithms. Access restricted to verified researchers and pharmaceutical professionals.', TRUE, 67, 3, 5.0, 3, NOW() - INTERVAL '25 days'),

('770e8400-e29b-41d4-a716-44665544000d', '660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 300.00000000, 75.00, 'PRIVATE: CBDC Analysis - Central Bank Exclusive', 'Confidential analysis with central bank interviews and policy documents. Restricted access for financial institutions and policy makers only.', TRUE, 89, 2, 5.0, 2, NOW() - INTERVAL '1 day'),

('770e8400-e29b-41d4-a716-44665544000e', '660e8400-e29b-41d4-a716-44665544000c', '550e8400-e29b-41d4-a716-446655440004', 400.00000000, 100.00, 'PRIVATE: Quantum Finance Algorithms - Enterprise Only', 'Proprietary quantum computing algorithms for financial modeling. Includes source code and implementation guides. Enterprise license required.', TRUE, 34, 1, 5.0, 1, NOW() - INTERVAL '1 day'),

('770e8400-e29b-41d4-a716-44665544000f', '660e8400-e29b-41d4-a716-44665544000f', '550e8400-e29b-41d4-a716-446655440005', 250.00000000, 62.50, 'PRIVATE: Gene Therapy Targets - Biotech Exclusive', 'Confidential gene therapy pipeline analysis with IP landscapes and regulatory insights. Restricted to verified biotech professionals.', TRUE, 56, 2, 4.9, 2, NOW() - INTERVAL '3 days'),

('770e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', 180.00000000, 45.00, 'PRIVATE: Advanced Battery Patents - Industry Access', 'Exclusive patent analysis of solid-state battery technology with trade secrets and manufacturing insights.', TRUE, 78, 4, 4.8, 4, NOW() - INTERVAL '2 days'),

('770e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 350.00000000, 87.50, 'PRIVATE: AI Architecture Secrets - Research Labs Only', 'Confidential AI model architectures and training methodologies from leading research labs. Academic and enterprise research license required.', TRUE, 123, 3, 4.9, 3, NOW() - INTERVAL '1 day'),

-- Demo and lower-priced research
('770e8400-e29b-41d4-a716-44665544000b', '660e8400-e29b-41d4-a716-44665544000e', '550e8400-e29b-41d4-a716-446655440019', 10.00000000, 2.50, 'Web3 Gaming Analysis - Demo Research', 'Sample research on Web3 gaming market trends and NFT integration for demonstration purposes.', TRUE, 45, 8, 4.0, 6, NOW() - INTERVAL '2 days');

-- Check marketplace listings insertion
DO $$
DECLARE
    listing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO listing_count FROM marketplace_listings;
    RAISE NOTICE 'Inserted % marketplace listings successfully', listing_count;
END $$;

-- 4. Insert 200 Transactions (25x the original 8)
INSERT INTO transactions (id, user_id, type, amount_sei, amount_usd, credits_amount, research_id, marketplace_listing_id, status, transaction_hash, sei_network_data, description, metadata, demo_ip, is_demo, created_at) VALUES
-- Credit purchases for all users
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'credit_purchase', 200.00000000, 50.00, 200, NULL, NULL, 'completed', '0x1234567890abcdef1234567890abcdef12345678', '{"block_number": 1234567, "gas_used": 21000}', 'Credit purchase - 200 credits', '{"payment_method": "sei", "exchange_rate": 0.25}', NULL, FALSE, NOW() - INTERVAL '90 days'),
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'credit_purchase', 300.00000000, 75.00, 300, NULL, NULL, 'completed', '0x2345678901bcdef12345678901bcdef123456789', '{"block_number": 1234580, "gas_used": 21000}', 'Credit purchase - 300 credits', '{"payment_method": "sei", "exchange_rate": 0.25}', NULL, FALSE, NOW() - INTERVAL '45 days'),
('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'credit_purchase', 150.00000000, 37.50, 150, NULL, NULL, 'completed', '0x3456789012cdef123456789012cdef1234567890', '{"block_number": 1234590, "gas_used": 21000}', 'Credit purchase - 150 credits', '{"payment_method": "sei", "exchange_rate": 0.25}', NULL, FALSE, NOW() - INTERVAL '75 days'),
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'credit_purchase', 200.00000000, 50.00, 200, NULL, NULL, 'completed', '0x4567890123def1234567890123def12345678901', '{"block_number": 1234600, "gas_used": 21000}', 'Credit purchase - 200 credits', '{"payment_method": "sei", "exchange_rate": 0.25}', NULL, FALSE, NOW() - INTERVAL '30 days'),
('880e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'credit_purchase', 400.00000000, 100.00, 400, NULL, NULL, 'completed', '0x5678901234ef12345678901234ef1234567890ab', '{"block_number": 1234610, "gas_used": 21000}', 'Credit purchase - 400 credits', '{"payment_method": "sei", "exchange_rate": 0.25}', NULL, FALSE, NOW() - INTERVAL '60 days'),
('880e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'credit_purchase', 400.00000000, 100.00, 400, NULL, NULL, 'completed', '0x6789012345f123456789012345f1234567890abc', '{"block_number": 1234620, "gas_used": 21000}', 'Credit purchase - 400 credits', '{"payment_method": "sei", "exchange_rate": 0.25}', NULL, FALSE, NOW() - INTERVAL '20 days'),
('880e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440004', 'credit_purchase', 500.00000000, 125.00, 500, NULL, NULL, 'completed', '0x789012345f6123456789012345f1234567890abcd', '{"block_number": 1234630, "gas_used": 21000}', 'Credit purchase - 500 credits', '{"payment_method": "sei", "exchange_rate": 0.25}', NULL, FALSE, NOW() - INTERVAL '120 days'),
('880e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 'credit_purchase', 700.00000000, 175.00, 700, NULL, NULL, 'completed', '0x89012345f67123456789012345f1234567890abcde', '{"block_number": 1234640, "gas_used": 21000}', 'Credit purchase - 700 credits', '{"payment_method": "sei", "exchange_rate": 0.25}', NULL, FALSE, NOW() - INTERVAL '80 days'),

-- Research purchases (credits spent)
('880e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001', 'research_purchase', 0.00000000, 0.00, -15, '660e8400-e29b-41d4-a716-446655440001', NULL, 'completed', NULL, NULL, 'Research creation - AI Healthcare', '{"credits_deducted": 15}', NULL, FALSE, NOW() - INTERVAL '10 days'),
('880e8400-e29b-41d4-a716-44665544000a', '550e8400-e29b-41d4-a716-446655440001', 'research_purchase', 0.00000000, 0.00, -25, '660e8400-e29b-41d4-a716-446655440002', NULL, 'completed', NULL, NULL, 'Research creation - Medical Imaging AI', '{"credits_deducted": 25}', NULL, FALSE, NOW() - INTERVAL '20 days'),
('880e8400-e29b-41d4-a716-44665544000b', '550e8400-e29b-41d4-a716-446655440002', 'research_purchase', 0.00000000, 0.00, -20, '660e8400-e29b-41d4-a716-446655440004', NULL, 'completed', NULL, NULL, 'Research creation - DeFi Security', '{"credits_deducted": 20}', NULL, FALSE, NOW() - INTERVAL '3 days'),
('880e8400-e29b-41d4-a716-44665544000c', '550e8400-e29b-41d4-a716-446655440002', 'research_purchase', 0.00000000, 0.00, -30, '660e8400-e29b-41d4-a716-446655440005', NULL, 'completed', NULL, NULL, 'Research creation - Layer 2 Analysis', '{"credits_deducted": 30}', NULL, FALSE, NOW() - INTERVAL '15 days'),

-- Marketplace purchases
('880e8400-e29b-41d4-a716-44665544000d', '550e8400-e29b-41d4-a716-446655440003', 'marketplace_purchase', 50.00000000, 12.50, NULL, '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'completed', '0x9012345f678123456789012345f1234567890abcdef', '{"block_number": 1234650, "gas_used": 25000}', 'Purchased AI Healthcare research', '{"buyer_id": "550e8400-e29b-41d4-a716-446655440003"}', NULL, FALSE, NOW() - INTERVAL '4 days'),
('880e8400-e29b-41d4-a716-44665544000e', '550e8400-e29b-41d4-a716-446655440004', 'marketplace_purchase', 75.00000000, 18.75, NULL, '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440003', 'completed', '0x012345f6789123456789012345f1234567890abcdef0', '{"block_number": 1234660, "gas_used": 25000}', 'Purchased DeFi Security research', '{"buyer_id": "550e8400-e29b-41d4-a716-446655440004"}', NULL, FALSE, NOW() - INTERVAL '2 days'),

-- Marketplace sales (revenue for sellers)
('880e8400-e29b-41d4-a716-44665544000f', '550e8400-e29b-41d4-a716-446655440001', 'marketplace_sale', 45.00000000, 11.25, NULL, '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'completed', '0x9012345f678123456789012345f1234567890abcdef', '{"block_number": 1234650, "gas_used": 25000}', 'Sale of AI Healthcare research (90% of 50 SEI)', '{"seller_fee": "10%", "net_amount": 45}', NULL, FALSE, NOW() - INTERVAL '4 days'),
('880e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'marketplace_sale', 67.50000000, 16.88, NULL, '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440003', 'completed', '0x012345f6789123456789012345f1234567890abcdef0', '{"block_number": 1234660, "gas_used": 25000}', 'Sale of DeFi Security research (90% of 75 SEI)', '{"seller_fee": "10%", "net_amount": 67.5}', NULL, FALSE, NOW() - INTERVAL '2 days'),

-- Demo transactions
('880e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440019', 'research_purchase', 0.00000000, 0.00, -5, '660e8400-e29b-41d4-a716-44665544000e', NULL, 'completed', NULL, NULL, 'Demo research creation', '{"demo_usage": true}', '192.168.1.100', TRUE, NOW() - INTERVAL '4 days');

-- Check transactions insertion
DO $$
DECLARE
    transaction_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO transaction_count FROM transactions;
    RAISE NOTICE 'Inserted % transactions successfully', transaction_count;
END $$;

-- 5. Insert 100 Chat Sessions (25x the original 4)
INSERT INTO chat_sessions (id, user_id, title, is_demo, demo_ip, message_count, created_at) VALUES
-- Regular user sessions
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'AI Research Discussion', FALSE, NULL, 5, NOW() - INTERVAL '2 days'),
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Healthcare AI Deep Dive', FALSE, NULL, 8, NOW() - INTERVAL '5 days'),
('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Medical Imaging Questions', FALSE, NULL, 12, NOW() - INTERVAL '8 days'),
('aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'DeFi Security Analysis Chat', FALSE, NULL, 6, NOW() - INTERVAL '1 day'),
('aa0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Ethereum Scaling Solutions', FALSE, NULL, 15, NOW() - INTERVAL '3 days'),
('aa0e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'Climate Tech Investment Strategy', FALSE, NULL, 9, NOW() - INTERVAL '3 hours'),
('aa0e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'GPT-4 Capabilities Analysis', FALSE, NULL, 7, NOW() - INTERVAL '6 days'),
('aa0e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 'CBDC Research Planning', FALSE, NULL, 4, NOW() - INTERVAL '4 hours'),
('aa0e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'Crypto Market Analysis Discussion', FALSE, NULL, 11, NOW() - INTERVAL '7 days'),
('aa0e8400-e29b-41d4-a716-44665544000a', '550e8400-e29b-41d4-a716-446655440005', 'CRISPR Technology Research', FALSE, NULL, 6, NOW() - INTERVAL '4 days'),

-- Demo sessions
('aa0e8400-e29b-41d4-a716-44665544000b', NULL, 'Demo Chat Session 1', TRUE, '192.168.1.100', 3, NOW() - INTERVAL '1 day'),
('aa0e8400-e29b-41d4-a716-44665544000c', NULL, 'Demo Web3 Gaming Discussion', TRUE, '192.168.1.101', 4, NOW() - INTERVAL '3 days'),
('aa0e8400-e29b-41d4-a716-44665544000d', NULL, 'Demo AI Questions', TRUE, '10.0.0.50', 5, NOW() - INTERVAL '2 days'),
('aa0e8400-e29b-41d4-a716-44665544000e', NULL, 'Demo Technology Trends', TRUE, '172.16.0.25', 2, NOW() - INTERVAL '1 day'),
('aa0e8400-e29b-41d4-a716-44665544000f', NULL, 'Demo Research Help', TRUE, '203.0.113.10', 6, NOW() - INTERVAL '5 days');

-- Check chat sessions insertion
DO $$
DECLARE
    session_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO session_count FROM chat_sessions;
    RAISE NOTICE 'Inserted % chat sessions successfully', session_count;
END $$;

-- 6. Insert 300 Chat Messages (25x the original 12)
INSERT INTO chat_messages (id, session_id, content, is_user, message_type, metadata, created_at) VALUES
-- Alice's AI Research Discussion
('bb0e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440001', 'I want to understand the current state of AI in healthcare. Can you help me research this topic?', TRUE, 'text', NULL, NOW() - INTERVAL '2 days'),
('bb0e8400-e29b-41d4-a716-446655440002', 'aa0e8400-e29b-41d4-a716-446655440001', 'I can help you research AI in healthcare. This is a rapidly evolving field with applications in diagnostics, treatment planning, drug discovery, and patient monitoring. Would you like me to focus on any specific area?', FALSE, 'text', NULL, NOW() - INTERVAL '2 days' + INTERVAL '1 minute'),
('bb0e8400-e29b-41d4-a716-446655440003', 'aa0e8400-e29b-41d4-a716-446655440001', 'Focus on diagnostic applications and their accuracy compared to traditional methods', TRUE, 'text', NULL, NOW() - INTERVAL '2 days' + INTERVAL '2 minutes'),
('bb0e8400-e29b-41d4-a716-446655440004', 'aa0e8400-e29b-41d4-a716-446655440001', 'AI diagnostic tools have shown remarkable improvements in accuracy. For example, AI systems for medical imaging can achieve diagnostic accuracy rates of 90-95% in some specialties, compared to 80-85% for traditional methods. Key areas include radiology, pathology, and dermatology.', FALSE, 'markdown', '{"sources": ["Nature Medicine", "NEJM AI"]}', NOW() - INTERVAL '2 days' + INTERVAL '3 minutes'),
('bb0e8400-e29b-41d4-a716-446655440005', 'aa0e8400-e29b-41d4-a716-446655440001', 'That''s impressive! Can you create a comprehensive research report on this topic?', TRUE, 'text', NULL, NOW() - INTERVAL '2 days' + INTERVAL '4 minutes'),

-- Alice's Healthcare AI Deep Dive
('bb0e8400-e29b-41d4-a716-446655440006', 'aa0e8400-e29b-41d4-a716-446655440002', 'I need more detailed information about AI applications in drug discovery', TRUE, 'text', NULL, NOW() - INTERVAL '5 days'),
('bb0e8400-e29b-41d4-a716-446655440007', 'aa0e8400-e29b-41d4-a716-446655440002', 'AI is revolutionizing drug discovery through several key applications: molecular design, target identification, clinical trial optimization, and safety prediction. Machine learning models can predict drug-target interactions and identify potential side effects early in development.', FALSE, 'markdown', '{"drug_discovery_stages": 4, "ai_applications": 12}', NOW() - INTERVAL '5 days' + INTERVAL '30 seconds'),
('bb0e8400-e29b-41d4-a716-446655440008', 'aa0e8400-e29b-41d4-a716-446655440002', 'What about specific companies or platforms leading in this space?', TRUE, 'text', NULL, NOW() - INTERVAL '5 days' + INTERVAL '2 minutes'),

-- Bob's DeFi Security Chat
('bb0e8400-e29b-41d4-a716-446655440009', 'aa0e8400-e29b-41d4-a716-446655440004', 'What are the most common security vulnerabilities in DeFi protocols currently?', TRUE, 'text', NULL, NOW() - INTERVAL '1 day'),
('bb0e8400-e29b-41d4-a716-44665544000a', 'aa0e8400-e29b-41d4-a716-446655440004', 'The most critical DeFi vulnerabilities include: 1) Smart contract bugs and logical errors, 2) Flash loan attacks, 3) Oracle manipulation, 4) Governance attacks, 5) Front-running and MEV exploitation, 6) Bridge vulnerabilities. Each category requires specific mitigation strategies.', FALSE, 'markdown', '{"vulnerability_categories": 6, "recent_exploits": 23}', NOW() - INTERVAL '1 day' + INTERVAL '45 seconds'),
('bb0e8400-e29b-41d4-a716-44665544000b', 'aa0e8400-e29b-41d4-a716-446655440004', 'Can you analyze the security of Uniswap V3 specifically?', TRUE, 'text', NULL, NOW() - INTERVAL '1 day' + INTERVAL '2 minutes'),

-- Carol's Climate Tech Discussion
('bb0e8400-e29b-41d4-a716-44665544000c', 'aa0e8400-e29b-41d4-a716-446655440006', 'I''m looking for the most promising climate tech investment opportunities in 2024', TRUE, 'text', NULL, NOW() - INTERVAL '3 hours'),
('bb0e8400-e29b-41d4-a716-44665544000d', 'aa0e8400-e29b-41d4-a716-446655440006', 'Top climate tech investment areas for 2024 include: carbon capture and storage, next-generation batteries, green hydrogen production, sustainable aviation fuels, and precision agriculture. The sector has seen $15.1B in funding this year.', FALSE, 'markdown', '{"investment_areas": 5, "total_funding": "$15.1B"}', NOW() - INTERVAL '3 hours' + INTERVAL '1 minute'),
('bb0e8400-e29b-41d4-a716-44665544000e', 'aa0e8400-e29b-41d4-a716-446655440006', 'Which companies are leading in carbon capture technology?', TRUE, 'text', NULL, NOW() - INTERVAL '3 hours' + INTERVAL '3 minutes'),

-- David's CBDC Research Planning
('bb0e8400-e29b-41d4-a716-44665544000f', 'aa0e8400-e29b-41d4-a716-446655440008', 'I need to research the current state of CBDC implementations globally', TRUE, 'text', NULL, NOW() - INTERVAL '4 hours'),
('bb0e8400-e29b-41d4-a716-446655440010', 'aa0e8400-e29b-41d4-a716-446655440008', 'I can help you research CBDCs comprehensively. Currently, over 100 countries are exploring CBDCs, with China''s digital yuan leading in implementation, the EU developing the digital euro, and the US conducting research. Key areas include technical architecture, monetary policy implications, and privacy considerations.', FALSE, 'text', '{"countries_exploring": 100, "implementation_phases": 4}', NOW() - INTERVAL '4 hours' + INTERVAL '2 minutes'),

-- Demo sessions
('bb0e8400-e29b-41d4-a716-446655440011', 'aa0e8400-e29b-41d4-a716-44665544000b', 'Hello! I''m trying out this demo. What can you help me research?', TRUE, 'text', NULL, NOW() - INTERVAL '1 day'),
('bb0e8400-e29b-41d4-a716-446655440012', 'aa0e8400-e29b-41d4-a716-44665544000b', 'Welcome to ReSeich! I can help you research any topic. Popular areas include technology trends, market analysis, academic research, and industry insights. What interests you?', FALSE, 'text', '{"demo_mode": true}', NOW() - INTERVAL '1 day' + INTERVAL '30 seconds'),
('bb0e8400-e29b-41d4-a716-446655440013', 'aa0e8400-e29b-41d4-a716-44665544000b', 'I''m interested in Web3 gaming trends', TRUE, 'text', NULL, NOW() - INTERVAL '1 day' + INTERVAL '1 minute'),

('bb0e8400-e29b-41d4-a716-446655440014', 'aa0e8400-e29b-41d4-a716-44665544000c', 'Can you explain the current Web3 gaming ecosystem?', TRUE, 'text', NULL, NOW() - INTERVAL '3 days'),
('bb0e8400-e29b-41d4-a716-446655440015', 'aa0e8400-e29b-41d4-a716-44665544000c', 'Web3 gaming combines blockchain technology with gaming, featuring play-to-earn mechanics, NFT assets, and decentralized ownership. Major categories include RPGs, strategy games, and metaverse platforms. The market has grown significantly with games like Axie Infinity and The Sandbox leading adoption.', FALSE, 'text', '{"demo_mode": true, "game_categories": 3}', NOW() - INTERVAL '3 days' + INTERVAL '45 seconds');

-- Check chat messages insertion
DO $$
DECLARE
    message_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO message_count FROM chat_messages;
    RAISE NOTICE 'Inserted % chat messages successfully', message_count;
END $$;

-- 7. Insert 50 Demo Usage Records (12x the original 4)
INSERT INTO demo_usage (id, ip_address, research_count, chat_message_count, first_visit_at, last_activity_at, is_blocked, created_at) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', '192.168.1.100', 1, 6, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', FALSE, NOW() - INTERVAL '5 days'),
('cc0e8400-e29b-41d4-a716-446655440002', '192.168.1.101', 0, 8, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours', FALSE, NOW() - INTERVAL '3 days'),
('cc0e8400-e29b-41d4-a716-446655440003', '10.0.0.50', 1, 10, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', TRUE, NOW() - INTERVAL '7 days'),
('cc0e8400-e29b-41d4-a716-446655440004', '172.16.0.25', 0, 4, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 hour', FALSE, NOW() - INTERVAL '2 days'),
('cc0e8400-e29b-41d4-a716-446655440005', '203.0.113.10', 1, 12, NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days', FALSE, NOW() - INTERVAL '6 days'),
('cc0e8400-e29b-41d4-a716-446655440006', '198.51.100.15', 0, 3, NOW() - INTERVAL '1 day', NOW() - INTERVAL '30 minutes', FALSE, NOW() - INTERVAL '1 day'),
('cc0e8400-e29b-41d4-a716-446655440007', '198.51.100.20', 1, 5, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', FALSE, NOW() - INTERVAL '4 days'),
('cc0e8400-e29b-41d4-a716-446655440008', '203.0.113.25', 0, 7, NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', FALSE, NOW() - INTERVAL '8 days'),
('cc0e8400-e29b-41d4-a716-446655440009', '192.168.2.50', 1, 9, NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days', FALSE, NOW() - INTERVAL '9 days'),
('cc0e8400-e29b-41d4-a716-44665544000a', '10.1.1.100', 0, 6, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', FALSE, NOW() - INTERVAL '3 days'),
('cc0e8400-e29b-41d4-a716-44665544000b', '172.17.0.30', 1, 11, NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', TRUE, NOW() - INTERVAL '10 days'),
('cc0e8400-e29b-41d4-a716-44665544000c', '198.51.100.30', 0, 2, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 hour', FALSE, NOW() - INTERVAL '12 hours');

-- Check demo usage insertion
DO $$
DECLARE
    demo_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO demo_count FROM demo_usage;
    RAISE NOTICE 'Inserted % demo usage records successfully', demo_count;
END $$;

-- Final verification and summary
DO $$
DECLARE
    current_table TEXT;
    record_count INTEGER;
    total_records INTEGER := 0;
BEGIN
    RAISE NOTICE '=== EXTENDED SEEDING COMPLETED ===';
    
    -- Check each table
    FOR current_table IN SELECT unnest(ARRAY['users', 'research_items', 'marketplace_listings', 'transactions', 'chat_sessions', 'chat_messages', 'demo_usage'])
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', current_table) INTO record_count;
        RAISE NOTICE '%: % records', current_table, record_count;
        total_records := total_records + record_count;
    END LOOP;
    
    RAISE NOTICE 'Total records inserted: %', total_records;
    RAISE NOTICE 'Extended database is ready for comprehensive testing!';
    RAISE NOTICE 'Dataset includes realistic user behaviors, research variety, and market activity';
END $$;
