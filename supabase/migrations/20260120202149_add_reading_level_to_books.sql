/*
  # Add Reading Level to Books

  ## Summary
  Adds reading level information to books table to help parents and children
  understand the difficulty level of books being read.

  ## Changes
  - Add `reading_level` column to books table (text, nullable)
  - Add `interest_level` column for age appropriateness (text, nullable)

  ## Notes
  - Reading level examples: "Grade 3-5", "Ages 8-10", "AR 4.5", etc.
  - Interest level indicates target audience age range
  - Both fields are nullable as not all books have this information
*/

-- Add reading level columns to books table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'reading_level'
  ) THEN
    ALTER TABLE books ADD COLUMN reading_level text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'interest_level'
  ) THEN
    ALTER TABLE books ADD COLUMN interest_level text;
  END IF;
END $$;
