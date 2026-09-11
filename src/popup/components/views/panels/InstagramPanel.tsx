import { SettingRow } from '@/popup/components/SettingRow';
import { SettingSection } from '@/popup/components/SettingSection';
import { MaintenanceSection } from '@/popup/components/views/panels/MaintenanceSection';
import type { PanelProps } from '@/popup/components/views/PlatformView';
import { INSTAGRAM_POST_ROWS, STORY_ROW, type PlatformTabId } from '@/popup/platforms';

interface InstagramPanelProps extends PanelProps {
  tab: PlatformTabId;
}

export function InstagramPanel({ tab, settings, update, resetPlatform }: InstagramPanelProps) {
  const instagram = settings.instagram;

  if (tab === 'general') {
    return (
      <SettingSection
        title="Stories"
        description="Hide the reply box and quick reactions on a Story. Tapping through stories keeps working."
      >
        <SettingRow
          icon={STORY_ROW.icon}
          label={STORY_ROW.label}
          checked={instagram.hideStoryActions}
          onChange={(next) =>
            update((draft) => {
              draft.instagram.hideStoryActions = next;
            })
          }
        />
      </SettingSection>
    );
  }

  if (tab === 'posts') {
    return (
      <SettingSection
        title="Post actions"
        description="Hide the controls under a post. The photo, caption and comments are never touched."
      >
        {INSTAGRAM_POST_ROWS.map((row) => (
          <SettingRow
            key={row.key}
            icon={row.icon}
            label={row.label}
            checked={instagram.posts[row.key]}
            disabled={row.key !== 'hideEntireActionBar' && instagram.posts.hideEntireActionBar}
            disabledHint="The whole action bar is already hidden."
            onChange={(next) =>
              update((draft) => {
                draft.instagram.posts[row.key] = next;
              })
            }
          />
        ))}
      </SettingSection>
    );
  }

  return (
    <>
      <div className="rounded-md border border-gray-400 bg-card px-3 py-2.5 shadow-none ">
        <p className="text-[13.5px] leading-tight">Not covered yet</p>
        <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
          Instagram direct messages have no options yet. The Messenger equivalents live under Facebook, and the same
          per-conversation approach is the plan here.
        </p>
      </div>
      <MaintenanceSection platformName="Instagram" onReset={resetPlatform} />
    </>
  );
}
