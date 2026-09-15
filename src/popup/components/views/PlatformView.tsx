import { Switch } from '@/popup/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/popup/components/ui/tabs';
import { PlatformIcon } from '@/popup/components/PlatformIcon';
import { FacebookPanel } from '@/popup/components/views/panels/FacebookPanel';
import { InstagramPanel } from '@/popup/components/views/panels/InstagramPanel';
import { MessengerPanel } from '@/popup/components/views/panels/MessengerPanel';
import { cn } from '@/popup/lib/utils';
import { TAB_LABELS, getPlatform, type PlatformTabId } from '@/popup/platforms';
import type { ExtensionSettings, PlatformId } from '@/shared/types';
import { useState } from 'react';

export interface PanelProps {
  settings: ExtensionSettings;
  update: (mutate: (draft: ExtensionSettings) => void) => void;
  resetPlatform: () => void;
  onOpenProtectedChats: () => void;
}

interface PlatformViewProps extends PanelProps {
  platform: PlatformId;
}

function PlatformPanel({ platform, ...panel }: PlatformViewProps & { tab: PlatformTabId }) {
  switch (platform) {
    case 'messenger':
      return <MessengerPanel {...panel} />;
    case 'instagram':
      return <InstagramPanel {...panel} />;
    case 'facebook':
    default:
      return <FacebookPanel {...panel} />;
  }
}

export function PlatformView({ platform, ...panel }: PlatformViewProps) {
  const meta = getPlatform(platform);
  const [tab, setTab] = useState<PlatformTabId>('general');
  const enabled = panel.settings[platform].enabled;

  if (!meta.available) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 px-0.5">
          <PlatformIcon platform={meta} size="header" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] leading-tight font-semibold tracking-tight">{meta.name}</h2>
            <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{meta.blurb}</p>
          </div>
        </div>
        <div className="rounded-md border border-gray-400 bg-card px-3 py-3 text-center shadow-none">
          <p className="text-[14px] font-medium">Coming soon</p>
          <p className="mt-1 text-[12px] text-muted-foreground">We’re still working on Instagram support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 px-0.5">
        <PlatformIcon platform={meta} size="header" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[19px] leading-tight font-semibold tracking-tight">{meta.name}</h2>
          <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{meta.blurb}</p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(next) =>
            panel.update((draft) => {
              draft[platform].enabled = next;
            })
          }
          aria-label={`Enable ${meta.name} cleanup`}
          className="scale-115"
        />
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as PlatformTabId)}>
        <TabsList
          className="grid h-auto w-full gap-1.5 bg-transparent p-0"
          style={{ gridTemplateColumns: `repeat(${meta.tabs.length}, minmax(0, 1fr))` }}
        >
          {meta.tabs.map((id) => (
            <TabsTrigger
              key={id}
              value={id}
              className="h-auto cursor-pointer rounded-full bg-secondary px-2 py-1.5 text-[12.5px] text-muted-foreground data-[state=active]:bg-tint-site! data-[state=active]:font-medium data-[state=active]:text-tint-site-foreground! shadow-none! border border-gray-400"
            >
              {TAB_LABELS[id]}
            </TabsTrigger>
          ))}
        </TabsList>

        {meta.tabs.map((id) => (
          <TabsContent key={id} value={id} className="mt-1">
            {/* A platform that is switched off still shows its options, dimmed,
                so it is obvious why nothing is being hidden. */}
            <div className={cn('space-y-3.5', !enabled && 'pointer-events-none opacity-50')}>
              <PlatformPanel platform={platform} tab={id} {...panel} />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {!enabled ? (
        <p className="px-1 text-center text-[11.5px] text-muted-foreground">
          {meta.name} cleanup is off. Everything hidden here has been restored.
        </p>
      ) : null}
    </div>
  );
}
