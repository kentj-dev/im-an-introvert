/** Constants shared by the content scripts, popup and background worker. */

/**
 * Public source. Surfaced in the popup so anyone can audit what the extension
 * does rather than taking the privacy claims on trust.
 */
export const REPO_URL = "https://github.com/kentj-dev/im-an-introvert";

/** The maker's site, linked from the popup's About view. */
export const MAKER_URL = "https://apps.hamiken.com";

/** Shown once after a fresh extension install. */
export const THANK_YOU_URL =
  "https://apps.hamiken.com/apps/im-an-introvert/thank-you";

/** Single `chrome.storage.sync` key holding the whole settings object. */
export const STORAGE_KEY = "introvertSettings";

/** `chrome.storage.local` key for today's Quick Stats counters. */
export const STATS_KEY = "introvertStats";

/**
 * Elements are hidden by marking them, never by removing them, so a setting
 * can be switched off and the original UI reappears instantly.
 * See src/styles/content.css for the matching rules.
 */
export const HIDDEN_ATTR = "data-introvert-hidden";

/**
 * Space separated list of rule keys currently hiding an element. An element
 * stays hidden while at least one rule claims it (e.g. "Hide Like" and "Hide
 * entire action bar" can both apply).
 */
export const RULES_ATTR = "data-introvert-rules";

/**
 * Marks the element that should render the small "messaging disabled" note.
 * The note is drawn with a CSS ::after pseudo-element rather than an injected
 * node, so nothing is ever added to a React-managed child list.
 */
export const NOTICE_ATTR = "data-introvert-notice";

/**
 * Marks a hidden post action bar that should show its "interactions disabled"
 * note in place of the buttons. Only has an effect alongside HIDDEN_ATTR.
 */
export const POST_NOTICE_ATTR = "data-introvert-post-notice";

/**
 * Rule keys. Kept in one place so the values that end up in the DOM are
 * stable and easy to grep for while debugging a live page.
 */
export const RULES = {
  storyActions: "story-actions",
  postActionBar: "post-bar",
  chatWidgets: "chat-widgets",

  messengerVoiceCall: "mx-voice",
  messengerVideoCall: "mx-video",
  messengerGroupActions: "mx-group",
  messengerComposer: "mx-composer",
  messengerAttachments: "mx-attach",
  messengerEmoji: "mx-emoji",
  messengerGif: "mx-gif",
  messengerSticker: "mx-sticker",
  messengerLike: "mx-like",

  igStoryActions: "ig-story-actions",
  igPostActionBar: "ig-post-bar",
  igPostLike: "ig-post-like",
  igPostComment: "ig-post-comment",
  igPostShare: "ig-post-share",
  igPostSave: "ig-post-save",
} as const;

export type RuleKey = (typeof RULES)[keyof typeof RULES];

/** How long to wait after DOM churn before re-running the cleanup pass. */
export const CLEANUP_DEBOUNCE_MS = 120;

/** Fallback interval for SPA route detection. See sites/shared/route.ts. */
export const ROUTE_POLL_MS = 500;

/** How often a content script folds its counters into today's stats. */
export const USAGE_FLUSH_MS = 20_000;

/**
 * Limits of the free version. Kept in one place so a premium plan can lift
 * them without hunting through the popup and storage code.
 */
export const FREE_LIMITS = {
  /** How many conversations can be protected. */
  protectedChats: 10,
  /** How long Leave me alone mode stays on before it switches itself off. */
  leaveMeAloneMs: 60 * 60 * 1000,
} as const;
