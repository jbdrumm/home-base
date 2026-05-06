# 🏠 Home Base

Family dashboard PWA — calendar, to-dos, grocery list, vehicle tracker, home status, finances, cameras, and more.  
Runs on a Raspberry Pi TV display (Chromium kiosk) and Android phones (PWA install).

---

## Stack

- **Frontend:** React 18 (PWA, installable)
- **Backend / DB:** Supabase (Postgres + realtime)
- **Auth / Calendar:** Google OAuth + Calendar API
- **Weather:** OpenWeather API
- **AI:** Anthropic Claude API (Vision — fuel log photo parsing)
- **Hosting:** Self-hosted on Raspberry Pi, or GitHub Codespaces for development

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values:

| Variable | Where to get it |
|---|---|
| `REACT_APP_SUPABASE_URL` | Supabase → project → Settings → API |
| `REACT_APP_SUPABASE_ANON_KEY` | Same page |
| `REACT_APP_GOOGLE_CLIENT_ID` | console.cloud.google.com → APIs & Services → Credentials |
| `REACT_APP_OPENWEATHER_KEY` | home.openweathermap.org/api_keys |
| `REACT_APP_ANTHROPIC_KEY` | console.anthropic.com → API Keys |

---

## Local Development

Requires [Node.js LTS](https://nodejs.org).

```bash
git clone https://github.com/jbdrumm/home-base.git
cd home-base
cp .env.example .env
# Fill in your values in .env
npm install --legacy-peer-deps
npm start
# Opens at http://localhost:3000
```

---

## GitHub Codespaces

No local Node install needed — runs entirely in the browser.

1. Go to the repo on GitHub
2. Click the green **Code** button → **Codespaces** tab → **Create codespace**
3. Add your 5 secrets at: github.com → Profile → Settings → Codespaces → Secrets
4. In the Codespace terminal:

```bash
git pull origin main
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm start
```

5. Click the **forwarded port** link that appears (port 3000) to open the app

> **Note:** Always run `git pull origin main` before reinstalling dependencies to make sure you have the latest `package.json`.

---

## Supabase Setup

The full schema is in `supabase-schema.sql`. Applied automatically each sprint via Supabase MCP.

For a fresh setup:
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase-schema.sql`

---

## Raspberry Pi Kiosk Setup

```bash
sudo apt install chromium-browser

# Add to ~/.bashrc or a systemd service
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --app=http://localhost:3000 &
```

## Android PWA Install

1. Open Chrome on Android
2. Navigate to the app URL
3. Tap menu → **Add to Home screen**

---

## Sprint Roadmap

| Sprint | Focus | Status |
|--------|-------|--------|
| 1 | Scaffold, UI shell, Supabase schema, seed data | ✅ Done |
| 2 | Google OAuth + Calendar API integration | ✅ Done |
| 3 | PWA service worker, mobile polish | ✅ Done |
| 4 | Weather widget, OpenWeather API | ✅ Done |
| 5 | Grocery list — store filters, check off, clear | ✅ Done |
| 6 | To-do lists — multi-list, priorities | ✅ Done |
| 7 | Home status panel | ✅ Done |
| 8 | Finances — bills, due dates, autopay flags | ✅ Done |
| 9 | Vehicle tracker — maintenance, fuel log, Claude Vision fillup | ✅ Done |
| 10 | Mobile responsive layout | 🔜 Next |
| 11 | Multi-account auth — Jacob + Katelin + Family Google accounts, merged dashboard view, account-aware task writes, "Who is this for?" selector | 🔜 Planned |
| 12 | Cameras — go2rtc relay of Lorex RTSP sub-streams (desktop PC server) | 🔜 Planned |
| 13 | Chores & Rewards — assign chores with schedules/rotations, point system, kid-friendly rewards | 🔜 Planned |
| 14 | Meal Planning — weekly meal plan, recipe library, auto-populate grocery list from recipes | 🔜 Planned |
| 15 | Countdowns tile — recurring annual events (auto-recalculate) + one-time events | 🔜 Planned |
| 16 | Packages — tracking auto-import via Make.com + Yahoo Mail | 🔜 Planned |
| 17 | Monarch Money integration — live balances & transactions behind PIN | 🔜 Planned |
| 18 | Jacob's page — F1/IndyCar news, personal weather, headlines | 🔜 Planned |
| 19 | Katelin's page — homeschool planner, family content | 🔜 Planned |
| 20 | Screensaver / sleep mode — family photo slideshow when idle, auto sleep schedule | 🔜 Planned |
| 21 | Pi kiosk hardening, offline mode, push notifications | 🔜 Planned |
