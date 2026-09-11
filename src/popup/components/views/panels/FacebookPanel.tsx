import { Info, MessagesSquare } from 'lucide-react';
import { NavCard } from '@/popup/components/NavCard';
import { SettingRow } from '@/popup/components/SettingRow';
import { SettingSection } from '@/popup/components/SettingSection';
import { Badge } from '@/popup/components/ui/badge';
import { MaintenanceSection } from '@/popup/components/views/panels/MaintenanceSection';
import type { PanelProps } from '@/popup/components/views/PlatformView';
import {
  FACEBOOK_POST_ROWS,
  MESSENGER_CALL_ROWS,
  MESSENGER_FIELD_ROWS,
  STORY_ROW,
  type PlatformTabId,
} from '@/popup/platforms';

interface FacebookPanelProps extends PanelProps {
  tab: PlatformTabId;
}

export function FacebookPanel({
  tab,
  settings,
  update,
  resetPlatform,
  onOpenProtectedChats,
}: FacebookPanelProps) {
  const facebook = settings.facebook;
  const messenger = facebook.messenger;
  const posts = facebook.posts;
  const protectedCount = Object.keys(settings.protectedChats).length;

  if (tab === 'general') {
    return (
      <SettingSection
        title="Stories"
        description="Hide the interaction strip at the bottom of a Story. Navigation, playback and closing keep working."
      >
        <SettingRow
          icon={STORY_ROW.icon}
          label={STORY_ROW.label}
          checked={facebook.hideStoryActions}
          onChange={(next) =>
            update((draft) => {
              draft.facebook.hideStoryActions = next;
            })
          }
        />
      </SettingSection>
    );
  }

  if (tab === 'messenger') {
    return (
      <>
        <NavCard
          icon={MessagesSquare}
          title="Protected Chats"
          description="Apply custom rules per conversation."
          badge={
            protectedCount > 0 ? (
              <Badge variant="secondary" className="bg-secondary text-muted-foreground">
                {protectedCount}
              </Badge>
            ) : undefined
          }
          onClick={onOpenProtectedChats}
        />

        <SettingSection
          title="Global Messenger Settings"
          description="These apply to all your Messenger conversations."
        >
          {MESSENGER_CALL_ROWS.map((row) => (
            <SettingRow
              key={row.key}
              icon={row.icon}
              label={row.label}
              checked={messenger[row.key]}
              onChange={(next) =>
                update((draft) => {
                  draft.facebook.messenger[row.key] = next;
                })
              }
            />
          ))}
        </SettingSection>

        <SettingSection
          title="Messenger Chat Field"
          description="Hide specific composer elements (global)."
        >
          {MESSENGER_FIELD_ROWS.map((row) => (
            <SettingRow
              key={row.key}
              icon={row.icon}
              label={row.label}
              checked={messenger[row.key]}
              // Once the whole field is hidden, the buttons inside it are moot.
              disabled={row.key !== 'hideChatField' && messenger.hideChatField}
              disabledHint="The whole chat field is already hidden."
              onChange={(next) =>
                update((draft) => {
                  draft.facebook.messenger[row.key] = next;
                })
              }
            />
          ))}
        </SettingSection>
      </>
    );
  }

  if (tab === 'posts') {
    return (
      <SettingSection
        title="Post actions"
        description="Hide the controls under a post. Post text, media and reaction counts are never touched."
      >
        {FACEBOOK_POST_ROWS.map((row) => (
          <SettingRow
            key={row.key}
            icon={row.icon}
            label={row.label}
            hint={row.hint}
            checked={posts[row.key]}
            // The reaction picker is its own element, so it stays independent.
            disabled={
              row.key !== 'hideEntireActionBar' &&
              row.key !== 'hideReactions' &&
              posts.hideEntireActionBar
            }
            disabledHint="The whole action bar is already hidden."
            onChange={(next) =>
              update((draft) => {
                draft.facebook.posts[row.key] = next;
              })
            }
          />
        ))}
      </SettingSection>
    );
  }

  return (
    <>
      <SettingSection title="Behaviour" description="Small touches that keep hidden UI from looking broken.">
        <SettingRow
          icon={Info}
          label="Note when chat field is hidden"
          hint="Shows a small “messaging disabled” line where the composer used to be."
          checked={messenger.showDisabledNotice}
          onChange={(next) =>
            update((draft) => {
              draft.facebook.messenger.showDisabledNotice = next;
            })
          }
        />
      </SettingSection>
      <MaintenanceSection platformName="Facebook" onReset={resetPlatform} />
    </>
  );
}
