/**
 * Hides the Messenger composer, or individual composer buttons.
 *
 * "Hide chat field" removes the whole composer row so a message cannot be
 * typed or sent by accident. Reading, scrolling and opening media all keep
 * working — only the input is gone.
 *
 * Everything is anchored to the composer textbox. If that cannot be found,
 * nothing is hidden: it is better to leave the composer visible than to guess
 * at a container and hide part of the conversation.
 */
import { NOTICE_ATTR, RULES, type RuleKey } from '../../../shared/constants';
import { debugOnce } from '../../../shared/debug';
import { applyRule } from '../../shared/hider';
import {
  ascendWhileSafe,
  containsAny,
  queryAll,
  queryOne,
  type SelectorCandidates,
} from '../../shared/query';
import type { MessengerContext } from '../context';
import { messengerSelectors } from '../selectors';

/** Composer rows sit shallow; a short ascent keeps the blast radius small. */
const COMPOSER_ASCENT_DEPTH = 4;

function isSafeComposerAncestor(candidate: HTMLElement): boolean {
  return (
    !containsAny(candidate, messengerSelectors.messageList) &&
    !containsAny(candidate, messengerSelectors.conversationTitle)
  );
}

/** The composer row: the wrapper holding the textbox and its buttons. */
function findComposer(context: MessengerContext): HTMLElement | null {
  const scope = context.threadRoot;
  if (!scope) return null;

  const textbox = queryOne(scope, messengerSelectors.composerTextbox);
  if (!textbox) {
    debugOnce('messenger:no-composer', 'composer textbox not found');
    return null;
  }
  return ascendWhileSafe(textbox, isSafeComposerAncestor, COMPOSER_ASCENT_DEPTH);
}

/**
 * Flags the composer's parent so the stylesheet can draw a one-line note where
 * the composer used to be. Done with an attribute and a ::after rule rather
 * than an injected element, which keeps React's child lists untouched.
 */
function applyNotice(composer: HTMLElement | null, show: boolean): void {
  const target = show ? composer?.parentElement ?? null : null;
  for (const element of document.querySelectorAll(`[${NOTICE_ATTR}]`)) {
    if (element !== target) element.removeAttribute(NOTICE_ATTR);
  }
  target?.setAttribute(NOTICE_ATTR, 'true');
}

/** Drops the note, used when leaving Messenger entirely. */
export function clearComposerNotice(): void {
  for (const element of document.querySelectorAll(`[${NOTICE_ATTR}]`)) {
    element.removeAttribute(NOTICE_ATTR);
  }
}

export function applyMessengerChatFieldCleanup(context: MessengerContext): void {
  const rules = context.rules;
  const composer = findComposer(context);

  applyRule(RULES.messengerComposer, rules.hideChatField, () => (composer ? [composer] : []));
  applyNotice(composer, rules.hideChatField && context.showNotice);

  const buttonRules: ReadonlyArray<[RuleKey, boolean, SelectorCandidates]> = [
    [RULES.messengerAttachments, rules.hideAttachments, messengerSelectors.attachmentButtons],
    [RULES.messengerEmoji, rules.hideEmojiButton, messengerSelectors.emojiButton],
    [RULES.messengerGif, rules.hideGifButton, messengerSelectors.gifButton],
    [RULES.messengerSticker, rules.hideStickerButton, messengerSelectors.stickerButton],
    [RULES.messengerLike, rules.hideLikeButton, messengerSelectors.likeButton],
  ];

  for (const [rule, enabled, candidates] of buttonRules) {
    // Scoped to the composer: the same labels appear on message hover menus,
    // and reacting to a message must keep working.
    applyRule(rule, enabled, () => (composer ? queryAll(composer, candidates) : []));
  }
}
