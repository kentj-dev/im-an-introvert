import { Info, MessagesSquare } from 'lucide-react';
import { NavCard } from '@/popup/components/NavCard';
import { SettingRow } from '@/popup/components/SettingRow';
import { SettingSection } from '@/popup/components/SettingSection';
import { Badge } from '@/popup/components/ui/badge';
import { MaintenanceSection } from '@/popup/components/views/panels/MaintenanceSection';
import type { PanelProps } from '@/popup/components/views/PlatformView';
import { MESSENGER_CALL_ROWS, MESSENGER_FIELD_ROWS, type PlatformTabId } from '@/popup/platforms';

interface MessengerPanelProps extends PanelProps {
  tab: PlatformTabId;
}

export function MessengerPanel({
  tab,
  settings,
  update,
  resetPlatform,
  onOpenProtectedChats,
}: MessengerPanelProps) {
  const messenger = settings.messenger;
  const protectedCount = Object.keys(settings.protectedChats).length;

  if (tab === 'general') {
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
                  draft.messenger[row.key] = next;
                })
              }
            />
          ))}
        </SettingSection>
      </>
    );
  }

  if (tab === 'chatField') {
    return (
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
                draft.messenger[row.key] = next;
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
              draft.messenger.showDisabledNotice = next;
            })
          }
        />
      </SettingSection>
      <MaintenanceSection platformName="Messenger" onReset={resetPlatform} />
    </>
  );
}
