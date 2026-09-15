import { Badge } from "@/popup/components/ui/badge";
import { Button } from "@/popup/components/ui/button";
import { Card } from "@/popup/components/ui/card";
import type { CurrentTabInfo } from "@/popup/hooks/useCurrentTab";
import { FREE_LIMITS } from "@/shared/constants";
import type { ExtensionSettings, ProtectedChat } from "@/shared/types";
import { canAddProtectedChat, listProtectedChats } from "@/storage/storage";
import { ChevronRight, Plus, Shield, ShieldCheck } from "lucide-react";

interface ProtectedChatsViewProps {
  settings: ExtensionSettings;
  current: CurrentTabInfo | null;
  onProtectCurrent: () => void;
  onOpenChat: (id: string) => void;
  onAddManually: () => void;
}

/** Reads back what a chat is actually hiding, so rows are not just names. */
function summarise(chat: ProtectedChat): string {
  const parts: string[] = [];
  if (chat.hideVoiceCall || chat.hideVideoCall) parts.push("calls");
  if (chat.hideGroupActions) parts.push("group actions");
  if (chat.hideChatField) parts.push("chat field");
  else if (
    chat.hideAttachments ||
    chat.hideEmojiButton ||
    chat.hideGifButton ||
    chat.hideStickerButton ||
    chat.hideLikeButton
  ) {
    parts.push("composer buttons");
  }
  return parts.length > 0 ? `Hiding ${parts.join(", ")}` : "Nothing hidden yet";
}

function shortId(id: string): string {
  return id.length > 24 ? `${id.slice(0, 24)}…` : id;
}

export function ProtectedChatsView({
  settings,
  current,
  onProtectCurrent,
  onOpenChat,
  onAddManually,
}: ProtectedChatsViewProps) {
  const chats = listProtectedChats(settings);
  const conversationId = current?.conversationId ?? null;
  const currentChat = conversationId
    ? settings.protectedChats[conversationId]
    : undefined;
  const atLimit = !canAddProtectedChat(settings);

  return (
    <div className="space-y-3.5">
      <div className="px-0.5">
        <h2 className="text-[19px] leading-tight font-semibold tracking-tight">
          Protected Chats
        </h2>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
          Rules that apply to one conversation instead of all of Messenger.
        </p>
      </div>

      {conversationId ? (
        <section className="space-y-1.5">
          <h3 className="px-0.5 text-[14.5px] leading-tight font-semibold tracking-tight">
            Current chat
          </h3>
          <Card className="gap-0 px-3 py-3 shadow-none border-gray-400 rounded-md">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[14px] font-medium">
                {currentChat?.name ?? current?.chatName ?? "Messenger chat"}
              </p>
              {currentChat ? (
                <Badge
                  variant="secondary"
                  className="bg-tint-success! text-tint-success-foreground!"
                >
                  <ShieldCheck />
                  Protected
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
              {current?.chatSubtitle ?? shortId(conversationId)}
            </p>
            {currentChat ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-2.5 w-full"
                onClick={() => onOpenChat(currentChat.id)}
              >
                Open its settings
              </Button>
            ) : (
              <Button
                size="sm"
                className="mt-2.5 w-full"
                disabled={atLimit}
                onClick={onProtectCurrent}
              >
                <Shield />
                Protect this chat
              </Button>
            )}
          </Card>
        </section>
      ) : null}

      <section className="space-y-1.5">
        <div className="flex items-baseline justify-between px-0.5">
          <h3 className="text-[14.5px] leading-tight font-semibold tracking-tight">
            All protected chats
          </h3>
          <span className="text-[11.5px] text-muted-foreground">
            {chats.length} of {FREE_LIMITS.protectedChats}
          </span>
        </div>

        {chats.length === 0 ? (
          <Card className="gap-0 px-3 py-4 text-center shadow-none border-gray-400">
            <p className="text-[13px] font-medium">No protected chats</p>
            <p className="mx-auto mt-1 max-w-[17rem] text-[11.5px] leading-snug text-muted-foreground">
              Open a Messenger conversation and protect it to hide its call and
              group buttons.
            </p>
          </Card>
        ) : (
          <Card className="gap-0 py-0 shadow-none rounded-md border-gray-400">
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => onOpenChat(chat.id)}
                className="group flex cursor-pointer items-center gap-2 px-3 py-2.5 text-left transition-colors first:rounded-t-md last:rounded-b-md hover:bg-accent focus-visible:outline-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] leading-tight font-medium">
                    {chat.name ?? "Messenger chat"}
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                    {chat.subtitle ?? summarise(chat)}
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                  strokeWidth={2}
                />
              </button>
            ))}
          </Card>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full cursor-pointer justify-start"
          disabled={atLimit}
          onClick={onAddManually}
        >
          <Plus />
          Add chat manually
        </Button>

        {atLimit ? (
          <p className="px-0.5 text-[11.5px] leading-snug text-muted-foreground">
            You can protect up to {FREE_LIMITS.protectedChats} chats. Remove one
            to add another.
          </p>
        ) : null}
      </section>
    </div>
  );
}
