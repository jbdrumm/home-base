# 🏠 Home Base — Project Tracker

> **For Claude:** Read this file fully at the start of every new conversation before suggesting or writing anything. It contains the full project state, all decisions made, active bugs, and sprint specs. Update it at the end of every conversation.

---

## 🖥 Infrastructure

| Item | Detail |
|---|---|
| **Repo** | https://github.com/jbdrumm/home-base |
| **GitHub user** | jbdrumm |
| **Supabase project** | https://spqzbyiihwebetycyard.supabase.co |
| **Netlify URL** | https://home-base22.netlify.app |
| **Netlify site ID** | 69cb2bbc-ed1d-453b-9b93-4c19fc36d0d1 |
| **Dev environment** | GitHub Codespaces (port 3000, keep public for mobile testing) |
| **Netlify deploys** | Manual only — auto-publish is OFF to conserve build credits. Trigger from Netlify dashboard or `npm run build && npx netlify-cli deploy --prod --dir=build` |
| **PWA URL** | https://home-base22.netlify.app — installed on Jacob's and Katelin's Android phones |

---

## 👨‍👩‍👧‍👦 Household

| Person | Role | Google Account |
|---|---|---|
| Jacob | Owner/Admin | jacob.b.drumm@gmail.com |
| Katelin | Co-owner | drummkatelin@gmail.com |
| Family | Shared household account | drummfam@gmail.com |

All three must be added as OAuth Test Users in Google Cloud Console → APIs & Services → OAuth consent screen → Test users.

---

## 🏗 Tech Stack

- **Frontend:** React 18 (CRA), Outfit font, Arctic White theme
- **Backend:** Supabase (Postgres + RLS)
- **Auth/Calendar/Tasks:** Google OAuth via @react-oauth/google (auth-code flow with refresh tokens)
- **Token persistence:** Supabase `household_tokens` table stores refresh tokens — accounts stay linked indefinitely
- **Weather:** OpenWeather API
- **AI:** Anthropic Claude API (Vision — fuel log photo parsing)
- **Push notifications:** Firebase Cloud Messaging (FCM) — configured, keys in Netlify env vars
- **Hosting:** Netlify (production), GitHub Codespaces (dev)
- **Camera plan:** go2rtc on desktop PC relaying Lorex RTSP sub-streams
- **Home automation:** Home Assistant on Pi 3, Mega-IO tophats for sensors
- **Wall display:** 22" Android 13 touchscreen (purchased, arriving soon)

---

## 📐 Dashboard Layout

### Desktop (4 cols × 4 rows)

| | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| **Row 1** | Weather | Calendar | To-do ↕ (rows 1-2) | Grocery ↕↕↕↕ |
| **Row 2** | Home Status ←→ (cols 1-2) | | (cont.) | (cont.) |
| **Row 3** | (cont.) | | Vehicles ↕ (rows 3-4) | (cont.) |
| **Row 4** | Cameras | Finances | (cont.) | (cont.) |

### Mobile (single column, top to bottom)
1. Weather
2. Calendar
3. To-do
4. Grocery List
5. Home Status
6. Vehicles
7. Bills

### Header
- **Desktop:** Logo + date + Jacob/Katelin person tiles + sync↻ + avatar menu
- **Mobile:** Logo + sync↻ + avatar (tapping opens: Settings / Refresh / Sign out)
- Gear ⚙️ removed as standalone button — Settings now lives in avatar dropdown menu

---

## 🔑 Environment Variables

| Variable | Where |
|---|---|
| `REACT_APP_SUPABASE_URL` | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anon key |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials |
| `REACT_APP_OPENWEATHER_KEY` | openweathermap.org |
| `REACT_APP_ANTHROPIC_KEY` | console.anthropic.com |
| `REACT_APP_URL` | https://home-base22.netlify.app |
| `REACT_APP_FIREBASE_API_KEY` | Firebase Console → Project Settings → Web app |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase |
| `REACT_APP_FIREBASE_APP_ID` | Firebase |
| `REACT_APP_FIREBASE_VAPID_KEY` | Firebase → Cloud Messaging → Web Push certificates |
| `GOOGLE_CLIENT_ID` | Same as REACT_APP_GOOGLE_CLIENT_ID (server-side, for Netlify functions) |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth client (server-side only) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase → Project Settings → Service accounts → Generate key (full JSON) |

Stored in: Codespace secrets, Netlify environment variables, local `.env` (never committed)

> ⚠️ `public/firebase-config.js` is generated at build time by `scripts/generate-firebase-config.js` — it is gitignored and must never be committed (contains API key).

---

## 🗄 Supabase Tables

| Table | Purpose | Notes |
|---|---|---|
| `household_tokens` | Google OAuth tokens per member | Stores refresh_token for persistent auth |
| `groceries` | Grocery list items | Persisted, shared across all devices |
| `bills` | Monthly bills | Persisted |
| `notification_prefs` | Per-member notification toggles | One row per member |
| `fcm_tokens` | FCM device tokens per member | Used for cross-device push |
| `error_logs` | App error logging | Fillup parse failures, etc. |

> ⚠️ **Supabase Grant Policy (May 2025):** After May 30 2025, new `public` schema tables require explicit grants. Add after every `CREATE TABLE`:
> ```sql
> GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO authenticated;
> GRANT SELECT ON public.your_table TO anon;
> GRANT ALL ON public.your_table TO service_role;
> GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
> ```
> See `supabase_migrations.sql` for the full idempotent migration file.

---

## ✅ Completed Sprints

| Sprint | What was built |
|---|---|
| 1–8 | Scaffold, auth, calendar, tasks, grocery, home status, finances, weather, PWA shell |
| 9 | Vehicle tracker — 4 vehicles, maintenance table, fuel log with Claude Vision photo parsing, extended-use plate logic |
| Post-9 | Calendar timezone fixes, weather drilldown, vehicle nav fix, photo support, QuickAdd routing fix, modal keyboard fix |
| 10 | Multi-account auth — `household_tokens` Supabase table, `useHouseholdAuth`, `useMultiAccountData`, HouseholdSetup UI, QuickAdd "Who is this for?", account-aware task writes, TodoFullView account filter chips, per-task toggle/delete/move |
| Post-10 | Task color coding (Jacob=blue, Katelin=pink, Family=green), merged column view in TodoFullView, GroceryFullView built, dashboard tile toggle/delete wired |
| 11 (partial) | Mobile responsive layout — single-column with correct tile order, header collapse, grocery filters work in-tile |
| PWA | Icons (all sizes + maskable), manifest, install banner, Firebase push notification infrastructure, background push via dedicated SW, `scripts/generate-firebase-config.js` prebuild |
| Auth hardening | Auth-code OAuth flow replaces implicit — refresh tokens stored in Supabase, silent 4-min refresh cycle, accounts never expire |
| Supabase persistence | `useSupabaseList` hook — groceries and bills now persist to Supabase (replaced `useLocalState`) |
| Notifications | `useNotificationTriggers` — per-member prefs checked before firing, all trigger types (tasks, grocery, calendar, bills, vehicles), cross-device push via Netlify `send-notification` function |

---

## 🔜 Sprint Roadmap

### Sprint 11 — Mobile Responsive Layout (in progress)
Mostly done. Remaining known issues tracked in bugs section.

### Sprint 12 — Cameras (Lorex RTSP)
- Lorex NVR: N862A63B, 6-8 cameras + doorbell, 4K
- Use sub-streams for dashboard: `rtsp://admin:<pw>@<NVR-IP>:554/cam/realmonitor?channel=1&subtype=1`
- go2rtc on always-on desktop PC → HLS/WebRTC relay
- Dashboard: featured front door + camera selector sidebar
- Full screen: grid of all cameras, tap to expand

### Sprint 12 — Financial Integration (Monarch Money)
See `FINANCIAL_DECISIONS.md` for full evaluation.
- Monarch Money ($99/yr) — unofficial API (`bradleyseanf/monarchmoneycommunity`)
- Python service on desktop PC, live fetch only, no financial data in Supabase
- PIN-protected drill-down: balances, net worth, cash flow, transactions
- Receipt capture via Claude Vision (dual dates: realized vs posted)
- 3x daily sync, Zillow/VinAudit/Principal 401k via Monarch native integrations

### Sprint 13 — Chores & Rewards
- Assign chores with schedules, repeats, rotations
- Point system + custom rewards
- Kid-friendly UI for wall display

### Sprint 14 — Meal Planning
- Weekly grid (Mon–Sun)
- Recipe library (URL import via Claude Vision or manual)
- Auto-populate grocery list from recipes

### Sprint 15 — Countdowns Tile
- Recurring annual (e.g. Anniversary) — auto-recalculates each year
- One-time (e.g. Vacation) — specific target date
- User chooses type at creation

### Sprint 16 — Packages
- Auto-import via Make.com + Yahoo Mail
- Carrier, status, ETA, progress bar

### Sprint 18 — Jacob's Page
- F1 and IndyCar news/calendar
- Personal weather detail
- World headlines

### Sprint 19 — Katelin's Page
- Homeschool daily planner
- Meal plan view
- Family-focused content

### Sprint 20 — Screensaver / Sleep Mode
- Family photo slideshow when idle
- Auto sleep schedule
- Wake on touch

### Sprint 21 — Pi Kiosk & Hardening
- Fully Kiosk Browser on Android touchscreen
- Offline graceful degradation
- Auto-launch on boot

---

## 🐛 Known Bugs / Backlog

| # | Description | Priority | Status |
|---|---|---|---|
| 1 | Fillup modal — pump photo parse occasionally hangs (30s timeout now in place, errors log to `error_logs` table) | Medium | Monitoring |
| 2 | Camera tile is placeholder only | Low | Blocked by Sprint 12 |
| 3 | Vehicle photos stored as seed data URLs — need Supabase Storage for user-added photos | Low | Sprint TBD |
| 4 | Fuel log MPG needs previous odometer for accuracy | Low | Sprint TBD |
| 5 | Bills seed data still shows on first load — user must delete and re-enter real bills | Medium | Sprint TBD |
| 6 | Background push notifications require app to be opened once per session to register FCM token | Medium | Monitoring post-Firebase setup |
| 7 | Quick-add PWA shortcut (long-press home screen icon) requires user to already be signed in | Low | Known limitation |

---

## 📝 Design Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Task backend | Google Tasks API (not Supabase) | Required for Google Hub voice commands |
| Family account | drummfam@gmail.com — full account with all 4 lists | "Family Tasks" special list concept was wrong; family is just a third account |
| Task colors | Jacob=blue, Katelin=pink, Family=green | Visual ownership at a glance |
| Token storage | Supabase `household_tokens` with refresh_token | Persistent auth — wall display can't re-auth every hour |
| OAuth flow | Auth-code flow (not implicit) | Implicit flow has no refresh token; expires in 1hr |
| Token exchange | Netlify Function `google-auth` | Client secret must never be in browser |
| Grocery/bills storage | Supabase via `useSupabaseList` | Replaced `useLocalState` — now persists across devices |
| PWA install | `beforeinstallprompt` (Android) + manual instructions (iOS) | Standard PWA pattern |
| Firebase config in SW | Generated at build time via `scripts/generate-firebase-config.js` | CRA doesn't allow env vars in public/ files; prebuild script solves this |
| firebase-config.js | Gitignored — never committed | Contains API key; Netlify secret scanner blocks builds if committed |
| Supabase grants | Explicit grants on every table | Required after May 30 2025 policy change |
| Avatar menu | Settings + Refresh + Sign out in dropdown | Cleaner mobile UX; removes standalone gear button |
| Grocery filter | stopPropagation on filter/toggle — opens fullscreen only via footer tap | Filters need to work in-tile without navigating away |
| Financial platform | Monarch Money ($99/yr) | See FINANCIAL_DECISIONS.md |
| Wall display | 22" Android 13 touchscreen | ~$220, offset by Pi 5 return |
| Camera relay | go2rtc on always-on desktop PC | RTSP → HLS/WebRTC for browser playback |
| Desktop PC | Power button = Display Off, Sleep = Never | Always-on camera/finance server |
| Pi 3 | Home Assistant only | Mega-IO sensor tophats for pool/garage |
| Pi 5 | Returned | Not needed |

---

## 🗒 Owner To-Do (Non-Code)

| Item | Notes |
|---|---|
| Firebase push notifications | Keys are configured in Netlify. Run app, accept notification permission prompt. Check Supabase `fcm_tokens` table for registered devices. |
| Supabase migrations | Run `supabase_migrations.sql` in Supabase SQL Editor any time new tables are added. Current version includes all tables + grants. |
| Google OAuth test users | Add drummfam@gmail.com once family account is ready. All 3 emails must be in OAuth consent screen test users. |
| Monarch Money | Subscribe before trial expires, set password (API needs password auth), cancel Simplifi after ~2 months |
| Wall display setup | Android 13 touchscreen — install Chrome, navigate to https://home-base22.netlify.app, install PWA, set to Fully Kiosk Browser |
| Bills seed data | After deploy, delete the seed bills in Finances and enter real monthly bills |

---

## 🚗 Vehicle Data Notes

- Vehicle data lives in `src/lib/vehicleData.js` (not Supabase) — this is intentional
- Photos: `photo_url`, `photo_position`, `photo_fit`, `photo_scale` stay in `vehicleData.js` as display config
- Extended use plates: S2000 and Ranger Splash show garaged badge Dec–Feb

| Vehicle | Notes |
|---|---|
| 2017 Dodge Durango GT | photo_scale: 85%, position: center 40% |
| 2018 Honda Odyssey Elite | photo_scale: 110%, position: 20% 60% |
| 2000 Honda S2000 | Extended use plate |
| 1994 Ford Ranger Splash | Extended use plate |
