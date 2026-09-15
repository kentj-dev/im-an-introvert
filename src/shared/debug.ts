/**
 * Development logging. Flip DEBUG to true while adjusting selectors, then set
 * it back to false — a shipped build should be silent even when Facebook
 * changes its markup and a selector stops matching.
 *
 * Never log message content or conversation text here.
 */
export const DEBUG = false;

const PREFIX = "[introvert]";
const seen = new Set<string>();

export function debug(...args: unknown[]): void {
  if (!DEBUG) return;
  console.log(PREFIX, ...args);
}

/**
 * Logs a message at most once per session. Used for "selector not found",
 * which would otherwise repeat on every mutation pass.
 */
export function debugOnce(key: string, ...args: unknown[]): void {
  if (!DEBUG || seen.has(key)) return;
  seen.add(key);
  console.log(PREFIX, ...args);
}

/**
 * Runs `fn` and swallows anything it throws. Facebook's DOM is a moving
 * target; a broken cleaner must never break the page it runs on.
 */
export function safely<T>(label: string, fn: () => T): T | undefined {
  try {
    return fn();
  } catch (error) {
    debugOnce(`error:${label}`, `${label} failed`, error);
    return undefined;
  }
}
