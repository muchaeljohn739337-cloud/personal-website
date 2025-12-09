-- =============================================================================
-- Supabase API Schema Setup
-- Migrates from public schema to api schema for Supabase API access
-- =============================================================================

-- Create api schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS api;

-- Grant usage on api schema to anon and authenticated roles
GRANT USAGE ON SCHEMA api TO anon;
GRANT USAGE ON SCHEMA api TO authenticated;

-- =============================================================================
-- Move existing tables from public to api schema
-- =============================================================================

-- Note: This script assumes tables are already created in public schema
-- If tables don't exist yet, Prisma migrations will create them in api schema

-- For existing tables, you would run:
-- ALTER TABLE public.<table_name> SET SCHEMA api;

-- =============================================================================
-- Grant permissions on api schema tables
-- =============================================================================

-- Function to grant permissions on all tables in api schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'api'
    LOOP
        -- Grant SELECT to anon (public read access)
        EXECUTE format('GRANT SELECT ON TABLE api.%I TO anon', r.tablename);
        
        -- Grant full CRUD to authenticated users
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE api.%I TO authenticated', r.tablename);
        
        -- Grant usage on sequences (for auto-increment IDs)
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE api.%I_id_seq TO anon, authenticated', r.tablename);
    END LOOP;
END $$;

-- =============================================================================
-- Enable Row Level Security (RLS) on api schema tables
-- =============================================================================

-- Function to enable RLS on all tables in api schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'api'
    LOOP
        EXECUTE format('ALTER TABLE api.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- =============================================================================
-- Create default RLS policies
-- =============================================================================

-- Example: Allow anon to read public data
-- CREATE POLICY "anon_read_public" ON api.<table_name>
--     FOR SELECT
--     TO anon
--     USING (true);

-- Example: Allow authenticated users full access to their own data
-- CREATE POLICY "authenticated_full_access" ON api.<table_name>
--     FOR ALL
--     TO authenticated
--     USING (auth.uid() = user_id);

-- =============================================================================
-- Revoke public schema access (optional - only if you want to completely hide public schema)
-- =============================================================================

-- WARNING: Only run this if you're sure all tables are moved to api schema
-- REVOKE ALL ON SCHEMA public FROM anon;
-- REVOKE ALL ON SCHEMA public FROM authenticated;

-- =============================================================================
-- Verify setup
-- =============================================================================

-- Check tables in api schema
SELECT 
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_schema = 'api'
ORDER BY table_name;

-- Check permissions
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'api'
ORDER BY table_name, grantee;

