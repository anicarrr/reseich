# ReSeich Database Setup Guide

Complete instructions for setting up the ReSeich database on Supabase.

## 📋 Prerequisites

- [Supabase](https://supabase.com) account
- Basic knowledge of SQL
- Access to Supabase SQL Editor

## 🚀 Quick Start

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `reseich-database` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project setup to complete (2-3 minutes)

### Step 2: Access SQL Editor

1. In your Supabase project dashboard, navigate to **SQL Editor** (left sidebar)
2. You can either:
   - Use the **Query tab** for manual execution
   - Create a **New query** for each script

### Step 3: Run Database Setup Script

**IMPORTANT**: If you've run this script before and encountered errors, first run the cleanup script:

```sql
-- Clear any broken state from previous failed runs
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_research_items_updated_at ON research_items;
DROP TRIGGER IF EXISTS update_marketplace_listings_updated_at ON marketplace_listings;
DROP TRIGGER IF EXISTS update_marketplace_access_updated_at ON marketplace_access;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
DROP TRIGGER IF EXISTS update_demo_usage_updated_at ON demo_usage;
```

Then run the main setup:

1. Open `database_setup.sql` from your project
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** button
5. Wait for execution to complete

**Expected Output:**
```
Success. No rows returned
```

**If you get errors**: See the Troubleshooting section below for specific solutions.

### Step 4: Populate with Sample Data (Optional)

For development and testing, run the seed script:

1. Open `seed_database.sql` from your project
2. Copy the entire contents
3. Paste into a new query in Supabase SQL Editor
4. Click **Run** button

**Expected Output:**
```
NOTICE: Data seeding completed successfully!
NOTICE: Database is ready for testing.
```

## 📊 Database Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User accounts and profiles | Wallet addresses, credits, demo users |
| `research_items` | Research projects and results | Public/private, different depths, status tracking |
| `marketplace_listings` | Research items for sale | Pricing, ratings, view counts |
| `marketplace_access` | Purchase tracking | Who can access what research |
| `transactions` | All financial transactions | SEI payments, credit purchases, sales |
| `chat_sessions` | Chat conversation containers | User and demo sessions |
| `chat_messages` | Individual chat messages | User/AI messages, types, metadata |
| `demo_usage` | Demo user limits and tracking | IP-based usage limits |

### Key Relationships

```
users ←→ research_items (one-to-many)
users ←→ transactions (one-to-many)
research_items ←→ marketplace_listings (one-to-one)
marketplace_listings ←→ marketplace_access (one-to-many)
users ←→ chat_sessions (one-to-many)
chat_sessions ←→ chat_messages (one-to-many)
```

## 🔐 Security Configuration

### Row Level Security (RLS)

The database setup includes comprehensive RLS policies for production use:

- **Users**: Can only access their own profile
- **Research Items**: Public research viewable by all, private research only by owner
- **Marketplace**: Listings viewable by all, management only by owner
- **Transactions**: Users can only see their own transactions
- **Chat**: Users can only access their own sessions and messages
- **Demo**: Special policies for demo users based on IP address

### Development vs Production

**For Development:**
```sql
-- Disable RLS for easier development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE research_items DISABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)
```

**For Production:**
```sql
-- Enable RLS for security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)
```

## 🛠 Environment Configuration

### Supabase Environment Variables

Add these to your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database URL (for direct connections if needed)
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
```

### Supabase API Keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the required keys:
   - **Project URL**: Your Supabase project URL
   - **anon/public key**: For client-side operations
   - **service_role key**: For server-side operations (keep secret!)

## 📝 Usage Examples

### Setting Session Variables for RLS

```sql
-- Set wallet address for RLS policies
SELECT set_wallet_address('0x742d35Cc6634C0532925a3b8D22544Dd9e745fFd');

-- Set demo IP for demo users
SELECT set_demo_ip('192.168.1.100');

-- Clear session variables
SELECT clear_session_variables();
```

### Demo Usage Tracking

```sql
-- Track demo research usage
SELECT track_demo_usage('192.168.1.100', 'research');

-- Track demo chat usage  
SELECT track_demo_usage('192.168.1.100', 'chat');
```

### Credit Management

```sql
-- Add credits to user
SELECT manage_credits('0x742d35Cc6634C0532925a3b8D22544Dd9e745fFd', 'add', 100);

-- Deduct credits from user
SELECT manage_credits('0x742d35Cc6634C0532925a3b8D22544Dd9e745fFd', 'deduct', 50);
```

## 🧪 Testing the Setup

### Verify Tables Created

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Check Sample Data (if seeded)

```sql
-- Count records in each table
SELECT 
  'users' as table_name, COUNT(*) as records FROM users
UNION ALL
SELECT 'research_items', COUNT(*) FROM research_items
UNION ALL  
SELECT 'marketplace_listings', COUNT(*) FROM marketplace_listings
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'chat_sessions', COUNT(*) FROM chat_sessions
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages;
```

### Test RLS Policies

```sql
-- Test user access (should return only user's data)
SELECT set_wallet_address('0x742d35Cc6634C0532925a3b8D22544Dd9e745fFd');
SELECT * FROM research_items; -- Should only show Alice's research
```

## 🔧 Maintenance

### Backup Database

```bash
# Using Supabase CLI
supabase db dump --db-url "$DATABASE_URL" -f backup.sql

# Or from Supabase dashboard
# Go to Settings → Database → Database backups
```

### Reset Database

```sql
-- WARNING: This will delete ALL data!
-- Run in this order to respect foreign key constraints
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE chat_sessions CASCADE; 
TRUNCATE TABLE marketplace_access CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE marketplace_listings CASCADE;
TRUNCATE TABLE research_items CASCADE;
TRUNCATE TABLE demo_usage CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
```

### Update Schema

When updating the schema:

1. Test changes on a development database first
2. Back up production database
3. Apply migrations during low-traffic periods
4. Verify data integrity after changes

## 🚨 Troubleshooting

### Common Issues

#### 1. Extension Not Found
**Error**: `extension "uuid-ossp" is not available`

**Solution**: Extensions should be auto-available in Supabase. If not, contact Supabase support.

#### 2. Trigger Already Exists
**Error**: `trigger "update_users_updated_at" for relation "users" already exists`

**Solutions**:
- The script now includes `DROP TRIGGER IF EXISTS` statements to handle this
- If you still get this error, run this first:
```sql
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_research_items_updated_at ON research_items;
DROP TRIGGER IF EXISTS update_marketplace_listings_updated_at ON marketplace_listings;
DROP TRIGGER IF EXISTS update_marketplace_access_updated_at ON marketplace_access;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
DROP TRIGGER IF EXISTS update_demo_usage_updated_at ON demo_usage;
```

#### 3. Table Does Not Exist (Foreign Key Reference)
**Error**: `relation "marketplace_access" does not exist` or similar foreign key errors

**Solutions**:
- The script has been updated to create tables in the correct order
- If you get this error, it means a previous run partially failed
- Clear the database and run the full script again:
```sql
-- WARNING: This deletes all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

#### 4. Permission Denied
**Error**: `permission denied for table users`

**Solutions**:
- Ensure you're using the correct API key
- Check if RLS is enabled and policies are correctly configured
- Verify session variables are set properly

#### 5. Foreign Key Constraint Violations
**Error**: `violates foreign key constraint`

**Solutions**:
- Ensure parent records exist before inserting child records
- Check the order of INSERT statements in seed script
- Verify UUIDs are correctly formatted

#### 6. RLS Blocking Queries
**Error**: Queries return no results unexpectedly

**Solutions**:
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Temporarily disable RLS for debugging
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Set proper session variables
SELECT set_wallet_address('your-wallet-address');
```

#### 7. Seed Script Fails
**Error**: Various errors during seed script execution

**Solutions**:
- Run `database_setup.sql` first
- Check for any custom modifications to the schema
- Ensure all required extensions are installed
- Run sections of seed script individually to isolate issues

### Getting Help

1. **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
2. **Supabase Community**: [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
3. **PostgreSQL Documentation**: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)

### Monitoring and Logs

1. **Supabase Dashboard** → **Logs**
   - Database logs
   - API logs
   - Function logs

2. **Performance Monitoring**
   - Query performance
   - Connection pooling
   - Resource usage

## 📚 Additional Resources

- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Database Design Best Practices](https://supabase.com/docs/guides/database/database-design)

---

## 📞 Support

For ReSeich-specific database issues:
- Check this documentation first
- Review the SQL scripts for comments and explanations
- Test on a development database before applying to production
- Keep backups before making any changes

Happy coding! 🚀
