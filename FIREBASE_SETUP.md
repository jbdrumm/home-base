# Firebase Push Notifications Setup

Home Base uses Firebase Cloud Messaging (FCM) for push notifications.
The app works without it, but notifications won't fire until these steps are done.

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com
2. **Add project** → name it "Home Base" → disable Google Analytics (not needed)
3. Click the **web icon (</>)** to add a web app → name it "Home Base"
4. Copy the config values shown

## 2. Enable Cloud Messaging

1. In Firebase Console → **Project Settings** → **Cloud Messaging**
2. Under **Web Push certificates** → **Generate key pair**
3. Copy the VAPID key shown

## 3. Add environment variables to Netlify

In Netlify → Site settings → Environment variables, add:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key
```

Then redeploy.

## 4. Add Firebase domain to authorized origins

In Firebase Console → Authentication → Settings → Authorized domains:
- Add `home-base-drumm.netlify.app`

## What notifications fire automatically

| Trigger | Notification |
|---|---|
| Bill due today (unpaid) | "💳 Bill Due Today — [name] $[amount]" |
| Vehicle task with High priority | "🔧 Service Due — [vehicle] [task]" |
| (Future sprints) Package delivered | "📦 Package Delivered" |
| (Future sprints) Task assigned to you | "✅ Task Reminder" |

## Install to home screen

The app will show an install banner automatically on Android Chrome.
On iPhone: tap Share → Add to Home Screen.

Once installed, the app:
- Opens full screen (no browser chrome)
- Has a Home Base icon on the home screen
- Long-pressing the icon shows quick-add shortcuts (Add To-do, Add Grocery)
- Receives push notifications in the background
