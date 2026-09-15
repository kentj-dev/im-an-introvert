import { CurrentSiteCard } from '@/popup/components/CurrentSiteCard';
import { FooterNote } from '@/popup/components/FooterNote';
import { LeaveMeAloneCard } from '@/popup/components/LeaveMeAloneCard';
import { PlatformList } from '@/popup/components/PlatformList';
import { QuickStats } from '@/popup/components/QuickStats';
import type { CurrentTabInfo } from '@/popup/hooks/useCurrentTab';
import type { ExtensionSettings, PlatformId, UsageStats } from '@/shared/types';

interface HomeViewProps {
  settings: ExtensionSettings;
  stats: UsageStats;
  current: CurrentTabInfo | null;
  onToggleLeaveMeAlone: (enabled: boolean) => void;
  onOpenPlatform: (platform: PlatformId) => void;
  onOpenProtectedChats: () => void;
}

export function HomeView({
  settings,
  stats,
  current,
  onToggleLeaveMeAlone,
  onOpenPlatform,
  onOpenProtectedChats,
}: HomeViewProps) {
  const conversationId = current?.conversationId ?? null;
  const currentChatProtected = conversationId !== null && settings.protectedChats[conversationId] !== undefined;

  return (
    <div className="space-y-3.5">
      {/* A running session stays reachable from any tab, so it can be ended. */}
      {(current?.platform || settings.leaveMeAloneMode) && (
        <LeaveMeAloneCard
          enabled={settings.leaveMeAloneMode}
          endsAt={settings.leaveMeAlone.until}
          onChange={onToggleLeaveMeAlone}
        />
      )}
      <CurrentSiteCard
        current={current}
        currentChatProtected={currentChatProtected}
        onOpenPlatform={onOpenPlatform}
        onOpenProtectedChats={onOpenProtectedChats}
      />
      {current?.platform && <PlatformList settings={settings} onOpen={onOpenPlatform} />}
      <QuickStats stats={stats} />
      <FooterNote />
    </div>
  );
}
