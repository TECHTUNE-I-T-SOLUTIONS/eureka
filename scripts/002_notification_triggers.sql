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
