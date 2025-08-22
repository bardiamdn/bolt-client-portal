/*
  # Complete Database Schema Setup

  1. New Tables
    - `companies` - Organizations that own projects
    - `projects` - Main project entities with progress tracking  
    - `project_members` - Many-to-many relationship between users and projects
    - `tasks` - Project tasks with assignment and tracking
    - `messages` - Real-time project messaging
    - `files` - File and link sharing within projects
    - `invoices` - Project billing and invoice management

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on project membership
    - Create helper function for permission checking

  3. Sample Data
    - Insert sample companies, projects, and memberships
    - Add sample tasks, invoices, and files for demonstration
*/

-- Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  description text,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  icon text DEFAULT 'C',
  icon_bg text DEFAULT 'bg-blue-500',
  start_date date DEFAULT CURRENT_DATE,
  end_date date DEFAULT CURRENT_DATE + INTERVAL '3 months',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text DEFAULT 'form' CHECK (type IN ('invoice', 'form', 'review', 'other')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'in_progress')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date date,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create files table if it doesn't exist
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'file' CHECK (type IN ('file', 'link')),
  url text,
  file_path text,
  size bigint,
  mime_type text,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number text UNIQUE NOT NULL,
  description text,
  amount numeric(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  issue_date date NOT NULL,
  due_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create helper function for permission checking (only if it doesn't exist)
CREATE OR REPLACE FUNCTION is_project_owner_or_admin(project_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM project_members 
    WHERE project_id = project_uuid 
      AND user_id = user_uuid 
      AND role IN ('owner', 'admin')
  );
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION is_project_owner_or_admin(uuid, uuid) TO authenticated;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Companies policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Authenticated users can read companies') THEN
    CREATE POLICY "Authenticated users can read companies"
      ON companies FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Projects policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Authenticated users can read projects') THEN
    CREATE POLICY "Authenticated users can read projects"
      ON projects FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Project members policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_members' AND policyname = 'Users can read their project memberships') THEN
    CREATE POLICY "Users can read their project memberships"
      ON project_members FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_members' AND policyname = 'Project owners can manage memberships') THEN
    CREATE POLICY "Project owners can manage memberships"
      ON project_members FOR ALL
      TO authenticated
      USING (is_project_owner_or_admin(project_id, auth.uid()))
      WITH CHECK (is_project_owner_or_admin(project_id, auth.uid()));
  END IF;

  -- Tasks policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Project members can read tasks') THEN
    CREATE POLICY "Project members can read tasks"
      ON tasks FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = tasks.project_id 
        AND pm.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Project members can create tasks') THEN
    CREATE POLICY "Project members can create tasks"
      ON tasks FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = created_by 
        AND EXISTS (
          SELECT 1 FROM project_members pm 
          WHERE pm.project_id = tasks.project_id 
          AND pm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Project members can update tasks') THEN
    CREATE POLICY "Project members can update tasks"
      ON tasks FOR UPDATE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = tasks.project_id 
        AND pm.user_id = auth.uid()
      ));
  END IF;

  -- Messages policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Project members can read messages') THEN
    CREATE POLICY "Project members can read messages"
      ON messages FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = messages.project_id 
        AND pm.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Project members can send messages') THEN
    CREATE POLICY "Project members can send messages"
      ON messages FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = sender_id 
        AND EXISTS (
          SELECT 1 FROM project_members pm 
          WHERE pm.project_id = messages.project_id 
          AND pm.user_id = auth.uid()
        )
      );
  END IF;

  -- Files policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Project members can read files') THEN
    CREATE POLICY "Project members can read files"
      ON files FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = files.project_id 
        AND pm.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Project members can upload files') THEN
    CREATE POLICY "Project members can upload files"
      ON files FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = uploaded_by 
        AND EXISTS (
          SELECT 1 FROM project_members pm 
          WHERE pm.project_id = files.project_id 
          AND pm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Users can delete their own files') THEN
    CREATE POLICY "Users can delete their own files"
      ON files FOR DELETE
      TO authenticated
      USING (auth.uid() = uploaded_by);
  END IF;

  -- Invoices policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Project members can read invoices') THEN
    CREATE POLICY "Project members can read invoices"
      ON invoices FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = invoices.project_id 
        AND pm.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Project owners can manage invoices') THEN
    CREATE POLICY "Project owners can manage invoices"
      ON invoices FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = invoices.project_id 
        AND pm.user_id = auth.uid() 
        AND pm.role IN ('owner', 'admin')
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = invoices.project_id 
        AND pm.user_id = auth.uid() 
        AND pm.role IN ('owner', 'admin')
      ));
  END IF;
END $$;

-- Insert sample companies
INSERT INTO companies (id, name) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Acme Corporation'),
  ('550e8400-e29b-41d4-a716-446655440002', 'TechStart Inc')
ON CONFLICT (id) DO NOTHING;

-- Insert sample projects
INSERT INTO projects (id, name, title, description, company_id, progress, icon, icon_bg, start_date, end_date) VALUES 
  ('df75cd43-5d84-47a2-834c-5bc2acd071e3', 'coreflux', 'CoreFlux Platform Development', 'Building a modern data processing platform with real-time analytics capabilities', '550e8400-e29b-41d4-a716-446655440001', 75, 'C', 'bg-blue-500', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '1 month'),
  ('550e8400-e29b-41d4-a716-446655440003', 'webapp', 'Web Application Redesign', 'Complete redesign of the company website with modern UI/UX', '550e8400-e29b-41d4-a716-446655440002', 45, 'W', 'bg-green-500', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '2 months')
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