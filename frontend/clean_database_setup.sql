-- Clean ReSeich Database Setup - Guaranteed to Work
-- This script creates tables first, then indexes, then triggers
-- Run this instead of the main database_setup.sql

-- Step 1: Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Clean slate (remove any partial state)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS marketplace_access CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS marketplace_listings CASCADE;
DROP TABLE IF EXISTS research_items CASCADE;
DROP TABLE IF EXISTS demo_usage CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 3: Create all tables ONLY (no indexes, no triggers)

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
  image_url TEXT,
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

-- Table 5: Marketplace Access
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

-- Step 4: Create indexes (now that all tables exist)
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_demo_ip ON users(demo_ip);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_research_items_user_id ON research_items(user_id);
CREATE INDEX IF NOT EXISTS idx_research_items_type ON research_items(research_type);
CREATE INDEX IF NOT EXISTS idx_research_items_status ON research_items(status);
CREATE INDEX IF NOT EXISTS idx_research_items_depth ON research_items(research_depth);
CREATE INDEX IF NOT EXISTS idx_research_items_created_at ON research_items(created_at);
CREATE INDEX IF NOT EXISTS idx_research_items_tags ON research_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_research_items_category ON research_items(category);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_research_id ON marketplace_listings(research_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_user_id ON marketplace_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_active ON marketplace_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_price ON marketplace_listings(price_sei);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_rating ON marketplace_listings(rating_average);

CREATE INDEX IF NOT EXISTS idx_marketplace_access_listing_id ON marketplace_access(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_user_id ON marketplace_access(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_research_id ON marketplace_access(research_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_demo_ip ON marketplace_access(demo_ip);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_created_at ON marketplace_access(created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_demo_ip ON chat_sessions(demo_ip);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_user ON chat_messages(is_user);

CREATE INDEX IF NOT EXISTS idx_demo_usage_ip_address ON demo_usage(ip_address);
CREATE INDEX IF NOT EXISTS idx_demo_usage_last_activity ON demo_usage(last_activity_at);

-- Step 5: Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Create triggers (now that tables and function exist)
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_items_updated_at BEFORE UPDATE ON research_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_access_updated_at BEFORE UPDATE ON marketplace_access
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_demo_usage_updated_at BEFORE UPDATE ON demo_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Create utility functions
CREATE OR REPLACE FUNCTION track_demo_usage(ip_addr TEXT, usage_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    demo_record RECORD;
    can_proceed BOOLEAN := TRUE;
BEGIN
    SELECT * INTO demo_record FROM demo_usage WHERE ip_address = ip_addr;
    
    IF NOT FOUND THEN
        INSERT INTO demo_usage (ip_address) VALUES (ip_addr);
        demo_record := (SELECT * FROM demo_usage WHERE ip_address = ip_addr);
    END IF;
    
    IF usage_type = 'research' THEN
        IF demo_record.research_count >= 1 THEN
            can_proceed := FALSE;
        END IF;
    ELSIF usage_type = 'chat' THEN
        IF demo_record.chat_message_count >= 10 THEN
            can_proceed := FALSE;
        END IF;
    END IF;
    
    IF can_proceed THEN
        IF usage_type = 'research' THEN
            UPDATE demo_usage SET 
                research_count = research_count + 1,
                last_activity_at = NOW()
            WHERE ip_address = ip_addr;
        ELSIF usage_type = 'chat' THEN
            UPDATE demo_usage SET 
                chat_message_count = chat_message_count + 1,
                last_activity_at = NOW()
            WHERE ip_address = ip_addr;
        END IF;
    END IF;
    
    RETURN can_proceed;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION manage_credits(
    wallet_addr TEXT,
    operation TEXT,
    amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
    success BOOLEAN := FALSE;
BEGIN
    SELECT * INTO user_record FROM users WHERE wallet_address = wallet_addr;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    IF operation = 'deduct' THEN
        IF user_record.credits >= amount THEN
            UPDATE users SET credits = credits - amount WHERE wallet_address = wallet_addr;
            success := TRUE;
        END IF;
    ELSIF operation = 'add' THEN
        UPDATE users SET credits = credits + amount WHERE wallet_address = wallet_addr;
        success := TRUE;
    END IF;
    
    RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Set permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Step 9: Verification
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public';
    
    RAISE NOTICE '=== DATABASE SETUP COMPLETED ===';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Indexes created: %', index_count;
    RAISE NOTICE 'Triggers created: %', trigger_count;
    RAISE NOTICE 'Database is ready for use!';
END $$;

-- Show all created tables
SELECT table_name, 'SUCCESS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
