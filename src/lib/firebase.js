// ─────────────────────────────────────────────────────────────
//  Firebase — Push Notifications
// ─────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from './supabase';

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const isConfigured = Object.values(firebaseConfig).every(Boolean);

let app, messaging;
if (isConfigured) {
  app       = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
}

export { messaging, isConfigured };

// ── Register FCM token for a member ──────────────────────────
// Gets the FCM token for this device and saves it to Supabase
// so the server can push to this device.
export async function registerFCMToken(member) {
  if (!isConfigured || !messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // Register the Firebase messaging SW
    let swReg;
    try {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      // Pass Firebase config to the SW
      swReg.active?.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig });
    } catch {
      swReg = await navigator.serviceWorker.ready;
    }

    const token = await getToken(messaging, {
      vapidKey:                    process.env.REACT_APP_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration:   swReg,
    });

    if (!token) return null;

    // Save to Supabase (upsert by token value)
    await supabase.from('fcm_tokens').upsert({
      member,
      token,
      device:     navigator.userAgent.slice(0, 100),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'token' });

    console.log(`[FCM] Token registered for ${member}`);
    return token;
  } catch (e) {
    console.error('[FCM] Token registration failed:', e);
    return null;
  }
}

// ── Request permission (legacy — kept for PWAPrompt) ─────────
export async function requestNotificationPermission() {
  return registerFCMToken('unknown');
}

// ── Foreground message handler ────────────────────────────────
export function onForegroundMessage(callback) {
  if (!isConfigured || !messaging) return () => {};
  return onMessage(messaging, callback);
}

// ── Local notification helper ─────────────────────────────────
export function showLocalNotification(title, body, options = {}) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  navigator.serviceWorker.ready.then(reg => {
    reg.showNotification(title, {
      body,
      icon:    '/icons/icon-192x192.png',
      badge:   '/icons/icon-96x96.png',
      vibrate: [200, 100, 200],
      tag:     options.tag || 'homebase',
      data:    options.data || {},
      ...options,
    });
  });
}

// ── Pre-built notification types ──────────────────────────────
export const notify = {
  billDue: (name, amount) =>
    showLocalNotification('💳 Bill Due Today', `${name} — $${amount}`,
      { tag: 'bill-due', data: { view: 'financial' } }),

  newTask: (title, owner) =>
    showLocalNotification('✅ New Task', title,
      { tag: `task-new-${owner}`, data: { view: 'todo' } }),

  completedTask: (title, owner) =>
    showLocalNotification('✅ Task Completed', title,
      { tag: `task-done-${owner}`, data: { view: 'todo' } }),

  newGrocery: (name) =>
    showLocalNotification('🛒 Grocery Item Added', name,
      { tag: 'grocery-new', data: { view: 'grocery' } }),

  newCalendarEvent: (title) =>
    showLocalNotification('📅 New Family Event', title,
      { tag: 'calendar-new', data: { view: 'calendar' } }),

  packageArrived: (description) =>
    showLocalNotification('📦 Package Delivered', description || 'A package has arrived',
      { tag: 'package', data: { view: 'packages' } }),

  vehicleService: (vehicle, service) =>
    showLocalNotification('🔧 Service Due', `${vehicle} — ${service}`,
      { tag: 'vehicle', data: { view: 'vehicles' } }),
};

// ── Send push to other members via Netlify Function ───────────
// Used to notify OTHER household members (e.g. Jacob adds a task → notify Katelin)
export async function sendPushToMember(member, title, body, data = {}) {
  try {
    const baseUrl = process.env.REACT_APP_URL || window.location.origin;
    await fetch(`${baseUrl}/.netlify/functions/send-notification`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ member, title, body, data }),
    });
  } catch (e) {
    console.error('[FCM] sendPushToMember failed:', e);
  }
}
