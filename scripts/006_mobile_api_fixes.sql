-- 006_mobile_api_fixes.sql
-- Ensures RLS policies for key tables support JWT-based auth from mobile clients.
-- Supabase JWT auth works transparently across web (cookie) and mobile (Bearer token)
-- as long as the JWT is valid — auth.uid() resolves correctly in both cases.

-- ============================================================
-- CHATS TABLE
-- ============================================================
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
CREATE POLICY "Users can view their own chats"
  ON public.chats FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own chats" ON public.chats;
CREATE POLICY "Users can create their own chats"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
CREATE POLICY "Users can update their own chats"
  ON public.chats FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chats" ON public.chats;
CREATE POLICY "Users can delete their own chats"
  ON public.chats FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- CHAT_MESSAGES TABLE
-- ============================================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.chat_messages;
CREATE POLICY "Users can view messages in their chats"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = chat_messages.chat_id
        AND chats.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.chat_messages;
CREATE POLICY "Users can insert messages in their chats"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = chat_messages.chat_id
        AND chats.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete messages in their chats" ON public.chat_messages;
CREATE POLICY "Users can delete messages in their chats"
  ON public.chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = chat_messages.chat_id
        AND chats.user_id = auth.uid()
    )
  );

-- ============================================================
-- LECTURES TABLE
-- ============================================================
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own lectures" ON public.lectures;
CREATE POLICY "Users can view their own lectures"
  ON public.lectures FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own lectures" ON public.lectures;
CREATE POLICY "Users can create their own lectures"
  ON public.lectures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own lectures" ON public.lectures;
CREATE POLICY "Users can update their own lectures"
  ON public.lectures FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own lectures" ON public.lectures;
CREATE POLICY "Users can delete their own lectures"
  ON public.lectures FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- LECTURE_MESSAGES TABLE
-- ============================================================
ALTER TABLE public.lecture_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their lectures" ON public.lecture_messages;
CREATE POLICY "Users can view messages in their lectures"
  ON public.lecture_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lectures
      WHERE lectures.id = lecture_messages.lecture_id
        AND lectures.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their lectures" ON public.lecture_messages;
CREATE POLICY "Users can insert messages in their lectures"
  ON public.lecture_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lectures
      WHERE lectures.id = lecture_messages.lecture_id
        AND lectures.user_id = auth.uid()
    )
  );

-- ============================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Note: INSERT/UPDATE/DELETE for subscriptions is done via the Admin client (service role),
-- which bypasses RLS. No user-facing write policies needed for this table.

-- ============================================================
-- NOTE_USAGE TABLE
-- ============================================================
ALTER TABLE public.note_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage" ON public.note_usage;
CREATE POLICY "Users can view their own usage"
  ON public.note_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage" ON public.note_usage;
CREATE POLICY "Users can insert their own usage"
  ON public.note_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage" ON public.note_usage;
CREATE POLICY "Users can update their own usage"
  ON public.note_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- NOTES TABLE
-- ============================================================
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
CREATE POLICY "Users can view their own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
CREATE POLICY "Users can create their own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
CREATE POLICY "Users can update their own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- USER_SETTINGS TABLE
-- ============================================================
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = id);
