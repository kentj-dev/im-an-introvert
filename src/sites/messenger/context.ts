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
} from "../../shared/types";
import { getProtectedChat } from "../../storage/storage";
import { queryAll } from "../shared/query";
import { queryFloatingThreadRoots } from "./floating";
import { getMessengerConversationId, isMessengerRoute } from "./router";
import { messengerSelectors } from "./selectors";

export interface MessengerContext {
  settings: ExtensionSettings;
  conversationId: string | null;
  /** null when this conversation has no protected-chat record. */
  chat: ProtectedChat | null;
  /** The effective rules: global OR per-chat, and all off if Facebook is off. */
  rules: ChatRules;
  showNotice: boolean;
  /** Full-page conversation panes and Facebook's floating chat widgets. */
  threadRoots: HTMLElement[];
  /** True on messenger.com or a facebook.com/messages route. */
  onMessengerRoute: boolean;
}

export function resolveChatRules(
  globals: ChatRules,
  chat: ProtectedChat | null,
  enabled: boolean,
): ChatRules {
  return Object.fromEntries(
    CHAT_RULE_KEYS.map((key) => [
      key,
      enabled && (globals[key] || chat?.[key] === true),
    ]),
  ) as ChatRules;
}

export function resolveMessengerContext(
  settings: ExtensionSettings,
): MessengerContext {
  // Messenger is its own platform with its own switch, even on facebook.com.
  const enabled = settings.messenger.enabled;
  const conversationId = getMessengerConversationId(location);
  const chat = getProtectedChat(settings, conversationId);
  const globals = settings.messenger;
  const onMessengerRoute = isMessengerRoute(location);
  const threadRoots = new Set<HTMLElement>();

  if (onMessengerRoute) {
    for (const root of queryAll(document, messengerSelectors.threadRoot))
      threadRoots.add(root);
  }
  for (const root of queryFloatingThreadRoots()) threadRoots.add(root);

  return {
    settings,
    conversationId,
    chat,
    rules: resolveChatRules(globals, chat, enabled),
    showNotice: enabled && globals.showDisabledNotice,
    threadRoots: [...threadRoots],
    onMessengerRoute,
  };
}
