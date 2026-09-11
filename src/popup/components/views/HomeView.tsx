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
  const currentChatProtected =
    conversationId !== null && settings.protectedChats[conversationId] !== undefined;

  return (
    <div className="space-y-3.5">
      <LeaveMeAloneCard enabled={settings.leaveMeAloneMode} onChange={onToggleLeaveMeAlone} />
      <PlatformList settings={settings} onOpen={onOpenPlatform} />
      <CurrentSiteCard
        current={current}
        currentChatProtected={currentChatProtected}
        onOpenPlatform={onOpenPlatform}
        onOpenProtectedChats={onOpenProtectedChats}
      />
      <QuickStats stats={stats} />
      <FooterNote />
    </div>
  );
}
