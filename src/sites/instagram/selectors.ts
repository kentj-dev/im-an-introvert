/**
 * Every Instagram selector the extension uses lives here. Same conventions as
 * the Facebook module: candidate lists built from durable attributes, never
 * generated class names, and a TODO on anything not pinned to a confirmed DOM
 * snapshot.
 *
 * Instagram differs from Facebook in one useful way: its controls are buttons
 * wrapping an `svg` that carries the accessible name, so selectors target the
 * button *through* its icon with `:has()`. Hiding the svg alone would leave a
 * clickable, invisible button behind — exactly the accident this extension is
 * supposed to prevent.
 */

/** Builds "the button that contains this icon" selectors for one label. */
function byIconLabel(names: readonly string[]): string[] {
  return names.flatMap((name) => {
    const escaped = name.replace(/"/g, '\\"');
    return [
      `button:has(svg[aria-label="${escaped}"])`,
      `div[role="button"]:has(svg[aria-label="${escaped}"])`,
      `button:has(svg[aria-label*="${escaped}" i])`,
      `div[role="button"]:has(svg[aria-label*="${escaped}" i])`,
      `[role="button"][aria-label="${escaped}"]`,
    ];
  });
}

export const instagramSelectors = {
  /* ------------------------------------------------------------- stories */

  /** TODO: Verify the story viewer container on the current Instagram DOM. */
  storyViewer: [
    'section:has(textarea[placeholder])',
    'div[role="dialog"]:has(video)',
    'main section',
    'main',
  ],

  /**
   * The story reply box. Anchor for the whole bottom bar.
   * TODO: Verify the story reply textarea placeholder.
   */
  storyReplyComposer: [
    'textarea[placeholder*="Reply" i]',
    'textarea[placeholder*="Send message" i]',
    'div[contenteditable="true"][role="textbox"]',
    'textarea[placeholder]',
  ],

  /**
   * Quick reactions and share controls next to the reply box.
   * TODO: Verify story action labels.
   */
  storyQuickActions: [
    ...byIconLabel(['Like', 'Unlike', 'Share', 'Send message', 'Direct']),
  ],

  /**
   * Must never be hidden: story navigation, playback, closing, the media, and
   * the author link.
   * TODO: Verify story navigation labels ("Next", "Go back").
   */
  storyProtected: [
    'svg[aria-label="Next"]',
    'svg[aria-label="Go back"]',
    'svg[aria-label="Close"]',
    'svg[aria-label*="Pause" i]',
    'svg[aria-label*="Play" i]',
    'svg[aria-label*="audio" i]',
    '[aria-label="Next"]',
    '[aria-label="Go back"]',
    '[aria-label="Close"]',
    'video',
    'img[srcset]',
    'a[href^="/"][role="link"]',
  ],

  /* --------------------------------------------------------------- posts */

  /** Feed posts and the post dialog are both `article` elements. */
  postRoot: ['article'],

  /**
   * Note: these also match the small like button on a comment, which is
   * intentional — it is still a like button. Action-bar detection requires two
   * actions in one container, so a lone comment like never looks like a bar.
   */
  postLike: [...byIconLabel(['Like', 'Unlike'])],
  postComment: [...byIconLabel(['Comment'])],
  postShare: [...byIconLabel(['Share Post', 'Share', 'Direct'])],
  postSave: [...byIconLabel(['Save', 'Remove'])],

  /** Post content that must stay visible; the guard for action-bar ascent. */
  postContent: ['img[srcset]', 'video', 'article header', 'ul', 'time'],
} as const satisfies Record<string, readonly string[]>;

/** Anything that looks like a post action, used to recognise the action bar. */
export const instagramPostActionCandidates: readonly string[] = [
  ...instagramSelectors.postLike,
  ...instagramSelectors.postComment,
  ...instagramSelectors.postShare,
  ...instagramSelectors.postSave,
];

export function isInstagramStoryRoute(pathname: string): boolean {
  return pathname.startsWith('/stories/');
}
