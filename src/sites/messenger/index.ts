/**
 * The Messenger site module.
 *
 * All of this is per conversation: `resolveMessengerContext` looks up the
 * conversation id from the URL and the matching protected chat, and the
 * cleaners hide nothing at all when the conversation is not protected.
 */
import { RULES, type RuleKey } from '../../shared/constants';
import type { ExtensionSettings } from '../../shared/types';
import { restoreRules } from '../shared/hider';
import type { SiteModule } from '../shared/runtime';
import { resolveMessengerContext } from './context';
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
}

export const messengerSite: SiteModule = {
  name: 'messenger',
  observeRoot: messengerObserveRoot,

  isActive: (settings) => settings.facebook.enabled,
  // On facebook.com the Facebook module counts page time; on messenger.com
  // this is the only content script, so it counts instead.
  ownsUsageClock: () => !isFacebookHost(location.hostname),

  apply(settings: ExtensionSettings) {
    if (!isMessengerRoute(location)) {
      reset();
      return;
    }

    const context = resolveMessengerContext(settings);
    applyMessengerCallCleanup(context);
    applyMessengerGroupCleanup(context);
    applyMessengerChatFieldCleanup(context);
  },

  // Switching conversation must not leave the previous chat's rules behind:
  // an unprotected chat has to look completely untouched.
  onRouteChange: reset,
};
