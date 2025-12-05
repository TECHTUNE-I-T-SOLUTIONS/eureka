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
