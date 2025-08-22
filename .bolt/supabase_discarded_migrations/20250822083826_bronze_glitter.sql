/*
  # Complete Database Schema Setup

  1. New Tables
    - `profiles` - User profile information linked to auth.users
    - `companies` - Organizations that own projects  
    - `projects` - Main project entities with progress tracking
    - `project_members` - Many-to-many relationship between users and projects
    - `tasks` - Project tasks with assignment and tracking
    - `messages` - Real-time project messaging
    - `files` - File and link sharing within projects
    - `invoices` - Project billing and invoice management
    - `stripe_customers` - Maps Supabase users to Stripe customers
    - `stripe_subscriptions` - Tracks subscription status and billing cycles
    - `stripe_orders` - Records one-time payments and purchases

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for user access control
    - Create helper functions for permission checking

  3. Views
    - `stripe_user_subscriptions` - User's subscription data
    - `stripe_user_orders` - User's order history
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  icon text DEFAULT 'P',
  icon_bg text DEFAULT 'bg-purple-600',
  start_date date DEFAULT CURRENT_DATE,
  end_date date DEFAULT (CURRENT_DATE + INTERVAL '3 months'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL DEFAULT 'form' CHECK (type IN ('invoice', 'form', 'review', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date date NOT NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('file', 'link')),
  url text,
  file_path text,
  size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  number text NOT NULL UNIQUE,
  description text DEFAULT '',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Stripe tables
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text NOT NULL UNIQUE,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text NOT NULL REFERENCES stripe_customers(customer_id) ON DELETE CASCADE,
  subscription_id text UNIQUE,
  price_id text,
  subscription_status text DEFAULT 'not_started',
  current_period_start bigint,
  current_period_end bigint,
  cancel_at_period_end boolean DEFAULT false,
  payment_method_brand text,
  payment_method_last4 text,
  status text DEFAULT 'not_started',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id serial UNIQUE,
  checkout_session_id text NOT NULL UNIQUE,
  payment_intent_id text,
  customer_id text REFERENCES stripe_customers(customer_id) ON DELETE CASCADE,
  amount_subtotal bigint,
  amount_total bigint,
  currency text DEFAULT 'usd',
  payment_status text DEFAULT 'pending',
  status text DEFAULT 'pending',
  order_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- Create helper function for project membership checks
CREATE OR REPLACE FUNCTION is_project_member(project_uuid uuid, user_uuid uuid)
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
  );
$$;

-- Create helper function for project owner/admin checks
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

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Companies policies
CREATE POLICY "Users can read companies of their projects"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE p.company_id = companies.id
        AND pm.user_id = auth.uid()
    )
  );

-- Projects policies
CREATE POLICY "Users can read projects they are members of"
  ON projects
  FOR SELECT
  TO authenticated
  USING (is_project_member(id, auth.uid()));

CREATE POLICY "Project owners can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (is_project_owner_or_admin(id, auth.uid()));

-- Project members policies
CREATE POLICY "Users can read project memberships for their projects"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (is_project_member(project_id, auth.uid()));

CREATE POLICY "Project owners can manage memberships"
  ON project_members
  FOR ALL
  TO authenticated
  USING (is_project_owner_or_admin(project_id, auth.uid()))
  WITH CHECK (is_project_owner_or_admin(project_id, auth.uid()));

-- Tasks policies
CREATE POLICY "Users can read tasks for their projects"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (is_project_member(project_id, auth.uid()));

-- Messages policies
CREATE POLICY "Users can read messages for their projects"
  ON messages
  FOR SELECT
  TO authenticated
  USING (is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (is_project_member(project_id, auth.uid()));

-- Files policies
CREATE POLICY "Users can read files for their projects"
  ON files
  FOR SELECT
  TO authenticated
  USING (is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can upload files"
  ON files
  FOR INSERT
  TO authenticated
  WITH CHECK (is_project_member(project_id, auth.uid()));

-- Invoices policies
CREATE POLICY "Users can read invoices for their projects"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (is_project_member(project_id, auth.uid()));

CREATE POLICY "Project owners can manage invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (is_project_owner_or_admin(project_id, auth.uid()))
  WITH CHECK (is_project_owner_or_admin(project_id, auth.uid()));

-- Stripe customers policies
CREATE POLICY "Users can read own stripe customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stripe customer data"
  ON stripe_customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stripe customer data"
  ON stripe_customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Stripe subscriptions policies
CREATE POLICY "Users can read own subscription data"
  ON stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stripe_customers sc
      WHERE sc.customer_id = stripe_subscriptions.customer_id
        AND sc.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage subscriptions"
  ON stripe_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Stripe orders policies
CREATE POLICY "Users can read own order data"
  ON stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stripe_customers sc
      WHERE sc.customer_id = stripe_orders.customer_id
        AND sc.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage orders"
  ON stripe_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create views for user-specific Stripe data
CREATE OR REPLACE VIEW stripe_user_subscriptions AS
SELECT 
  ss.*
FROM stripe_subscriptions ss
JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
WHERE sc.user_id = auth.uid();

CREATE OR REPLACE VIEW stripe_user_orders AS
SELECT 
  so.*
FROM stripe_orders so
JOIN stripe_customers sc ON so.customer_id = sc.customer_id
WHERE sc.user_id = auth.uid();

-- Grant permissions on helper functions
GRANT EXECUTE ON FUNCTION is_project_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_owner_or_admin(uuid, uuid) TO authenticated;

-- Insert sample data
INSERT INTO companies (id, name) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Acme Corporation')
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, title, description, company_id, progress, icon, icon_bg, start_date, end_date) VALUES 
  ('coreflux', 'CoreFlux', 'CoreFlux Integration Platform', 'A comprehensive integration platform for seamless data flow between enterprise systems', '550e8400-e29b-41d4-a716-446655440000', 75, 'CF', 'bg-blue-600', '2024-01-15', '2024-06-15')
ON CONFLICT (id) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (project_id, title, description, type, status, priority, due_date) VALUES 
  ('coreflux', 'Review API Documentation', 'Please review the updated API documentation for the new endpoints', 'review', 'pending', 'high', '2024-03-15'),
  ('coreflux', 'Complete Integration Testing', 'Perform end-to-end testing of the CoreFlux integration', 'form', 'pending', 'medium', '2024-03-20'),
  ('coreflux', 'Invoice Payment Required', 'Payment needed for Q1 development milestone', 'invoice', 'pending', 'high', '2024-03-10')
ON CONFLICT DO NOTHING;

-- Insert sample invoices
INSERT INTO invoices (project_id, number, description, amount, status, issue_date, due_date) VALUES 
  ('coreflux', 'INV-2024-001', 'Q1 Development Milestone - CoreFlux Integration Platform', 15000.00, 'pending', '2024-02-15', '2024-03-15'),
  ('coreflux', 'INV-2024-002', 'Additional API Development Services', 8500.00, 'paid', '2024-01-15', '2024-02-15')
ON CONFLICT (number) DO NOTHING;

-- Insert sample files
INSERT INTO files (project_id, name, type, url) VALUES 
  ('coreflux', 'Project Requirements Document', 'link', 'https://docs.google.com/document/d/example'),
  ('coreflux', 'API Specification', 'link', 'https://api.coreflux.com/docs'),
  ('coreflux', 'Integration Guide', 'link', 'https://github.com/coreflux/integration-guide')
ON CONFLICT DO NOTHING;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
    CREATE TRIGGER update_companies_updated_at
      BEFORE UPDATE ON companies
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at') THEN
    CREATE TRIGGER update_projects_updated_at
      BEFORE UPDATE ON projects
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invoices_updated_at') THEN
    CREATE TRIGGER update_invoices_updated_at
      BEFORE UPDATE ON invoices
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger for new user profile creation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;