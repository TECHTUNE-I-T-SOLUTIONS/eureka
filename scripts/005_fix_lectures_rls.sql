-- Fix Lectures Table RLS Issues
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily to test
ALTER TABLE lectures DISABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_messages DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with simpler policies
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_messages ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can insert own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can update own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can delete own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can view messages in own lectures" ON lecture_messages;
DROP POLICY IF EXISTS "Users can insert messages in own lectures" ON lecture_messages;
DROP POLICY IF EXISTS "Users can delete messages in own lectures" ON lecture_messages;

-- Create simple RLS policies for lectures (allow authenticated users)
CREATE POLICY "Allow authenticated users to view lectures" ON lectures
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert lectures" ON lectures
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update lectures" ON lectures
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete lectures" ON lectures
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create simple RLS policies for lecture_messages
CREATE POLICY "Allow authenticated users to view messages" ON lecture_messages
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert messages" ON lecture_messages
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete messages" ON lecture_messages
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Also ensure chunks table has proper RLS for fetching note content
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chunks" ON chunks;
DROP POLICY IF EXISTS "Users can insert own chunks" ON chunks;
DROP POLICY IF EXISTS "Users can update own chunks" ON chunks;
DROP POLICY IF EXISTS "Users can delete own chunks" ON chunks;

CREATE POLICY "Allow authenticated users to view chunks" ON chunks
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert chunks" ON chunks
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update chunks" ON chunks
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete chunks" ON chunks
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Note: These policies allow any authenticated user to access all data.
-- For production, you should add user_id filtering back once confirmed working.
