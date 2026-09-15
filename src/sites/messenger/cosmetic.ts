/**
 * Builds the pre-paint stylesheet for Messenger.
 *
 * This depends only on the settings and the conversation ID in the URL, never
 * on the DOM, which is the point: it can be written the moment the route
 * changes, before Messenger has mounted the new conversation. The controls for
 * a protected chat are then never painted, rather than painted and removed.
 */
import type { ChatRules } from "../../shared/types";
import { scoped } from "../shared/cosmetic";
import { messengerCosmetic, messengerScopes } from "./selectors";
import type { MessengerContext } from "./context";

type RuleSelectors = Partial<Record<keyof ChatRules, readonly string[]>>;

/** Rules whose controls live in the conversation header or its menus. */
const THREAD_RULES: RuleSelectors = {
  hideVoiceCall: messengerCosmetic.voiceCall,
  hideVideoCall: messengerCosmetic.videoCall,
  hideGroupActions: messengerCosmetic.groupActions,
};

/** Rules whose controls live inside the composer. */
const COMPOSER_RULES: RuleSelectors = {
  hideAttachments: messengerCosmetic.attachments,
  hideEmojiButton: messengerCosmetic.emoji,
  hideGifButton: messengerCosmetic.gif,
  hideStickerButton: messengerCosmetic.sticker,
  hideLikeButton: messengerCosmetic.like,
};

export function messengerCosmeticSelectors(
  context: MessengerContext,
): string[] {
  const rules = context.rules;
  const selectors: string[] = [];

  // Hiding the whole composer covers every button inside it, so the
  // per-button rules become redundant.
  if (rules.hideChatField) {
    selectors.push(messengerScopes.composer);
  } else {
    for (const [rule, candidates] of Object.entries(COMPOSER_RULES)) {
      if (rules[rule as keyof ChatRules] && candidates) {
        selectors.push(...scoped(messengerScopes.composer, candidates));
      }
    }
  }

  for (const [rule, candidates] of Object.entries(THREAD_RULES)) {
    if (rules[rule as keyof ChatRules] && candidates) {
      selectors.push(...scoped(messengerScopes.thread, candidates));
    }
  }

  return selectors;
}
