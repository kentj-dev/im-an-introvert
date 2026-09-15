import { FREE_LIMITS } from "../shared/constants";
import {
  CHAT_RULE_KEYS,
  type ChatRules,
  type ExtensionSettings,
  type LeaveMeAloneSnapshot,
  type ProtectedChat,
} from "../shared/types";
import {
  DEFAULT_CHAT_RULES,
  DEFAULT_SETTINGS,
  NO_CHAT_RULES,
  expireLeaveMeAlone,
  isLeaveMeAloneMode,
} from "./defaults";

export const CURRENT_VERSION = 3 as const;

/** Synced devices can disagree about the time by a few minutes. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

/** Reads the nine shared Messenger rules out of an unknown object. */
function readChatRules(
  source: Record<string, unknown>,
  fallback: ChatRules,
): ChatRules {
  return Object.fromEntries(
    CHAT_RULE_KEYS.map((key) => [key, bool(source[key], fallback[key])]),
  ) as ChatRules;
}

function normaliseChat(id: string, raw: unknown): ProtectedChat | null {
  if (!id) return null;
  const source = record(raw);
  const chat: ProtectedChat = {
    id,
    addedAt: typeof source.addedAt === "number" ? source.addedAt : Date.now(),
    ...readChatRules(source, DEFAULT_CHAT_RULES),
  };
  if (typeof source.name === "string" && source.name.trim())
    chat.name = source.name.trim();
  if (typeof source.subtitle === "string" && source.subtitle.trim()) {
    chat.subtitle = source.subtitle.trim();
  }
  return chat;
}

/**
 * A session end time. One further away than a single activation can reach was
 * not written by this extension, so it counts as already over.
 */
function readSessionEnd(raw: unknown, now: number): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return raw > now + FREE_LIMITS.leaveMeAloneMs + CLOCK_SKEW_MS ? now : raw;
}

function readSnapshot(raw: unknown): LeaveMeAloneSnapshot | null {
  if (typeof raw !== "object" || raw === null) return null;
  const source = record(raw);
  return {
    hideStoryActions: bool(source.hideStoryActions, false),
    hideEntireActionBar: bool(source.hideEntireActionBar, false),
    hideChatWidgets: bool(source.hideChatWidgets, false),
    blurSidebars: bool(source.blurSidebars, false),
    hideVoiceCall: bool(source.hideVoiceCall, false),
    hideVideoCall: bool(source.hideVideoCall, false),
    hideGroupActions: bool(source.hideGroupActions, false),
    hideChatField: bool(source.hideChatField, false),
  };
}

/**
 * Version 1 kept Messenger's only global under a top-level `messenger` key and
 * had no platforms. Moving it under `facebook.messenger` is the whole
 * migration to version 2; the v2 step below then lifts it back out.
 */
function migrateV1(source: Record<string, unknown>): Record<string, unknown> {
  const facebook = record(source.facebook);
  const legacyMessenger = record(source.messenger);
  return {
    ...source,
    version: 2,
    facebook: {
      ...facebook,
      messenger: {
        ...record(facebook.messenger),
        showDisabledNotice: bool(legacyMessenger.showDisabledNotice, true),
      },
    },
  };
}

/**
 * Version 2 kept Messenger inside Facebook: its rules under
 * `facebook.messenger`, switched on and off by Facebook's master switch.
 * Version 3 makes Messenger a platform of its own, so its rules move to the
 * top level and its new switch starts from whatever Facebook's was.
 */
function migrateV2(source: Record<string, unknown>): Record<string, unknown> {
  const facebook = record(source.facebook);
  return {
    ...source,
    version: CURRENT_VERSION,
    messenger: {
      ...record(facebook.messenger),
      enabled: bool(facebook.enabled, DEFAULT_SETTINGS.messenger.enabled),
    },
  };
}

/**
 * Turns whatever is in storage into a valid settings object.
 *
 * This is the migration seam: older versions are upgraded here before being
 * normalised. Unknown keys are dropped and missing keys fall back to
 * defaults, so a partially written or older object can never crash the popup
 * or a content script.
 */
export function parseSettings(raw: unknown): ExtensionSettings {
  const now = Date.now();
  let source = record(raw);
  if (source.version === 1) source = migrateV1(source);
  if (source.version === 2) source = migrateV2(source);

  const defaults = DEFAULT_SETTINGS;

  const facebook = record(source.facebook);
  const facebookPosts = record(facebook.posts);
  const messenger = record(source.messenger);

  const instagram = record(source.instagram);
  const instagramPosts = record(instagram.posts);

  const protectedChats: Record<string, ProtectedChat> = {};
  for (const [id, value] of Object.entries(record(source.protectedChats))) {
    const chat = normaliseChat(id, value);
    if (chat) protectedChats[id] = chat;
  }

  const session = record(source.leaveMeAlone);
  const until = readSessionEnd(session.until, now);

  const settings: ExtensionSettings = {
    version: CURRENT_VERSION,
    facebook: {
      enabled: bool(facebook.enabled, defaults.facebook.enabled),
      hideStoryActions: bool(
        facebook.hideStoryActions,
        defaults.facebook.hideStoryActions,
      ),
      hideChatWidgets: bool(
        facebook.hideChatWidgets,
        defaults.facebook.hideChatWidgets,
      ),
      blurSidebars: bool(facebook.blurSidebars, defaults.facebook.blurSidebars),
      // The individual Like/Comment/Share/Send/reaction switches were removed;
      // their stored keys are dropped here like any other unknown key.
      posts: {
        hideEntireActionBar: bool(
          facebookPosts.hideEntireActionBar,
          defaults.facebook.posts.hideEntireActionBar,
        ),
      },
    },
    messenger: {
      enabled: bool(messenger.enabled, defaults.messenger.enabled),
      ...readChatRules(messenger, NO_CHAT_RULES),
      showDisabledNotice: bool(
        messenger.showDisabledNotice,
        defaults.messenger.showDisabledNotice,
      ),
    },
    instagram: {
      enabled: bool(instagram.enabled, defaults.instagram.enabled),
      hideStoryActions: bool(
        instagram.hideStoryActions,
        defaults.instagram.hideStoryActions,
      ),
      posts: {
        hideLike: bool(
          instagramPosts.hideLike,
          defaults.instagram.posts.hideLike,
        ),
        hideComment: bool(
          instagramPosts.hideComment,
          defaults.instagram.posts.hideComment,
        ),
        hideShare: bool(
          instagramPosts.hideShare,
          defaults.instagram.posts.hideShare,
        ),
        hideSave: bool(
          instagramPosts.hideSave,
          defaults.instagram.posts.hideSave,
        ),
        hideEntireActionBar: bool(
          instagramPosts.hideEntireActionBar,
          defaults.instagram.posts.hideEntireActionBar,
        ),
      },
    },
    protectedChats,
    leaveMeAlone: {
      until,
      previous: until === null ? null : readSnapshot(session.previous),
    },
    leaveMeAloneMode: false,
  };

  // A session whose hour ran out ends here, on whichever read comes first.
  expireLeaveMeAlone(settings, now);

  // Derived, never trusted from storage: when the preset gains a setting, a
  // stored "on" would otherwise claim settings that are not actually in place.
  settings.leaveMeAloneMode = isLeaveMeAloneMode(settings, now);
  return settings;
}
