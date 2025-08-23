# Database Fix for ReSeich Dashboard/Marketplace Issues

## Problem

The dashboard and marketplace are showing errors due to:

1. **Row-Level Security (RLS) Policy Violations** - Database rejecting user creation
2. **Missing Database Tables/Columns** - Some required fields don't exist
3. **Complex RLS Setup** - The current RLS policies require session variables that aren't being set

## Solution

For development, we'll disable RLS and use a simplified database setup.

## Steps to Fix

### 1. Set up your Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `init_database.sql`
4. Run the script

### 2. Environment Variables

Make sure you have these environment variables set in your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-publishable-key

# Dynamic SDK Configuration
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-dynamic-environment-id
```

### 3. What the Fix Does

#### Database Changes:

- **Disables RLS** for all tables (development only)
- **Adds missing columns** like `research_count` and `display_name`
- **Creates proper table structure** with all required fields
- **Adds sample demo users** for testing

#### Code Changes:

- **Simplified database service** without complex session variables
- **Proper error handling** for database operations
- **Wallet state integration** in dashboard and marketplace pages

### 4. Testing the Fix

After running the database script:

1. **Restart your development server**:

   ```bash
   cd frontend
   npm run dev
   ```

2. **Connect your wallet** on the landing page

3. **Navigate to dashboard** - should now load properly

4. **Navigate to marketplace** - should now load without infinite loading

### 5. Production Considerations

**IMPORTANT**: This fix disables RLS for development. For production:

1. **Re-enable RLS** by running the original `database_setup.sql`
2. **Implement proper authentication** with session variables
3. **Add proper security policies** for user data isolation

### 6. Troubleshooting

If you still see errors:

1. **Check Supabase connection** - verify your environment variables
2. **Check database tables** - ensure all tables were created
3. **Check browser console** - look for specific error messages
4. **Verify wallet connection** - ensure Dynamic Labs is properly configured

### 7. Alternative Approach

If you prefer to keep RLS enabled, you can:

1. Use the original `database_setup.sql`
2. Implement the session variable functions
3. Modify the database service to set session variables before each query

But for development and testing, the simplified approach (disabling RLS) is recommended.

## Files Modified

- `frontend/src/app/dashboard/page.tsx` - Added wallet context integration
- `frontend/src/app/marketplace/page.tsx` - Added wallet context integration
- `frontend/src/lib/hooks/useDemoMode.ts` - Added demoUser property
- `frontend/src/lib/database.ts` - Simplified database operations
- `frontend/init_database.sql` - New simplified database setup
- `frontend/database_setup.sql` - Updated with RLS disable option

## Next Steps

1. Run the database initialization script
2. Test the dashboard and marketplace
3. Verify wallet connection works
4. Test demo mode functionality
5. When ready for production, re-enable RLS with proper authentication
