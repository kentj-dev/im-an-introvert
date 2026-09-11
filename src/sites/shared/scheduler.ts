/** Debounced runner with a ceiling, so cleanup keeps up with busy pages. */
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
  let timer: number | undefined;
  let firstRequest = 0;

  const run = (): void => {
    timer = undefined;
    firstRequest = 0;
    task();
  };

  return {
    schedule() {
      const now = Date.now();
      if (firstRequest === 0) firstRequest = now;
      // Facebook can mutate continuously (video, typing indicators). Without a
      // ceiling a trailing debounce could be starved forever.
      if (now - firstRequest >= maxWait) {
        if (timer !== undefined) clearTimeout(timer);
        run();
        return;
      }
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(run, wait) as unknown as number;
    },
    flush() {
      if (timer !== undefined) clearTimeout(timer);
      run();
    },
    cancel() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      firstRequest = 0;
    },
  };
}
