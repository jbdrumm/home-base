# 🏠 Home Base — Project Tracker

> **For Claude:** Read this file at the start of every new conversation. It contains the full project state, decisions made, bugs logged, and sprint specs. Update it at the end of every conversation.

---

## 🖥 Infrastructure

| Item | Detail |
|---|---|
| **Repo** | https://github.com/jbdrumm/home-base |
| **GitHub user** | jbdrumm |
| **Supabase project** | https://spqzbyiihwebetycyard.supabase.co |
| **Netlify URL** | https://home-base-drumm.netlify.app |
| **Netlify site ID** | 69cb2bbc-ed1d-453b-9b93-4c19fc36d0d1 |
| **Dev environment** | GitHub Codespaces (port 3000, keep public for mobile testing) |
| **Netlify deploys** | Manual only — auto-publish is OFF to conserve build credits |

---

## 👨‍👩‍👧‍👦 Household

| Person | Role | Google Account |
|---|---|---|
| Jacob | Owner/Admin | jacob.b.drumm@gmail.com |
| Katelin | Co-owner | (her personal Gmail) |
| Family | Shared household account | (family Gmail, not yet integrated) |

---

## 🏗 Tech Stack

- **Frontend:** React 18, CRA, Outfit font, Arctic White theme
- **Backend:** Supabase (Postgres + RLS)
- **Auth/Calendar/Tasks:** Google OAuth via @react-oauth/google
- **Weather:** OpenWeather API
- **AI:** Anthropic Claude API (Vision — fuel log photo parsing)
- **Hosting:** Netlify (production), GitHub Codespaces (dev)
- **Camera plan:** go2rtc on desktop PC relaying Lorex RTSP sub-streams
- **Home automation:** Home Assistant on Pi 3, Mega-IO tophats for sensors
- **Wall display:** 22" Android 13 touchscreen (purchased, arriving soon)

---

## 📐 Dashboard Layout (Desktop — 4 cols × 4 rows)

| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **Row 1** | Weather | Calendar | To-do ↕ (rows 1-2) | Grocery ↕↕↕↕ |
| **Row 2** | Home Status ←→ (cols 1-2) | | (cont.) | (cont.) |
| **Row 3** | Cameras | Finances | Vehicles ↕ (rows 3-4) | (cont.) |
| **Row 4** | (cont.) | (cont.) | (cont.) | (cont.) |

- Header: Logo + date + **Jacob** and **Katelin** person tiles + sync status + clock
- FAB: Add grocery / Add to-do / Log fillup

---

## ✅ Completed Sprints

| Sprint | What was built |
|---|---|
| 1–8 | Scaffold, auth, calendar, tasks, grocery, home status, finances, weather, PWA |
| 9 | Vehicle tracker — 4 vehicles (Durango GT, Odyssey Elite, S2000, Ranger Splash), maintenance table, fuel log, Claude Vision fillup flow, extended-use plate logic |
| Post-9 fixes | Calendar all-day event timezone fix, full calendar event display, weather drilldown, vehicle nav fix, badge overlap fix, photo support per vehicle, QuickAdd list routing fix, modal keyboard behavior fix, desktop modal centering |
| 10 | Multi-account auth — household_tokens Supabase table, useHouseholdAuth hook, useMultiAccountData merging all 3 accounts, HouseholdSetup UI (⚙️ in header), QuickAdd "Who is this for?" selector (Jacob/Family/Katelin), Family Tasks list auto-created on Family Google account, account-aware task writes |

---

## 🔜 Sprint Roadmap

### Sprint 10 — Multi-Account Auth ⬅ NEXT
**Goal:** Dashboard reads from all 3 Google accounts merged. Writes route to correct account.

**Spec:**
- Store Google tokens for Jacob, Katelin, and Family accounts in Supabase (`household_tokens` table)
- One-time OAuth flow for each account — Jacob signs in first, then Katelin, then Family
- Dashboard merges calendar events and tasks from all 3 accounts
- **Quick Add "Who is this for?" selector:**
  - Wall display / tablet (width > 1024px): shows **Jacob / Family / Katelin**, defaults to Family
  - Jacob's phone: shows **Personal / Family**, defaults to Personal
  - Katelin's phone: shows **Personal / Family**, defaults to Personal
- **To-do full screen account toggle:** filter chips in order **Jacob | Family | Katelin** — tap to show/hide each account's tasks
- **Move task between lists:** "Move to..." option on each task item in full screen view
- Create "Family Tasks" list on Family Google account programmatically via API
- Family tasks write to Family Google account → visible on all Google Hubs
- Personal tasks stay on personal accounts — never cross-visible between Jacob and Katelin

**Hardware context:**
- Google Hubs set up under Jacob's personal account
- Family account added as household *member* (not primary) in Google Home app
- Katelin's Voice Match already configured on Hubs
- "Hey Google, add X to Family Tasks" routes to Family Google Tasks list by name

---

### Sprint 11 — Mobile Responsive Layout ⬅ NEXT
**Goal:** App looks and works great on phones.

**Known issues to fix:**
- Dashboard grid collapses poorly on mobile
- Header cramped/wrapping
- Tiles need mobile-specific sizing
- Font sizes need adjustment for small screens
- Touch targets need to be large enough

**Notes:**
- Test via Codespace port 3000 set to Public, open on phone browser
- Wall display is 22" Android 13 — needs tablet breakpoint (~1024px) as well as phone (~768px)

---

### Sprint 12 — Cameras (Lorex RTSP)
**Goal:** Live camera feeds on dashboard and full screen view.

**Spec:**
- Lorex NVR model: N862A63B (bundle 4KSDAI168-2), 6-8 cameras + doorbell, all 4K
- Use **sub-streams** (not 4K main streams) for dashboard display — RTSP URL format:
  `rtsp://admin:<password>@<NVR-IP>:554/cam/realmonitor?channel=1&subtype=1`
- Run **go2rtc** on desktop PC (always-on, display-off power config) to relay sub-streams to HLS/WebRTC
- Dashboard camera tile: featured front door feed + camera selector sidebar
- Full screen: all cameras in grid, select to expand
- Lorex already handles motion/person/vehicle detection — no reprocessing needed
- Desktop PC power button set to "Display Off" (not shutdown)

---

### Sprint 13 — Chores & Rewards
**Goal:** Kids chore tracking with gamification.

**Spec (from Cozyla research):**
- Assign chores with schedules, repeats, and rotations
- Point system — earn points for completing chores
- Rewards — redeem points for custom rewards
- Kid-friendly UI — large touch targets, fun visuals
- Visible on wall display and family member phones

---

### Sprint 14 — Meal Planning
**Goal:** Weekly meal plan with recipe library.

**Spec:**
- Weekly meal plan grid (Mon–Sun, breakfast/lunch/dinner)
- Recipe library — add by URL (Claude Vision parses) or manually
- Auto-populate grocery list from selected recipes
- Katelin's page integration

---

### Sprint 15 — Countdowns Tile
**Goal:** Family countdown display on dashboard.

**Spec:**
- **Two types:**
  1. **Recurring annual** (e.g. Anniversary) — user enters original date, app auto-recalculates next occurrence each year
  2. **One-time** (e.g. Vacation) — user enters specific upcoming target date
- UI must let user choose type when creating
- Show days remaining prominently

---

### Sprint 16 — Packages
- Auto-import tracking numbers via Make.com + Yahoo Mail
- Show carrier, status, estimated delivery, progress bar

### Sprint 17 — Monarch Money
- Live account balances and transactions
- Behind PIN for privacy
- Finances tile shows spending summary

### Sprint 18 — Jacob's Page
- F1 and IndyCar news/calendar
- Personal weather detail
- World headlines (Reuters, AP)

### Sprint 19 — Katelin's Page
- Homeschool daily planner
- Meal plan view
- Family-focused content

### Sprint 20 — Screensaver / Sleep Mode
- Family photo slideshow when idle
- Auto sleep schedule (e.g. 10pm–6am screen off)
- Wake on touch

### Sprint 21 — Pi Kiosk & Hardening
- Fully Kiosk Browser config on Android touchscreen
- Offline mode — graceful degradation when internet is down
- Push notifications
- Auto-launch on boot

---

## 🐛 Known Bugs / Backlog

| # | Description | Priority |
|---|---|---|
| 1 | Katelin's Google account not yet integrated — she sees only her own data | Blocked by Sprint 10 |
| 2 | Family Google account not yet connected | Blocked by Sprint 10 |
| 3 | Camera tile is placeholder only | Blocked by Sprint 12 |
| 4 | Vehicle photos stored as seed data URLs — need Supabase Storage upload for user-added photos | Sprint TBD |
| 5 | Fuel log MPG calculation needs previous odometer reading for accuracy | Sprint TBD |
| 6 | Bills in Finances are seed data only — not yet editable/persistent in Supabase | Sprint TBD |

---

## 🚗 Vehicle Data Notes

- Photos: `photo_url`, `photo_position`, `photo_fit`, `photo_scale` stay in `vehicleData.js` as display config (not in Supabase) — this is intentional
- Extended use plates: S2000 and Ranger Splash show garaged badge Dec–Feb
- Odometer is estimated from last fuel log entry + avg miles/day

| Vehicle | photo_fit | Notes |
|---|---|---|
| 2017 Dodge Durango GT | cover | photo_scale: 85%, position: center 40% |
| 2018 Honda Odyssey Elite | cover | photo_scale: 110%, position: 20% 60% |
| 2000 Honda S2000 | cover | Extended use plate |
| 1994 Ford Ranger Splash | cover | Extended use plate |

---

## 🔑 Environment Variables

| Variable | Where |
|---|---|
| `REACT_APP_SUPABASE_URL` | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anon key |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials |
| `REACT_APP_OPENWEATHER_KEY` | openweathermap.org |
| `REACT_APP_ANTHROPIC_KEY` | console.anthropic.com |

Stored in: Codespace secrets, Netlify environment variables, local `.env` (never committed)

---

## 📝 Design Decisions & Notes

- **Google Tasks** stays as task backend (not Supabase) — needed for Google Hub voice commands
- **Family Tasks** list on Family Google account — visible on all Hubs by name
- **To-do account toggle order:** Jacob | Family | Katelin ("sandwich" — Jacob and Katelin are the ends)
- **Supabase** used for: vehicles, maintenance, fuel log, bills, future: household tokens, chores, meals
- **No ads** — Netlify free tier, self-hosted wall display
- **Pi 3** → Home Assistant only (Mega-IO sensor tophats for pool level, garage, etc.)
- **Desktop PC** → Always-on camera relay server. Power button = "Display Off". Sleep = Never.
- **Pi 5** → Returned. Not needed.
- **Wall display** → 22" Android 13 touchscreen (~$220, offset by Pi 5 return of $190)
- **Netlify credits** → Manual deploys only. Use Codespace public port for testing.
- Google OAuth authorized origins: localhost:3000, Codespace URL, https://home-base-drumm.netlify.app
