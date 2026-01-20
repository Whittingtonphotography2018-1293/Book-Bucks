/*
  # BookBucks Database Schema

  ## Overview
  This migration creates the complete database structure for the BookBucks app,
  a gamified reading rewards system for children managed by parents.

  ## New Tables
  
  ### 1. `profiles`
  Stores parent account information
  - `id` (uuid, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `children`
  Stores child profiles managed by parents
  - `id` (uuid, primary key)
  - `parent_id` (uuid, references profiles)
  - `name` (text) - Child's name
  - `grade_level` (int) - Current grade level
  - `avatar_color` (text) - For UI personalization
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `reward_settings`
  Stores reward configuration for each child
  - `id` (uuid, primary key)
  - `child_id` (uuid, references children, unique)
  - `reward_type` (text) - 'money' or 'points'
  - `amount_per_book` (numeric) - Amount earned per book
  - `payout_threshold` (numeric) - Minimum to cash out
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `books`
  Stores books read by children
  - `id` (uuid, primary key)
  - `child_id` (uuid, references children)
  - `title` (text) - Book title
  - `author` (text) - Book author
  - `summary` (text) - Short summary by child
  - `cover_url` (text, nullable) - Book cover image
  - `status` (text) - 'pending', 'approved', 'rejected'
  - `submitted_at` (timestamptz)
  - `approved_at` (timestamptz, nullable)
  - `created_at` (timestamptz)

  ### 5. `prizes`
  Custom prizes created by parents
  - `id` (uuid, primary key)
  - `parent_id` (uuid, references profiles)
  - `child_id` (uuid, references children, nullable) - If null, available to all parent's children
  - `name` (text) - Prize name
  - `description` (text)
  - `points_required` (numeric) - Points needed to redeem
  - `is_redeemed` (boolean) - Whether claimed
  - `created_at` (timestamptz)

  ### 6. `achievements`
  Tracks badges and milestones earned by children
  - `id` (uuid, primary key)
  - `child_id` (uuid, references children)
  - `achievement_type` (text) - 'milestone_5', 'milestone_10', etc.
  - `title` (text) - Achievement title
  - `description` (text) - Achievement description
  - `earned_at` (timestamptz)

  ## Security
  - All tables have RLS enabled
  - Parents can only access their own data and their children's data
  - Children profiles and related data are restricted to the parent who created them
  - Proper policies for SELECT, INSERT, UPDATE, and DELETE operations
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create children table
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  grade_level int NOT NULL CHECK (grade_level >= 0 AND grade_level <= 12),
  avatar_color text DEFAULT '#4CAF50',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reward_settings table
CREATE TABLE IF NOT EXISTS reward_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE UNIQUE NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('money', 'points')),
  amount_per_book numeric DEFAULT 1.00 CHECK (amount_per_book >= 0),
  payout_threshold numeric DEFAULT 10.00 CHECK (payout_threshold >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  summary text NOT NULL,
  cover_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create prizes table
CREATE TABLE IF NOT EXISTS prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  points_required numeric DEFAULT 10 CHECK (points_required >= 0),
  is_redeemed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  achievement_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  earned_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Children policies
CREATE POLICY "Parents can view own children"
  ON children FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can create children"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own children"
  ON children FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can delete own children"
  ON children FOR DELETE
  TO authenticated
  USING (parent_id = auth.uid());

-- Reward settings policies
CREATE POLICY "Parents can view children's reward settings"
  ON reward_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = reward_settings.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can create reward settings"
  ON reward_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = reward_settings.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update children's reward settings"
  ON reward_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = reward_settings.child_id
      AND children.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = reward_settings.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Books policies
CREATE POLICY "Parents can view children's books"
  ON books FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = books.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can create books for children"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = books.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update children's books"
  ON books FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = books.child_id
      AND children.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = books.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can delete children's books"
  ON books FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = books.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Prizes policies
CREATE POLICY "Parents can view own prizes"
  ON prizes FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can create prizes"
  ON prizes FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own prizes"
  ON prizes FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can delete own prizes"
  ON prizes FOR DELETE
  TO authenticated
  USING (parent_id = auth.uid());

-- Achievements policies
CREATE POLICY "Parents can view children's achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = achievements.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can create achievements for children"
  ON achievements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = achievements.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_books_child_id ON books(child_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_reward_settings_child_id ON reward_settings(child_id);
CREATE INDEX IF NOT EXISTS idx_prizes_parent_id ON prizes(parent_id);
CREATE INDEX IF NOT EXISTS idx_prizes_child_id ON prizes(child_id);
CREATE INDEX IF NOT EXISTS idx_achievements_child_id ON achievements(child_id);