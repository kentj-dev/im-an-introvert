import { useCallback, useEffect, useState } from "react";
import { debug } from "@/shared/debug";
import type { ExtensionSettings } from "@/shared/types";
import { parseSettings } from "@/storage/schema";
import {
  loadSettings,
  onSettingsExpiry,
  updateSettings,
  watchSettings,
} from "@/storage/storage";

const SAVE_ERROR = "That change could not be saved. Please try again.";

export interface UseSettings {
  settings: ExtensionSettings | null;
  /** Mutate a draft of the settings; the write and re-read are handled here. */
  update: (mutate: (draft: ExtensionSettings) => void) => void;
  /** For helpers in storage.ts that own their own logic (presets, resets). */
  run: (operation: () => Promise<ExtensionSettings>) => void;
  /** Set when the last write failed; cleared by the next one that succeeds. */
  saveError: string | null;
}

/**
 * Loads settings once, then follows chrome.storage. The subscription matters
 * even inside the popup: another tab or another signed-in device can change
 * things while it is open.
 */
export function useSettings(): UseSettings {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadSettings().then((loaded) => {
      if (active) setSettings(loaded);
    });
    const unwatch = watchSettings(setSettings);
    return () => {
      active = false;
      unwatch();
    };
  }, []);

  // Leave me alone mode can run out while the popup is open.
  useEffect(() => {
    if (!settings) return undefined;
    return onSettingsExpiry(settings, () =>
      setSettings((current) => (current ? parseSettings(current) : current)),
    );
  }, [settings]);

  const run = useCallback((operation: () => Promise<ExtensionSettings>) => {
    void operation().then(
      (next) => {
        setSettings(next);
        setSaveError(null);
      },
      (error: unknown) => {
        debug("settings write failed", error);
        setSaveError(SAVE_ERROR);
      },
    );
  }, []);

  const update = useCallback(
    (mutate: (draft: ExtensionSettings) => void) =>
      run(() => updateSettings(mutate)),
    [run],
  );

  return { settings, update, run, saveError };
}
