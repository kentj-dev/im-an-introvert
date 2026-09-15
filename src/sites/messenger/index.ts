/**
 * The Messenger site module.
 *
 * All of this is per conversation: `resolveMessengerContext` looks up the
 * conversation id from the URL and the matching protected chat, and the
 * cleaners hide nothing at all when the conversation is not protected.
 */
import { RULES, type RuleKey } from '../../shared/constants';
import type { ExtensionSettings } from '../../shared/types';
import { clearCosmeticRules, applyCosmeticRules } from '../shared/cosmetic';
import { restoreRules } from '../shared/hider';
import type { SiteModule } from '../shared/runtime';
import { resolveMessengerContext } from './context';
import { messengerCosmeticSelectors } from './cosmetic';
import { applyMessengerCallCleanup } from './cleaners/calls';
import { applyMessengerChatFieldCleanup, clearComposerNotice } from './cleaners/chatField';
import { applyMessengerGroupCleanup } from './cleaners/groupActions';
import { messengerObserveRoot } from './observer';
import { isFacebookHost, isMessengerRoute } from './router';

export const MESSENGER_RULES: readonly RuleKey[] = [
  RULES.messengerVoiceCall,
  RULES.messengerVideoCall,
  RULES.messengerGroupActions,
  RULES.messengerComposer,
  RULES.messengerAttachments,
  RULES.messengerEmoji,
  RULES.messengerGif,
  RULES.messengerSticker,
  RULES.messengerLike,
];

function reset(): void {
  restoreRules(MESSENGER_RULES);
  clearComposerNotice();
  clearCosmeticRules();
}

export const messengerSite: SiteModule = {
  name: 'messenger',
  observeRoot: messengerObserveRoot,

  isActive: (settings) => settings.messenger.enabled,
  // On facebook.com the Facebook module counts page time; on messenger.com
  // this is the only content script, so it counts instead.
  ownsUsageClock: () => !isFacebookHost(location.hostname),

  apply(settings: ExtensionSettings) {
    if (!isMessengerRoute(location)) {
      if (isFacebookHost(location.hostname)) {
        const context = resolveMessengerContext(settings);
        // Floating chat tabs have no conversation id in the page URL, so only
        // global Messenger rules apply. Marker-based cleanup is used here;
        // the full-page cosmetic selectors must not be scoped to Facebook's
        // ordinary feed main.
        clearCosmeticRules();
        applyMessengerCallCleanup(context);
        applyMessengerGroupCleanup(context);
        applyMessengerChatFieldCleanup(context);
        return;
      }
      reset();
      return;
    }

    const context = resolveMessengerContext(settings);
    applyCosmeticRules(messengerCosmeticSelectors(context));
    applyMessengerCallCleanup(context);
    applyMessengerGroupCleanup(context);
    applyMessengerChatFieldCleanup(context);
  },

  /**
   * Switching conversation must not leave the previous chat's rules behind: an
   * unprotected chat has to look completely untouched.
   *
   * The stylesheet is rewritten here rather than in the pass that follows,
   * because at this point the new conversation has not been mounted yet. That
   * is what stops a protected chat's call buttons from appearing for a frame
   * before they are hidden. Markers need no reset: every rule diffs what it
   * has claimed against what it now matches, and the pass runs immediately
   * after this.
   */
  onRouteChange(settings: ExtensionSettings) {
    if (!isMessengerRoute(location)) {
      reset();
      return;
    }
    applyCosmeticRules(messengerCosmeticSelectors(resolveMessengerContext(settings)));
  },
};
