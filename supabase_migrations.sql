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
