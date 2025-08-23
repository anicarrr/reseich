# Marketplace Access Control Database Migration

## Overview
This file contains the SQL commands needed to add marketplace access control functionality to your existing ReSeich database.

## Migration Steps

### 1. Add Marketplace Access Table
Run this SQL command in your Supabase SQL editor:

```sql
-- 4. Marketplace Access Table
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
```

### 2. Add Indexes for Performance
```sql
-- Marketplace access indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_access_listing_id ON marketplace_access(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_user_id ON marketplace_access(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_research_id ON marketplace_access(research_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_demo_ip ON marketplace_access(demo_ip);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_created_at ON marketplace_access(created_at);
```

### 3. Update Transactions Table
Add new transaction types and demo support:

```sql
-- Add new transaction types
ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('credit_purchase', 'research_purchase', 'research_sale', 'marketplace_purchase', 'marketplace_sale', 'access_granted', 'access_revoked'));

-- Add demo support columns if they don't exist
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS demo_ip TEXT,
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Make user_id nullable for demo transactions
ALTER TABLE transactions ALTER COLUMN user_id DROP NOT NULL;
```

### 4. Enable Row Level Security (Optional)
```sql
-- Enable RLS on marketplace_access table
ALTER TABLE marketplace_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own marketplace access" ON marketplace_access
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true))
    OR is_demo = true
  );

CREATE POLICY "Users can insert own marketplace access" ON marketplace_access
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address', true))
    OR is_demo = true
  );
```

## Verification

After running the migration, verify the tables exist:

```sql
-- Check if marketplace_access table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'marketplace_access';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'marketplace_access';
```

## Important Notes

1. **Backup First**: Always backup your database before running migrations in production.

2. **Test in Development**: Run these commands in your development environment first.

3. **Environment Variables**: Make sure your `.env.local` file has the correct Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **SEI Network Configuration**: The current implementation uses mock transactions. For production, you'll need to:
   - Configure actual SEI network endpoints
   - Implement real wallet connection with Dynamic SDK
   - Add transaction verification on the SEI blockchain

## Features Enabled After Migration

- ✅ Private research purchase with SEI tokens
- ✅ Access control for marketplace items
- ✅ Transaction tracking and verification
- ✅ Demo mode support for testing
- ✅ User purchase history
- ✅ Seller analytics and sales tracking
