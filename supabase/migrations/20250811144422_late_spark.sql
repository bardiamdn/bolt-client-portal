/*
  # Fix RLS Infinite Recursion in Project Members

  1. Problem
    - The "Project owners can manage memberships" policy on project_members table
    - Creates infinite recursion by querying project_members from within itself
    - This happens when other tables check project membership

  2. Solution
    - Replace the recursive policy with a simpler approach
    - Use a security definer function to break the recursion cycle
    - Maintain the same security model without circular references

  3. Changes
    - Drop the problematic policy
    - Create a helper function that uses security definer
    - Create new policy using the helper function
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Project owners can manage memberships" ON project_members;

-- Create a security definer function to check if user is project owner/admin
-- This breaks the recursion cycle by using security definer privileges
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

-- Create new policy using the helper function (no recursion)
CREATE POLICY "Project owners can manage memberships"
  ON project_members
  FOR ALL
  TO authenticated
  USING (is_project_owner_or_admin(project_id, auth.uid()))
  WITH CHECK (is_project_owner_or_admin(project_id, auth.uid()));

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION is_project_owner_or_admin(uuid, uuid) TO authenticated;