/**
 * The only module that talks to chrome.storage.sync.
 *
 * Everything lives under a single key so a change fires one onChanged event
 * that both the popup and every open tab can react to. Nothing here ever
 * leaves the browser profile.
 */
import { FREE_LIMITS, STORAGE_KEY } from "../shared/constants";
import { debug } from "../shared/debug";
import type {
  ExtensionSettings,
  PlatformId,
  ProtectedChat,
} from "../shared/types";
import {
  DEFAULT_SETTINGS,
  endLeaveMeAlone,
  isLeaveMeAloneMode,
  matchesLeaveMeAlone,
  startLeaveMeAlone,
} from "./defaults";
import { parseSettings } from "./schema";

export async function loadSettings(): Promise<ExtensionSettings> {
  try {
    const stored = await chrome.storage.sync.get(STORAGE_KEY);
    return parseSettings(stored[STORAGE_KEY]);
  } catch (error) {
    // Storage can be unavailable while the extension is reloading.
    debug("loadSettings failed, using defaults", error);
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
}

/**
 * Read, mutate a copy, write back. This is the single write path: callers pass
 * a mutator instead of each setting needing its own helper.
 */
export async function updateSettings(
  mutate: (draft: ExtensionSettings) => void,
): Promise<ExtensionSettings> {
  const current = await loadSettings();
  const draft = structuredClone(current);
  mutate(draft);
  // Switching off one of the preset's settings by hand ends a running session
  // without restoring anything, so the timer cannot later undo that choice.
  if (draft.leaveMeAlone.until !== null && !matchesLeaveMeAlone(draft)) {
    draft.leaveMeAlone = { until: null, previous: null };
  }
  // The preset switch reflects its settings rather than storing its own truth.
  draft.leaveMeAloneMode = isLeaveMeAloneMode(draft);
  await saveSettings(draft);
  return draft;
}

/**
 * Subscribes to settings changes. Fires for changes made anywhere: the popup,
 * another tab, or another signed-in device via storage sync.
 */
export function watchSettings(
  listener: (settings: ExtensionSettings) => void,
): () => void {
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ): void => {
    if (area !== "sync") return;
    const change = changes[STORAGE_KEY];
    if (!change) return;
    listener(parseSettings(change.newValue));
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}

/**
 * Calls `onExpire` once a time-limited setting runs out, so a page that stays
 * open re-reads its settings then instead of at the next storage write.
 * Returns a function that cancels the timer.
 */
export function onSettingsExpiry(
  settings: ExtensionSettings,
  onExpire: () => void,
): () => void {
  const { until } = settings.leaveMeAlone;
  if (until === null) return () => undefined;
  // A moment late, never early: parseSettings must already see the time as up.
  const timer = setTimeout(onExpire, Math.max(0, until - Date.now()) + 1_000);
  return () => clearTimeout(timer);
}

/* ---------------------------------------------------------------- helpers */

export function getProtectedChat(
  settings: ExtensionSettings,
  conversationId: string | null,
): ProtectedChat | null {
  if (!conversationId) return null;
  return settings.protectedChats[conversationId] ?? null;
}

export function listProtectedChats(
  settings: ExtensionSettings,
): ProtectedChat[] {
  return Object.values(settings.protectedChats).sort(
    (a, b) => a.addedAt - b.addedAt,
  );
}

export function canAddProtectedChat(settings: ExtensionSettings): boolean {
  return (
    Object.keys(settings.protectedChats).length < FREE_LIMITS.protectedChats
  );
}

export function addProtectedChat(
  chat: ProtectedChat,
): Promise<ExtensionSettings> {
  return updateSettings((draft) => {
    // Keep an existing configuration if the chat is already protected.
    if (draft.protectedChats[chat.id]) return;
    // The popup disables adding at the limit; this catches a second popup or
    // another synced device getting there first.
    if (!canAddProtectedChat(draft)) {
      throw new Error(
        `Protected chat limit of ${FREE_LIMITS.protectedChats} reached`,
      );
    }
    draft.protectedChats[chat.id] = chat;
  });
}

export function removeProtectedChat(id: string): Promise<ExtensionSettings> {
  return updateSettings((draft) => {
    delete draft.protectedChats[id];
  });
}

export function patchProtectedChat(
  id: string,
  patch: Partial<Omit<ProtectedChat, "id">>,
): Promise<ExtensionSettings> {
  return updateSettings((draft) => {
    const chat = draft.protectedChats[id];
    if (!chat) return;
    draft.protectedChats[id] = { ...chat, ...patch, id };
  });
}

export function setLeaveMeAloneMode(
  enabled: boolean,
): Promise<ExtensionSettings> {
  return updateSettings((draft) => {
    if (enabled) startLeaveMeAlone(draft);
    else endLeaveMeAlone(draft);
  });
}

/** Restores one platform's options to their defaults, keeping the rest. */
export function resetPlatform(
  platform: PlatformId,
): Promise<ExtensionSettings> {
  return updateSettings((draft) => {
    switch (platform) {
      case "facebook":
        draft.facebook = structuredClone(DEFAULT_SETTINGS.facebook);
        break;
      case "messenger":
        draft.messenger = structuredClone(DEFAULT_SETTINGS.messenger);
        break;
      case "instagram":
        draft.instagram = structuredClone(DEFAULT_SETTINGS.instagram);
        break;
    }
  });
}

/** Wipes every setting, including protected chats. */
export function resetAllSettings(): Promise<ExtensionSettings> {
  return updateSettings((draft) => {
    Object.assign(draft, structuredClone(DEFAULT_SETTINGS));
  });
}
