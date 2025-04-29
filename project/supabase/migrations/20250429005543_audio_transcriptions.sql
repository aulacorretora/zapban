
ALTER TABLE IF EXISTS messages
ADD COLUMN IF NOT EXISTS type text DEFAULT 'TEXT' CHECK (type IN ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'));

CREATE TABLE IF NOT EXISTS audio_transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  instance_id uuid REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  message_id uuid,
  file_path text,
  transcription text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audio_transcriptions_user_instance ON audio_transcriptions(user_id, instance_id);
