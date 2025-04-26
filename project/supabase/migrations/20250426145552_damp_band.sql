/*
  # Create messages table and analytics views

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `instance_id` (uuid, references whatsapp_instances.id)
      - `contact_number` (text)
      - `direction` (text) - INBOUND or OUTBOUND
      - `content` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on messages table
    - Add policies for users to read their own messages
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  contact_number text NOT NULL,
  direction text CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  content text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    instance_id IN (
      SELECT id FROM whatsapp_instances 
      WHERE user_id = auth.uid()
    )
  );

-- Create view for message analytics
CREATE OR REPLACE VIEW message_analytics AS
SELECT 
  wi.user_id,
  m.instance_id,
  DATE(m.created_at) as date,
  COUNT(DISTINCT m.contact_number) as unique_contacts,
  COUNT(*) FILTER (WHERE m.direction = 'INBOUND') as inbound_messages,
  COUNT(*) FILTER (WHERE m.direction = 'OUTBOUND') as outbound_messages,
  COUNT(*) as total_messages
FROM messages m
JOIN whatsapp_instances wi ON wi.id = m.instance_id
GROUP BY wi.user_id, m.instance_id, DATE(m.created_at);

-- Grant access to authenticated users
GRANT SELECT ON message_analytics TO authenticated;