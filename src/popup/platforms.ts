/**
 * Popup metadata for each supported platform: branding, tabs, and the setting
 * rows each tab renders.
 *
 * Keeping the rows as data means the tab views stay short, the labels live in
 * one place, and adding a site is mostly adding an entry here.
 */
import {
  Bookmark,
  Camera,
  Film,
  Focus,
  Heart,
  Keyboard,
  LayoutList,
  MessageCircle,
  MessageCircleOff,
  Paperclip,
  Phone,
  Send,
  Smile,
  Sticker,
  ThumbsUp,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import facebookIcon from "@/assets/facebook.png";
import instagramIcon from "@/assets/instagram.png";
import messengerIcon from "@/assets/messenger.png";
import type {
  ChatRuleKey,
  InstagramPostSettings,
  PlatformId,
} from "@/shared/types";

export type PlatformTabId = "general" | "chatField" | "posts" | "other";

export interface PlatformMeta {
  id: PlatformId;
  name: string;
  /** Coming-soon platforms are visible in the popup but cannot be opened. */
  available: boolean;
  /** Shown in the platform list on the home view. */
  summary: string;
  /** Shown under the platform name on its own page. */
  blurb: string;
  icon: string;
  tabs: PlatformTabId[];
}

export const PLATFORMS: readonly PlatformMeta[] = [
  {
    id: "facebook",
    name: "Facebook",
    available: true,
    summary: "Cleaner browsing experience",
    blurb: "Customize your Facebook experience.",
    icon: facebookIcon,
    tabs: ["general", "other"],
  },
  {
    id: "messenger",
    name: "Messenger",
    available: true,
    summary: "Calmer conversations",
    blurb: "Customize your Messenger experience.",
    icon: messengerIcon,
    tabs: ["general", "chatField", "other"],
  },
  {
    id: "instagram",
    name: "Instagram",
    available: false,
    summary: "Support is on the way",
    blurb: "Instagram support is coming soon.",
    icon: instagramIcon,
    tabs: ["general", "posts", "other"],
  },
];

export const TAB_LABELS: Record<PlatformTabId, string> = {
  general: "General",
  chatField: "Chat Field",
  posts: "Posts",
  other: "Other",
};

export function getPlatform(id: PlatformId): PlatformMeta {
  // PLATFORMS covers every PlatformId, so the fallback is unreachable.
  return PLATFORMS.find((platform) => platform.id === id) ?? PLATFORMS[0]!;
}

export interface SettingRowMeta<K extends string> {
  key: K;
  label: string;
  icon: LucideIcon;
  hint?: string;
}

/** Calls and group actions: the buttons people regret touching. */
export const MESSENGER_CALL_ROWS: ReadonlyArray<SettingRowMeta<ChatRuleKey>> = [
  { key: "hideVoiceCall", label: "Hide voice call button", icon: Phone },
  { key: "hideVideoCall", label: "Hide video call button", icon: Video },
  { key: "hideGroupActions", label: "Hide group actions", icon: Users },
];

export const MESSENGER_FIELD_ROWS: ReadonlyArray<SettingRowMeta<ChatRuleKey>> =
  [
    {
      key: "hideChatField",
      label: "Hide chat field (message input)",
      icon: Keyboard,
    },
    {
      key: "hideAttachments",
      label: "Hide attachment button",
      icon: Paperclip,
    },
    { key: "hideEmojiButton", label: "Hide emoji button", icon: Smile },
    { key: "hideGifButton", label: "Hide GIF button", icon: Film },
    { key: "hideStickerButton", label: "Hide sticker button", icon: Sticker },
    { key: "hideLikeButton", label: "Hide quick-like button", icon: ThumbsUp },
  ];

export const POST_ACTION_BAR_ROW = {
  label: "Hide entire action bar",
  icon: LayoutList,
  hint: "The Like, Comment, Share and Send row under each post.",
} as const;

export const INSTAGRAM_POST_ROWS: ReadonlyArray<
  SettingRowMeta<keyof InstagramPostSettings>
> = [
  {
    key: "hideEntireActionBar",
    label: "Hide entire action bar",
    icon: LayoutList,
  },
  { key: "hideLike", label: "Hide Like", icon: Heart },
  { key: "hideComment", label: "Hide Comment", icon: MessageCircle },
  { key: "hideShare", label: "Hide Share", icon: Send },
  { key: "hideSave", label: "Hide Save", icon: Bookmark },
];

export const STORY_ROW = { label: "Hide Story actions", icon: Camera } as const;

export const CHAT_WIDGETS_ROW = {
  label: "Hide chat widgets",
  icon: MessageCircleOff,
  hint: "Floating chat windows that pop up in the corner. Full Messenger is unaffected.",
} as const;

export const FOCUS_ROW = {
  label: "Blur Panels",
  icon: Focus,
  hint: "Frosted glass over the top bar and the menus beside the feed. Hover one to peek.",
} as const;
