/*
  # Add INSERT policy for projects table

  1. Security
    - Add policy for authenticated users to create projects
    - This allows the Edge Function to create sample projects for new users

  Note: This policy is needed for the create-sample-data Edge Function
  which runs with service role permissions to bypass RLS when creating
  sample data for new users.
*/

CREATE POLICY "Authenticated users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);