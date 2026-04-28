const BASE = '/api';

export async function fetchLogs() {
  const res = await fetch(`${BASE}/logs`);
  return res.json();
}

export async function fetchLog(date) {
  const res = await fetch(`${BASE}/logs/${date}`);
  return res.json();
}

export async function saveLog(data) {
  const res = await fetch(`${BASE}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteLog(date) {
  const res = await fetch(`${BASE}/logs/${date}`, { method: 'DELETE' });
  return res.json();
}

export async function getSetting(key) {
  const res = await fetch(`${BASE}/settings/${key}`);
  return res.json();
}

export async function saveSetting(key, value) {
  const res = await fetch(`${BASE}/settings/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  });
  return res.json();
}

export function downloadBackup(password) {
  window.open(`${BASE}/backup?password=${encodeURIComponent(password)}`, '_blank');
}

export async function importBackup(file, password) {
  const form = new FormData();
  form.append('file', file);
  form.append('password', password);
  const res = await fetch(`${BASE}/import`, { method: 'POST', body: form });
  return res.json();
}
