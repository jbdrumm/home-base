# Google Cloud Setup — Step by Step

This guide takes about 10 minutes. You only do this once.

---

## Step 1 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with **your Google account** (the one powering the hubs)
3. Click the project dropdown at the top → **New Project**
4. Name it **Home Base** → click **Create**
5. Make sure the new project is selected in the dropdown

---

## Step 2 — Enable the APIs

1. In the left sidebar go to **APIs & Services → Library**
2. Search for **Google Calendar API** → click it → click **Enable**
3. Go back to Library, search for **Tasks API** → click it → click **Enable**

---

## Step 3 — Configure the OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** → click **Create**
3. Fill in:
   - App name: `Home Base`
   - User support email: your email
   - Developer contact: your email
4. Click **Save and Continue** through Scopes (no changes needed)
5. On the **Test users** screen, click **Add Users**
6. Add **your Google account email**
7. Add **your wife's Google account email**
8. Click **Save and Continue** → **Back to Dashboard**

> ⚠️ Keep the app in **Testing** mode. You don't need to publish it.
> Test mode is fine for a private family app — it supports up to 100 users.

---

## Step 4 — Create OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `Home Base Web`
5. Under **Authorized JavaScript origins** click **+ Add URI** and add:
   - `http://localhost:3000`
   - `http://YOUR-PI-IP:3000` (add this when your display Pi is ready, e.g. `http://192.168.1.50:3000`)
6. Leave **Authorized redirect URIs** empty
7. Click **Create**
8. A popup shows your **Client ID** — copy it (looks like `123456789-abc...apps.googleusercontent.com`)

---

## Step 5 — Add to your .env file

Open `home-base/.env` and add your Client ID:

```
REACT_APP_GOOGLE_CLIENT_ID=123456789-abc...apps.googleusercontent.com
```

Save the file, then **stop and restart** the dev server:
```bash
# Ctrl+C to stop, then:
npm start
```

---

## Step 6 — Sign in

The app will now show the **Sign in with Google** screen.
Click it, choose your account, grant Calendar and Tasks access.

Your calendar events and tasks will load within a few seconds.

---

## Troubleshooting

**"This app isn't verified"** — Click **Advanced → Go to Home Base (unsafe)**. This is expected for apps in Testing mode that haven't gone through Google's review. It's your own app on your own account — it's safe.

**"redirect_uri_mismatch"** — Make sure `http://localhost:3000` is in your Authorized JavaScript origins (Step 4), not Redirect URIs.

**Events not showing** — Your wife's calendar must be shared with your Google account. In Google Calendar on her account: Settings → her calendar → Share with specific people → add your email with "See all event details" permission.

**Tasks not syncing** — The first sync creates the four lists (General, House, Yard, Vehicles) in Google Tasks automatically. Give it 10–15 seconds on first sign-in.
