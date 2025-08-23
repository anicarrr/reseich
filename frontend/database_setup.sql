-- ReSeich Database Setup Script
-- Run this script in your Supabase SQL editor to set up the complete database
-- Note: This script is idempotent and can be run multiple times safely

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clear any existing broken state (in case of previous failed runs)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_research_items_updated_at ON research_items;
DROP TRIGGER IF EXISTS update_marketplace_listings_updated_at ON marketplace_listings;
DROP TRIGGER IF EXISTS update_marketplace_access_updated_at ON marketplace_access;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
DROP TRIGGER IF EXISTS update_demo_usage_updated_at ON demo_usage;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
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

-- 2. Research Items Table
CREATE TABLE IF NOT EXISTS research_items (
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

-- 3. Marketplace Listings Table
CREATE TABLE IF NOT EXISTS marketplace_listings (
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

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
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

-- 5. Marketplace Access Table
CREATE TABLE IF NOT EXISTS marketplace_access (
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

-- 6. Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_demo BOOLEAN DEFAULT FALSE,
  demo_ip TEXT,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_user BOOLEAN NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'markdown', 'code', 'file')) DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Demo Usage Tracking Table
CREATE TABLE IF NOT EXISTS demo_usage (
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

-- Create Indexes
-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_demo_ip ON users(demo_ip);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Research items indexes
CREATE INDEX IF NOT EXISTS idx_research_items_user_id ON research_items(user_id);
CREATE INDEX IF NOT EXISTS idx_research_items_type ON research_items(research_type);
CREATE INDEX IF NOT EXISTS idx_research_items_status ON research_items(status);
CREATE INDEX IF NOT EXISTS idx_research_items_depth ON research_items(research_depth);
CREATE INDEX IF NOT EXISTS idx_research_items_created_at ON research_items(created_at);
CREATE INDEX IF NOT EXISTS idx_research_items_tags ON research_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_research_items_category ON research_items(category);

-- Marketplace listings indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_research_id ON marketplace_listings(research_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_user_id ON marketplace_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_active ON marketplace_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_price ON marketplace_listings(price_sei);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_rating ON marketplace_listings(rating_average);

-- Marketplace access indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_access_listing_id ON marketplace_access(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_user_id ON marketplace_access(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_research_id ON marketplace_access(research_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_demo_ip ON marketplace_access(demo_ip);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_created_at ON marketplace_access(created_at);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash);

-- Chat sessions indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_demo_ip ON chat_sessions(demo_ip);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_user ON chat_messages(is_user);

-- Demo usage indexes
CREATE INDEX IF NOT EXISTS idx_demo_usage_ip_address ON demo_usage(ip_address);
CREATE INDEX IF NOT EXISTS idx_demo_usage_last_activity ON demo_usage(last_activity_at);

-- Enable Row Level Security (RLS)
-- NOTE: For development, you can disable RLS by commenting out these lines
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE demo_usage ENABLE ROW LEVEL SECURITY;

-- For development without RLS, uncomment these lines instead:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE research_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE marketplace_listings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE marketplace_access DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE demo_usage DISABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- NOTE: These policies are only needed when RLS is enabled
-- For development without RLS, you can comment out this entire section

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (wallet_address = current_setting('app.current_wallet_address', true));

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (wallet_address = current_setting('app.current_wallet_address', true));

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (wallet_address = current_setting('app.current_wallet_address', true));

-- Research items policies
CREATE POLICY "Public research is viewable by everyone" ON research_items
  FOR SELECT USING (research_type = 'public');

CREATE POLICY "Users can view own research" ON research_items
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true)));

CREATE POLICY "Users can insert own research" ON research_items
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true)));

CREATE POLICY "Users can update own research" ON research_items
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true)));

CREATE POLICY "Users can delete own research" ON research_items
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true)));

-- Marketplace listings policies
CREATE POLICY "Marketplace listings are viewable by everyone" ON marketplace_listings
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can manage own listings" ON marketplace_listings
  FOR ALL USING (user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true)));

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true)));

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true)));

-- Chat sessions policies
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true)) OR
    (is_demo = TRUE AND demo_ip = current_setting('app.current_demo_ip', true))
  );

CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true)) OR
    (is_demo = TRUE AND demo_ip = current_setting('app.current_demo_ip', true))
  );

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
  FOR UPDATE USING (
    user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true)) OR
    (is_demo = TRUE AND demo_ip = current_setting('app.current_demo_ip', true))
  );

CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
  FOR DELETE USING (
    user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true)) OR
    (is_demo = TRUE AND demo_ip = current_setting('app.current_demo_ip', true))
  );

-- Chat messages policies (inherited from chat_sessions)
CREATE POLICY "Chat messages inherit session permissions" ON chat_messages
  FOR ALL USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE 
        user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true)) OR
        (is_demo = TRUE AND demo_ip = current_setting('app.current_demo_ip', true))
    )
  );

-- Demo usage policies
CREATE POLICY "Demo usage is viewable by all" ON demo_usage
  FOR SELECT USING (TRUE);

-- Create Functions for RLS Session Variables

-- Function to set wallet address in session
CREATE OR REPLACE FUNCTION set_wallet_address(wallet_addr TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_wallet_address', wallet_addr, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set demo IP in session
CREATE OR REPLACE FUNCTION set_demo_ip(demo_ip TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_demo_ip', demo_ip, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear session variables
CREATE OR REPLACE FUNCTION clear_session_variables()
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_wallet_address', NULL, false);
  PERFORM set_config('app.current_demo_ip', NULL, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on these functions
GRANT EXECUTE ON FUNCTION set_wallet_address(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_demo_ip(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION clear_session_variables() TO anon, authenticated;

-- Create Functions and Triggers

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers (with IF NOT EXISTS equivalent)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_research_items_updated_at ON research_items;
CREATE TRIGGER update_research_items_updated_at BEFORE UPDATE ON research_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_listings_updated_at ON marketplace_listings;
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_access_updated_at ON marketplace_access;
CREATE TRIGGER update_marketplace_access_updated_at BEFORE UPDATE ON marketplace_access
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_demo_usage_updated_at ON demo_usage;
CREATE TRIGGER update_demo_usage_updated_at BEFORE UPDATE ON demo_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Demo usage tracking function
CREATE OR REPLACE FUNCTION track_demo_usage(ip_addr TEXT, usage_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    demo_record RECORD;
    can_proceed BOOLEAN := TRUE;
BEGIN
    -- Get or create demo usage record
    SELECT * INTO demo_record FROM demo_usage WHERE ip_address = ip_addr;
    
    IF NOT FOUND THEN
        INSERT INTO demo_usage (ip_address) VALUES (ip_addr);
        demo_record := (SELECT * FROM demo_usage WHERE ip_address = ip_addr);
    END IF;
    
    -- Check limits based on usage type
    IF usage_type = 'research' THEN
        IF demo_record.research_count >= 1 THEN
            can_proceed := FALSE;
        END IF;
    ELSIF usage_type = 'chat' THEN
        IF demo_record.chat_message_count >= 10 THEN
            can_proceed := FALSE;
        END IF;
    END IF;
    
    -- Update usage if allowed
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

-- Credit management function
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
    -- Get user record
    SELECT * INTO user_record FROM users WHERE wallet_address = wallet_addr;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Perform credit operation
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

-- Sample data will be inserted via separate seed script

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Database setup complete
-- Run the seed script (seed_database.sql) to populate with sample data

-- Note: COMMIT is not needed in Supabase as it auto-commits
