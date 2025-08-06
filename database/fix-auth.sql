-- Fix authentication issues
-- Run this in your Supabase SQL editor to fix RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can create their own profile" ON users
    FOR INSERT WITH CHECK (auth_id = auth.uid());

-- Allow users to read all users (keep existing)
-- (Already exists: "Everyone can read users")

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth_id = auth.uid());

-- Allow admins to manage all users
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.auth_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Ensure first user can always be created (fallback)
CREATE POLICY "Allow first user creation" ON users
    FOR INSERT WITH CHECK (
        NOT EXISTS (SELECT 1 FROM users LIMIT 1)
    );