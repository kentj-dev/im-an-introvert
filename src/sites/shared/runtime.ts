/**
 * Shared content-script runtime.
 *
 * A site (Facebook, Messenger, Instagram, and later Reddit, X, ...) only has
 * to describe *what* to clean. This module owns the lifecycle every site
 * needs: load settings, run an idempotent pass, re-run on DOM churn, re-run on
 * SPA navigation, re-run when the popup changes a setting, and report the two
 * Quick Stats counters.
 */
import { USAGE_FLUSH_MS } from "../../shared/constants";
import { safely, debug } from "../../shared/debug";
import {
  MESSAGES,
  type ExtensionSettings,
  type UsageReport,
} from "../../shared/types";
import { parseSettings } from "../../storage/schema";
import {
  loadSettings,
  onSettingsExpiry,
  watchSettings,
} from "../../storage/storage";
import { takeHiddenCount } from "./hider";
import { observeStructure } from "./observer";
import { watchRoute } from "./route";
import { createScheduler } from "./scheduler";

export interface SiteModule {
  /** Used in debug output only. */
  name: string;
  /**
   * Apply every cleanup rule for the current settings. Must be safe to call
   * repeatedly and must restore anything its settings no longer ask to hide.
   */
  apply(settings: ExtensionSettings): void;
  /**
   * Called before the first pass after an SPA navigation. Use it to release
   * markers that belonged to the previous route — otherwise the last
   * conversation's rules would linger on the next one.
   */
  onRouteChange?(settings: ExtensionSettings, href: string): void;
  /**
   * Optional follow-up passes after an SPA route change. Useful for sites that
   * update the URL before asynchronously mounting the destination surface.
   */
  routeSettleDelays?: readonly number[];
  /**
   * Optional low-cost maintenance pass for a highly dynamic surface whose DOM
   * can be reused or revealed without an observable structural mutation.
   */
  maintenanceIntervalMs?: number;
  shouldMaintain?(): boolean;
  /** False when the platform's master switch is off; stops the usage clock. */
  isActive?(settings: ExtensionSettings): boolean;
  /**
   * Whether this module counts page time on this host. Facebook loads two
   * content scripts, so exactly one of them must own the clock. Hidden-element
   * counts are reported by every module either way.
   */
  ownsUsageClock?(): boolean;
  /** Element to observe. Defaults to document.body. */
  observeRoot?(): Node | null;
}

const TICK_MS = 5_000;

export function startSiteModule(module: SiteModule): void {
  let settings: ExtensionSettings | null = null;
  let activeSeconds = 0;
  let cancelExpiry = (): void => undefined;

  const scheduler = createScheduler(() => {
    if (!settings) return;
    safely(`${module.name}:apply`, () =>
      module.apply(settings as ExtensionSettings),
    );
  });

  // Leave me alone mode ends on a timer. Re-reading the settings when it does
  // restores the page even though nothing writes to storage at that moment.
  const setSettings = (next: ExtensionSettings): void => {
    settings = next;
    cancelExpiry();
    cancelExpiry = onSettingsExpiry(next, () => {
      if (!settings) return;
      setSettings(parseSettings(settings));
      scheduler.flush();
    });
  };

  const isActive = (): boolean =>
    settings !== null && (module.isActive?.(settings) ?? true);

  const flushUsage = (): void => {
    const hidden = takeHiddenCount();
    const seconds = activeSeconds;
    activeSeconds = 0;
    if (hidden === 0 && seconds === 0) return;

    const report: UsageReport = { type: MESSAGES.reportUsage, hidden, seconds };
    // Fire and forget. The worker may be asleep or the extension may have been
    // reloaded out from under this page; stats are never worth an exception.
    safely("usage:send", () => {
      void chrome.runtime.sendMessage(report).catch(() => undefined);
    });
  };

  const startUsageReporting = (): void => {
    // Only the clock owner counts time, so it is not counted twice on a host
    // with two content scripts. Hidden counts are per script and always sent.
    if (module.ownsUsageClock?.() !== false) {
      setInterval(() => {
        if (document.visibilityState === "visible" && isActive())
          activeSeconds += TICK_MS / 1000;
      }, TICK_MS);
    }
    setInterval(flushUsage, USAGE_FLUSH_MS);
    // Leaving the page is the last chance to report what this tab accumulated.
    window.addEventListener("pagehide", flushUsage);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushUsage();
    });
  };

  const boot = async (): Promise<void> => {
    setSettings(await loadSettings());
    debug(`${module.name} started`);
    scheduler.flush();

    const root = module.observeRoot?.() ?? document.body;
    if (root) observeStructure(root, scheduler);

    watchRoute((href) => {
      if (!settings) return;
      safely(`${module.name}:route`, () =>
        module.onRouteChange?.(settings as ExtensionSettings, href),
      );
      scheduler.flush();

      // A delayed pass is tied to the exact destination. If another SPA
      // navigation wins first, the stale callback becomes a no-op.
      for (const delay of module.routeSettleDelays ?? []) {
        setTimeout(() => {
          if (location.href === href) scheduler.flush();
        }, delay);
      }
    });

    if (module.maintenanceIntervalMs && module.shouldMaintain) {
      setInterval(() => {
        if (
          document.visibilityState === "visible" &&
          module.shouldMaintain?.()
        ) {
          scheduler.flush();
        }
      }, module.maintenanceIntervalMs);
    }

    // Live updates: a popup toggle writes to storage, this fires, the pass
    // re-runs, and the element appears or disappears without a reload.
    watchSettings((next) => {
      setSettings(next);
      scheduler.flush();
    });

    startUsageReporting();
  };

  if (document.body) {
    void boot();
  } else {
    document.addEventListener("DOMContentLoaded", () => void boot(), {
      once: true,
    });
  }
}
