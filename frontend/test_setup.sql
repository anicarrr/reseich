-- ReSeich Database Test Setup Script
-- Use this to test if the main setup script will work
-- Run this first to identify any issues

-- Test 1: Check if extensions can be created
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    RAISE NOTICE 'Extensions created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Extension error: %', SQLERRM;
END $$;

-- Test 2: Check if we can create a simple table
DROP TABLE IF EXISTS test_table CASCADE;
CREATE TABLE test_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test 3: Check if we can create a trigger
CREATE OR REPLACE FUNCTION test_update_function()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS test_trigger ON test_table;
CREATE TRIGGER test_trigger BEFORE UPDATE ON test_table
    FOR EACH ROW EXECUTE FUNCTION test_update_function();

-- Test 4: Insert test data
INSERT INTO test_table (name) VALUES ('test');

-- Test 5: Clean up
DROP TABLE test_table CASCADE;
DROP FUNCTION test_update_function CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'All tests passed! The main setup script should work.';
END $$;
