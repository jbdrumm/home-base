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

### ⚠️ Codespaces Dev Workflow

Always use this sequence when starting a Codespaces session or pulling updates:

```bash
git stash && git pull origin main && git stash pop && npm install && rm -rf node_modules/.cache && netlify dev
```

**First time setup only** (once per Codespace):
```bash
npm install -g netlify-cli
netlify login
netlify link
```
Then add your Codespace URL (port 8888) to Google Cloud Console as an authorized redirect URI. It's stable — only changes if you rebuild the Codespace from scratch.

**`netlify dev` vs `npm start`:**
- `netlify dev` runs on port **8888** and includes Netlify Functions (account linking, push notifications, token refresh, weather fetch all work)
- `npm start` runs on port **3000** — Netlify Functions 404

**Testing functions locally (second terminal while dev server runs in first):**
```bash
curl -X POST http://localhost:8888/.netlify/functions/fetch-weather
```

**Device testing:**
- Open Codespace port 8888 URL on your Android phone → install as PWA for mobile testing
- Chrome DevTools → device toolbar (F12 → phone icon) for simulated device testing on desktop
- isMobile is reactive — resizing window or switching DevTools device updates layout live

**Deploying to production (manual only — auto-publishing is locked):**
```bash
netlify deploy --prod
```
Never unlock auto-publishing — it burns credits on every push.

**After deploying, seed the weather cache:**
```bash
curl -X POST https://home-base22.netlify.app/.netlify/functions/fetch-weather
```

**What works in Codespaces with `netlify dev`:**
- Everything — UI, Supabase, tile preferences, Netlify Functions, account linking, weather fetch

**What still requires a production deploy to validate:**
- Scheduled function cron (runs every 30 min on production only)
- Final release validation before pushing to wall display or Katelin's phone

### ⚠️ Known Netlify Gotchas

**SPA catch-all redirect breaks function routing:**
`/* /index.html 200` in `netlify.toml` rewrites ALL paths including `/.netlify/functions/*`. This is a known Netlify issue. Workaround: `public/_redirects` with `/api/*` proxy path before the catch-all. Direct `/.netlify/functions/*` calls from the browser still get caught — always use `/api/*` proxy for any new client-side function calls.

**Scheduled functions reject manual HTTP calls:**
When `[functions."fetch-weather"] schedule = ...` is set in `netlify.toml`, Netlify wraps the handler and rejects manual POSTs with "Bad request, missing form". Solution: keep plain handler in `fetch-weather.js` (manual POST) and put `schedule()` wrapper in separate `fetch-weather-scheduled.js`.

**Never add `@netlify/plugin-nextjs`:**
This is a React app. Adding that plugin causes build failures.

**Auto-publishing is locked — keep it that way.**

### ⚠️ Weather Architecture

```
Netlify cron (every 30 min)
  → fetch-weather-scheduled.js (schedule wrapper)
  → fetch-weather.js (plain handler)
  → Tomorrow.io API (1 call per 30 min total, all devices)
  → Supabase weather_cache table (id=1, single-row upsert)
  → useWeather hook reads from Supabase on mount + every 30 min
  → All devices get instant data, zero browser API calls
```

**Rate limits:** Tomorrow.io free tier = 25 calls/hour, 500/day. Server-side fetching uses 2/hour max.

**Forecast days:** 7 days on free tier (API advertises 14 but caps at 7 in practice).

**Fields available (free tier):** temperature, feelsLike, high/low, humidity, dewPoint, windSpeed, windGust, windDirection, precipitationProbability, cloudCover, visibility, pressure, uvIndex, uvHealthConcern, weatherCode → condition + emoji.

---

## 👨‍👩‍👧‍👦 Household

| Person | Role | Google Account |
|---|---|---|
| Jacob | Owner/Admin | jacob.b.drumm@gmail.com |
| Katelin | Co-owner | drummkatelin@gmail.com |
| Family | Shared household account | drummfam@gmail.com |

All three accounts (jacob.b.drumm@gmail.com, drummkatelin@gmail.com, drummfam@gmail.com) have been added as OAuth Test Users in Google Cloud Console → APIs & Services → OAuth consent screen → Test users. ✅

---

## 🏗 Tech Stack

- **Frontend:** React 18 (CRA), Outfit font, Arctic White theme
- **Backend:** Supabase (Postgres + RLS)
- **Auth/Calendar/Tasks:** Google OAuth via @react-oauth/google (auth-code flow with refresh tokens)
- **Token persistence:** Supabase `household_tokens` table stores refresh tokens — accounts stay linked indefinitely
- **Weather:** ✅ Switched to Tomorrow.io via server-side Netlify scheduled function (`fetch-weather`) — runs every 30 min, writes to Supabase `weather_cache`. All devices read from Supabase — only 1 API call per 30 min regardless of device count. Free tier: 25 calls/hour, 500/day.
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
| `REACT_APP_TOMORROW_API_KEY` | tomorrow.io (replaces OpenWeather — add to Codespace .env and Netlify) |
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
| `tile_preferences` | Per-member tile visibility + order | Mobile only for now; desktop Coming Soon |

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
| 11 | Mobile responsive layout — single-column with correct tile order, header collapse, grocery filters work in-tile |
| PWA | Icons (all sizes + maskable), manifest, install banner, Firebase push notification infrastructure, background push via dedicated SW, `scripts/generate-firebase-config.js` prebuild |
| Auth hardening | Auth-code OAuth flow replaces implicit — refresh tokens stored in Supabase, silent 4-min refresh cycle, accounts never expire |
| Supabase persistence | `useSupabaseList` hook — groceries and bills now persist to Supabase (replaced `useLocalState`) |
| Notifications | `useNotificationTriggers` — per-member prefs checked before firing, all trigger types (tasks, grocery, calendar, bills, vehicles), cross-device push via Netlify `send-notification` function |

---

## 🔜 Sprint Roadmap

### Sprint 12 — Packages
- Auto-import via Make.com + Yahoo Mail (Make.com also used in Sprint 13 for bill notifications — shared integration)
- Carrier, status, ETA, progress bar
- No Packages source files exist yet — clean build from scratch

### Sprint 13 — Financial Integration (Monarch Money)
See `FINANCIAL_DECISIONS.md` for full evaluation.
- Monarch Money ($99/yr) — unofficial API (`bradleyseanf/monarchmoneycommunity`)
- **Owner to-do:** Set Monarch Money password before this sprint (API requires password auth)
- Python service on desktop PC, live fetch only, no financial data in Supabase
- PIN-protected drill-down: balances, net worth, cash flow, transactions
- Receipt capture via Claude Vision (dual dates: realized vs posted)
- 3x daily sync, Zillow/VinAudit/Principal 401k via Monarch native integrations
- **Setup step:** Delete bills seed data and enter real monthly bills during this sprint

### Sprint 14 — Meal Planning
- Weekly grid (Mon–Sun)
- Recipe library (URL import via Claude Vision or manual)
- Auto-populate grocery list from recipes
- **"Paste a shopping list" feature:** textarea input → Claude Vision parses items, quantities, categories → confirm screen → bulk-inserts into Supabase grocery list. Works for any text source (ChatGPT meal plan output, recipe sites, text messages, etc.). Primary use case: Katelin pastes her ChatGPT-generated ingredient list directly into Home Base.

### Sprint 15 — Google Hub Voice Commands
- Google Home routines trigger webhooks or Supabase writes
- Task backend already uses Google Tasks API — prerequisite met
- Fully remote work — no physical hardware required

### Sprint 16 — Tile Customization ✅ Built
- `tile_preferences` Supabase table — `member`, `tile_id`, `enabled`, `order_index`
- `useTilePreferences` hook — loads/saves from Supabase, merges new tiles at end on first load
- `LayoutSettings` component — drag-to-reorder + up/down arrow fallback, toggle per tile
- Mobile: fully functional — preferences respected on dashboard render
- Desktop: settings page rendered but greyed out with "Coming Soon" overlay
- Settings → Layout tab added alongside Accounts and Notifications
- Account-owner configurable store/filter options noted for future iteration
- Desktop dynamic grid reflow deferred to future sprint

### Sprint 17 — Jacob's Page
- F1 and IndyCar news/calendar
- Personal weather detail
- World headlines

### Sprint 18 — Katelin's Page
- Homeschool daily planner
- Meal plan view
- Family-focused content

### Sprint 19 — Home Assistant Integration
- Connect HA API to Home Base Home Status tile
- Read sensor states and trigger actions from dashboard
- **Prerequisite:** HA must be accessible outside home network before this sprint
  - Options: Nabu Casa ($7/mo), Cloudflare Tunnel (free), or VPN
  - Pi 3 is already running HA with Mega-IO sensor tophats — local config is complete
  - Any future hardware-side changes require being on local network

### Sprint 20 — Screensaver / Sleep Mode
- Family photo slideshow when idle
- Auto sleep schedule
- Wake on touch

### Sprint 21 — Countdowns Tile
- Recurring annual (e.g. Anniversary) — auto-recalculates each year
- One-time (e.g. Vacation) — specific target date
- User chooses type at creation

### Sprint 22 — Pi Kiosk & Hardening
- Fully Kiosk Browser on Android touchscreen
- Offline graceful degradation
- Auto-launch on boot

### Sprint 23 — Cameras (Lorex RTSP)
- Lorex NVR: N862A63B, 6-8 cameras + doorbell, 4K
- Use sub-streams for dashboard: `rtsp://admin:<pw>@<NVR-IP>:554/cam/realmonitor?channel=1&subtype=1`
- go2rtc on always-on desktop PC → HLS/WebRTC relay
- Dashboard: featured front door + camera selector sidebar
- Full screen: grid of all cameras, tap to expand

### Sprint 24 — Chores & Rewards
- Assign chores with schedules, repeats, rotations
- Point system + custom rewards
- Kid-friendly UI for wall display

---

## 🐛 Known Bugs / Backlog

| # | Description | Priority | Status |
|---|---|---|---|
| 1 | Fillup modal — pump photo parse occasionally hangs (30s timeout now in place, errors log to `error_logs` table) | Medium | Monitoring |
| 16 | Calendar full view — missing "katelin" owner color mapping (showed wrong color), missing empty state when no events loaded, no location display on event detail | Low | ✅ Fixed |
| 17 | Log Fillup modal — no backdrop dismiss (tap outside didn't close), no close X button, z-index too low (300) causing stacking issues on some devices, desktop centering broken (always showed as bottom sheet) | Medium | ✅ Fixed |
| 2 | Camera tile is placeholder only | Low | Blocked by Sprint 23 |
| 3 | Vehicle photos stored as seed data URLs — need Supabase Storage for user-added photos | Low | Sprint TBD |
| 4 | Fuel log MPG needs previous odometer for accuracy | Low | Sprint TBD |
| 5 | Bills seed data still shows on first load — user must delete and re-enter real bills | Medium | Sprint 13 |
| 6 | Background push notifications require app to be opened once per session to register FCM token | Medium | Monitoring post-Firebase setup |
| 7 | Quick-add PWA shortcut (long-press home screen icon) requires user to already be signed in | Low | Known limitation |
| 8 | Add "Butcher" as a grocery store/filter option | Low | ✅ Fixed |
| 9 | Mobile app may require re-login after 1-2 days of inactivity | Medium | ✅ Fixed |
| 10 | Layout settings — toggle, arrows, and drag not persisting | High | ✅ Fixed — `tile_preferences` table must be created via migration |
| 11 | Fuel fillup opens gallery instead of camera | Medium | ✅ Fixed — added `capture="environment"` to file input |
| 12 | Odometer photo not parsing despite clear image | Medium | ✅ Fixed — improved Claude Vision prompt, more permissive reading |
| 13 | Self-notifications when adding grocery items — `created_by` never written on insert | Medium | ✅ Fixed — stamp `created_by: primaryMember` on add; also added `created_by` column to migration |
| 14 | Status bar badge showing house icon instead of "HB" | Low | ✅ Fixed — regenerated badge-mono.png with white "HB" text |
| 15 | Notification right-side image showing green placeholder instead of tile icon | Low | ✅ Fixed — added `image` field to webpush payload |

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
| ~~Firebase push notifications~~ | ✅ Complete — confirmed via 2 rows in `fcm_tokens` table |
| ~~Supabase migrations~~ | ✅ Complete — migrations run, all tables + grants in place |
| ~~Google OAuth test users~~ | ✅ Complete — all three accounts added |
| Monarch Money | Subscribed ✅ — **still need to set password** (API requires password auth). Password setup is a step in Sprint 13. Cancel Simplifi after ~2 months. |
| Wall display setup | Android 13 touchscreen — install Chrome, navigate to https://home-base22.netlify.app, install PWA, set to Fully Kiosk Browser |
| Bills seed data | Delete seed bills and enter real monthly bills — scheduled as Sprint 13 setup step |
| Netlify publish | **Hold** — do not publish until next round of updates and bug fixes are ready. Pending publish may already resolve the mobile re-login bug (bug #9). |
| Home Assistant external access | Before Sprint 19 — configure HA for outside-network access. Options: Nabu Casa ($7/mo), Cloudflare Tunnel (free), or VPN. Required for dashboard to read status and trigger actions remotely. |

---

## 💡 Feature Ideas (Not Yet Scheduled)

Ideas captured for future consideration — not committed to a sprint yet.

### 🤖 Agent Ideas

| Idea | Description | Notes |
|---|---|---|
| Grocery restocking agent | Monitors grocery list completion history, learns restock cadence per item (e.g. milk every 6 days), proactively re-adds items before they run out | Agent SDK + Supabase grocery history. Katelin's request. |
| Garden soil moisture agent | Soil moisture sensors in Katelin's garden (ESP32 or Pi via HA). Agent reviews readings on schedule, notifies Katelin which beds need watering. Cross-references Tomorrow.io forecast — skip notification if rain expected tomorrow. | Hardware: sensors + ESP32 or Pi 3 via Home Assistant |
| Boiler pressure diagnostic agent | Logs overnight pressure readings. Agent correlates pressure drops with heating cycles to help identify root cause of weekly upstairs radiator bleeding (likely failing auto air vent, micro-leak, or waterlogged expansion tank). | High value — active known issue. Pairs with pressure sensor on boiler loop. |
| Electrical anomaly agent | Learns baseline panel draw by time-of-day and day-of-week via Emporia Vue. Alerts when draw is meaningfully outside normal (e.g. "2am, 800W above baseline"). Catches stuck appliances, failed relays, slow faults. | Better fit than time-of-use optimization since rate is locked 24/7. |
| Pool fill agent | Pool level sensor triggers solenoid fill valve when level drops. Agent checks: (1) pool cover open via tilt/contact sensor — if closed, skip fill and notify instead. (2) Cross-reference Tomorrow.io — skip if heavy rain expected. Tracks daily fill volume over time, alerts if leak rate accelerates. | Pool has known slow leak. Cover sensor is prerequisite. |

### 🔧 Sensor / Hardware Ideas

| Idea | Status | Notes |
|---|---|---|
| Pool water level + auto-fill solenoid | **Add to sprint backlog** | Float valve sensor + solenoid on water line. Prerequisite: pool cover tilt/contact sensor. |
| Pool water temperature sensor | **Add to sprint backlog** | Pair with pool fill sprint. Useful for knowing when pool is naturally swimworthy. |
| Pool cover open/closed sensor | **Add to sprint backlog** | Tilt or magnetic contact sensor on cover mechanism. Prerequisite for fill agent logic. |
| Sump pump high-water alert | Keep simple | Basic float/overflow sensor only. Push notification if water reaches high-water mark. No cycle monitoring — french drain makes frequency data noisy. |
| Boiler hydronic pressure sensor | High value | Log pressure on closed loop. Overnight drop pattern helps diagnose weekly radiator bleeding issue. |
| Boiler flue temperature sensor | High value | 1970s original unit. Flue temp degradation = early warning of combustion efficiency loss before safety issue or surprise repair. |
| Boiler zone valve + room temp sensors | Future | Pairs with planned Taco controller/circulator hydronic upgrade next year. Revisit during that project. |
| Water leak pads | Recommended | ~$15 each (Govee). Place under boiler, water heater, water softener. Detects slow leak before floor damage. Already have Govee ecosystem. |
| Emporia Vue 3 panel monitor | Recommended | ~$80–110 with 8–16 circuit sensors. Clamp-on CT install, HA integration, 200A split-phase compatible. Good value. Key circuits: pool pump, well pump, dryer, water heater. |
| Door/window contact sensors | Recommended | Use Z-Wave or Zigbee (not WiFi) to avoid network congestion. Pi 3 + USB Z-Wave/Zigbee stick as HA coordinator. ~$10–20/sensor. |
| Dryer vent airflow sensor | Recommended | ~$15 at exterior vent cap. Safety play — clogged dryer vents are a leading house fire cause. |
| Gas leak detectors (boiler room) | Buy dumb ones | $25 hardwired detector from big box store. Smart integration not worth the cost for a primary residence where someone is usually home. |
| CO/Smoke detectors | Evaluate | First Alert Safe & Sound (SMCO600NVACA) has HA integration via Resideo. Newer SC5 does not yet. If replacing detectors anyway, Safe & Sound is the smart-home-compatible choice. |
| Well pump pressure tank monitor | Low priority | Well is irrigation-only, infrequent use. Monitor if cost is minimal, otherwise skip. |
| Core grocery items / pantry staples | Future sprint | Separate curated list of household staples with name, qty, store, cadence note. "Add core items" button bulk-adds anything not already on active grocery list, skipping duplicates and already-checked items. Optional: auto-add every Sunday morning. Editable management screen. Supabase table: `core_grocery_items`. Primary use case: Katelin bulk-adds weekly essentials (6x 2% milk, etc.) in one tap. |
| Screensaver / photo slideshow | Future sprint | Direct photo upload for wall display screensaver mode. Table stakes for a wall-mounted dashboard — all smart display competitors have it. Relevant once wall display (Android 13 touchscreen) is installed. |
| OBD2 persistent monitoring — Odyssey & Durango | Recommended | WiFi/cellular dongle (e.g. Bouncie, ~$80–150 + ~$8/mo cellular) stays plugged in, pushes data to cloud continuously. HA community integration available for Bouncie. Value: (1) DTC push alert the moment a check engine fires, with Claude interpreting the code in plain English, (2) battery voltage trending to catch weak battery before stranding someone, (3) coolant temp anomaly detection, (4) trip data auto-feeding fuel log instead of manual photo capture, (5) TPMS fault alert if dongle exposes it — not guaranteed depending on vehicle OBD2 reporting depth, but best-effort "go check your tires before heading out" notification is sufficient. S2000 and Ranger intentionally excluded — simpler mechanical systems, owner has strong intuitive sense of those vehicles. Modern ECUs on Odyssey/Durango actively compensate for degrading components, masking symptoms until failure. |
| Pool sand filter pump runtime | Low value | Pump is on a timer so cycle monitoring is moot. Skip. |
| Pool chemical monitor — inline flow cell | Personal project — near term | Skip the Flipr float sensor. Build an inline flow cell bypass loop on pool plumbing — after the 3 intake pipes converge (suction side) or after the pump on the pressure side (easier, no air ingestion risk). Components: off-shelf flow cell or DIY clear PVC chamber (~$20–120) + pH electrode (~$35–60) + ORP electrode (~$35–60) + ESP32 + signal conditioning (~$20–35) + plumbing fittings (~$15–25) + weatherproof enclosure (~$15–20). Total ~$140–320. Reads only when pump is running — tag data with pump-on status so agent ignores stale off-cycle readings. Pump is on a timer so schedule is known. Home Base: dashboard shows pH + ORP + pool temp + water level. Agent alerts if either drifts out of range ("Pool pH at 7.8 — may need muriatic acid"). History chart shows weekly trends. More accurate than any float sensor — samples blended water from all 3 intakes. |
| HVAC zone sensors | Deferred | Ecobee already handles room occupancy + temp well. HA has native Ecobee integration — pull into Home Base when Ecobee sprint arrives. |

---

## 🚗 Vehicle Data Notes

- Vehicle data currently lives in `src/lib/vehicleData.js` (not Supabase)
- Photos: `photo_url`, `photo_position`, `photo_fit`, `photo_scale` stay in `vehicleData.js` as display config for now
- Extended use plates: S2000 and Ranger Splash show garaged badge Dec–Feb
- **⚠️ Architectural decision:** If/when the app goes public, vehicle data must migrate to Supabase with per-user RLS. Hardcoded data breaks multi-tenancy — every user needs their own vehicles, insurance info, etc. Sensitive fields (policy numbers, license plates, toll tags) should be encrypted at rest. No need to change DB platform — Supabase RLS is sufficient. Revisit during multi-tenancy work.

| Vehicle | Notes |
|---|---|
| 2017 Dodge Durango GT | photo_scale: 85%, position: center 40% |
| 2018 Honda Odyssey Elite | photo_scale: 110%, position: 20% 60% |
| 2000 Honda S2000 | Extended use plate |
| 1994 Ford Ranger Splash | Extended use plate |
