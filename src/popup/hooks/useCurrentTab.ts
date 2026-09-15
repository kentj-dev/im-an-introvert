import { useEffect, useState } from 'react';
import { MESSAGES, type ChatInfoResponse, type PlatformId } from '@/shared/types';
import { getMessengerConversationId, isMessengerRoute } from '@/sites/messenger/router';

export interface CurrentTabInfo {
  /** null when the active tab is not a supported site. */
  platform: PlatformId | null;
  /** True on messenger.com or facebook.com/messages. */
  onMessenger: boolean;
  conversationId: string | null;
  chatName?: string;
  chatSubtitle?: string;
}

const NOT_SUPPORTED: CurrentTabInfo = {
  platform: null,
  onMessenger: false,
  conversationId: null,
};

function platformFor(hostname: string): PlatformId | null {
  if (/(^|\.)(facebook|messenger)\.com$/.test(hostname)) return 'facebook';
  return null;
}

async function readActiveTab(): Promise<CurrentTabInfo> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // tab.url is readable only because of host_permissions for these sites; no
  // "tabs" permission is requested.
  let url: URL | null = null;
  try {
    url = tab?.url ? new URL(tab.url) : null;
  } catch {
    url = null;
  }
  if (!url) return NOT_SUPPORTED;

  const platform = platformFor(url.hostname);
  if (!platform) return NOT_SUPPORTED;

  const location = { hostname: url.hostname, pathname: url.pathname };
  const onMessenger = isMessengerRoute(location);
  const fromUrl = getMessengerConversationId(location);
  const base: CurrentTabInfo = { platform, onMessenger, conversationId: fromUrl };

  if (!fromUrl || tab?.id === undefined) return base;

  // The content script knows the live route and the conversation title, which
  // the URL alone cannot give us.
  try {
    const info = (await chrome.tabs.sendMessage(tab.id, {
      type: MESSAGES.getChatInfo,
    })) as ChatInfoResponse | undefined;

    return {
      ...base,
      conversationId: info?.conversationId ?? fromUrl,
      ...(info?.name ? { chatName: info.name } : {}),
      ...(info?.subtitle ? { chatSubtitle: info.subtitle } : {}),
    };
  } catch {
    // No content script yet: the page is still loading or was just reloaded.
    return base;
  }
}

export function useCurrentTab(): CurrentTabInfo | null {
  const [current, setCurrent] = useState<CurrentTabInfo | null>(null);

  useEffect(() => {
    let active = true;
    void readActiveTab().then((info) => {
      if (active) setCurrent(info);
    });
    return () => {
      active = false;
    };
  }, []);

  return current;
}
