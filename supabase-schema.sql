-- =============================================
--  HOME BASE — Supabase Schema
--  Run this in your Supabase SQL editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── TODOS ──────────────────────────────────
create table if not exists todos (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  done         boolean not null default false,
  priority     text not null default 'medium'  -- 'high' | 'medium' | 'low'
                check (priority in ('high','medium','low')),
  due_date     date,
  created_by   text,                           -- google user display name
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── GROCERY ITEMS ──────────────────────────
create table if not exists grocery_items (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  done         boolean not null default false,
  category     text not null default 'Other',  -- Produce, Dairy, Meat, Frozen, etc.
  store        text not null default 'Meijer', -- Meijer | Walmart | Sam's Club | Jewel-Osco
  added_by     text,                           -- google user display name
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── COUNTDOWNS ─────────────────────────────
create table if not exists countdowns (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  target_date  date not null,
  emoji        text default '🗓',
  created_at   timestamptz not null default now()
);

-- ── MESSAGES (family board) ─────────────────
create table if not exists messages (
  id           uuid primary key default uuid_generate_v4(),
  text         text not null,
  author       text not null,               -- google user display name
  pinned       boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ── HOME STATUS (future Sprint 4) ──────────
create table if not exists home_status (
  id           uuid primary key default uuid_generate_v4(),
  key          text not null unique,         -- e.g. 'front_door', 'thermostat'
  label        text not null,
  value        text not null,
  icon         text,
  updated_at   timestamptz not null default now()
);

-- ── updated_at triggers ────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger todos_updated_at         before update on todos          for each row execute procedure set_updated_at();
create trigger grocery_items_updated_at before update on grocery_items  for each row execute procedure set_updated_at();

-- ── Row Level Security (open for household) ─
-- For Sprint 2, lock down with Google-authenticated user IDs.
-- For now, allow all authenticated Supabase users.
alter table todos         enable row level security;
alter table grocery_items enable row level security;
alter table countdowns    enable row level security;
alter table messages      enable row level security;
alter table home_status   enable row level security;

create policy "household read"  on todos         for select using (true);
create policy "household write" on todos         for all    using (true);
create policy "household read"  on grocery_items for select using (true);
create policy "household write" on grocery_items for all    using (true);
create policy "household read"  on countdowns    for select using (true);
create policy "household write" on countdowns    for all    using (true);
create policy "household read"  on messages      for select using (true);
create policy "household write" on messages      for all    using (true);
create policy "household read"  on home_status   for select using (true);
create policy "household write" on home_status   for all    using (true);

-- ── Seed data (optional — comment out if using app UI) ──
insert into countdowns (title, target_date, emoji) values
  ('Summer vacation', '2025-07-04', '🏖'),
  ('Anniversary',     '2025-06-15', '❤️')
on conflict do nothing;

-- =============================================
--  SPRINT 2 ADDITIONS
-- =============================================

-- Add list column to todos
alter table todos add column if not exists list text not null default 'General'
  check (list in ('General','House','Yard','Vehicles'));

-- ── BILLS ──────────────────────────────────────
create table if not exists bills (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  amount            numeric(10,2) not null default 0,
  due_day           integer not null check (due_day between 1 and 31),
  autopay           boolean not null default false,
  category          text not null default 'Other',
  paid_this_month   boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger bills_updated_at before update on bills
  for each row execute procedure set_updated_at();

alter table bills enable row level security;
create policy "household read"  on bills for select using (true);
create policy "household write" on bills for all    using (true);

-- Auto-reset paid_this_month on the 1st of each month
-- (wire this to a Supabase scheduled function in Sprint 3)
-- create or replace function reset_bills_monthly() ...

-- =============================================
--  SPRINT 9 ADDITIONS — Vehicle Tracker
-- =============================================

-- ── VEHICLES ───────────────────────────────
create table if not exists vehicles (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,               -- e.g. "2017 Dodge Durango GT"
  make              text not null,
  model             text not null,
  year              integer not null,
  trim              text,
  engine            text,
  color             text,
  emoji             text default '🚗',
  license_plate     text,
  state             text default 'Illinois',
  vin               text,
  insurance_company text,
  policy_number     text,
  toll_tag          text,
  car_wash_pass     text,
  extended_use_plate boolean not null default false,
  photo_url         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── MAINTENANCE SCHEDULE ────────────────────
create table if not exists maintenance_schedule (
  id            uuid primary key default uuid_generate_v4(),
  vehicle_id    uuid not null references vehicles(id) on delete cascade,
  task          text not null,               -- e.g. "Oil Change"
  notes         text,                        -- e.g. "5W-30 Synthetic"
  interval_mi   integer,                     -- miles between service
  interval_mo   integer,                     -- months between service (alt)
  last_done_mi  integer,
  last_done_at  date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── FUEL LOG ───────────────────────────────
create table if not exists fuel_log (
  id            uuid primary key default uuid_generate_v4(),
  vehicle_id    uuid not null references vehicles(id) on delete cascade,
  logged_at     date not null default current_date,
  odometer_mi   integer not null,
  gallons       numeric(6,3) not null,
  price_per_gal numeric(5,3) not null,
  total_cost    numeric(8,2) not null,
  mpg           numeric(5,1),
  station       text,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ── MAINTENANCE LOG ─────────────────────────
create table if not exists maintenance_log (
  id            uuid primary key default uuid_generate_v4(),
  vehicle_id    uuid not null references vehicles(id) on delete cascade,
  schedule_id   uuid references maintenance_schedule(id),
  task          text not null,
  odometer_mi   integer,
  performed_at  date not null default current_date,
  cost          numeric(8,2),
  shop          text,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ── updated_at triggers ────────────────────
create trigger vehicles_updated_at before update on vehicles for each row execute procedure set_updated_at();
create trigger maintenance_schedule_updated_at before update on maintenance_schedule for each row execute procedure set_updated_at();

-- ── RLS ────────────────────────────────────
alter table vehicles             enable row level security;
alter table maintenance_schedule enable row level security;
alter table fuel_log             enable row level security;
alter table maintenance_log      enable row level security;

create policy "household read"  on vehicles             for select using (true);
create policy "household write" on vehicles             for all    using (true);
create policy "household read"  on maintenance_schedule for select using (true);
create policy "household write" on maintenance_schedule for all    using (true);
create policy "household read"  on fuel_log             for select using (true);
create policy "household write" on fuel_log             for all    using (true);
create policy "household read"  on maintenance_log      for select using (true);
create policy "household write" on maintenance_log      for all    using (true);
