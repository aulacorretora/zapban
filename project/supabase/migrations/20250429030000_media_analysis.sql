CREATE TABLE IF NOT EXISTS image_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  instance_id uuid REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  message_id uuid,
  file_path text,
  extracted_text text,
  identified_objects jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_image_analysis_user_instance ON image_analysis(user_id, instance_id);

CREATE TABLE IF NOT EXISTS pdf_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  instance_id uuid REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  message_id uuid,
  file_path text,
  extracted_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_pdf_extractions_user_instance ON pdf_extractions(user_id, instance_id);
