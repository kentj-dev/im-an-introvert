import { useCallback, useEffect, useState } from 'react';
import type { ExtensionSettings } from '@/shared/types';
import { loadSettings, updateSettings, watchSettings } from '@/storage/storage';

export interface UseSettings {
  settings: ExtensionSettings | null;
  /** Mutate a draft of the settings; the write and re-read are handled here. */
  update: (mutate: (draft: ExtensionSettings) => void) => void;
  /** For helpers in storage.ts that own their own logic (presets, resets). */
  run: (operation: () => Promise<ExtensionSettings>) => void;
}

/**
 * Loads settings once, then follows chrome.storage. The subscription matters
 * even inside the popup: another tab or another signed-in device can change
 * things while it is open.
 */
export function useSettings(): UseSettings {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);

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

  const update = useCallback((mutate: (draft: ExtensionSettings) => void) => {
    void updateSettings(mutate).then(setSettings);
  }, []);

  const run = useCallback((operation: () => Promise<ExtensionSettings>) => {
    void operation().then(setSettings);
  }, []);

  return { settings, update, run };
}
