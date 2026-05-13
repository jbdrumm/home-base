-- Run this in Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ── Groceries ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groceries (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'Other',
  store       TEXT        NOT NULL DEFAULT 'Meijer',
  done        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS but allow all for now (single household app)
ALTER TABLE groceries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_groceries" ON groceries FOR ALL USING (true) WITH CHECK (true);

-- ── Bills ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT        NOT NULL,
  amount           NUMERIC     NOT NULL DEFAULT 0,
  due_day          INTEGER     NOT NULL DEFAULT 1,
  autopay          BOOLEAN     NOT NULL DEFAULT false,
  category         TEXT        NOT NULL DEFAULT 'Other',
  paid_this_month  BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_bills" ON bills FOR ALL USING (true) WITH CHECK (true);

-- ── household_tokens: add refresh_token column if not exists ──
ALTER TABLE household_tokens
  ADD COLUMN IF NOT EXISTS refresh_token TEXT;


-- ── Notification preferences ──────────────────────────────────
-- One row per member. All columns default true (opt-in by default).
CREATE TABLE IF NOT EXISTS notification_prefs (
  member               TEXT PRIMARY KEY,  -- 'jacob' | 'katelin' | 'family'
  new_task_own         BOOLEAN NOT NULL DEFAULT true,  -- new task assigned to me
  new_task_family      BOOLEAN NOT NULL DEFAULT true,  -- new task on family account
  completed_task_own   BOOLEAN NOT NULL DEFAULT false, -- my task completed
  completed_task_family BOOLEAN NOT NULL DEFAULT false, -- family task completed
  new_grocery          BOOLEAN NOT NULL DEFAULT true,  -- grocery item added
  new_calendar_family  BOOLEAN NOT NULL DEFAULT true,  -- new family calendar event
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_notif_prefs" ON notification_prefs FOR ALL USING (true) WITH CHECK (true);


-- ── FCM tokens ────────────────────────────────────────────────
-- Stores device FCM tokens per member so server can push to them
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id         BIGSERIAL PRIMARY KEY,
  member     TEXT        NOT NULL,
  token      TEXT        NOT NULL UNIQUE,
  device     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_fcm_tokens" ON fcm_tokens FOR ALL USING (true) WITH CHECK (true);
