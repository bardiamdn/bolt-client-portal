/*
  # Add description column to tasks table

  1. Changes
    - Add `description` column to `tasks` table as optional text field
    - Column allows null values since description is optional for tasks

  2. Notes
    - This resolves the PGRST204 error where the application expects a description column
    - The column is nullable to maintain compatibility with existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'description'
  ) THEN
    ALTER TABLE tasks ADD COLUMN description text;
  END IF;
END $$;