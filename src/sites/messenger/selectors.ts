/**
 * Every Messenger selector lives here. See the header of
 * src/sites/facebook/selectors.ts for the candidate-list convention and the
 * procedure for fixing a selector that stopped matching.
 *
 * Messenger labels vary by locale, by surface (facebook.com/messages versus
 * messenger.com) and by rollout, so each entry lists several accessible names.
 * Anything that fails to match simply results in no change.
 */
import { byAriaLabel, byAriaLabelButton } from "../shared/query";

export const messengerSelectors = {
  /**
   * The conversation pane. Used to scope queries away from the chat list, so a
   * protected chat's rules can never affect the sidebar.
   */
  threadRoot: ['div[role="main"]', 'div[role="main"][aria-label]'],

  /** Floating Facebook chat tabs, which live outside the main Messenger pane. */
  floatingThreadRoot: [
    '[style*="--mwp-message-list"]',
    '[style*="--mwp-primary-theme-color"]',
    '[data-pagelet^="ChatTab"]',
    'div[role="dialog"]:has([aria-label*="Close chat" i])',
    'div[role="dialog"]:has([aria-label*="Minimize chat" i])',
    'div[role="dialog"]:has([aria-label*="voice call" i])',
    'div[role="dialog"]:has([aria-label*="audio call" i])',
    'div[role="dialog"]:has([aria-label*="video call" i])',
    'div[role="dialog"]:has(div[role="grid"])',
    'div[role="dialog"]:has(div[role="log"])',
    'div[role="dialog"]:has([contenteditable="true"][role="textbox"])',
  ],

  /**
   * Never hide these: the message list and history.
   * TODO: Verify the message list role on the current Messenger build.
   */
  messageList: [
    'div[role="grid"]',
    'div[role="log"]',
    'div[role="list"]',
    ...byAriaLabel(["Messages", "Message list", "Conversation"]),
  ],

  /* --------------------------------------------------------------- calls */

  /** TODO: Verify voice call labels against the current Messenger header. */
  voiceCallButton: [
    ...byAriaLabelButton([
      "Start a voice call",
      "Start voice call",
      "Voice call",
      "Audio call",
      "Start a call",
    ]),
    // Note: a bare "Call" is deliberately not listed. As a substring it also
    // matches "Video call", which would hide the video button when only the
    // voice rule is on.
  ],

  /** TODO: Verify video call labels against the current Messenger header. */
  videoCallButton: [
    ...byAriaLabelButton([
      "Start a video call",
      "Start video call",
      "Video call",
      "Video chat",
    ]),
  ],

  /* ------------------------------------------------------- group actions */

  /**
   * Prominent group management controls. These are the buttons that turn a
   * misclick into a notification for everyone in a work chat.
   * TODO: Verify group action labels, especially in the chat info panel.
   */
  groupActions: [
    ...byAriaLabelButton([
      "Add people",
      "Add people to conversation",
      "Add members",
      "Add to group",
      "Create a group",
      "Create group chat",
      "Start a group call",
      "Manage members",
      "Remove member",
      "Make admin",
      "Leave chat",
      "Leave group",
    ]),
  ],

  /* -------------------------------------------------------- chat field */

  /**
   * The message composer. Everything composer related is anchored to this
   * textbox: the cleaner ascends from here to find the composer row, and each
   * button lookup is scoped inside it.
   * TODO: Verify the composer aria-label ("Message", "Aa", localized).
   */
  /**
   * The whole composer, including the button rows either side of the text box.
   *
   * This is the preferred target for "hide chat field": ascending from the
   * textbox stops at whichever wrapper holds the input, which leaves the
   * attachment, sticker and GIF buttons sitting there on their own.
   *
   * Confirmed against a live Messenger DOM: the region carries both a role and
   * an aria-label, which is about as stable as Facebook markup gets.
   */
  composerRegion: [
    'div[role="region"][aria-label="Thread composer"]',
    'div[role="region"][aria-label*="composer" i]',
    'div[aria-label="Thread composer"]',
  ],

  composerTextbox: [
    // Messenger's composer is a Lexical editor; that attribute has outlived
    // several redesigns. Every candidate here is deliberately an editable
    // textbox, so a loose aria-label match can never select a whole pane.
    'div[contenteditable="true"][data-lexical-editor="true"]',
    'div[role="textbox"][aria-label*="Message" i]',
    'div[contenteditable="true"][aria-label*="Message" i]',
    'div[role="textbox"][contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]',
  ],

  /**
   * Things a composer row never contains. The ascent from the text box stops
   * below any ancestor holding one: the conversation header and its call
   * buttons, a chat tab's window controls, message rows, or the whole pane.
   */
  composerStops: [
    "h1",
    "h2",
    '[role="heading"]',
    '[role="row"]',
    '[role="gridcell"]',
    '[role="article"]',
    '[role="main"]',
    '[aria-label="Minimize chat"]',
    '[aria-label="Close chat"]',
    '[aria-label*="voice call" i]',
    '[aria-label*="audio call" i]',
    '[aria-label*="video call" i]',
  ],

  /** TODO: Verify attachment / photo / file button labels. */
  attachmentButtons: [
    ...byAriaLabelButton([
      "Attach a file",
      "Attach files",
      "Attach a photo or video",
      "Choose a file to upload",
      "Open photos and videos",
      "Add files",
      "Attach",
      "Upload",
    ]),
  ],

  /** TODO: Verify emoji button label. */
  emojiButton: [
    ...byAriaLabelButton(["Choose an emoji", "Open emoji keyboard", "Emoji"]),
  ],

  /** TODO: Verify GIF button label. */
  gifButton: [
    ...byAriaLabelButton(["Choose a GIF", "Choose a GIF or sticker", "GIF"]),
  ],

  /** TODO: Verify sticker button label. */
  stickerButton: [
    ...byAriaLabelButton(["Choose a sticker", "Open stickers", "Sticker"]),
  ],

  /**
   * The one-tap thumbs up next to the composer.
   * TODO: Verify quick-like label; it is "Send a like" on most builds.
   */
  likeButton: [
    ...byAriaLabelButton([
      "Send a like",
      "Send a thumbs up",
      "Like",
      "Thumbs up",
    ]),
  ],

  /**
   * A chat with a custom quick reaction labels the button with its emoji
   * instead (confirmed live: aria-label="Send a 💋"). The emoji differs per
   * chat, so this prefix is only a pre-filter; QUICK_REACTION_LABEL decides.
   */
  quickReactionButton: [
    'div[role="button"][aria-label^="Send a" i]',
    '[role="button"][aria-label^="Send a" i]',
    'button[aria-label^="Send a" i]',
  ],

  /* -------------------------------------------------------------- labels */

  /**
   * Conversation title in the thread header, read only to suggest a display
   * name in the popup. Never message content.
   * TODO: Verify the heading element used for the conversation title.
   */
  conversationTitle: [
    'div[role="main"] h1',
    'div[role="main"] h2',
    'div[role="main"] [role="heading"]',
  ],
} as const satisfies Record<string, readonly string[]>;

/**
 * "Send a" followed by an emoji and nothing else. No letters are allowed after
 * the prefix, so a label such as "Send a voice clip" never qualifies; emoji
 * sequences (skin tones, ZWJ joins, variation selectors) contain no letters.
 */
export const QUICK_REACTION_LABEL = /^send an?\s+\P{L}+$/iu;

/** Scopes the cosmetic rules below; both are stable landmarks. */
export const messengerScopes = {
  /** The open conversation, never the chat list. */
  thread: 'div[role="main"]',
  composer: 'div[role="region"][aria-label="Thread composer"]',
} as const;

/**
 * Selectors for the pre-paint stylesheet (see sites/shared/cosmetic.ts).
 *
 * These are deliberately a tight subset of the candidate lists above: a
 * cosmetic rule runs with no scoping logic and no guards, so only exact,
 * high-confidence selectors belong here. Everything fuzzy stays in the
 * candidate lists and is handled by the JS pass, which can scope and verify.
 * A label that is missing here still gets hidden, just one frame later.
 */
export const messengerCosmetic = {
  voiceCall: [
    '[aria-label="Start a voice call"]',
    '[aria-label="Voice call"]',
    '[aria-label="Audio call"]',
  ],
  videoCall: ['[aria-label="Start a video call"]', '[aria-label="Video call"]'],
  groupActions: [
    '[aria-label="Add people"]',
    '[aria-label="Add people to conversation"]',
    '[aria-label="Add members"]',
    '[aria-label="Create a group"]',
    '[aria-label="Start a group call"]',
  ],
  attachments: [
    '[aria-label="Attach a file"]',
    '[aria-label="Attach files"]',
    '[aria-label="Attach a photo or video"]',
    '[aria-label="Choose a file to upload"]',
    '[aria-label="Open photos and videos"]',
  ],
  emoji: [
    '[aria-label="Choose an emoji"]',
    '[aria-label="Open emoji keyboard"]',
  ],
  gif: [
    '[aria-label="Choose a GIF"]',
    '[aria-label="Choose a GIF or sticker"]',
  ],
  sticker: ['[aria-label="Choose a sticker"]', '[aria-label="Open stickers"]'],
  like: ['[aria-label="Send a like"]', '[aria-label="Send a thumbs up"]'],
} as const satisfies Record<string, readonly string[]>;
