/**
 * Hides the Messenger composer, or individual composer buttons.
 *
 * "Hide chat field" removes the whole composer row so a message cannot be
 * typed or sent by accident. Reading, scrolling and opening media all keep
 * working — only the input is gone.
 *
 * Composers are found document-wide, not inside a pre-resolved conversation
 * pane: Messenger's pane and Facebook's floating chat tabs both change shape
 * without notice, and a missed pane used to mean no composer at all. Every
 * candidate is then verified. On a Messenger route any editor outside page
 * navigation counts; on the rest of facebook.com it must sit inside a floating
 * chat tab, so comment boxes, post dialogs and Story replies are never touched.
 *
 * If nothing can be verified, nothing is hidden: it is better to leave the
 * composer visible than to guess at a container and hide part of the
 * conversation.
 */
import { NOTICE_ATTR, RULES, type RuleKey } from "../../../shared/constants";
import { debugOnce } from "../../../shared/debug";
import { applyRule } from "../../shared/hider";
import {
  ascendWhileSafe,
  containsAny,
  queryAll,
  type SelectorCandidates,
} from "../../shared/query";
import type { MessengerContext } from "../context";
import { isInsideChatTab } from "../floating";
import { messengerSelectors } from "../selectors";

/**
 * The button rows sit a few levels above the text box. The guards in
 * isSafeComposerAncestor, not this depth, keep the ascent out of the
 * conversation.
 */
const COMPOSER_ASCENT_DEPTH = 6;

/** Page chrome that never holds a composer. */
const NON_COMPOSER_CONTAINERS =
  '[role="navigation"], [role="banner"], [role="search"]';

const COMPOSER_REGION = messengerSelectors.composerRegion.join(", ");

function isSafeComposerAncestor(candidate: HTMLElement): boolean {
  return (
    !containsAny(candidate, messengerSelectors.messageList) &&
    !containsAny(candidate, messengerSelectors.composerStops)
  );
}

function isMessengerComposer(
  anchor: HTMLElement,
  context: MessengerContext,
): boolean {
  if (anchor.closest(NON_COMPOSER_CONTAINERS)) return false;
  return context.onMessengerRoute || isInsideChatTab(anchor);
}

/** The composer: the text box plus the button rows on either side of it. */
function composerFor(anchor: HTMLElement): HTMLElement {
  // Preferred: the composer region itself. Ascending from the text box alone
  // can stop at the wrapper holding the input and strand the buttons.
  const region = anchor.closest(COMPOSER_REGION);
  if (
    region instanceof HTMLElement &&
    !containsAny(region, messengerSelectors.messageList)
  ) {
    return region;
  }
  return ascendWhileSafe(anchor, isSafeComposerAncestor, COMPOSER_ASCENT_DEPTH);
}

function findComposers(context: MessengerContext): HTMLElement[] {
  const anchors = [
    ...queryAll(document, messengerSelectors.composerRegion),
    ...queryAll(document, messengerSelectors.composerTextbox),
  ].filter((anchor) => isMessengerComposer(anchor, context));

  const composers = [...new Set(anchors.map(composerFor))];
  if (composers.length === 0) {
    debugOnce("messenger:no-composer", "composer region and textbox not found");
  }
  // A region and its own text box can resolve to nested targets.
  return composers.filter(
    (composer) =>
      !composers.some(
        (other) => other !== composer && other.contains(composer),
      ),
  );
}

/**
 * Flags the composer's parent so the stylesheet can draw a one-line note where
 * the composer used to be. Done with an attribute and a ::after rule rather
 * than an injected element, which keeps React's child lists untouched.
 */
function applyNotice(composers: readonly HTMLElement[], show: boolean): void {
  const targets = new Set(
    show
      ? composers.map((composer) => composer.parentElement).filter(Boolean)
      : [],
  );
  for (const element of document.querySelectorAll(`[${NOTICE_ATTR}]`)) {
    if (!targets.has(element as HTMLElement))
      element.removeAttribute(NOTICE_ATTR);
  }
  for (const target of targets) target?.setAttribute(NOTICE_ATTR, "true");
}

/** Drops the note, used when leaving Messenger entirely. */
export function clearComposerNotice(): void {
  for (const element of document.querySelectorAll(`[${NOTICE_ATTR}]`)) {
    element.removeAttribute(NOTICE_ATTR);
  }
}

export function applyMessengerChatFieldCleanup(
  context: MessengerContext,
): void {
  const rules = context.rules;

  const buttonRules: ReadonlyArray<[RuleKey, boolean, SelectorCandidates]> = [
    [
      RULES.messengerAttachments,
      rules.hideAttachments,
      messengerSelectors.attachmentButtons,
    ],
    [
      RULES.messengerEmoji,
      rules.hideEmojiButton,
      messengerSelectors.emojiButton,
    ],
    [RULES.messengerGif, rules.hideGifButton, messengerSelectors.gifButton],
    [
      RULES.messengerSticker,
      rules.hideStickerButton,
      messengerSelectors.stickerButton,
    ],
    [RULES.messengerLike, rules.hideLikeButton, messengerSelectors.likeButton],
  ];

  // The document-wide search is only worth running when something asks for it.
  const needed =
    rules.hideChatField || buttonRules.some(([, enabled]) => enabled);
  const composers = needed ? findComposers(context) : [];

  applyRule(RULES.messengerComposer, rules.hideChatField, () => composers);
  applyNotice(composers, rules.hideChatField && context.showNotice);

  for (const [rule, enabled, candidates] of buttonRules) {
    // Scoped to the composer: the same labels appear on message hover menus
    // and Facebook comment boxes, and those must keep working.
    applyRule(rule, enabled, () =>
      composers.flatMap((composer) => queryAll(composer, candidates)),
    );
  }
}
