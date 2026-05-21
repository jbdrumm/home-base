// ─────────────────────────────────────────────────────────────
//  useMultiAccountData
//  Fetches and merges calendar events + tasks from all 3 accounts
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import {
  fetchCalendarList, fetchCalendarEvents, normalizeCalendarEvent,
  fetchTaskLists, ensureTaskList, fetchTasks, normalizeTask,
  createTask, updateTask, deleteTask, TASK_LIST_NAMES,
} from '../lib/google';

const MEMBER_OWNER_MAP = {
  jacob:   'jacob',
  katelin: 'katelin',
  family:  'family',
};

export function useMultiAccountData(getTokenFor, householdTokens) {
  const [events,      setEvents]      = useState([]);
  const [todosByList, setTodosByList] = useState({});
  const [taskListIds, setTaskListIds] = useState({}); // { jacob: { General: 'id', ... }, ... }
  const [loading,     setLoading]     = useState(false);
  const [lastSync,    setLastSync]    = useState(null);

  const sync = useCallback(async () => {
    const members = ['jacob', 'katelin', 'family'];
    const validMembers = members.filter(m => getTokenFor(m));
    if (validMembers.length === 0) return;

    setLoading(true);
    try {
      // ── Calendar: fetch from all valid accounts ──
      const allEvents = [];
      await Promise.all(validMembers.map(async member => {
        const token = getTokenFor(member);
        if (!token) return;
        try {
          const calendars = await fetchCalendarList(token);
          const selected  = calendars.filter(c => c.selected !== false);
          console.log(`[CalendarNames] ${member}:`, selected.map(c => c.summary));
          const results   = await Promise.all(
            selected.map(async cal => {
              try {
                const raw = await fetchCalendarEvents(token, cal.id, 270, 60);  // 9 months ahead, 60 days back
                return raw.map(e => normalizeCalendarEvent(e, MEMBER_OWNER_MAP[member], cal.summary || ''));
              } catch { return []; }
            })
          );
          allEvents.push(...results.flat());
        } catch (e) {
          console.warn(`[MultiAccount] Calendar sync failed for ${member}:`, e.message);
        }
      }));

      // Deduplicate events:
      // 1. By Google event ID (same event shared across accounts)
      // 2. By title+date+time for all-day holidays (same title, same date, no specific time)
      //    We only dedup all-day events by title+date — timed events need title+date+time
      //    to avoid collapsing different sessions of the same recurring event.
      const seenIds       = new Set();
      const seenTitleDate = new Set();
      const dedupedEvents = allEvents.filter(e => {
        if (seenIds.has(e.id)) return false;
        seenIds.add(e.id);
        // Only dedup all-day events by title+date (holidays, birthdays)
        // Timed events use title+date+time so recurring events at different times are kept
        const timeKey = e.time === 'All day' ? 'allday' : e.time;
        const titleDateKey = `${e.title.toLowerCase().trim()}|${e.rawDate?.slice(0, 10)}|${timeKey}`;
        if (seenTitleDate.has(titleDateKey)) return false;
        seenTitleDate.add(titleDateKey);
        return true;
      });
      // Sort by date
      dedupedEvents.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
      setEvents(dedupedEvents);

      // ── Tasks: fetch from all valid accounts ──
      const newTaskListIds = {};
      const allTodosByList = {};

      await Promise.all(validMembers.map(async member => {
        const token = getTokenFor(member);
        if (!token) return;
        newTaskListIds[member] = {};

        try {
          const allLists = await fetchTaskLists(token);

          // Jacob and Katelin get the 4 standard lists
          // All accounts get the same standard lists
          const listsToEnsure = TASK_LIST_NAMES;

          for (const listName of listsToEnsure) {
            try {
              const listId = await ensureTaskList(token, listName, allLists);
              newTaskListIds[member][listName] = listId;

              const raw = await fetchTasks(token, listId);
              const normalized = raw
                .filter(t => t.title)
                .map(t => ({
                  ...normalizeTask(t, listName),
                  taskListId: listId,
                  owner: MEMBER_OWNER_MAP[member],
                }));

              // Namespace list key: "jacob:General", "family:General", etc.
              const key = `${member}:${listName}`;
              allTodosByList[key] = normalized;
            } catch (e) {
              console.warn(`[MultiAccount] Task list ${listName} failed for ${member}:`, e.message);
            }
          }
        } catch (e) {
          console.warn(`[MultiAccount] Tasks sync failed for ${member}:`, e.message);
        }
      }));

      setTaskListIds(newTaskListIds);
      setTodosByList(allTodosByList);
      setLastSync(new Date());
    } catch (e) {
      console.error('[MultiAccount] Sync error:', e);
    } finally {
      setLoading(false);
    }
  }, [getTokenFor]);

  // Sync on mount and when tokens change
  useEffect(() => {
    sync();
    const interval = setInterval(sync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [sync]);

  // ── Add task to correct account ──
  const addTask = useCallback(async ({ title, list, owner, priority }) => {
    const token = getTokenFor(owner);
    if (!token) {
      console.warn(`[MultiAccount] No token for ${owner}, cannot add task`);
      return;
    }

    // Determine which list name and member
    const member   = owner;
    const listName = list;
    const listId   = taskListIds[member]?.[listName];

    const tempId  = `temp-${Date.now()}`;
    const key     = `${owner}:${listName}`;
    const newItem = { id: tempId, title, list: listName, owner, priority, done: false };

    // Optimistic update
    setTodosByList(prev => ({ ...prev, [key]: [newItem, ...(prev[key] || [])] }));

    try {
      const created = await createTask(token, listId, title);
      setTodosByList(prev => ({
        ...prev,
        [key]: (prev[key] || []).map(t =>
          t.id === tempId ? { ...t, id: created.id, googleId: created.id } : t
        ),
      }));
    } catch (e) {
      console.error('[MultiAccount] Add task failed:', e);
      setTodosByList(prev => ({
        ...prev,
        [key]: (prev[key] || []).filter(t => t.id !== tempId),
      }));
    }
  }, [getTokenFor, taskListIds]);

  // ── Toggle task done/undone ──
  const toggleTask = useCallback(async ({ id, listKey, owner, done }) => {
    const token = getTokenFor(owner);
    if (!token) return;
    const listName = listKey.replace(`${owner}:`, '');
    const listId   = taskListIds[owner]?.[listName];
    if (!listId) return;
    setTodosByList(prev => ({
      ...prev,
      [listKey]: (prev[listKey] || []).map(t => t.id === id ? { ...t, done: !done } : t),
    }));
    try {
      await updateTask(token, listId, id, {
        status: done ? 'needsAction' : 'completed',
        completed: done ? null : new Date().toISOString(),
      });
    } catch (e) {
      console.error('[MultiAccount] Toggle task failed:', e);
      setTodosByList(prev => ({
        ...prev,
        [listKey]: (prev[listKey] || []).map(t => t.id === id ? { ...t, done } : t),
      }));
    }
  }, [getTokenFor, taskListIds]);

  // ── Delete a task ──
  const removeTask = useCallback(async ({ id, listKey, owner }) => {
    const token = getTokenFor(owner);
    if (!token) return;
    const listName = listKey.replace(`${owner}:`, '');
    const listId   = taskListIds[owner]?.[listName];
    if (!listId) return;
    setTodosByList(prev => ({
      ...prev,
      [listKey]: (prev[listKey] || []).filter(t => t.id !== id),
    }));
    try {
      await deleteTask(token, listId, id);
    } catch (e) {
      console.error('[MultiAccount] Delete task failed:', e);
      sync();
    }
  }, [getTokenFor, taskListIds, sync]);

  // ── Move task to a different list (within same owner) ──
  const moveTask = useCallback(async ({ id, fromListKey, toListName, owner, title }) => {
    const token = getTokenFor(owner);
    if (!token) return;
    const fromListName = fromListKey.replace(`${owner}:`, '');
    const fromListId   = taskListIds[owner]?.[fromListName];
    const toListId     = taskListIds[owner]?.[toListName];
    const toListKey    = `${owner}:${toListName}`;
    if (!fromListId || !toListId) return;
    setTodosByList(prev => {
      const item = (prev[fromListKey] || []).find(t => t.id === id);
      if (!item) return prev;
      return {
        ...prev,
        [fromListKey]: (prev[fromListKey] || []).filter(t => t.id !== id),
        [toListKey]:   [{ ...item, list: toListName, taskListId: toListId }, ...(prev[toListKey] || [])],
      };
    });
    try {
      await createTask(token, toListId, title);
      await deleteTask(token, fromListId, id);
    } catch (e) {
      console.error('[MultiAccount] Move task failed:', e);
      sync();
    }
  }, [getTokenFor, taskListIds, sync]);

  return { events, todosByList, taskListIds, loading, lastSync, sync, addTask, toggleTask, removeTask, moveTask };
}
