-- Migration: Fix push_subscriptions table schema
-- Safe migration that preserves existing data

-- Add new columns if they don't exist
ALTER TABLE push_subscriptions
ADD COLUMN IF NOT EXISTS p256dh TEXT,
ADD COLUMN IF NOT EXISTS auth TEXT;

-- Migrate data from keys JSONB to individual columns
UPDATE push_subscriptions
SET 
  p256dh = COALESCE(p256dh, keys->>'p256dh', ''),
  auth = COALESCE(auth, keys->>'auth', '')
WHERE p256dh IS NULL OR auth IS NULL;

-- Make columns NOT NULL after data migration
ALTER TABLE push_subscriptions
ALTER COLUMN p256dh SET NOT NULL,
ALTER COLUMN auth SET NOT NULL;

-- Add unique constraint on endpoint per user if not exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint_user 
ON push_subscriptions(endpoint, user_id);

-- Enable RLS if not already enabled
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;

-- Create RLS Policies
CREATE POLICY "Users can view their own push subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
  ON push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
  ON push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON push_subscriptions TO authenticated;
