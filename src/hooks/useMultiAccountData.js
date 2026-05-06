// ─────────────────────────────────────────────────────────────
//  useMultiAccountData
//  Fetches and merges calendar events + tasks from all 3 accounts
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import {
  fetchCalendarList, fetchCalendarEvents, normalizeCalendarEvent,
  fetchTaskLists, ensureTaskList, fetchTasks, normalizeTask,
  createTask, TASK_LIST_NAMES,
} from '../lib/google';

const MEMBER_OWNER_MAP = {
  jacob:   'jacob',
  katelin: 'katelin',
  family:  'family',
};

// Family Tasks list name — must match exactly for Google Hub voice commands
export const FAMILY_TASKS_LIST = 'Family Tasks';

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
          const results   = await Promise.all(
            selected.map(async cal => {
              try {
                const raw = await fetchCalendarEvents(token, cal.id, 45);
                return raw.map(e => normalizeCalendarEvent(e, MEMBER_OWNER_MAP[member]));
              } catch { return []; }
            })
          );
          allEvents.push(...results.flat());
        } catch (e) {
          console.warn(`[MultiAccount] Calendar sync failed for ${member}:`, e.message);
        }
      }));

      // Deduplicate events by id
      const seen = new Set();
      const dedupedEvents = allEvents.filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
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
          // Family gets "Family Tasks" list (+ standard lists for completeness)
          const listsToEnsure = member === 'family'
            ? [FAMILY_TASKS_LIST, ...TASK_LIST_NAMES]
            : TASK_LIST_NAMES;

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

              // Namespace list key: "jacob:General", "family:Family Tasks", etc.
              const key = member === 'family' ? listName : `${member}:${listName}`;
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
    const listName = owner === 'family' ? FAMILY_TASKS_LIST : list;
    const listId   = taskListIds[member]?.[listName];

    const tempId  = `temp-${Date.now()}`;
    const key     = owner === 'family' ? listName : `${owner}:${listName}`;
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

  return { events, todosByList, taskListIds, loading, lastSync, sync, addTask };
}
