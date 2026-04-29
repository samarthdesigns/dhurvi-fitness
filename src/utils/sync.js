import { getAllLogs, saveLog, getSetting, saveSetting } from './db';
import Dexie from 'dexie';

const db = new Dexie('DhruviGymPlan');
db.version(1).stores({
  logs: 'date',
  settings: 'key',
  smarttips: 'exercise'
});

// Pull remote data from GitHub via Netlify Function
async function pullRemote() {
  const res = await fetch('/api/sync');
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Sync pull failed');
  }
  return res.json(); // { logs, settings, sha }
}

// Push merged data to GitHub via Netlify Function
async function pushRemote(logs, settings, sha) {
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs, settings, sha })
  });
  if (!res.ok) {
    const err = await res.json();
    if (res.status === 409) throw new Error('conflict');
    throw new Error(err.error || 'Sync push failed');
  }
  return res.json(); // { success, sha }
}

// Merge two arrays of logs — latest write wins per date
function mergeLogs(localLogs, remoteLogs) {
  const map = {};
  // Local first
  for (const log of localLogs) map[log.date] = log;
  // Remote overwrites (it's the "shared truth")
  for (const log of remoteLogs) map[log.date] = log;
  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
}

// Merge settings — remote wins
function mergeSettings(localSettings, remoteSettings) {
  const map = {};
  for (const s of localSettings) map[s.key] = s;
  for (const s of remoteSettings) map[s.key] = s;
  return Object.values(map);
}

/**
 * Full sync cycle:
 * 1. Pull from GitHub
 * 2. Merge with local IndexedDB
 * 3. Write merged data to local IndexedDB
 * 4. Push merged data back to GitHub
 * Returns { success, message }
 */
export async function syncWithGitHub() {
  try {
    // 1. Pull remote
    const remote = await pullRemote();

    // 2. Get local data
    const localLogs = await getAllLogs();
    const localSettings = await db.settings.toArray();

    // 3. Merge
    const remoteLogs = remote.logs || [];
    const remoteSettings = remote.settings || [];
    const mergedLogs = mergeLogs(localLogs, remoteLogs);
    const mergedSettings = mergeSettings(localSettings, remoteSettings);

    // 4. Write merged data to local IndexedDB
    for (const log of mergedLogs) await db.logs.put(log);
    for (const s of mergedSettings) await db.settings.put(s);

    // 5. Push merged data back to GitHub
    const result = await pushRemote(mergedLogs, mergedSettings, remote.sha);

    return {
      success: true,
      message: `Synced! ${mergedLogs.length} logs across devices`
    };

  } catch (err) {
    if (err.message === 'conflict') {
      // Conflict: retry once with fresh pull
      try {
        const remote = await pullRemote();
        const localLogs = await getAllLogs();
        const localSettings = await db.settings.toArray();
        const merged = mergeLogs(localLogs, remote.logs || []);
        const mergedS = mergeSettings(localSettings, remote.settings || []);
        for (const log of merged) await db.logs.put(log);
        for (const s of mergedS) await db.settings.put(s);
        await pushRemote(merged, mergedS, remote.sha);
        return { success: true, message: 'Synced after conflict resolution!' };
      } catch (retryErr) {
        return { success: false, message: 'Sync conflict — try again in a moment' };
      }
    }

    // If GitHub isn't configured, that's okay — just works locally
    if (err.message.includes('not configured')) {
      return { success: false, message: 'GitHub sync not set up — data saved locally' };
    }

    return { success: false, message: err.message };
  }
}
