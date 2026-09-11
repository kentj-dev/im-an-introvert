import { SettingSection } from '@/popup/components/SettingSection';
import { Button } from '@/popup/components/ui/button';
import type { UsageStats } from '@/shared/types';
import { formatDuration } from '@/storage/stats';
import { Lock } from 'lucide-react';
import { useState } from 'react';

interface AboutViewProps {
  stats: UsageStats;
  onResetStats: () => void;
  onResetAll: () => void;
}

function ActionRow({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-tight">{title}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export function AboutView({ stats, onResetStats, onResetAll }: AboutViewProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-3.5">
      <div className="px-0.5">
        <h2 className="text-[19px] leading-tight font-semibold tracking-tight">Settings and privacy</h2>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
          What this extension keeps, and how to clear it.
        </p>
      </div>

      <div className="flex gap-3 rounded-sm shadow-none border border-gray-400 bg-tint-night px-3 py-3">
        <Lock className="mt-0.5 size-[16px] shrink-0 text-tint-night-foreground" strokeWidth={1.9} />
        <p className="text-[12px] leading-snug">
          Everything runs on this device. No accounts, no analytics, no servers, and no network requests of any kind.
          Your settings and protected chat IDs live in Chrome storage; message content is never read or stored.
        </p>
      </div>

      <SettingSection title="Quick Stats" description="Two counters for today, stored locally and never synced.">
        <ActionRow
          title={`${stats.hiddenCount.toLocaleString()} elements hidden`}
          description={`${formatDuration(stats.activeSeconds)} of distraction-free browsing today.`}
          action={
            <Button variant="outline" size="sm" onClick={onResetStats}>
              Reset
            </Button>
          }
        />
      </SettingSection>

      <SettingSection title="Everything else">
        <ActionRow
          title="Reset all settings"
          description={
            confirming
              ? 'This also removes every protected chat.'
              : 'Puts every platform and protected chat back to defaults.'
          }
          action={
            confirming ? (
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive!"
                  onClick={() => {
                    onResetAll();
                    setConfirming(false);
                  }}
                >
                  Reset all
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
                Reset
              </Button>
            )
          }
        />
      </SettingSection>
    </div>
  );
}
