-- ReSeich Database Initialization Script (Development)
-- Run this script in your Supabase SQL editor to set up the database for development

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  email TEXT,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 100,
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
  type TEXT CHECK (type IN ('credit_purchase', 'research_purchase', 'research_sale')) NOT NULL,
  amount_sei DECIMAL(20, 8) NOT NULL,
  credits_amount INTEGER,
  research_id UUID REFERENCES research_items(id),
  marketplace_listing_id UUID REFERENCES marketplace_listings(id),
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  transaction_hash TEXT,
  sei_network_data JSONB,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Chat Sessions Table
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

-- 6. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_user BOOLEAN NOT NULL,
  user_id UUID REFERENCES users(id),
  demo_ip TEXT,
  is_demo BOOLEAN DEFAULT FALSE,
  message_type TEXT CHECK (message_type IN ('text', 'markdown', 'code', 'file')) DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Demo Usage Table
CREATE TABLE IF NOT EXISTS demo_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT UNIQUE NOT NULL,
  research_count INTEGER DEFAULT 0,
  chat_message_count INTEGER DEFAULT 0,
  first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Functions and Triggers

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_items_updated_at BEFORE UPDATE ON research_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Demo usage tracking function
CREATE OR REPLACE FUNCTION track_demo_usage(ip_addr TEXT, usage_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO demo_usage (ip_address, research_count, chat_message_count)
    VALUES (ip_addr, 
            CASE WHEN usage_type = 'research' THEN 1 ELSE 0 END,
            CASE WHEN usage_type = 'chat' THEN 1 ELSE 0 END)
    ON CONFLICT (ip_address) DO UPDATE SET
        research_count = demo_usage.research_count + 
                        CASE WHEN usage_type = 'research' THEN 1 ELSE 0 END,
        chat_message_count = demo_usage.chat_message_count + 
                            CASE WHEN usage_type = 'chat' THEN 1 ELSE 0 END,
        last_activity_at = NOW();
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing
INSERT INTO users (wallet_address, username, display_name, email, credits, is_demo_user)
VALUES 
  ('demo-address-1', 'demo1', 'Demo User 1', 'demo1@example.com', 1000, true),
  ('demo-address-2', 'demo2', 'Demo User 2', 'demo2@example.com', 1000, true)
ON CONFLICT (wallet_address) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
