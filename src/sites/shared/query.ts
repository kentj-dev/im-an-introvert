/**
 * Selector helpers.
 *
 * Facebook ships generated class names (`.x1abc123`) that change without
 * warning, so selectors live in per-site selector modules and are written as
 * *lists of candidates*. These helpers try every candidate and never throw,
 * which is what lets a stale selector degrade into "do nothing".
 */
import { debugOnce } from '../../shared/debug';

export type SelectorCandidates = readonly string[];

function safeQueryAll(root: ParentNode, selector: string): Element[] {
  try {
    return Array.from(root.querySelectorAll(selector));
  } catch (error) {
    debugOnce(`bad-selector:${selector}`, 'invalid selector', selector, error);
    return [];
  }
}

/** First element matched by the first candidate that matches anything. */
export function queryOne(
  root: ParentNode,
  candidates: SelectorCandidates,
): HTMLElement | null {
  for (const selector of candidates) {
    const found = safeQueryAll(root, selector)[0];
    if (found instanceof HTMLElement) return found;
  }
  return null;
}

/** Every element matched by any candidate, de-duplicated and in DOM order. */
export function queryAll(root: ParentNode, candidates: SelectorCandidates): HTMLElement[] {
  const found = new Set<HTMLElement>();
  for (const selector of candidates) {
    for (const element of safeQueryAll(root, selector)) {
      if (element instanceof HTMLElement) found.add(element);
    }
  }
  return [...found];
}

/** True when `root` contains at least one element matching any candidate. */
export function containsAny(root: ParentNode, candidates: SelectorCandidates): boolean {
  return queryOne(root, candidates) !== null;
}

/**
 * Builds selector candidates from a list of accessible names.
 *
 * Facebook's aria-labels differ by locale, A/B test and surface, so each name
 * yields an exact match plus a case-insensitive substring match. Pass names in
 * English; the substring form also catches "Start a voice call" variants.
 */
export function byAriaLabel(names: readonly string[]): string[] {
  const candidates: string[] = [];
  for (const name of names) {
    const escaped = name.replace(/"/g, '\\"');
    candidates.push(`[aria-label="${escaped}"]`);
    candidates.push(`[aria-label*="${escaped}" i]`);
  }
  return candidates;
}

/** Same as byAriaLabel but restricted to things that behave like buttons. */
export function byAriaLabelButton(names: readonly string[]): string[] {
  return byAriaLabel(names).flatMap((selector) => [
    `div[role="button"]${selector}`,
    `a[role="button"]${selector}`,
    `button${selector}`,
    `a${selector}`,
    selector,
  ]);
}

/**
 * Walks up from `element` and returns the highest ancestor that still passes
 * `isSafe`. Used to find a wrapper worth hiding (an action bar, a composer
 * row) without knowing Facebook's class names.
 *
 * `isSafe` is where the guard rails live: it should reject any ancestor that
 * has grown to contain UI the user must keep, such as story navigation or the
 * message list.
 */
export function ascendWhileSafe(
  element: HTMLElement,
  isSafe: (candidate: HTMLElement) => boolean,
  maxDepth = 6,
): HTMLElement {
  let best = element;
  let current: HTMLElement | null = element.parentElement;
  for (let depth = 0; depth < maxDepth && current; depth++) {
    if (current === document.body || !isSafe(current)) break;
    best = current;
    current = current.parentElement;
  }
  return best;
}

/**
 * Walks up from `element` until `predicate` is satisfied, returning that
 * ancestor or null. Unlike ascendWhileSafe this looks for a positive signal,
 * e.g. "the ancestor that contains at least two post action buttons".
 */
export function ascendUntil(
  element: HTMLElement,
  predicate: (candidate: HTMLElement) => boolean,
  maxDepth = 8,
): HTMLElement | null {
  let current: HTMLElement | null = element.parentElement;
  for (let depth = 0; depth < maxDepth && current; depth++) {
    if (current === document.body) return null;
    if (predicate(current)) return current;
    current = current.parentElement;
  }
  return null;
}
