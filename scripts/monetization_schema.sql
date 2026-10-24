-- ==========================================
-- EUREKA AI STUDY ASSISTANT - MONETIZATION SCHEMA
-- ==========================================

-- 1. Create Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'expired')),
  paystack_reference text,
  plan_code text,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for fast user subscription lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 2. Create Note Usage Table (Usage Guard Tracking)
CREATE TABLE IF NOT EXISTS public.note_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  note_id uuid,
  request_count integer NOT NULL DEFAULT 0,
  content_hash text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT note_usage_pkey PRIMARY KEY (id),
  CONSTRAINT note_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT note_usage_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE SET NULL
);

-- Indexes for note_usage
CREATE INDEX IF NOT EXISTS idx_note_usage_user_note ON public.note_usage(user_id, note_id);
CREATE INDEX IF NOT EXISTS idx_note_usage_user_hash ON public.note_usage(user_id, content_hash);

-- 3. Update Notifications Type Constraint if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'notifications_type_check'
    AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
  END IF;

  ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('chunks_processed', 'note_ready', 'system', 'info', 'subscription'));
END $$;

-- 4. Subscription Trigger & Function to Auto-Insert Notification
CREATE OR REPLACE FUNCTION public.notify_on_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, payload)
  VALUES (
    NEW.user_id,
    'subscription',
    'Subscription Updated',
    'Your Eureka plan is now ' || UPPER(NEW.plan) || ' (' || NEW.status || '). Thank you for learning with us!',
    jsonb_build_object(
      'plan', NEW.plan,
      'status', NEW.status,
      'paystack_reference', NEW.paystack_reference,
      'logo_url', 'https://eureka.vercel.app/Eureka-01.png',
      'email_notification', true
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on subscriptions
DROP TRIGGER IF EXISTS trigger_notify_subscription_change ON public.subscriptions;
CREATE TRIGGER trigger_notify_subscription_change
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_subscription_change();

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_usage ENABLE ROW LEVEL SECURITY;

-- Subscriptions Policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on subscriptions" ON public.subscriptions;
CREATE POLICY "Service role full access on subscriptions" ON public.subscriptions
  FOR ALL USING (true);

-- Note Usage Policies
DROP POLICY IF EXISTS "Users can view own note usage" ON public.note_usage;
CREATE POLICY "Users can view own note usage" ON public.note_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on note_usage" ON public.note_usage;
CREATE POLICY "Service role full access on note_usage" ON public.note_usage
  FOR ALL USING (true);

-- 6. Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
