/**
 * Quick Stats: two counters for the current day, and nothing else.
 *
 * Deliberate boundaries, because this is the one part of the extension that
 * records anything about what you did:
 *   - `chrome.storage.local`, so it is never synced anywhere.
 *   - Two integers plus a date. No URLs, no per-site split, no history: when
 *     the day rolls over, yesterday's numbers are gone, not archived.
 *   - Written only by the service worker, which serialises reports from tabs.
 *   - Clearable at any time from the popup.
 */
import { STATS_KEY } from '../shared/constants';
import { debug } from '../shared/debug';
import type { UsageStats } from '../shared/types';

/** Local calendar day, so "today" means the user's today. */
export function today(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function emptyStats(): UsageStats {
  return { date: today(), hiddenCount: 0, activeSeconds: 0 };
}

function parseStats(raw: unknown): UsageStats {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const date = typeof source.date === 'string' ? source.date : '';
  // Anything from a previous day reads as zero rather than accumulating.
  if (date !== today()) return emptyStats();
  return {
    date,
    hiddenCount: typeof source.hiddenCount === 'number' ? Math.max(0, source.hiddenCount) : 0,
    activeSeconds: typeof source.activeSeconds === 'number' ? Math.max(0, source.activeSeconds) : 0,
  };
}

export async function loadStats(): Promise<UsageStats> {
  try {
    const stored = await chrome.storage.local.get(STATS_KEY);
    return parseStats(stored[STATS_KEY]);
  } catch (error) {
    debug('loadStats failed', error);
    return emptyStats();
  }
}

/** Folds one tab's report into today's totals. Called in the worker only. */
export async function addUsage(delta: { hidden?: number; seconds?: number }): Promise<void> {
  const current = await loadStats();
  const next: UsageStats = {
    date: today(),
    hiddenCount: current.hiddenCount + Math.max(0, Math.trunc(delta.hidden ?? 0)),
    activeSeconds: current.activeSeconds + Math.max(0, Math.trunc(delta.seconds ?? 0)),
  };
  await chrome.storage.local.set({ [STATS_KEY]: next });
}

export async function resetStats(): Promise<void> {
  await chrome.storage.local.set({ [STATS_KEY]: emptyStats() });
}

export function watchStats(listener: (stats: UsageStats) => void): () => void {
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ): void => {
    if (area !== 'local') return;
    const change = changes[STATS_KEY];
    if (!change) return;
    listener(parseStats(change.newValue));
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}

/** "2h 14m", "14m", "—". */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return seconds > 0 ? '<1m' : '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
