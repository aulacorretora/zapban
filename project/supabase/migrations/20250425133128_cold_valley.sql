/*
  # Add admin-related columns and functions

  1. Changes
    - Add is_active column to users table
    - Add role column to users table
    - Add last_active column to users table
    - Create function to update last_active timestamp

  2. Security
    - Add policies for admin access
    - Maintain existing user policies
*/

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active timestamptz DEFAULT now();

-- Create function to update last_active
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS trigger AS $$
BEGIN
  NEW.last_active = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last_active
DROP TRIGGER IF EXISTS update_user_last_active ON users;
CREATE TRIGGER update_user_last_active
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

-- Add admin policies
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

-- Update existing user to be admin (replace with actual admin user ID)
UPDATE users
SET role = 'admin'
WHERE email = 'admin@zapban.com';