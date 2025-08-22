/*
  # Add INSERT policy for companies table

  1. Security Changes
    - Add policy to allow authenticated users to create companies
    - This enables sample project creation for new users

  2. Notes
    - Required for the createSampleProjects function to work properly
    - Allows any authenticated user to create companies
*/

CREATE POLICY "Authenticated users can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);