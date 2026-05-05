import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchTaskLists, ensureTaskList, fetchTasks,
  normalizeTask, createTask, updateTask, deleteTask,
  TASK_LIST_NAMES,
} from '../lib/google';
import { seedTodosByList } from '../lib/seedData';

export function useTasksData(token) {
  const [todosByList,  setTodosByList]  = useState(seedTodosByList);
  const [taskListIds,  setTaskListIds]  = useState({}); // { General: 'abc123', ... }
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const taskListIdsRef = useRef({});

  // Keep ref in sync so callbacks have latest ids
  useEffect(() => { taskListIdsRef.current = taskListIds; }, [taskListIds]);

  // ── Initial sync: ensure lists exist, fetch all tasks ──
  const sync = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const allLists = await fetchTaskLists(token);

      // Ensure all 4 lists exist in Google Tasks
      const ids = {};
      for (const name of TASK_LIST_NAMES) {
        ids[name] = await ensureTaskList(token, name, allLists);
      }
      setTaskListIds(ids);
      taskListIdsRef.current = ids;

      // Fetch tasks from each list
      const byList = {};
      for (const name of TASK_LIST_NAMES) {
        const raw = await fetchTasks(token, ids[name]);
        byList[name] = raw
          .filter(t => t.title) // skip blank tasks
          .map(t => ({ ...normalizeTask(t, name), taskListId: ids[name] }));
      }
      setTodosByList(byList);
    } catch (e) {
      console.error('Tasks sync error', e);
      setError('Could not load tasks. Using local data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [sync]);

  // ── Toggle task complete ──
  const toggleTodo = useCallback(async (id, list) => {
    // Optimistic update
    setTodosByList(prev => ({
      ...prev,
      [list]: prev[list].map(t => t.id === id ? { ...t, done: !t.done } : t),
    }));

    if (!token) return;
    try {
      const item = todosByList[list]?.find(t => t.id === id);
      if (!item) return;
      const taskListId = taskListIdsRef.current[list];
      await updateTask(token, taskListId, id, {
        status: item.done ? 'needsAction' : 'completed',
      });
    } catch (e) {
      console.error('Toggle task error', e);
      // Revert on error
      setTodosByList(prev => ({
        ...prev,
        [list]: prev[list].map(t => t.id === id ? { ...t, done: !t.done } : t),
      }));
    }
  }, [token, todosByList]);

  // ── Add task ──
  const addTodo = useCallback(async (item) => {
    const list = item.list || 'General';
    const tempId = `temp-${Date.now()}`;
    const newItem = { ...item, id: tempId, list };

    // Optimistic update
    setTodosByList(prev => ({
      ...prev,
      [list]: [newItem, ...(prev[list] || [])],
    }));

    if (!token) return;
    try {
      const taskListId = taskListIdsRef.current[list];
      const created = await createTask(token, taskListId, item.title);
      // Replace temp id with real id
      setTodosByList(prev => ({
        ...prev,
        [list]: prev[list].map(t =>
          t.id === tempId
            ? { ...t, id: created.id, googleId: created.id, taskListId }
            : t
        ),
      }));
    } catch (e) {
      console.error('Add task error', e);
      // Remove optimistic item on error
      setTodosByList(prev => ({
        ...prev,
        [list]: prev[list].filter(t => t.id !== tempId),
      }));
    }
  }, [token]);

  // ── Delete task ──
  const deleteTodo = useCallback(async (id, list) => {
    const item = todosByList[list]?.find(t => t.id === id);

    // Optimistic update
    setTodosByList(prev => ({
      ...prev,
      [list]: prev[list].filter(t => t.id !== id),
    }));

    if (!token || !item) return;
    try {
      const taskListId = taskListIdsRef.current[list];
      await deleteTask(token, taskListId, id);
    } catch (e) {
      console.error('Delete task error', e);
      // Restore on error
      setTodosByList(prev => ({
        ...prev,
        [list]: [item, ...(prev[list] || [])],
      }));
    }
  }, [token, todosByList]);

  return { todosByList, loading, error, sync, toggleTodo, addTodo, deleteTodo };
}
