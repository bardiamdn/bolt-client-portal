/*
  # Add start and end dates to projects

  1. Schema Changes
    - Add `start_date` column to projects table (date type)
    - Add `end_date` column to projects table (date type)
    - Set default values for existing projects

  2. Data Migration
    - Update existing projects with sample date ranges
    - Ensure all projects have valid start and end dates

  3. Notes
    - Start dates default to project creation date
    - End dates default to 3 months after start date
    - Both fields are nullable to allow flexible project planning
*/

-- Add start_date and end_date columns to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN start_date date;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN end_date date;
  END IF;
END $$;

-- Update existing projects with default date ranges
UPDATE projects 
SET 
  start_date = COALESCE(start_date, created_at::date),
  end_date = COALESCE(end_date, (created_at::date + INTERVAL '3 months')::date)
WHERE start_date IS NULL OR end_date IS NULL;