import { SettingRow } from "@/popup/components/SettingRow";
import { SettingSection } from "@/popup/components/SettingSection";
import { MaintenanceSection } from "@/popup/components/views/panels/MaintenanceSection";
import type { PanelProps } from "@/popup/components/views/PlatformView";
import {
  CHAT_WIDGETS_ROW,
  FOCUS_ROW,
  POST_ACTION_BAR_ROW,
  STORY_ROW,
  type PlatformTabId,
} from "@/popup/platforms";

interface FacebookPanelProps extends PanelProps {
  tab: PlatformTabId;
}

export function FacebookPanel({
  tab,
  settings,
  update,
  resetPlatform,
}: FacebookPanelProps) {
  const facebook = settings.facebook;

  if (tab === "general") {
    return (
      <>
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

        <SettingSection
          title="Posts"
          description="Hide the controls under a post. Post text, media and reaction counts are never touched."
        >
          <SettingRow
            icon={POST_ACTION_BAR_ROW.icon}
            label={POST_ACTION_BAR_ROW.label}
            hint={POST_ACTION_BAR_ROW.hint}
            checked={facebook.posts.hideEntireActionBar}
            onChange={(next) =>
              update((draft) => {
                draft.facebook.posts.hideEntireActionBar = next;
              })
            }
          />
        </SettingSection>

        <SettingSection
          title="Chat"
          description="Keep incoming messages from popping open over the page."
        >
          <SettingRow
            icon={CHAT_WIDGETS_ROW.icon}
            label={CHAT_WIDGETS_ROW.label}
            hint={CHAT_WIDGETS_ROW.hint}
            checked={facebook.hideChatWidgets}
            onChange={(next) =>
              update((draft) => {
                draft.facebook.hideChatWidgets = next;
              })
            }
          />
        </SettingSection>

        <SettingSection
          title="Focus"
          description="Keep your eyes on the middle of the page. The side menus stay, just out of focus."
        >
          <SettingRow
            icon={FOCUS_ROW.icon}
            label={FOCUS_ROW.label}
            hint={FOCUS_ROW.hint}
            checked={facebook.blurSidebars}
            onChange={(next) =>
              update((draft) => {
                draft.facebook.blurSidebars = next;
              })
            }
          />
        </SettingSection>
      </>
    );
  }

  return <MaintenanceSection platformName="Facebook" onReset={resetPlatform} />;
}
