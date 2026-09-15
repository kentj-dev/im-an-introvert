import { Badge } from '@/popup/components/ui/badge';
import { Card } from '@/popup/components/ui/card';
import { PlatformIcon } from '@/popup/components/PlatformIcon';
import { PLATFORMS } from '@/popup/platforms';
import type { ExtensionSettings, PlatformId } from '@/shared/types';
import { ChevronRight } from 'lucide-react';

interface PlatformListProps {
  settings: ExtensionSettings;
  onOpen: (platform: PlatformId) => void;
}

/** The home view's main list: available sites plus announced future support. */
export function PlatformList({ settings, onOpen }: PlatformListProps) {
  const availableCount = PLATFORMS.filter((platform) => platform.available).length;

  return (
    <section className="space-y-1.5">
      <div className="flex items-baseline justify-between px-0.5">
        <h2 className="text-[15px] leading-tight font-semibold tracking-tight">Supported Social Media</h2>
        <span className="text-[11.5px] text-muted-foreground">{availableCount} available</span>
      </div>

      <Card className="gap-0 divide-y divide-border py-0 shadow-none rounded-md border-gray-400">
        {PLATFORMS.map((platform) => {
          const enabled = settings[platform.id].enabled;
          return (
            <button
              key={platform.id}
              type="button"
              disabled={!platform.available}
              onClick={() => onOpen(platform.id)}
              className="group flex items-center gap-3 px-3 py-2.5 text-left transition-colors first:rounded-t-xl last:rounded-b-xl enabled:cursor-pointer enabled:hover:bg-accent enabled:focus-visible:ring-[3px] enabled:focus-visible:ring-ring/50 enabled:focus-visible:outline-none disabled:cursor-default"
            >
              <PlatformIcon platform={platform} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] leading-tight font-medium">{platform.name}</span>
                <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{platform.summary}</span>
              </span>
              <Badge
                variant="secondary"
                className={
                  platform.available && enabled
                    ? 'bg-tint-success! text-tint-success-foreground!'
                    : 'bg-secondary text-muted-foreground'
                }
              >
                {platform.available ? (enabled ? 'Enabled' : 'Off') : 'Coming soon'}
              </Badge>
              {platform.available ? (
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                  strokeWidth={2}
                />
              ) : null}
            </button>
          );
        })}
      </Card>
    </section>
  );
}
