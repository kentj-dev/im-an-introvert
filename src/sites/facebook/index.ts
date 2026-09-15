/**
 * The Facebook site module: what to clean on facebook.com.
 *
 * Adding another site means writing one of these plus a content entry — see
 * the README section "How to add another supported website".
 */
import { RULES, type RuleKey } from "../../shared/constants";
import type { ExtensionSettings } from "../../shared/types";
import { restoreRules } from "../shared/hider";
import type { SiteModule } from "../shared/runtime";
import { isMessengerRoute } from "../messenger/router";
import { applyChatWidgetCleanup } from "./cleaners/chatWidgets";
import { applyFocusCleanup, clearFocus } from "./cleaners/focus";
import { applyPostCleanup, clearPostNotice } from "./cleaners/posts";
import { applyStoryCleanup } from "./cleaners/stories";
import { facebookObserveRoot } from "./observer";
import { isStoryRoute } from "./selectors";

/** Every rule this site owns, so a route change can release all of them. */
export const FACEBOOK_RULES: readonly RuleKey[] = [
  RULES.storyActions,
  RULES.postActionBar,
  RULES.chatWidgets,
];

export const facebookSite: SiteModule = {
  name: "facebook",
  observeRoot: facebookObserveRoot,
  // Facebook changes the URL before its Story viewer footer is fully mounted.
  // Recheck across that short transition so SPA navigation behaves like a
  // direct page load without polling continuously.
  routeSettleDelays: [100, 300, 700, 1_500],
  // Story transitions sometimes reveal a pre-mounted footer through class and
  // style changes only, which the structural observer intentionally ignores.
  // Reconcile while on /stories/ so those controls cannot reappear later.
  maintenanceIntervalMs: 400,
  shouldMaintain: () => isStoryRoute(location.pathname),

  // facebook.com/messages is Messenger time, which follows Messenger's switch.
  isActive: (settings) =>
    isMessengerRoute(location)
      ? settings.messenger.enabled
      : settings.facebook.enabled,
  // Two content scripts run on facebook.com; this one keeps the usage clock.
  ownsUsageClock: () => true,

  apply(settings: ExtensionSettings) {
    // facebook.com/messages is Messenger; the Messenger content script owns it.
    if (!settings.facebook.enabled || isMessengerRoute(location)) {
      restoreRules(FACEBOOK_RULES);
      clearPostNotice();
      clearFocus();
      return;
    }
    applyStoryCleanup(settings);
    applyPostCleanup(settings);
    applyChatWidgetCleanup(settings);
    applyFocusCleanup(settings);
  },

  onRouteChange() {
    // Release everything first: markers from the previous route may sit on
    // nodes Facebook is about to reuse.
    restoreRules(FACEBOOK_RULES);
    clearPostNotice();
  },
};
