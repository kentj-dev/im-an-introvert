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
import { byAriaLabel, byAriaLabelButton } from '../shared/query';

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
    'div[role="textbox"][aria-label*="Reply" i]',
    'div[contenteditable="true"][aria-label*="Reply" i]',
    'textarea[placeholder*="Reply" i]',
    'form [role="textbox"]',
    ...byAriaLabel(['Write a reply', 'Reply to story', 'Send message']),
  ],

  /**
   * Quick emoji reactions and the send button, which sometimes render in a row
   * separate from the reply box.
   * TODO: Verify the story reaction button labels.
   */
  storyQuickActions: [
    ...byAriaLabelButton([
      'Send a like',
      'Quick reactions',
      'React',
      'Send in Messenger',
      'Share',
      'Send',
    ]),
    'div[aria-label*="reaction" i][role="button"]',
  ],

  /**
   * Controls that must never be hidden. Every story ascent stops before an
   * ancestor containing one of these, which is what keeps navigation, closing,
   * pausing and the author link working.
   * TODO: Verify story navigation labels ("Next card" / "Previous card").
   */
  storyProtected: [
    ...byAriaLabel([
      'Next card',
      'Previous card',
      'Next',
      'Previous',
      'Close',
      'Pause',
      'Play',
      'Mute',
      'Unmute',
      'Sound',
      'Seek',
    ]),
    'video',
    'img[data-visualcompletion="media-vc-image"]',
    '[data-visualcompletion="media-vc-image"]',
    'a[href*="/stories/"]',
    'a[role="link"][href^="/"]:has(image)',
  ],

  /* --------------------------------------------------------------- posts */

  /** Feed post container. Comments are nested articles and get filtered out. */
  postRoot: ['div[role="article"]'],

  postLike: [
    '[data-ad-rendering-role="like_button"]',
    ...byAriaLabelButton(['Like', 'Remove Like', 'React']),
  ],

  postComment: [
    '[data-ad-rendering-role="comment_button"]',
    ...byAriaLabelButton(['Comment', 'Leave a comment', 'Write a comment']),
  ],

  postShare: [
    '[data-ad-rendering-role="share_button"]',
    ...byAriaLabelButton(['Share', 'Send this to friends or post it on your profile']),
  ],

  postSend: [...byAriaLabelButton(['Send', 'Send in Messenger', 'Share in Messenger'])],

  /**
   * Reaction controls: the hover picker and any inline reaction strip. This is
   * about the controls, not the reaction counts, which stay visible.
   * TODO: Verify the reaction picker container on the current UI.
   */
  postReactions: [
    'div[role="dialog"][aria-label*="Reaction" i]',
    '[aria-label*="Reaction" i][role="toolbar"]',
    ...byAriaLabel(['Leave a reaction', 'Reactions']),
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
    'video',
    'a[role="link"] strong',
  ],
} as const satisfies Record<string, readonly string[]>;

/** Anything that looks like a post action, used to recognise the action bar. */
export const postActionCandidates: readonly string[] = [
  ...facebookSelectors.postLike,
  ...facebookSelectors.postComment,
  ...facebookSelectors.postShare,
  ...facebookSelectors.postSend,
];

/** Story routes are a dedicated URL, which is cheaper to test than the DOM. */
export function isStoryRoute(pathname: string): boolean {
  return pathname.startsWith('/stories/') || pathname.startsWith('/story.php');
}
