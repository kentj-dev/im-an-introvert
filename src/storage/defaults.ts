import { CHAT_RULE_KEYS, type ChatRules, type ExtensionSettings, type ProtectedChat } from '../shared/types';

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
  version: 2,
  facebook: {
    enabled: true,
    hideStoryActions: true,
    posts: {
      hideLike: false,
      hideComment: false,
      hideShare: false,
      hideSend: false,
      hideReactions: false,
      hideEntireActionBar: false,
    },
    messenger: {
      ...NO_CHAT_RULES,
      showDisabledNotice: true,
    },
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

/**
 * "Leave me alone mode": the recommended noise cleanup across every supported
 * platform. It never touches Messenger rules or protected chats — those are
 * about accidental clicks, not noise, and stay hand-tuned.
 */
export function applyLeaveMeAlone(draft: ExtensionSettings, enabled: boolean): void {
  draft.facebook.hideStoryActions = enabled;
  draft.facebook.posts.hideEntireActionBar = enabled;
}

export function matchesLeaveMeAlone(settings: ExtensionSettings): boolean {
  return settings.facebook.hideStoryActions && settings.facebook.posts.hideEntireActionBar;
}
