-- Lectures Table for Lecturer Mode
-- Run this in Supabase SQL Editor

-- Create lectures table
CREATE TABLE IF NOT EXISTS lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Lecture Session',
  explanation_level TEXT DEFAULT 'intermediate' CHECK (explanation_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lecture_messages table
CREATE TABLE IF NOT EXISTS lecture_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lectures_user_id ON lectures(user_id);
CREATE INDEX IF NOT EXISTS idx_lectures_note_id ON lectures(note_id);
CREATE INDEX IF NOT EXISTS idx_lectures_created_at ON lectures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lecture_messages_lecture_id ON lecture_messages(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_messages_created_at ON lecture_messages(created_at ASC);

-- Enable RLS
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can insert own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can update own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can delete own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can view messages in own lectures" ON lecture_messages;
DROP POLICY IF EXISTS "Users can insert messages in own lectures" ON lecture_messages;
DROP POLICY IF EXISTS "Users can delete messages in own lectures" ON lecture_messages;

-- Create RLS policies for lectures
CREATE POLICY "Users can view own lectures" ON lectures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lectures" ON lectures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lectures" ON lectures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lectures" ON lectures FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for lecture_messages
CREATE POLICY "Users can view messages in own lectures" ON lecture_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM lectures WHERE lectures.id = lecture_messages.lecture_id AND lectures.user_id = auth.uid()));
CREATE POLICY "Users can insert messages in own lectures" ON lecture_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM lectures WHERE lectures.id = lecture_messages.lecture_id AND lectures.user_id = auth.uid()));
CREATE POLICY "Users can delete messages in own lectures" ON lecture_messages FOR DELETE
  USING (EXISTS (SELECT 1 FROM lectures WHERE lectures.id = lecture_messages.lecture_id AND lectures.user_id = auth.uid()));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lectures_updated_at ON lectures;
CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON lectures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
