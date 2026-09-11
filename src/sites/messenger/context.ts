/**
 * Resolves "what is on screen right now" for the Messenger cleaners: which
 * conversation, which rules apply to it, and the pane to scope queries to.
 *
 * Two layers decide what gets hidden, and a rule wins if either says so:
 *   - global Messenger settings, which apply to every conversation
 *   - the protected chat record for this conversation, if there is one
 */
import {
  CHAT_RULE_KEYS,
  type ChatRules,
  type ExtensionSettings,
  type ProtectedChat,
} from '../../shared/types';
import { getProtectedChat } from '../../storage/storage';
import { queryOne } from '../shared/query';
import { getMessengerConversationId } from './router';
import { messengerSelectors } from './selectors';

export interface MessengerContext {
  settings: ExtensionSettings;
  conversationId: string | null;
  /** null when this conversation has no protected-chat record. */
  chat: ProtectedChat | null;
  /** The effective rules: global OR per-chat, and all off if Facebook is off. */
  rules: ChatRules;
  showNotice: boolean;
  /** The conversation pane; queries are scoped here, never document-wide. */
  threadRoot: HTMLElement | null;
}

export function resolveChatRules(
  globals: ChatRules,
  chat: ProtectedChat | null,
  enabled: boolean,
): ChatRules {
  return Object.fromEntries(
    CHAT_RULE_KEYS.map((key) => [key, enabled && (globals[key] || chat?.[key] === true)]),
  ) as ChatRules;
}

export function resolveMessengerContext(settings: ExtensionSettings): MessengerContext {
  // Messenger lives inside the Facebook platform, so it follows that switch.
  const enabled = settings.facebook.enabled;
  const conversationId = getMessengerConversationId(location);
  const chat = getProtectedChat(settings, conversationId);
  const globals = settings.facebook.messenger;

  return {
    settings,
    conversationId,
    chat,
    rules: resolveChatRules(globals, chat, enabled),
    showNotice: enabled && globals.showDisabledNotice,
    threadRoot: queryOne(document, messengerSelectors.threadRoot),
  };
}
