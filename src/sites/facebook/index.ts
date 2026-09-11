/**
 * The Facebook site module: what to clean on facebook.com.
 *
 * Adding another site means writing one of these plus a content entry — see
 * the README section "How to add another supported website".
 */
import { RULES, type RuleKey } from '../../shared/constants';
import type { ExtensionSettings } from '../../shared/types';
import { restoreRules } from '../shared/hider';
import type { SiteModule } from '../shared/runtime';
import { isMessengerRoute } from '../messenger/router';
import { applyPostCleanup } from './cleaners/posts';
import { applyStoryCleanup } from './cleaners/stories';
import { facebookObserveRoot } from './observer';

/** Every rule this site owns, so a route change can release all of them. */
export const FACEBOOK_RULES: readonly RuleKey[] = [
  RULES.storyActions,
  RULES.postActionBar,
  RULES.postLike,
  RULES.postComment,
  RULES.postShare,
  RULES.postSend,
  RULES.postReactions,
];

export const facebookSite: SiteModule = {
  name: 'facebook',
  observeRoot: facebookObserveRoot,

  isActive: (settings) => settings.facebook.enabled,
  // Two content scripts run on facebook.com; this one keeps the usage clock.
  ownsUsageClock: () => true,

  apply(settings: ExtensionSettings) {
    // facebook.com/messages is Messenger; the Messenger content script owns it.
    if (!settings.facebook.enabled || isMessengerRoute(location)) {
      restoreRules(FACEBOOK_RULES);
      return;
    }
    applyStoryCleanup(settings);
    applyPostCleanup(settings);
  },

  onRouteChange() {
    // Release everything first: markers from the previous route may sit on
    // nodes Facebook is about to reuse.
    restoreRules(FACEBOOK_RULES);
  },
};
