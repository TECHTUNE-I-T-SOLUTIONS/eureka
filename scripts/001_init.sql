-- Eureka AI Study Assistant - Database Schema
-- This script creates all necessary tables with Row Level Security

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Settings Table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  explain_level TEXT DEFAULT 'intermediate' CHECK (explain_level IN ('beginner', 'intermediate', 'advanced')),
  study_preferences JSONB DEFAULT '{}',
  notify_on_new_chunks BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  summary TEXT,
  uploaded_via TEXT DEFAULT 'text' CHECK (uploaded_via IN ('text', 'file', 'paste')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks Table (for vector storage)
CREATE TABLE IF NOT EXISTS chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_hash TEXT NOT NULL,
  embedding DOUBLE PRECISION[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats Table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('chunks_processed', 'note_ready', 'system', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs Table (for background processing)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('chunk_embed', 'summarize', 'export')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  payload JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chunks_hash ON chunks(chunk_hash);
CREATE INDEX IF NOT EXISTS idx_chunks_note_id ON chunks(note_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Enable Row Level Security on all tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for notes
CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chunks (inherit from notes)
CREATE POLICY "Users can view chunks of own notes" ON chunks FOR SELECT 
  USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = chunks.note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can insert chunks for own notes" ON chunks FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM notes WHERE notes.id = chunks.note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can delete chunks of own notes" ON chunks FOR DELETE 
  USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = chunks.note_id AND notes.user_id = auth.uid()));

-- RLS Policies for chats
CREATE POLICY "Users can view own chats" ON chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chats" ON chats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON chats FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages (inherit from chats)
CREATE POLICY "Users can view messages in own chats" ON chat_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM chats WHERE chats.id = chat_messages.chat_id AND chats.user_id = auth.uid()));
CREATE POLICY "Users can insert messages in own chats" ON chat_messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM chats WHERE chats.id = chat_messages.chat_id AND chats.user_id = auth.uid()));

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can view own subscriptions" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for jobs
CREATE POLICY "Users can view own jobs" ON jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to auto-create user settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();



-- Eureka AI Study Assistant - Notification Triggers
-- This script adds automatic notification triggers for table insertions

-- Function to create notification when a new note is created
CREATE OR REPLACE FUNCTION notify_new_note()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, payload)
  VALUES (
    NEW.user_id,
    'note_ready',
    'New Note Created',
    format('Your note "%s" has been created and is being processed.', NEW.title),
    jsonb_build_object('note_id', NEW.id, 'title', NEW.title)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when note processing is complete
CREATE OR REPLACE FUNCTION notify_note_processed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changed to 'completed'
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    INSERT INTO notifications (user_id, type, title, message, payload)
    VALUES (
      NEW.user_id,
      'note_ready',
      'Note Ready',
      format('Your note "%s" has been processed and is ready for study!', NEW.title),
      jsonb_build_object('note_id', NEW.id, 'title', NEW.title, 'summary', LEFT(NEW.summary, 100))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when chunks are created for a note
CREATE OR REPLACE FUNCTION notify_chunks_processed()
RETURNS TRIGGER AS $$
DECLARE
  note_record RECORD;
  chunk_count INTEGER;
BEGIN
  -- Get the note info
  SELECT id, user_id, title INTO note_record FROM notes WHERE id = NEW.note_id;
  
  -- Count total chunks for this note
  SELECT COUNT(*) INTO chunk_count FROM chunks WHERE note_id = NEW.note_id;
  
  -- Only notify on first chunk (to avoid spam)
  IF chunk_count = 1 THEN
    INSERT INTO notifications (user_id, type, title, message, payload)
    VALUES (
      note_record.user_id,
      'chunks_processed',
      'Content Chunked',
      format('Your note "%s" is being analyzed into study segments.', note_record.title),
      jsonb_build_object('note_id', NEW.note_id, 'chunk_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when a new chat is created
CREATE OR REPLACE FUNCTION notify_new_chat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, payload)
  VALUES (
    NEW.user_id,
    'info',
    'New Chat Started',
    format('You started a new study session: "%s"', NEW.title),
    jsonb_build_object('chat_id', NEW.id, 'title', NEW.title)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when job status changes
CREATE OR REPLACE FUNCTION notify_job_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    IF NEW.status = 'completed' THEN
      INSERT INTO notifications (user_id, type, title, message, payload)
      VALUES (
        NEW.user_id,
        'system',
        'Task Completed',
        format('Your %s task has completed successfully.', REPLACE(NEW.type, '_', ' ')),
        jsonb_build_object('job_id', NEW.id, 'type', NEW.type, 'result', NEW.result)
      );
    ELSIF NEW.status = 'error' THEN
      INSERT INTO notifications (user_id, type, title, message, payload)
      VALUES (
        NEW.user_id,
        'system',
        'Task Failed',
        format('Your %s task encountered an error: %s', REPLACE(NEW.type, '_', ' '), COALESCE(NEW.error_message, 'Unknown error')),
        jsonb_build_object('job_id', NEW.id, 'type', NEW.type, 'error', NEW.error_message)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_note_created ON notes;
CREATE TRIGGER on_note_created
  AFTER INSERT ON notes
  FOR EACH ROW EXECUTE FUNCTION notify_new_note();

DROP TRIGGER IF EXISTS on_note_processed ON notes;
CREATE TRIGGER on_note_processed
  AFTER UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION notify_note_processed();

DROP TRIGGER IF EXISTS on_chunks_created ON chunks;
CREATE TRIGGER on_chunks_created
  AFTER INSERT ON chunks
  FOR EACH ROW EXECUTE FUNCTION notify_chunks_processed();

DROP TRIGGER IF EXISTS on_chat_created ON chats;
CREATE TRIGGER on_chat_created
  AFTER INSERT ON chats
  FOR EACH ROW EXECUTE FUNCTION notify_new_chat();

DROP TRIGGER IF EXISTS on_job_status_change ON jobs;
CREATE TRIGGER on_job_status_change
  AFTER UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION notify_job_status();

-- Allow notifications to be inserted by the system
CREATE POLICY "Allow system to insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);



-- Notification Triggers for Eureka AI Study Assistant
-- This script adds automatic notification triggers when new entries are created

-- Function to create notification for new notes
CREATE OR REPLACE FUNCTION notify_on_new_note()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, payload)
  VALUES (
    NEW.user_id,
    'note_ready',
    'New Note Created',
    'Your note "' || NEW.title || '" has been created and is being processed.',
    jsonb_build_object('note_id', NEW.id, 'note_title', NEW.title)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when note processing is complete
CREATE OR REPLACE FUNCTION notify_on_note_processed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'completed'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
    INSERT INTO notifications (user_id, type, title, message, payload)
    VALUES (
      NEW.user_id,
      'note_ready',
      'Note Ready for Study',
      'Your note "' || NEW.title || '" has been processed and is ready for AI-powered studying!',
      jsonb_build_object('note_id', NEW.id, 'note_title', NEW.title)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when chunks are created for a note
CREATE OR REPLACE FUNCTION notify_on_chunks_created()
RETURNS TRIGGER AS $$
DECLARE
  note_record RECORD;
  chunk_count INTEGER;
BEGIN
  -- Get the note details
  SELECT n.user_id, n.title INTO note_record
  FROM notes n WHERE n.id = NEW.note_id;
  
  -- Count total chunks for this note
  SELECT COUNT(*) INTO chunk_count
  FROM chunks WHERE note_id = NEW.note_id;
  
  -- Only notify on the first chunk (to avoid spam)
  IF chunk_count = 1 THEN
    INSERT INTO notifications (user_id, type, title, message, payload)
    VALUES (
      note_record.user_id,
      'chunks_processed',
      'Content Chunked Successfully',
      'Your note "' || note_record.title || '" has been split into searchable chunks for better AI responses.',
      jsonb_build_object('note_id', NEW.note_id, 'note_title', note_record.title)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify on new chat session
CREATE OR REPLACE FUNCTION notify_on_new_chat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, payload)
  VALUES (
    NEW.user_id,
    'info',
    'New Study Session Started',
    'You started a new study session: "' || NEW.title || '"',
    jsonb_build_object('chat_id', NEW.id, 'chat_title', NEW.title)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send welcome notification on new user
CREATE OR REPLACE FUNCTION notify_welcome_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, payload)
  VALUES (
    NEW.id,
    'info',
    'Welcome to Eureka!',
    'Get started by uploading your first study note. Our AI will help you understand and retain the material better.',
    jsonb_build_object('action', 'upload_first_note')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_new_note ON notes;
CREATE TRIGGER trigger_notify_new_note
  AFTER INSERT ON notes
  FOR EACH ROW EXECUTE FUNCTION notify_on_new_note();

DROP TRIGGER IF EXISTS trigger_notify_note_processed ON notes;
CREATE TRIGGER trigger_notify_note_processed
  AFTER UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION notify_on_note_processed();

DROP TRIGGER IF EXISTS trigger_notify_chunks_created ON chunks;
CREATE TRIGGER trigger_notify_chunks_created
  AFTER INSERT ON chunks
  FOR EACH ROW EXECUTE FUNCTION notify_on_chunks_created();

DROP TRIGGER IF EXISTS trigger_notify_new_chat ON chats;
CREATE TRIGGER trigger_notify_new_chat
  AFTER INSERT ON chats
  FOR EACH ROW EXECUTE FUNCTION notify_on_new_chat();

DROP TRIGGER IF EXISTS trigger_welcome_user ON user_settings;
CREATE TRIGGER trigger_welcome_user
  AFTER INSERT ON user_settings
  FOR EACH ROW EXECUTE FUNCTION notify_welcome_user();

-- Allow service role to insert notifications (for triggers)
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);
