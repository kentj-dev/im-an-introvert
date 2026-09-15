/**
 * Every Facebook selector the extension uses lives here.
 *
 * ## How these are written
 * Facebook's class names are generated (`.x1abc123`) and rotate, so they are
 * avoided. Each entry is a *list of candidates* built from things that survive
 * redesigns reasonably well: `aria-label`, `role`, `href` shape,
 * `data-visualcompletion`, `data-ad-rendering-role`, `contenteditable`.
 *
 * ## How to fix one
 * 1. Set `DEBUG = true` in src/shared/debug.ts and rebuild.
 * 2. Inspect the element in DevTools, copy an attribute that looks stable.
 * 3. Add it to the front of the relevant candidate list. Old candidates can
 *    stay: unmatched candidates cost nothing and keep other locales working.
 *
 * ## Accuracy
 * Entries marked TODO were written from Facebook's published markup patterns
 * and have not been pinned to one confirmed DOM snapshot; labels also differ
 * by locale and A/B test. They fail closed — when nothing matches, the cleaner
 * does nothing at all.
 */
import { byAriaLabel, byAriaLabelButton } from "../shared/query";

export const facebookSelectors = {
  /* ------------------------------------------------------------- stories */

  /**
   * Root of the story viewer. Used to scope story queries so post rules can
   * never reach into a story and vice versa.
   * TODO: Verify against the current Facebook Story viewer DOM.
   */
  storyViewer: [
    '[data-pagelet="Stories"]',
    '[data-pagelet^="Stories"]',
    'div[role="main"]:has([aria-label="Next card"])',
    'div[role="dialog"]:has([aria-label="Next card"])',
    'div[role="main"]',
  ],

  /**
   * The reply box at the bottom of a story. This is the anchor for the whole
   * bottom bar: the cleaner ascends from here instead of guessing a wrapper.
   * TODO: Verify the reply textbox aria-label/placeholder on your account.
   */
  storyReplyComposer: [
    'input[placeholder*="Send message" i]',
    'textarea[placeholder*="Send message" i]',
    '[role="textbox"][aria-placeholder*="Send message" i]',
    '[contenteditable="true"][aria-placeholder*="Send message" i]',
    '[contenteditable="true"][role="textbox"]',
    '[contenteditable="true"][data-lexical-editor="true"]',
    '[role="textbox"][aria-label*="Message" i]',
    'input[placeholder*="Reply" i]',
    'div[role="textbox"][aria-label*="Reply" i]',
    'div[contenteditable="true"][aria-label*="Reply" i]',
    'textarea[placeholder*="Reply" i]',
    'form [role="textbox"]',
    ...byAriaLabel(["Write a reply", "Reply to story", "Send message"]),
  ],

  /**
   * Quick emoji reactions and the send button, which sometimes render in a row
   * separate from the reply box.
   * TODO: Verify the story reaction button labels.
   */
  storyQuickActions: [
    ...byAriaLabelButton([
      "Send a like",
      "Quick reactions",
      "React",
      "Send in Messenger",
      "Share",
      "Send",
    ]),
    'div[aria-label*="reaction" i][role="button"]',
  ],

  /**
   * Stable anchor beside the unlabeled "Send message…" field in the current
   * story viewer. It is safe only when combined with the /stories/ route gate.
   */
  storyReactionTray: [
    'div[role="dialog"][aria-label="Reactions"]',
    'div[role="dialog"][aria-label*="Reactions" i]',
  ],

  /* -------------------------------------------------------- chat widgets */

  /**
   * Header controls only a floating chat tab carries. "Minimize chat" is
   * confirmed against a live tab; exact labels keep the right-hand contacts
   * list and ordinary dialogs out of scope.
   */
  chatWidgetAnchors: [
    'div[role="button"][aria-label="Minimize chat"]',
    'div[role="button"][aria-label="Close chat"]',
    '[aria-label="Minimize chat"]',
    '[aria-label="Close chat"]',
  ],

  /**
   * The chat tab's own root. Messenger web sets its theme variables inline on
   * the tab (confirmed: `--mwp-header-button-color`).
   * TODO: Verify which element is the outermost `--mwp-` holder.
   */
  chatWidgetRoot: ['[style*="--mwp-"]', '[data-pagelet^="ChatTab"]'],

  /** A chat widget never contains these, so its ascent stops below them. */
  chatWidgetProtected: [
    '[role="main"]',
    '[role="banner"]',
    '[role="navigation"]',
    '[role="complementary"]',
    '[role="feed"]',
    "[aria-posinset]",
    'div[role="dialog"][aria-label="Reactions"]',
    '[aria-label="Next card"]',
    '[aria-label="Previous card"]',
  ],

  /**
   * Controls that must never be hidden. Every story ascent stops before an
   * ancestor containing one of these, which is what keeps navigation, closing,
   * pausing and the author link working.
   * TODO: Verify story navigation labels ("Next card" / "Previous card").
   */
  storyProtected: [
    ...byAriaLabel([
      "Next card",
      "Previous card",
      "Next",
      "Previous",
      "Close",
      "Pause",
      "Play",
      "Mute",
      "Unmute",
      "Sound",
      "Seek",
    ]),
    "video",
    'img[data-visualcompletion="media-vc-image"]',
    '[data-visualcompletion="media-vc-image"]',
    'a[href*="/stories/"]',
    'a[role="link"][href^="/"]:has(image)',
  ],

  /* --------------------------------------------------------------- focus */

  /** The page's centre column. Side columns are found as its siblings. */
  focusMain: ['div[role="main"]'],

  /**
   * Side columns beside the centre column. Confirmed live on the home feed:
   * `[role="navigation"][aria-label="Shortcuts"]` on the left and
   * `[role="complementary"]#right_rail_container` on the right, both direct
   * siblings of main. Requiring a sibling keeps the header's own navigation
   * and anything inside a dialog out of scope.
   */
  focusSidebars: ['[role="navigation"]', '[role="complementary"]'],

  /* --------------------------------------------------------------- posts */

  /**
   * Feed post container. Current feeds use aria-posinset; role="article" is
   * retained for older layouts and post dialogs.
   */
  postRoot: ["[aria-posinset]", 'div[role="article"]'],

  postLike: [
    '[data-ad-rendering-role="like_button"]',
    ...byAriaLabelButton(["Like", "Remove Like", "React"]),
  ],

  postComment: [
    '[data-ad-rendering-role="comment_button"]',
    ...byAriaLabelButton(["Comment", "Leave a comment", "Write a comment"]),
  ],

  postShare: [
    '[data-ad-rendering-role="share_button"]',
    ...byAriaLabelButton([
      "Share",
      "Send this to friends or post it on your profile",
    ]),
  ],

  postSend: [
    ...byAriaLabelButton(["Send", "Send in Messenger", "Share in Messenger"]),
  ],

  /**
   * Post content that must stay visible. Used as the guard when locating the
   * action bar, so an over-eager ascent can never swallow the post itself.
   */
  postContent: [
    '[data-ad-preview="message"]',
    '[data-ad-comet-preview="message"]',
    'div[role="article"] [role="article"]',
    'img[data-visualcompletion="media-vc-image"]',
    "video",
  ],
} as const satisfies Record<string, readonly string[]>;

/** Story routes are a dedicated URL, which is cheaper to test than the DOM. */
export function isStoryRoute(pathname: string): boolean {
  return pathname.startsWith("/stories/") || pathname.startsWith("/story.php");
}
