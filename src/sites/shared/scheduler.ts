/**
 * Runs the cleanup pass at a sensible rate.
 *
 * Three behaviours, each there for a reason:
 *
 *   leading edge — after a quiet moment, the first request runs on the spot.
 *     A conversation mounting is exactly that case, and waiting out a debounce
 *     there is what makes controls visibly twitch before they disappear.
 *   trailing debounce — during continuous churn (typing indicators, video,
 *     lazy-loaded rows) requests coalesce into one pass.
 *   ceiling — a page that never goes quiet would otherwise starve the trailing
 *     run forever, so a pass is forced once the burst has lasted long enough.
 */
import { CLEANUP_DEBOUNCE_MS } from '../../shared/constants';

export interface Scheduler {
  /** Request a run; coalesces bursts of calls into one. */
  schedule(): void;
  /** Run immediately, cancelling any pending run. */
  flush(): void;
  cancel(): void;
}

export function createScheduler(task: () => void, wait = CLEANUP_DEBOUNCE_MS): Scheduler {
  const maxWait = wait * 8;
  const idleGap = wait * 4;

  let timer: number | undefined;
  let firstRequest = 0;
  let lastRun = 0;

  const run = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    firstRequest = 0;
    lastRun = Date.now();
    task();
  };

  return {
    schedule() {
      const now = Date.now();
      // Quiet until now: act on this tick, before the browser paints.
      if (now - lastRun >= idleGap) {
        run();
        return;
      }
      if (firstRequest === 0) firstRequest = now;
      if (now - firstRequest >= maxWait) {
        run();
        return;
      }
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(run, wait) as unknown as number;
    },
    flush: run,
    cancel() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      firstRequest = 0;
    },
  };
}
