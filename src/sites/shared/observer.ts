/**
 * MutationObserver wiring.
 *
 * One observer watches the subtree for structural changes, and its callback is
 * deliberately trivial: it decides whether anything *could* matter and then
 * asks the scheduler for a debounced pass. All the real querying happens once
 * per pass rather than once per mutation.
 */
import type { Scheduler } from './scheduler';

export interface ObserverHandle {
  disconnect(): void;
}

const OBSERVED_ATTRIBUTES = ['aria-label', 'role', 'contenteditable'];

export function observeStructure(target: Node, scheduler: Scheduler): ObserverHandle {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
          scheduler.schedule();
          return; // one signal per batch is enough
        }
        continue;
      }
      // An element can gain its aria-label after mount, which is exactly the
      // attribute most of our selectors key off.
      scheduler.schedule();
      return;
    }
  });

  observer.observe(target, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: OBSERVED_ATTRIBUTES,
  });

  return { disconnect: () => observer.disconnect() };
}
