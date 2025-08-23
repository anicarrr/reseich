-- Minimal ReSeich Database Setup - Step by Step
-- Run each section separately to identify where the issue occurs

-- Section 1: Extensions
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    RAISE NOTICE 'Extensions created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Extension error: %', SQLERRM;
END $$;

-- Section 2: Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS marketplace_access CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS marketplace_listings CASCADE;
DROP TABLE IF EXISTS research_items CASCADE;
DROP TABLE IF EXISTS demo_usage CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Section 3: Create tables in order (no triggers yet)
-- Table 1: Users
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

-- Table 2: Research Items
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

-- Table 3: Marketplace Listings
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

-- Table 4: Transactions
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

-- Table 5: Marketplace Access (after transactions)
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

-- Table 6: Chat Sessions
CREATE TABLE chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_demo BOOLEAN DEFAULT FALSE,
  demo_ip TEXT,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 7: Chat Messages
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_user BOOLEAN NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'markdown', 'code', 'file')) DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 8: Demo Usage
CREATE TABLE demo_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  research_count INTEGER DEFAULT 0,
  chat_message_count INTEGER DEFAULT 0,
  first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verify all tables were created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'research_items', 'marketplace_listings', 'transactions', 'marketplace_access', 'chat_sessions', 'chat_messages', 'demo_usage');
    
    RAISE NOTICE 'Created % out of 8 expected tables', table_count;
    
    IF table_count = 8 THEN
        RAISE NOTICE 'SUCCESS: All tables created successfully!';
    ELSE
        RAISE NOTICE 'ERROR: Not all tables were created';
    END IF;
END $$;

-- List all created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
