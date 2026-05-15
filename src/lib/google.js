// ─────────────────────────────────────────────
//  Google API helpers — Calendar + Tasks
// ─────────────────────────────────────────────

const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';
const TASKS_BASE    = 'https://www.googleapis.com/tasks/v1';

// The four task lists we mirror in Google Tasks
export const TASK_LIST_NAMES = ['General', 'House', 'Yard', 'Vehicles'];

// ── Auth token storage ────────────────────────
export function saveToken(tokenResponse) {
  const expiry = Date.now() + tokenResponse.expires_in * 1000;
  localStorage.setItem('hb_access_token', tokenResponse.access_token);
  localStorage.setItem('hb_token_expiry', expiry.toString());
}

export function getToken() {
  const token  = localStorage.getItem('hb_access_token');
  const expiry = parseInt(localStorage.getItem('hb_token_expiry') || '0');
  if (!token || Date.now() > expiry) return null;
  return token;
}

export function clearToken() {
  localStorage.removeItem('hb_access_token');
  localStorage.removeItem('hb_token_expiry');
}

// ── Generic fetch wrapper ─────────────────────
async function gFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Calendar ──────────────────────────────────

// Fetch all calendars the user has access to
export async function fetchCalendarList(token) {
  const data = await gFetch(`${CALENDAR_BASE}/users/me/calendarList`, token);
  return data.items || [];
}

// Fetch events from a specific calendar for a date range
export async function fetchCalendarEvents(token, calendarId = 'primary', daysAhead = 270) {
  const now    = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    timeMin:      now.toISOString(),
    timeMax:      future.toISOString(),
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '500',
  });
  const data = await gFetch(`${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, token);
  return data.items || [];
}

// Normalize a Google Calendar event to Home Base format
export function normalizeCalendarEvent(event, owner = 'family') {
  const startDT   = event.start?.dateTime;
  const startDate = event.start?.date; // all-day: "YYYY-MM-DD"
  const start     = startDT || startDate;

  // For all-day events, parse date parts directly to avoid UTC offset shifting the day
  let date;
  if (startDate && !startDT) {
    const [y, m, d] = startDate.split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(start);
  }

  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  let dateLabel = start;
  if (date.toDateString() === today.toDateString())    dateLabel = 'today';
  if (date.toDateString() === tomorrow.toDateString()) dateLabel = 'tomorrow';

  return {
    id:       event.id,
    title:    event.summary || '(No title)',
    time:     startDT
                ? new Date(startDT).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                : 'All day',
    date:     dateLabel,
    rawDate:  start,
    owner,
    details:  event.description || '',
    location: event.location || '',
  };
}

// Create a new event
export async function createCalendarEvent(token, calendarId = 'primary', eventData) {
  return gFetch(`${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, token, {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
}

// ── Tasks ─────────────────────────────────────

// Fetch all task lists
export async function fetchTaskLists(token) {
  const data = await gFetch(`${TASKS_BASE}/users/@me/lists`, token);
  return data.items || [];
}

// Create a task list if it doesn't exist, return its id
export async function ensureTaskList(token, name, existingLists) {
  const existing = existingLists.find(l => l.title === name);
  if (existing) return existing.id;
  const created = await gFetch(`${TASKS_BASE}/users/@me/lists`, token, {
    method: 'POST',
    body: JSON.stringify({ title: name }),
  });
  return created.id;
}

// Fetch tasks from a specific list
export async function fetchTasks(token, taskListId) {
  const params = new URLSearchParams({ showCompleted: 'true', maxResults: '100' });
  const data = await gFetch(`${TASKS_BASE}/lists/${taskListId}/tasks?${params}`, token);
  return data.items || [];
}

// Normalize a Google Task to Home Base format
export function normalizeTask(task, list) {
  return {
    id:       task.id,
    title:    task.title || '(No title)',
    done:     task.status === 'completed',
    priority: 'medium',
    list,
    googleId: task.id,
    taskListId: task.taskListId,
  };
}

// Create a task
export async function createTask(token, taskListId, title) {
  return gFetch(`${TASKS_BASE}/lists/${taskListId}/tasks`, token, {
    method: 'POST',
    body: JSON.stringify({ title, status: 'needsAction' }),
  });
}

// Update a task (toggle complete)
export async function updateTask(token, taskListId, taskId, updates) {
  return gFetch(`${TASKS_BASE}/lists/${taskListId}/tasks/${taskId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// Delete a task
export async function deleteTask(token, taskListId, taskId) {
  const res = await fetch(`${TASKS_BASE}/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}
