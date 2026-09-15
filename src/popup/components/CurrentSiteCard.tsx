import { NavCard } from '@/popup/components/NavCard';
import type { CurrentTabInfo } from '@/popup/hooks/useCurrentTab';
import { getPlatform } from '@/popup/platforms';
import type { PlatformId } from '@/shared/types';
import { Globe } from 'lucide-react';

interface CurrentSiteCardProps {
  current: CurrentTabInfo | null;
  /** True when the conversation in the active tab is already protected. */
  currentChatProtected: boolean;
  onOpenPlatform: (platform: PlatformId) => void;
  onOpenProtectedChats: () => void;
}

/**
 * Shortcut to whatever the active tab is showing. On a Messenger conversation
 * it points at Protected Chats, which is where that conversation can be
 * protected in one click — that is the whole point of detecting it.
 */
export function CurrentSiteCard({
  current,
  currentChatProtected,
  onOpenPlatform,
  onOpenProtectedChats,
}: CurrentSiteCardProps) {
  return (
    <section className="space-y-1.5">
      <h2 className="px-0.5 text-[15px] leading-tight font-semibold tracking-tight">Current Site</h2>

      {!current?.platform ? (
        <NavCard
          icon={Globe}
          title="No supported site open"
          description="Open Facebook or Messenger."
          className="rounded-md border-gray-400 shadow-none"
        />
      ) : current.conversationId ? (
        <NavCard
          tone="site"
          image={getPlatform('facebook').icon}
          title={current.chatName ?? "You're on Messenger"}
          description={
            currentChatProtected
              ? 'Protected chat. Open its settings'
              : 'Open Protected Chats to protect this conversation'
          }
          onClick={onOpenProtectedChats}
        />
      ) : (
        <NavCard
          tone="site"
          image={getPlatform(current.platform).icon}
          title={`You're on ${getPlatform(current.platform).name}`}
          description="Open settings to customize"
          onClick={() => onOpenPlatform(current.platform as PlatformId)}
        />
      )}
    </section>
  );
}
