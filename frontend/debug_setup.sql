-- Debug Script - Run this to find exactly where the setup is failing
-- Run each section separately and see where it stops working

-- STEP 1: Clean everything first
DO $$
BEGIN
    -- Drop all triggers first
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    DROP TRIGGER IF EXISTS update_research_items_updated_at ON research_items;
    DROP TRIGGER IF EXISTS update_marketplace_listings_updated_at ON marketplace_listings;
    DROP TRIGGER IF EXISTS update_marketplace_access_updated_at ON marketplace_access;
    DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
    DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
    DROP TRIGGER IF EXISTS update_demo_usage_updated_at ON demo_usage;
    
    -- Drop all tables in reverse dependency order
    DROP TABLE IF EXISTS chat_messages CASCADE;
    DROP TABLE IF EXISTS chat_sessions CASCADE;
    DROP TABLE IF EXISTS marketplace_access CASCADE;
    DROP TABLE IF EXISTS transactions CASCADE;
    DROP TABLE IF EXISTS marketplace_listings CASCADE;
    DROP TABLE IF EXISTS research_items CASCADE;
    DROP TABLE IF EXISTS demo_usage CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    
    RAISE NOTICE 'STEP 1: Cleanup completed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'STEP 1 ERROR: %', SQLERRM;
END $$;

-- STEP 2: Check extensions
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    RAISE NOTICE 'STEP 2: Extensions created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'STEP 2 ERROR: %', SQLERRM;
END $$;

-- STEP 3: Create users table
DO $$
BEGIN
    CREATE TABLE users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      wallet_address TEXT UNIQUE NOT NULL,
      email TEXT,
      username TEXT,
      display_name TEXT,
      avatar_url TEXT,
      credits INTEGER DEFAULT 0,
      is_demo_user BOOLEAN DEFAULT FALSE,
      demo_ip TEXT,
      demo_expires_at TIMESTAMP WITH TIME ZONE,
      research_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'STEP 3: Users table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'STEP 3 ERROR: %', SQLERRM;
END $$;

-- STEP 4: Create research_items table
DO $$
BEGIN
    CREATE TABLE research_items (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      research_type TEXT CHECK (research_type IN ('public', 'private')) DEFAULT 'private',
      research_depth TEXT CHECK (research_depth IN ('simple', 'full', 'max')) NOT NULL,
      query TEXT NOT NULL,
      result_content TEXT,
      result_file_url TEXT,
      result_metadata JSONB,
      credits_used INTEGER NOT NULL,
      status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
      tags TEXT[],
      category TEXT,
      estimated_completion TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'STEP 4: Research items table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'STEP 4 ERROR: %', SQLERRM;
END $$;

-- STEP 5: Create marketplace_listings table
DO $$
BEGIN
    CREATE TABLE marketplace_listings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      research_id UUID REFERENCES research_items(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      price_sei DECIMAL(20, 8) NOT NULL,
      price_usd DECIMAL(10, 2),
      description TEXT,
      preview_content TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      views_count INTEGER DEFAULT 0,
      purchase_count INTEGER DEFAULT 0,
      rating_average DECIMAL(3, 2),
      rating_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'STEP 5: Marketplace listings table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'STEP 5 ERROR: %', SQLERRM;
END $$;

-- STEP 6: Create transactions table
DO $$
BEGIN
    CREATE TABLE transactions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      type TEXT CHECK (type IN ('credit_purchase', 'research_purchase', 'research_sale', 'marketplace_purchase', 'marketplace_sale', 'access_granted', 'access_revoked')) NOT NULL,
      amount_sei DECIMAL(20, 8) NOT NULL,
      amount_usd DECIMAL(10, 2),
      credits_amount INTEGER,
      research_id UUID REFERENCES research_items(id),
      marketplace_listing_id UUID REFERENCES marketplace_listings(id),
      status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
      transaction_hash TEXT,
      sei_network_data JSONB,
      description TEXT,
      metadata JSONB,
      demo_ip TEXT,
      is_demo BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'STEP 6: Transactions table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'STEP 6 ERROR: %', SQLERRM;
END $$;

-- STEP 7: Create marketplace_access table
DO $$
BEGIN
    CREATE TABLE marketplace_access (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
      research_id UUID REFERENCES research_items(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      transaction_id UUID REFERENCES transactions(id),
      access_type TEXT CHECK (access_type IN ('purchased', 'granted', 'demo')) DEFAULT 'purchased',
      demo_ip TEXT,
      is_demo BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(listing_id, user_id),
      UNIQUE(listing_id, demo_ip)
    );
    RAISE NOTICE 'STEP 7: Marketplace access table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'STEP 7 ERROR: %', SQLERRM;
END $$;

-- STEP 8: Verify all tables exist
DO $$
DECLARE
    table_count INTEGER;
    missing_tables TEXT;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'research_items', 'marketplace_listings', 'transactions', 'marketplace_access');
    
    -- Check for missing tables
    SELECT string_agg(expected_table, ', ') INTO missing_tables
    FROM (
        SELECT unnest(ARRAY['users', 'research_items', 'marketplace_listings', 'transactions', 'marketplace_access']) AS expected_table
    ) expected
    WHERE expected_table NOT IN (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    );
    
    RAISE NOTICE 'STEP 8: Created % out of 5 core tables', table_count;
    
    IF missing_tables IS NOT NULL THEN
        RAISE NOTICE 'MISSING TABLES: %', missing_tables;
    END IF;
    
    IF table_count = 5 THEN
        RAISE NOTICE 'SUCCESS: All core tables created!';
    ELSE
        RAISE NOTICE 'ERROR: Some tables are missing';
    END IF;
END $$;

-- Show all tables that were created
SELECT 
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
