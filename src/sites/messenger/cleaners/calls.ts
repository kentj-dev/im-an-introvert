/**
 * Hides the voice and video call buttons.
 *
 * Scoped to the conversation pane so the chat list and other surfaces keep
 * their buttons. Whether a rule is on comes from the context: a global
 * Messenger switch, or this conversation's protected-chat record.
 */
import { RULES } from '../../../shared/constants';
import { applyRule } from '../../shared/hider';
import { queryAll, type SelectorCandidates } from '../../shared/query';
import type { MessengerContext } from '../context';
import { messengerSelectors } from '../selectors';

function findCallButtons(
  context: MessengerContext,
  candidates: SelectorCandidates,
): HTMLElement[] {
  const scope = context.threadRoot;
  if (!scope) return [];
  // An in-progress call renders in a dialog; leave its controls alone so the
  // user can always hang up.
  return queryAll(scope, candidates).filter((button) => !button.closest('[role="dialog"]'));
}

export function applyMessengerCallCleanup(context: MessengerContext): void {
  applyRule(RULES.messengerVoiceCall, context.rules.hideVoiceCall, () =>
    findCallButtons(context, messengerSelectors.voiceCallButton),
  );

  applyRule(RULES.messengerVideoCall, context.rules.hideVideoCall, () =>
    findCallButtons(context, messengerSelectors.videoCallButton),
  );
}
