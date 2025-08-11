/*
  # Create Sample Data with Project Memberships

  1. Sample Data
    - Creates sample companies and projects
    - Creates project memberships for authenticated users
    - Creates sample tasks, invoices, and files

  2. Security
    - Ensures proper project membership relationships
    - Maintains RLS compliance
*/

-- Insert sample companies
INSERT INTO companies (id, name) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Acme Corporation'),
  ('550e8400-e29b-41d4-a716-446655440002', 'TechStart Inc')
ON CONFLICT (id) DO NOTHING;

-- Insert sample projects
INSERT INTO projects (id, name, title, description, company_id, progress, icon, icon_bg) VALUES 
  ('df75cd43-5d84-47a2-834c-5bc2acd071e3', 'coreflux', 'CoreFlux Platform Development', 'Building a modern data processing platform with real-time analytics capabilities', '550e8400-e29b-41d4-a716-446655440001', 75, 'C', 'bg-blue-500'),
  ('550e8400-e29b-41d4-a716-446655440003', 'webapp', 'Web Application Redesign', 'Complete redesign of the company website with modern UI/UX', '550e8400-e29b-41d4-a716-446655440002', 45, 'W', 'bg-green-500')
ON CONFLICT (id) DO NOTHING;

-- Create project memberships for all authenticated users
-- This will make any authenticated user a member of both projects
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Add current authenticated users to projects
    FOR user_record IN 
        SELECT id FROM auth.users 
    LOOP
        -- Add to CoreFlux project as owner
        INSERT INTO project_members (project_id, user_id, role) 
        VALUES ('df75cd43-5d84-47a2-834c-5bc2acd071e3', user_record.id, 'owner')
        ON CONFLICT (project_id, user_id) DO NOTHING;
        
        -- Add to WebApp project as member
        INSERT INTO project_members (project_id, user_id, role) 
        VALUES ('550e8400-e29b-41d4-a716-446655440003', user_record.id, 'member')
        ON CONFLICT (project_id, user_id) DO NOTHING;
    END LOOP;
END $$;

-- Insert sample tasks
INSERT INTO tasks (project_id, title, type, status, priority, due_date, created_by) 
SELECT 
    'df75cd43-5d84-47a2-834c-5bc2acd071e3',
    'Review API Documentation',
    'review',
    'pending',
    'high',
    CURRENT_DATE + INTERVAL '3 days',
    auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO tasks (project_id, title, type, status, priority, due_date, created_by) 
SELECT 
    'df75cd43-5d84-47a2-834c-5bc2acd071e3',
    'Submit Monthly Invoice',
    'invoice',
    'pending',
    'medium',
    CURRENT_DATE + INTERVAL '7 days',
    auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- Insert sample invoices
INSERT INTO invoices (project_id, number, description, amount, status, issue_date, due_date) VALUES 
  ('df75cd43-5d84-47a2-834c-5bc2acd071e3', 'INV-2024-001', 'Development Phase 1', 15000.00, 'pending', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days'),
  ('df75cd43-5d84-47a2-834c-5bc2acd071e3', 'INV-2024-002', 'Development Phase 2', 12000.00, 'paid', CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT (number) DO NOTHING;

-- Insert sample files/links
INSERT INTO files (project_id, name, type, url, uploaded_by) 
SELECT 
    'df75cd43-5d84-47a2-834c-5bc2acd071e3',
    'Project Requirements',
    'link',
    'https://docs.google.com/document/d/example',
    auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO files (project_id, name, type, url, uploaded_by) 
SELECT 
    'df75cd43-5d84-47a2-834c-5bc2acd071e3',
    'Design Mockups',
    'link',
    'https://figma.com/file/example',
    auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;