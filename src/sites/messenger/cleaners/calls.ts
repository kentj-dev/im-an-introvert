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

const BUTTON_SELECTOR = 'button, a[role="button"], div[role="button"], [role="button"]';

function physicalButton(element: HTMLElement): HTMLElement {
  const button = element.closest(BUTTON_SELECTOR);
  return button instanceof HTMLElement ? button : element;
}

function findCallButtons(candidates: SelectorCandidates): HTMLElement[] {
  const found = new Set<HTMLElement>();
  const messageLists = queryAll(document, messengerSelectors.messageList);

  // Exact call labels are sufficiently specific to scan document-wide. This
  // also covers floating widgets whose outer wrapper changes or has no role.
  for (const match of queryAll(document, candidates)) {
    const button = physicalButton(match);
    // Call-history cards can contain labels such as "Audio call". Preserve
    // everything in the message list; only call controls are in scope.
    if (!messageLists.some((list) => list.contains(button))) found.add(button);
  }
  return [...found];
}

export function applyMessengerCallCleanup(context: MessengerContext): void {
  applyRule(RULES.messengerVoiceCall, context.rules.hideVoiceCall, () =>
    findCallButtons(messengerSelectors.voiceCallButton),
  );

  applyRule(RULES.messengerVideoCall, context.rules.hideVideoCall, () =>
    findCallButtons(messengerSelectors.videoCallButton),
  );
}
