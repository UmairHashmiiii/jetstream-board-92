-- Demo Data for JeuxBoard
-- Run this after setting up the schema and creating your admin user

-- Insert demo users (replace with actual auth UUIDs from Supabase Auth)
INSERT INTO users (auth_id, name, email, role_id) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'John Developer', 'john@jeux.com', (SELECT id FROM roles WHERE name = 'dev')),
    ('00000000-0000-0000-0000-000000000002', 'Sarah Designer', 'sarah@jeux.com', (SELECT id FROM roles WHERE name = 'designer')),
    ('00000000-0000-0000-0000-000000000003', 'Mike PM', 'mike@jeux.com', (SELECT id FROM roles WHERE name = 'pm')),
    ('00000000-0000-0000-0000-000000000004', 'Lisa CTO', 'lisa@jeux.com', (SELECT id FROM roles WHERE name = 'cto')),
    ('00000000-0000-0000-0000-000000000005', 'Alex Lead', 'alex@jeux.com', (SELECT id FROM roles WHERE name = 'lead'))
ON CONFLICT (email) DO NOTHING;

-- Insert demo projects
INSERT INTO projects (title, stack, sprint, notes, status, created_by) VALUES 
    (
        'E-commerce Mobile App',
        'React Native, Node.js, MongoDB',
        'Sprint 1',
        'Modern e-commerce application with real-time features',
        'in_progress',
        (SELECT id FROM users WHERE email = 'admin@jeux.com')
    ),
    (
        'Admin Dashboard',
        'React, TypeScript, Supabase',
        'Sprint 2',
        'Internal dashboard for business analytics',
        'not_started',
        (SELECT id FROM users WHERE email = 'mike@jeux.com')
    ),
    (
        'IoT Device Manager',
        'Python, FastAPI, PostgreSQL',
        'Sprint 1',
        'Device management system for IoT infrastructure',
        'done',
        (SELECT id FROM users WHERE email = 'alex@jeux.com')
    );

-- Insert demo project modules
INSERT INTO project_modules (
    project_id, module_name, platform_stack, assigned_dev_id, 
    design_locked_date, dev_start_date, self_qa_date, 
    cto_review_status, client_ready_status, status, 
    eta, sprint, notes
) VALUES 
    (
        (SELECT id FROM projects WHERE title = 'E-commerce Mobile App'),
        'User Authentication',
        'React Native + Firebase Auth',
        (SELECT id FROM users WHERE email = 'john@jeux.com'),
        '2025-01-01',
        '2025-01-02',
        '2025-01-05',
        'approved',
        'pending',
        'done',
        '2025-01-08',
        'Sprint 1',
        'JWT-based authentication with social login'
    ),
    (
        (SELECT id FROM projects WHERE title = 'E-commerce Mobile App'),
        'Product Catalog',
        'React Native + REST API',
        (SELECT id FROM users WHERE email = 'john@jeux.com'),
        '2025-01-03',
        '2025-01-04',
        NULL,
        'pending',
        'pending',
        'in_progress',
        '2025-01-15',
        'Sprint 1',
        'Product browsing and search functionality'
    ),
    (
        (SELECT id FROM projects WHERE title = 'Admin Dashboard'),
        'Analytics Dashboard',
        'React + Recharts',
        (SELECT id FROM users WHERE email = 'john@jeux.com'),
        NULL,
        NULL,
        NULL,
        'pending',
        'pending',
        'not_started',
        '2025-02-01',
        'Sprint 2',
        'Real-time analytics with interactive charts'
    );

-- Insert demo project members
INSERT INTO project_members (project_id, user_id, role_in_project) VALUES 
    (
        (SELECT id FROM projects WHERE title = 'E-commerce Mobile App'),
        (SELECT id FROM users WHERE email = 'john@jeux.com'),
        'Lead Developer'
    ),
    (
        (SELECT id FROM projects WHERE title = 'E-commerce Mobile App'),
        (SELECT id FROM users WHERE email = 'sarah@jeux.com'),
        'UI/UX Designer'
    ),
    (
        (SELECT id FROM projects WHERE title = 'Admin Dashboard'),
        (SELECT id FROM users WHERE email = 'john@jeux.com'),
        'Frontend Developer'
    ),
    (
        (SELECT id FROM projects WHERE title = 'Admin Dashboard'),
        (SELECT id FROM users WHERE email = 'mike@jeux.com'),
        'Project Manager'
    );

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE project_modules;
ALTER PUBLICATION supabase_realtime ADD TABLE project_members;
ALTER PUBLICATION supabase_realtime ADD TABLE users;