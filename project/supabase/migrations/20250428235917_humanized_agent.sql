
--

CREATE TABLE IF NOT EXISTS agent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  instance_id uuid REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  is_active boolean DEFAULT false,
  mode text CHECK (mode IN ('ACTIVE', 'PASSIVE')) DEFAULT 'PASSIVE',
  openai_model text DEFAULT 'gpt-4-turbo',
  temperature numeric DEFAULT 0.7,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  instance_id uuid REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  trigger_phrase text NOT NULL,
  response text NOT NULL,
  is_active boolean DEFAULT true,
  action_buttons jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_agent_settings_user_instance ON agent_settings(user_id, instance_id);
CREATE INDEX idx_agent_triggers_user_instance ON agent_triggers(user_id, instance_id);
CREATE INDEX idx_agent_triggers_trigger_phrase ON agent_triggers(trigger_phrase);
