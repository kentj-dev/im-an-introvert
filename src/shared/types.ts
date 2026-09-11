/** Shared types for settings, protected chats and extension messaging. */

/** Sites the extension knows how to clean. Add one here and in PLATFORMS. */
export type PlatformId = 'facebook' | 'instagram';

/**
 * The Messenger rules that exist both globally and per conversation.
 *
 * One list keeps the two in sync: a global switch hides a control in every
 * conversation, and a protected chat can hide it in that chat alone. The
 * effective value is `global || perChat`.
 */
export const CHAT_RULE_KEYS = [
  'hideVoiceCall',
  'hideVideoCall',
  'hideGroupActions',
  'hideChatField',
  'hideAttachments',
  'hideEmojiButton',
  'hideGifButton',
  'hideStickerButton',
  'hideLikeButton',
] as const;

export type ChatRuleKey = (typeof CHAT_RULE_KEYS)[number];
export type ChatRules = { [K in ChatRuleKey]: boolean };

/**
 * A protected conversation. `id` is the Messenger conversation id from the
 * URL and is the only real identifier; `name` and `subtitle` are cosmetic
 * labels shown in the popup.
 */
export interface ProtectedChat extends ChatRules {
  id: string;
  name?: string;
  /** e.g. "6 members" — a cached label, never message content. */
  subtitle?: string;
  /** Epoch ms, used only to keep the popup list in a stable order. */
  addedAt: number;
}

export interface MessengerSettings extends ChatRules {
  /**
   * Show a small "messaging disabled" line where the composer used to be, so
   * a hidden chat field does not look like a broken page.
   */
  showDisabledNotice: boolean;
}

export interface FacebookPostSettings {
  hideLike: boolean;
  hideComment: boolean;
  hideShare: boolean;
  hideSend: boolean;
  hideReactions: boolean;
  hideEntireActionBar: boolean;
}

export interface FacebookSettings {
  /** Master switch for the whole platform. */
  enabled: boolean;
  hideStoryActions: boolean;
  posts: FacebookPostSettings;
  messenger: MessengerSettings;
}

export interface InstagramPostSettings {
  hideLike: boolean;
  hideComment: boolean;
  hideShare: boolean;
  hideSave: boolean;
  hideEntireActionBar: boolean;
}

export interface InstagramSettings {
  enabled: boolean;
  hideStoryActions: boolean;
  posts: InstagramPostSettings;
}

export interface ExtensionSettings {
  version: 2;
  facebook: FacebookSettings;
  instagram: InstagramSettings;
  protectedChats: Record<string, ProtectedChat>;
  leaveMeAloneMode: boolean;
}

/**
 * Local-only counters behind the popup's Quick Stats. Stored in
 * chrome.storage.local (never synced), reset every day, and holding nothing
 * but two numbers — no URLs, no per-site breakdown, no history.
 */
export interface UsageStats {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  hiddenCount: number;
  activeSeconds: number;
}

/** Messages between content scripts, the popup and the service worker. */
export const MESSAGES = {
  /** Popup -> content script: which conversation are you showing? */
  getChatInfo: 'introvert:get-chat-info',
  /** Content script -> worker: counters to fold into today's stats. */
  reportUsage: 'introvert:report-usage',
} as const;

export interface ChatInfoResponse {
  conversationId: string | null;
  /** Conversation title from the thread heading or document title. */
  name?: string;
  /** A count-like label such as "6 members", when one can be read safely. */
  subtitle?: string;
}

export interface UsageReport {
  type: typeof MESSAGES.reportUsage;
  /** Elements newly hidden since the last report. */
  hidden: number;
  /** Seconds the page was visible since the last report. */
  seconds: number;
}
