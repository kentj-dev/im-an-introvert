import { FREE_LIMITS } from '../shared/constants';
import {
  CHAT_RULE_KEYS,
  type ChatRules,
  type ExtensionSettings,
  type LeaveMeAloneSnapshot,
  type ProtectedChat,
} from '../shared/types';

const chatRules = (value: boolean): ChatRules =>
  Object.fromEntries(CHAT_RULE_KEYS.map((key) => [key, value])) as ChatRules;

/**
 * Global Messenger rules start off: hiding a call button in *every*
 * conversation is opt-in, because the point of the feature is the one work
 * group chat, not all of Messenger.
 */
export const NO_CHAT_RULES: ChatRules = chatRules(false);

/**
 * Defaults for a chat the user has just protected. These are the recommended
 * settings: calls and group actions hidden, because those are the buttons
 * people regret touching, while the chat field stays usable.
 */
export const DEFAULT_CHAT_RULES: ChatRules = {
  ...chatRules(false),
  hideVoiceCall: true,
  hideVideoCall: true,
  hideGroupActions: true,
  hideAttachments: true,
  hideGifButton: true,
  hideStickerButton: true,
  hideLikeButton: true,
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  version: 3,
  facebook: {
    enabled: true,
    hideStoryActions: true,
    hideChatWidgets: false,
    posts: {
      hideEntireActionBar: false,
    },
  },
  messenger: {
    enabled: true,
    ...NO_CHAT_RULES,
    showDisabledNotice: true,
  },
  instagram: {
    enabled: true,
    hideStoryActions: true,
    posts: {
      hideLike: false,
      hideComment: false,
      hideShare: false,
      hideSave: false,
      hideEntireActionBar: false,
    },
  },
  protectedChats: {},
  leaveMeAlone: { until: null, previous: null },
  leaveMeAloneMode: false,
};

export function createProtectedChat(
  id: string,
  labels: { name?: string; subtitle?: string } = {},
): ProtectedChat {
  const chat: ProtectedChat = {
    id,
    addedAt: Date.now(),
    ...DEFAULT_CHAT_RULES,
  };
  if (labels.name) chat.name = labels.name;
  if (labels.subtitle) chat.subtitle = labels.subtitle;
  return chat;
}

/* ------------------------------------------------------ leave me alone */

/*
 * "Leave me alone mode": the recommended cleanup across every supported
 * platform — Facebook's Story actions, post action bar and floating chat
 * widgets, plus Messenger's global call, group action and chat field rules.
 * Protected chats keep their own records; the global rules simply apply on top
 * of them.
 *
 * Each activation lasts FREE_LIMITS.leaveMeAloneMs. The values it replaces are
 * kept, and put back when the session ends, whether the timer or the user
 * ends it.
 */

function readLeaveMeAlone(settings: ExtensionSettings): LeaveMeAloneSnapshot {
  return {
    hideStoryActions: settings.facebook.hideStoryActions,
    hideEntireActionBar: settings.facebook.posts.hideEntireActionBar,
    hideChatWidgets: settings.facebook.hideChatWidgets,
    hideVoiceCall: settings.messenger.hideVoiceCall,
    hideVideoCall: settings.messenger.hideVideoCall,
    hideGroupActions: settings.messenger.hideGroupActions,
    hideChatField: settings.messenger.hideChatField,
  };
}

function writeLeaveMeAlone(draft: ExtensionSettings, values: LeaveMeAloneSnapshot): void {
  draft.facebook.hideStoryActions = values.hideStoryActions;
  draft.facebook.posts.hideEntireActionBar = values.hideEntireActionBar;
  draft.facebook.hideChatWidgets = values.hideChatWidgets;
  draft.messenger.hideVoiceCall = values.hideVoiceCall;
  draft.messenger.hideVideoCall = values.hideVideoCall;
  draft.messenger.hideGroupActions = values.hideGroupActions;
  draft.messenger.hideChatField = values.hideChatField;
}

const ALL_ON: LeaveMeAloneSnapshot = {
  hideStoryActions: true,
  hideEntireActionBar: true,
  hideChatWidgets: true,
  hideVoiceCall: true,
  hideVideoCall: true,
  hideGroupActions: true,
  hideChatField: true,
};

export function matchesLeaveMeAlone(settings: ExtensionSettings): boolean {
  return Object.values(readLeaveMeAlone(settings)).every(Boolean);
}

export function isLeaveMeAloneRunning(settings: ExtensionSettings, now = Date.now()): boolean {
  const { until } = settings.leaveMeAlone;
  return until !== null && until > now;
}

/** What the popup switch shows: a running session whose settings are all on. */
export function isLeaveMeAloneMode(settings: ExtensionSettings, now = Date.now()): boolean {
  return isLeaveMeAloneRunning(settings, now) && matchesLeaveMeAlone(settings);
}

export function startLeaveMeAlone(draft: ExtensionSettings, now = Date.now()): void {
  // Already on: keep the original snapshot and the original end time.
  if (isLeaveMeAloneRunning(draft, now)) return;
  draft.leaveMeAlone = {
    until: now + FREE_LIMITS.leaveMeAloneMs,
    previous: readLeaveMeAlone(draft),
  };
  writeLeaveMeAlone(draft, ALL_ON);
}

/** Ends a session and puts back what the user had before it started. */
export function endLeaveMeAlone(draft: ExtensionSettings): void {
  if (draft.leaveMeAlone.until === null) return;
  const previous = draft.leaveMeAlone.previous;
  if (previous) writeLeaveMeAlone(draft, previous);
  draft.leaveMeAlone = { until: null, previous: null };
}

/**
 * Ends a session whose time is up. Runs on every settings read, so the mode
 * switches off even if nothing was open when the hour ran out.
 */
export function expireLeaveMeAlone(settings: ExtensionSettings, now = Date.now()): void {
  const { until } = settings.leaveMeAlone;
  if (until !== null && until <= now) endLeaveMeAlone(settings);
}
