# 🏠 Home Base

Family dashboard PWA — calendar, to-dos, grocery list, home status, countdowns, and message board.  
Runs on a Raspberry Pi TV display (Chromium kiosk) and both Android phones (PWA install).

---

## Stack
- **Frontend:** React (PWA, installable)
- **Backend / DB:** Supabase (Postgres + realtime)
- **Google Integration:** Google Calendar + Tasks APIs (Sprint 2)
- **Hosting:** Self-hosted on Raspberry Pi (or Netlify for remote access)

---

## Getting Started

### 1. Clone & install
```bash
git clone <repo>
cd home-base
npm install
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase-schema.sql`
3. Go to **Settings → API** and copy your Project URL and anon public key

### 3. Configure environment
```bash
cp .env.example .env
# Fill in REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
```

### 4. Run locally
```bash
npm start
# Opens at http://localhost:3000
```

---

## Raspberry Pi Kiosk Setup
```bash
# On the Pi, install Chromium
sudo apt install chromium-browser

# Auto-launch on boot (add to ~/.bashrc or a systemd service)
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --app=http://localhost:3000 &

# Or if hosted remotely:
chromium-browser --kiosk http://your-server-ip:3000
```

## Android Phone (PWA Install)
1. Open Chrome on your Android phone
2. Navigate to the app URL
3. Tap the browser menu → **"Add to Home screen"**
4. Home Base will appear as an app icon

---

## Sprint Roadmap

| Sprint | Focus |
|--------|-------|
| ✅ 1 | Scaffold, UI, Supabase schema, seeded data |
| 🔜 2 | Google OAuth + Calendar/Tasks API integration |
| 🔜 3 | PWA service worker, Pi kiosk config, mobile polish |
| 🔜 4 | Auto theme, smart home hooks, weather widget |

---

## Google Cloud Setup (Sprint 2 prep)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project called **Home Base**
3. Enable: **Google Calendar API**, **Google Tasks API**
4. Create OAuth 2.0 credentials (Web application type)
5. Add your Pi's IP and `localhost:3000` to Authorized Origins
6. Copy Client ID to `.env` as `REACT_APP_GOOGLE_CLIENT_ID`
