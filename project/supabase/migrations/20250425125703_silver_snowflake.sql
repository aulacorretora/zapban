/*
  # Create plans table and update users table

  1. New Tables
    - `plans`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamptz)
      - `max_instances` (integer)
      - `price` (numeric)
      - `features` (jsonb)

  2. Security
    - Enable RLS on plans table
    - Add policy for authenticated users to read plans
*/

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  max_instances integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  features jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Create policy for reading plans
CREATE POLICY "Anyone can read plans"
  ON plans
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default plan
INSERT INTO plans (name, max_instances, price, features)
VALUES ('Free', 1, 0, '{"can_create_automations": true, "max_messages_per_day": 100}'::jsonb);

-- Temporarily drop the foreign key constraint from users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_id_fkey;

-- Add the foreign key constraint back
ALTER TABLE users
ADD CONSTRAINT users_plan_id_fkey
FOREIGN KEY (plan_id) REFERENCES plans(id);