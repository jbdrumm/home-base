-- ═══════════════════════════════════════════════════════════════
--  Home Base — Supabase Migrations
--  Run this entire file in Supabase SQL Editor to set up all tables.
--
--  SUPABASE GRANT POLICY (updated May 2025):
--  After May 30, 2025 new tables in the public schema require
--  explicit grants to be accessible via the Data API (/rest/v1/).
--  Every table below includes the required grants.
--  Template for new tables going forward:
--
--    CREATE TABLE IF NOT EXISTS public.your_table (...);
--    GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO authenticated;
--    GRANT SELECT ON public.your_table TO anon;
--    GRANT ALL ON public.your_table TO service_role;
--    ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;
--    CREATE POLICY "allow_all_your_table" ON public.your_table FOR ALL USING (true) WITH CHECK (true);
-- ═══════════════════════════════════════════════════════════════


-- ── Groceries ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.groceries (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'Other',
  store       TEXT        NOT NULL DEFAULT 'Meijer',
  done        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groceries TO authenticated;
GRANT SELECT ON public.groceries TO anon;
GRANT ALL ON public.groceries TO service_role;
ALTER TABLE public.groceries ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_groceries" ON public.groceries FOR ALL USING (true) WITH CHECK (true);


-- ── Bills ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bills (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT        NOT NULL,
  amount           NUMERIC     NOT NULL DEFAULT 0,
  due_day          INTEGER     NOT NULL DEFAULT 1,
  autopay          BOOLEAN     NOT NULL DEFAULT false,
  category         TEXT        NOT NULL DEFAULT 'Other',
  paid_this_month  BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bills TO authenticated;
GRANT SELECT ON public.bills TO anon;
GRANT ALL ON public.bills TO service_role;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_bills" ON public.bills FOR ALL USING (true) WITH CHECK (true);


-- ── Household tokens ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.household_tokens (
  member        TEXT        PRIMARY KEY,
  display_name  TEXT,
  email         TEXT,
  access_token  TEXT,
  refresh_token TEXT,
  expires_at    BIGINT,
  scope         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_tokens TO authenticated;
GRANT SELECT ON public.household_tokens TO anon;
GRANT ALL ON public.household_tokens TO service_role;
ALTER TABLE public.household_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_household_tokens" ON public.household_tokens FOR ALL USING (true) WITH CHECK (true);
-- Add refresh_token column if upgrading from older schema
ALTER TABLE public.household_tokens ADD COLUMN IF NOT EXISTS refresh_token TEXT;


-- ── Notification preferences ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_prefs (
  member                TEXT    PRIMARY KEY,
  new_task_own          BOOLEAN NOT NULL DEFAULT true,
  new_task_family       BOOLEAN NOT NULL DEFAULT true,
  completed_task_own    BOOLEAN NOT NULL DEFAULT false,
  completed_task_family BOOLEAN NOT NULL DEFAULT false,
  new_grocery           BOOLEAN NOT NULL DEFAULT true,
  new_calendar_family   BOOLEAN NOT NULL DEFAULT true,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_prefs TO authenticated;
GRANT SELECT ON public.notification_prefs TO anon;
GRANT ALL ON public.notification_prefs TO service_role;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_notif_prefs" ON public.notification_prefs FOR ALL USING (true) WITH CHECK (true);


-- ── FCM tokens ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id         BIGSERIAL PRIMARY KEY,
  member     TEXT        NOT NULL,
  token      TEXT        NOT NULL UNIQUE,
  device     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fcm_tokens TO authenticated;
GRANT SELECT ON public.fcm_tokens TO anon;
GRANT ALL ON public.fcm_tokens TO service_role;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_fcm_tokens" ON public.fcm_tokens FOR ALL USING (true) WITH CHECK (true);


-- ── Error logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.error_logs (
  id         BIGSERIAL PRIMARY KEY,
  context    TEXT,
  message    TEXT,
  details    TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_logs TO authenticated;
GRANT SELECT ON public.error_logs TO anon;
GRANT ALL ON public.error_logs TO service_role;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_error_logs" ON public.error_logs FOR ALL USING (true) WITH CHECK (true);


-- ── Sequence grants (required for BIGSERIAL inserts) ──────────
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
