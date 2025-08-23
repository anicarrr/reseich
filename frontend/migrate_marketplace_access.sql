-- =====================================================
-- ReSeich Marketplace Access Control Migration Script
-- =====================================================
-- 
-- PURPOSE: This script adds access control for PRIVATE LISTED RESEARCH
-- 
-- CLARIFICATION:
-- - Explore page shows ONLY research items that owners choose to list
-- - Private unlisted research NEVER appears on explore page
-- - This access control is for tracking who purchased private listed research
-- - Public listed research doesn't need access control (always viewable)
-- 
-- IMPORTANT: 
-- 1. Backup your database before running this script
-- 2. Test in development environment first
-- 3. Run this script in your Supabase SQL editor
-- 
-- =====================================================

-- Start transaction for atomic migration
BEGIN;

-- =====================================================
-- 1. CREATE MARKETPLACE ACCESS TABLE
-- =====================================================

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
  
  -- Constraints to prevent duplicate access
  UNIQUE(listing_id, user_id),
  UNIQUE(listing_id, demo_ip)
);

-- =====================================================
-- 2. UPDATE TRANSACTIONS TABLE CONSTRAINTS
-- =====================================================

-- Drop existing type constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'transactions_type_check'
    ) THEN
        ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;
    END IF;
END $$;

-- Add new constraint with extended transaction types
ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN (
  'credit_purchase', 
  'research_purchase', 
  'research_sale', 
  'marketplace_purchase', 
  'marketplace_sale', 
  'access_granted', 
  'access_revoked'
));

-- =====================================================
-- 3. ADD NEW COLUMNS TO TRANSACTIONS TABLE
-- =====================================================

-- Add demo support columns if they don't exist
DO $$
BEGIN
    -- Add description column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'description'
    ) THEN
        ALTER TABLE transactions ADD COLUMN description TEXT;
    END IF;
    
    -- Add metadata column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE transactions ADD COLUMN metadata JSONB;
    END IF;
    
    -- Add demo_ip column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'demo_ip'
    ) THEN
        ALTER TABLE transactions ADD COLUMN demo_ip TEXT;
    END IF;
    
    -- Add is_demo column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'is_demo'
    ) THEN
        ALTER TABLE transactions ADD COLUMN is_demo BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- =====================================================
-- 4. MAKE USER_ID NULLABLE FOR DEMO TRANSACTIONS
-- =====================================================

-- Make user_id nullable to support demo transactions
ALTER TABLE transactions ALTER COLUMN user_id DROP NOT NULL;

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Marketplace access indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_access_listing_id ON marketplace_access(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_user_id ON marketplace_access(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_research_id ON marketplace_access(research_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_demo_ip ON marketplace_access(demo_ip);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_created_at ON marketplace_access(created_at);
CREATE INDEX IF NOT EXISTS idx_marketplace_access_access_type ON marketplace_access(access_type);

-- Additional transaction indexes for demo support
CREATE INDEX IF NOT EXISTS idx_transactions_demo_ip ON transactions(demo_ip);
CREATE INDEX IF NOT EXISTS idx_transactions_is_demo ON transactions(is_demo);

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on marketplace_access table
ALTER TABLE marketplace_access ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE RLS POLICIES
-- =====================================================

-- Policy: Users can view their own marketplace access
CREATE POLICY IF NOT EXISTS "marketplace_access_select_own" ON marketplace_access
  FOR SELECT USING (
    -- User can see their own access records
    user_id = (
      SELECT id FROM users 
      WHERE wallet_address = current_setting('app.current_wallet_address', true)
    )
    -- Or it's a demo record (for demo mode functionality)
    OR is_demo = true
    -- Or it's for public research validation
    OR research_id IN (
      SELECT id FROM research_items WHERE research_type = 'public'
    )
  );

-- Policy: System can insert marketplace access records
CREATE POLICY IF NOT EXISTS "marketplace_access_insert_system" ON marketplace_access
  FOR INSERT WITH CHECK (
    -- Allow inserts for authenticated users
    user_id = (
      SELECT id FROM users 
      WHERE wallet_address = current_setting('app.current_wallet_address', true)
    )
    -- Or for demo transactions
    OR is_demo = true
  );

-- Policy: Users can update their own access records (for metadata updates)
CREATE POLICY IF NOT EXISTS "marketplace_access_update_own" ON marketplace_access
  FOR UPDATE USING (
    user_id = (
      SELECT id FROM users 
      WHERE wallet_address = current_setting('app.current_wallet_address', true)
    )
  );

-- =====================================================
-- 8. CREATE HELPFUL FUNCTIONS
-- =====================================================

-- Function to check if user has access to a research item
CREATE OR REPLACE FUNCTION user_has_research_access(
  p_research_id UUID,
  p_user_wallet TEXT DEFAULT NULL,
  p_demo_ip TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_has_access BOOLEAN := FALSE;
  v_research_type TEXT;
  v_research_owner_id UUID;
BEGIN
  -- Get research details
  SELECT research_type, user_id INTO v_research_type, v_research_owner_id
  FROM research_items WHERE id = p_research_id;
  
  -- If research not found, no access
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Public research is always accessible
  IF v_research_type = 'public' THEN
    RETURN TRUE;
  END IF;
  
  -- For private research, check ownership and marketplace access
  IF p_user_wallet IS NOT NULL THEN
    -- Get user ID
    SELECT id INTO v_user_id FROM users WHERE wallet_address = p_user_wallet;
    
    -- User owns the research
    IF v_user_id = v_research_owner_id THEN
      RETURN TRUE;
    END IF;
    
    -- Check marketplace access
    SELECT EXISTS(
      SELECT 1 FROM marketplace_access ma
      JOIN marketplace_listings ml ON ma.listing_id = ml.id
      WHERE ml.research_id = p_research_id 
        AND ma.user_id = v_user_id
        AND ma.is_demo = FALSE
    ) INTO v_has_access;
    
  ELSIF p_demo_ip IS NOT NULL THEN
    -- Check demo access
    SELECT EXISTS(
      SELECT 1 FROM marketplace_access ma
      JOIN marketplace_listings ml ON ma.listing_id = ml.id
      WHERE ml.research_id = p_research_id 
        AND ma.demo_ip = p_demo_ip
        AND ma.is_demo = TRUE
    ) INTO v_has_access;
  END IF;
  
  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. INSERT SAMPLE DATA (OPTIONAL - COMMENT OUT IF NOT NEEDED)
-- =====================================================

-- Uncomment the following block if you want to insert sample data for testing

/*
-- Sample marketplace access record (for testing)
-- Only insert if there are existing marketplace listings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM marketplace_listings LIMIT 1) THEN
    INSERT INTO marketplace_access (
      listing_id, 
      research_id, 
      user_id, 
      access_type,
      is_demo
    )
    SELECT 
      ml.id,
      ml.research_id,
      u.id,
      'granted',
      FALSE
    FROM marketplace_listings ml
    CROSS JOIN users u
    WHERE ml.user_id != u.id  -- Don't grant access to own research
    LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
*/

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Verify the migration was successful
DO $$
DECLARE
  table_count INTEGER;
  index_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Check if marketplace_access table exists
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'marketplace_access';
  
  -- Check if indexes were created
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'marketplace_access';
  
  -- Check if RLS policies exist
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'marketplace_access';
  
  -- Report results
  RAISE NOTICE 'Migration Verification:';
  RAISE NOTICE '- marketplace_access table: % (should be 1)', table_count;
  RAISE NOTICE '- marketplace_access indexes: % (should be 6+)', index_count;
  RAISE NOTICE '- marketplace_access policies: % (should be 3)', policy_count;
  
  IF table_count = 1 AND index_count >= 6 AND policy_count >= 3 THEN
    RAISE NOTICE '✅ Migration completed successfully!';
  ELSE
    RAISE NOTICE '⚠️  Migration may be incomplete. Please review the results.';
  END IF;
END $$;

-- =====================================================
-- COMMIT TRANSACTION
-- =====================================================

-- If everything looks good, commit the changes
COMMIT;

-- =====================================================
-- POST-MIGRATION VERIFICATION
-- =====================================================

-- Final verification queries (run these manually after migration)
-- SELECT 'Tables' as type, table_name as name FROM information_schema.tables WHERE table_name IN ('marketplace_access');
-- SELECT 'Indexes' as type, indexname as name FROM pg_indexes WHERE tablename = 'marketplace_access';
-- SELECT 'Policies' as type, policyname as name FROM pg_policies WHERE tablename = 'marketplace_access';
-- SELECT 'Functions' as type, routine_name as name FROM information_schema.routines WHERE routine_name = 'user_has_research_access';

-- Test the access function
-- SELECT user_has_research_access('some-research-id'::UUID, 'some-wallet-address', NULL);

RAISE NOTICE '';
RAISE NOTICE '🎉 Marketplace Access Control Migration Complete!';
RAISE NOTICE '';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Verify the migration results above';
RAISE NOTICE '2. Test the new functionality in your application';
RAISE NOTICE '3. Update your application environment variables if needed';
RAISE NOTICE '4. Deploy your updated application code';
RAISE NOTICE '';
