// ─────────────────────────────────────────────────────────────
//  useNotificationTriggers
//  Watches app state for notification-worthy events and fires
//  them based on each member's saved preferences.
//
//  Two types of notifications:
//  1. LOCAL — fires on THIS device (e.g. bill due today)
//  2. PUSH  — sent to OTHER members via Netlify Function
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { notify, sendPushToMember } from '../lib/firebase';

// ── Dedup helpers ─────────────────────────────────────────────
function todayKey(prefix, id) {
  return `hb_notif_${prefix}_${id}_${new Date().toISOString().slice(0, 10)}`;
}
function notifiedToday(key)  { return !!localStorage.getItem(key); }
function markNotified(key)   {
  localStorage.setItem(key, '1');
  // Prune keys older than 2 days
  const cutoff = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith('hb_notif_') && k < `hb_notif_z_${cutoff}`) {
      localStorage.removeItem(k);
    }
  }
}

// ── Main hook ─────────────────────────────────────────────────
export function useNotificationTriggers({
  primaryMember,   // whose device is this
  prefs,           // notification_prefs for primaryMember
  bills       = [],
  todosByList = {},
  groceries   = [],
  events      = [],
  householdMembers = [], // all linked members for cross-push
}) {
  // Track previous state for change detection
  const prevTodos    = useRef({});
  const prevGrocery  = useRef([]);
  const prevEvents   = useRef([]);

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
      }
    }
  }, [bills, prefs]);

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

        const isOwnTask    = owner === primaryMember;
        const isFamilyTask = owner === 'family';

        // Local notification for this device
        if (isOwnTask    && prefs.new_task_own)    { notify.newTask(task.title, owner); markNotified(key); }
        if (isFamilyTask && prefs.new_task_family) { notify.newTask(task.title, owner); markNotified(key); }

        // Push to other members if it's their task
        if (!isOwnTask) {
          sendPushToMember(owner, '✅ New Task', task.title, { view: 'todo' });
        }
        if (isFamilyTask) {
          // Push to all other linked members
          for (const m of householdMembers) {
            if (m !== primaryMember) sendPushToMember(m, '✅ New Family Task', task.title, { view: 'todo' });
          }
        }
      }

      // Completed tasks
      const justDone = tasks.filter(t => {
        const wasActive = prevList.find(p => p.id === t.id && !p.done);
        return t.done && wasActive;
      });

      for (const task of justDone) {
        const key = todayKey('done-task', task.id);
        if (notifiedToday(key)) continue;

        const isOwnTask    = owner === primaryMember;
        const isFamilyTask = owner === 'family';

        if (isOwnTask    && prefs.completed_task_own)    { notify.completedTask(task.title, owner); markNotified(key); }
        if (isFamilyTask && prefs.completed_task_family) { notify.completedTask(task.title, owner); markNotified(key); }

        // Push other members
        if (isFamilyTask) {
          for (const m of householdMembers) {
            if (m !== primaryMember) sendPushToMember(m, '✅ Family Task Done', task.title, { view: 'todo' });
          }
        }
      }
    }

    prevTodos.current = todosByList;
  }, [todosByList, prefs, primaryMember, householdMembers]);

  // ── 3. New grocery items ────────────────────────────────────
  useEffect(() => {
    if (Notification.permission !== 'granted') return;
    if (!prefs) return;

    const prev    = prevGrocery.current;
    const newItems = groceries.filter(i => !prev.find(p => p.id === i.id));

    for (const item of newItems) {
      const key = todayKey('grocery', item.id);
      if (notifiedToday(key)) continue;

      if (prefs.new_grocery) { notify.newGrocery(item.name); markNotified(key); }

      // Push to all other members
      for (const m of householdMembers) {
        if (m !== primaryMember) sendPushToMember(m, '🛒 Grocery Item Added', item.name, { view: 'grocery' });
      }
    }

    prevGrocery.current = groceries;
  }, [groceries, prefs, primaryMember, householdMembers]);

  // ── 4. New family calendar events ──────────────────────────
  useEffect(() => {
    if (Notification.permission !== 'granted') return;
    if (!prefs) return;

    const prev      = prevEvents.current;
    const newEvents = events.filter(e =>
      e.owner === 'family' && !prev.find(p => p.id === e.id)
    );

    for (const event of newEvents) {
      const key = todayKey('cal', event.id);
      if (notifiedToday(key)) continue;

      if (prefs.new_calendar_family) { notify.newCalendarEvent(event.title); markNotified(key); }

      // Push to all other members
      for (const m of householdMembers) {
        if (m !== primaryMember) sendPushToMember(m, '📅 New Family Event', event.title, { view: 'calendar' });
      }
    }

    prevEvents.current = events;
  }, [events, prefs, primaryMember, householdMembers]);
}
