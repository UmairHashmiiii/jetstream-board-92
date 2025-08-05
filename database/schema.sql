-- JeuxBoard Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMS
CREATE TYPE project_status AS ENUM ('not_started', 'in_progress', 'blocked', 'done');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table  
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role_id UUID REFERENCES roles(id) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    stack TEXT NOT NULL,
    sprint VARCHAR(100) NOT NULL,
    notes TEXT,
    status project_status DEFAULT 'not_started',
    created_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_modules table
CREATE TABLE IF NOT EXISTS project_modules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    module_name VARCHAR(255) NOT NULL,
    platform_stack VARCHAR(255) NOT NULL,
    assigned_dev_id UUID REFERENCES users(id),
    design_locked_date DATE,
    dev_start_date DATE,
    self_qa_date DATE,
    lead_signoff_date DATE,
    pm_review_date DATE,
    cto_review_status review_status DEFAULT 'pending',
    client_ready_status review_status DEFAULT 'pending',
    status project_status DEFAULT 'not_started',
    eta DATE,
    sprint VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_in_project VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_modules_project_id ON project_modules(project_id);
CREATE INDEX IF NOT EXISTS idx_project_modules_assigned_dev_id ON project_modules(assigned_dev_id);
CREATE INDEX IF NOT EXISTS idx_project_modules_status ON project_modules(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_modules_updated_at BEFORE UPDATE ON project_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Roles: Only admins can CRUD, everyone can read
CREATE POLICY "Everyone can read roles" ON roles
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage roles" ON roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.auth_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Users: Users can read all users, only admins can CRUD
CREATE POLICY "Everyone can read users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.auth_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Projects: Users can see projects they're members of, admins/PMs can CRUD
CREATE POLICY "Users can read their projects" ON projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_members pm 
            WHERE pm.project_id = id AND pm.user_id IN (
                SELECT id FROM users WHERE auth_id = auth.uid()
            )
        ) OR 
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.auth_id = auth.uid() AND r.name IN ('admin', 'pm', 'cto')
        )
    );

CREATE POLICY "Admins and PMs can manage projects" ON projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.auth_id = auth.uid() AND r.name IN ('admin', 'pm')
        )
    );

-- Project Modules: Complex field-level permissions handled in application
CREATE POLICY "Users can read modules for their projects" ON project_modules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_members pm 
            WHERE pm.project_id = project_modules.project_id AND pm.user_id IN (
                SELECT id FROM users WHERE auth_id = auth.uid()
            )
        ) OR 
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.auth_id = auth.uid() AND r.name IN ('admin', 'pm', 'cto', 'lead')
        )
    );

CREATE POLICY "Authorized users can update modules" ON project_modules
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.auth_id = auth.uid() AND (
                r.name IN ('admin', 'pm', 'cto', 'lead') OR
                (r.name = 'dev' AND u.id = assigned_dev_id) OR
                (r.name = 'designer' AND assigned_dev_id IS NOT NULL)
            )
        )
    );

CREATE POLICY "Admins and PMs can manage modules" ON project_modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.auth_id = auth.uid() AND r.name IN ('admin', 'pm')
        )
    );

-- Project Members: Users can see members of their projects, admins can manage
CREATE POLICY "Users can read project members" ON project_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_members pm2 
            WHERE pm2.project_id = project_members.project_id AND pm2.user_id IN (
                SELECT id FROM users WHERE auth_id = auth.uid()
            )
        ) OR 
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.auth_id = auth.uid() AND r.name IN ('admin', 'pm', 'cto')
        )
    );

CREATE POLICY "Admins can manage project members" ON project_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.auth_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Insert default roles
INSERT INTO roles (name) VALUES 
    ('admin'),
    ('dev'),
    ('pm'),
    ('cto'),
    ('lead'),
    ('designer')
ON CONFLICT (name) DO NOTHING;

-- Insert demo admin user (run after creating auth user manually)
-- You'll need to replace 'ACTUAL_AUTH_UUID' with the real UUID from auth.users
/*
INSERT INTO users (auth_id, name, email, role_id) VALUES 
    ('ACTUAL_AUTH_UUID', 'Admin User', 'admin@jeux.com', (SELECT id FROM roles WHERE name = 'admin'))
ON CONFLICT (email) DO NOTHING;
*/