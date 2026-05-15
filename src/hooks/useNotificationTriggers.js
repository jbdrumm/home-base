// ─────────────────────────────────────────────────────────────
//  useNotificationTriggers
//  Watches app state for notification-worthy events and fires
//  them based on each member's saved preferences.
//
//  Two types of notifications:
//  1. LOCAL — fires on THIS device (e.g. bill due today)
//  2. PUSH  — sent to OTHER members via Netlify Function
//
//  Key rules:
//  - Creator of an item is NEVER notified of their own action
//  - Calendar "new event" uses Supabase-backed seen_event_ids
//    so events don't re-notify when the sync window expands
//  - Fillup logging does NOT generate a notification
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useCallback } from 'react';
import { notify, sendPushToMember } from '../lib/firebase';
import { supabase } from '../lib/supabase';

// ── Local dedup helpers (bills, tasks, grocery — short-lived) ─
function todayKey(prefix, id) {
  return `hb_notif_${prefix}_${id}_${new Date().toISOString().slice(0, 10)}`;
}
function notifiedToday(key) { return !!localStorage.getItem(key); }
function markNotified(key) {
  localStorage.setItem(key, '1');
  // Prune keys older than 2 days
  const cutoff = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith('hb_notif_') && k < `hb_notif_z_${cutoff}`) {
      localStorage.removeItem(k);
    }
  }
}

// ── Supabase-backed seen event IDs ────────────────────────────
// Stores Google Calendar event IDs permanently so re-syncing a
// wider window never re-fires "new event" notifications.
const SEEN_KEY = 'hb_seen_event_ids'; // localStorage cache
let seenEventIds = null; // in-memory cache after first load

async function loadSeenEventIds() {
  if (seenEventIds !== null) return seenEventIds;
  // Try localStorage cache first for instant reads
  try {
    const cached = localStorage.getItem(SEEN_KEY);
    if (cached) seenEventIds = new Set(JSON.parse(cached));
  } catch { seenEventIds = new Set(); }

  // Hydrate from Supabase (source of truth)
  try {
    const { data } = await supabase
      .from('seen_calendar_events')
      .select('event_id');
    if (data) {
      seenEventIds = new Set(data.map(r => r.event_id));
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seenEventIds]));
    }
  } catch { /* fallback to localStorage cache */ }

  if (!seenEventIds) seenEventIds = new Set();
  return seenEventIds;
}

async function markEventSeen(eventId) {
  if (!seenEventIds) seenEventIds = new Set();
  if (seenEventIds.has(eventId)) return;
  seenEventIds.add(eventId);
  // Persist to localStorage immediately
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seenEventIds])); } catch {}
  // Persist to Supabase (best-effort, non-blocking)
  try {
    await supabase.from('seen_calendar_events').upsert(
      { event_id: eventId, seen_at: new Date().toISOString() },
      { onConflict: 'event_id' }
    );
  } catch {}
}

// ── Main hook ─────────────────────────────────────────────────
export function useNotificationTriggers({
  primaryMember,        // whose device is this
  prefs,                // notification_prefs for primaryMember
  bills            = [],
  todosByList      = {},
  groceries        = [],
  events           = [],
  householdMembers = [], // all linked members for cross-push
}) {
  const prevTodos   = useRef({});
  const prevGrocery = useRef([]);
  const seenLoaded  = useRef(false);

  // Pre-load seen event IDs on mount
  useEffect(() => {
    if (!seenLoaded.current) {
      loadSeenEventIds();
      seenLoaded.current = true;
    }
  }, []);

  // ── 1. Bills due today (local, daily) ──────────────────────
  useEffect(() => {
    if (Notification.permission !== 'granted') return;
    if (!prefs) return;

    const today = new Date().toISOString().slice(0, 10);
    for (const bill of bills) {
      const dueDate = bill.due_day
        ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2,'0')}-${String(bill.due_day).padStart(2,'0')}`
        : null;
      if (!dueDate || bill.paid_this_month) continue;
      if (dueDate !== today) continue;
      const key = todayKey('bill', bill.id);
      if (!notifiedToday(key)) {
        notify.billDue(bill.name, bill.amount);
        markNotified(key);
        // Push to all members who didn't create this bill entry
        for (const m of householdMembers) {
          if (m !== primaryMember) {
            sendPushToMember(m, '💳 Bill Due Today', `${bill.name} — $${bill.amount}`, { view: 'financial', prefKey: 'bill_due' });
          }
        }
      }
    }
  }, [bills, prefs, primaryMember, householdMembers]);

  // ── 2. New tasks added ──────────────────────────────────────
  useEffect(() => {
    if (Notification.permission !== 'granted') return;
    if (!prefs || !primaryMember) return;

    const prev = prevTodos.current;

    for (const [listKey, tasks] of Object.entries(todosByList)) {
      const owner    = listKey.split(':')[0];
      const prevList = prev[listKey] || [];
      const newTasks = tasks.filter(t => !prevList.find(p => p.id === t.id) && !t.done);

      for (const task of newTasks) {
        const key = todayKey('new-task', task.id);
        if (notifiedToday(key)) continue;

        const addedByMe    = task.created_by === primaryMember;
        const isOwnTask    = owner === primaryMember;
        const isFamilyTask = owner === 'family';

        // Local: notify me only if someone ELSE added this task to my list
        if (!addedByMe) {
          if (isOwnTask    && prefs.new_task_own)    { notify.newTask(task.title, owner); markNotified(key); }
          if (isFamilyTask && prefs.new_task_family) { notify.newTask(task.title, owner); markNotified(key); }
        }

        // Push to other members who didn't create the task
        if (isFamilyTask) {
          for (const m of householdMembers) {
            if (m !== primaryMember && m !== task.created_by) {
              sendPushToMember(m, '✅ New Family Task', task.title, { view: 'todo', prefKey: 'new_task_family' });
            }
          }
        } else if (!isOwnTask && !addedByMe) {
          sendPushToMember(owner, '✅ New Task', task.title, { view: 'todo', prefKey: 'new_task_own' });
        }
        markNotified(key);
      }

      // Completed tasks
      const justDone = tasks.filter(t => {
        const wasActive = prevList.find(p => p.id === t.id && !p.done);
        return t.done && wasActive;
      });

      for (const task of justDone) {
        const key = todayKey('done-task', task.id);
        if (notifiedToday(key)) continue;

        const completedByMe = task.completed_by === primaryMember;
        const isOwnTask     = owner === primaryMember;
        const isFamilyTask  = owner === 'family';

        if (!completedByMe) {
          if (isOwnTask    && prefs.completed_task_own)    { notify.completedTask(task.title, owner); markNotified(key); }
          if (isFamilyTask && prefs.completed_task_family) { notify.completedTask(task.title, owner); markNotified(key); }
        }

        if (isFamilyTask) {
          for (const m of householdMembers) {
            if (m !== primaryMember && m !== task.completed_by) {
              sendPushToMember(m, '✅ Family Task Done', task.title, { view: 'todo', prefKey: 'completed_task_family' });
            }
          }
        }
        markNotified(key);
      }
    }

    prevTodos.current = todosByList;
  }, [todosByList, prefs, primaryMember, householdMembers]);

  // ── 3. New grocery items ────────────────────────────────────
  useEffect(() => {
    if (Notification.permission !== 'granted') return;
    if (!prefs) return;

    const prev     = prevGrocery.current;
    const newItems = groceries.filter(i => !prev.find(p => p.id === i.id));

    for (const item of newItems) {
      const key = todayKey('grocery', item.id);
      if (notifiedToday(key)) continue;

      const addedByMe = item.created_by === primaryMember;

      // Local notify only if someone else added it
      if (!addedByMe && prefs.new_grocery) {
        notify.newGrocery(item.name);
        markNotified(key);
      }

      // Push to other members who didn't add it
      for (const m of householdMembers) {
        if (m !== primaryMember && m !== item.created_by) {
          sendPushToMember(m, '🛒 Grocery Item Added', item.name, { view: 'grocery', prefKey: 'new_grocery' });
        }
      }
      markNotified(key);
    }

    prevGrocery.current = groceries;
  }, [groceries, prefs, primaryMember, householdMembers]);

  // ── 4. New family calendar events (Supabase-backed dedup) ──
  // Uses permanent seen_event_ids so expanding the sync window
  // to 9 months never re-fires for events already processed.
  const checkNewEvents = useCallback(async () => {
    if (Notification.permission !== 'granted') return;
    if (!prefs || !primaryMember) return;

    const seen = await loadSeenEventIds();
    const familyEvents = events.filter(e => e.owner === 'family');

    for (const event of familyEvents) {
      if (seen.has(event.id)) continue; // truly already seen — skip forever

      // Mark seen immediately before any async work to prevent double-fire
      await markEventSeen(event.id);

      // Local notify — only if this device's member didn't create it
      if (event.created_by !== primaryMember && prefs.new_calendar_family) {
        notify.newCalendarEvent(event.title);
      }

      // Push to other members who didn't create the event
      for (const m of householdMembers) {
        if (m !== primaryMember && m !== event.created_by) {
          sendPushToMember(m, '📅 New Family Event', event.title, { view: 'calendar', prefKey: 'new_calendar_family' });
        }
      }
    }
  }, [events, prefs, primaryMember, householdMembers]);

  useEffect(() => {
    checkNewEvents();
  }, [checkNewEvents]);
}
