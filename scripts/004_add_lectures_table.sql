-- Lectures Table for Lecturer Mode
-- This script adds a table to store lecture sessions with their Q&A history

CREATE TABLE IF NOT EXISTS lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Lecture Session',
  explanation_level TEXT DEFAULT 'intermediate' CHECK (explanation_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lecture Messages Table (stores Q&A history for each lecture)
CREATE TABLE IF NOT EXISTS lecture_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lectures_user_id ON lectures(user_id);
CREATE INDEX IF NOT EXISTS idx_lectures_note_id ON lectures(note_id);
CREATE INDEX IF NOT EXISTS idx_lectures_created_at ON lectures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lecture_messages_lecture_id ON lecture_messages(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_messages_created_at ON lecture_messages(created_at ASC);

-- Enable Row Level Security
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lectures
CREATE POLICY "Users can view own lectures" ON lectures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lectures" ON lectures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lectures" ON lectures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lectures" ON lectures FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for lecture_messages (inherit from lectures)
CREATE POLICY "Users can view messages in own lectures" ON lecture_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM lectures WHERE lectures.id = lecture_messages.lecture_id AND lectures.user_id = auth.uid()));
CREATE POLICY "Users can insert messages in own lectures" ON lecture_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM lectures WHERE lectures.id = lecture_messages.lecture_id AND lectures.user_id = auth.uid()));
CREATE POLICY "Users can delete messages in own lectures" ON lecture_messages FOR DELETE
  USING (EXISTS (SELECT 1 FROM lectures WHERE lectures.id = lecture_messages.lecture_id AND lectures.user_id = auth.uid()));

-- Allow service role to bypass RLS for operations (for API routes)
CREATE POLICY "Service role can manage lectures" ON lectures
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage lecture messages" ON lecture_messages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger for updated_at on lectures
CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON lectures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
