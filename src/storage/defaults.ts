import {
  CHAT_RULE_KEYS,
  type ChatRuleKey,
  type ChatRules,
  type ExtensionSettings,
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

/** Global Messenger rules the preset switches: calls, group actions, the field. */
const LEAVE_ME_ALONE_MESSENGER_RULES: readonly ChatRuleKey[] = [
  'hideVoiceCall',
  'hideVideoCall',
  'hideGroupActions',
  'hideChatField',
];

/**
 * "Leave me alone mode": the recommended cleanup across every supported
 * platform — Facebook's Story actions, post action bar and floating chat
 * widgets, plus Messenger's global call, group action and chat field rules.
 * Protected chats keep their own records; the global rules simply apply on top
 * of them.
 */
export function applyLeaveMeAlone(draft: ExtensionSettings, enabled: boolean): void {
  draft.facebook.hideStoryActions = enabled;
  draft.facebook.posts.hideEntireActionBar = enabled;
  draft.facebook.hideChatWidgets = enabled;
  for (const key of LEAVE_ME_ALONE_MESSENGER_RULES) draft.messenger[key] = enabled;
}

export function matchesLeaveMeAlone(settings: ExtensionSettings): boolean {
  return (
    settings.facebook.hideStoryActions &&
    settings.facebook.posts.hideEntireActionBar &&
    settings.facebook.hideChatWidgets &&
    LEAVE_ME_ALONE_MESSENGER_RULES.every((key) => settings.messenger[key])
  );
}
