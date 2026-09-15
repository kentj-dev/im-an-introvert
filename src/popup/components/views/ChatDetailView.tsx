import { SettingRow } from "@/popup/components/SettingRow";
import { SettingSection } from "@/popup/components/SettingSection";
import { Badge } from "@/popup/components/ui/badge";
import { Button } from "@/popup/components/ui/button";
import { Input } from "@/popup/components/ui/input";
import { Label } from "@/popup/components/ui/label";
import { MESSENGER_CALL_ROWS, MESSENGER_FIELD_ROWS } from "@/popup/platforms";
import type { ChatRules, ProtectedChat } from "@/shared/types";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

interface ChatDetailViewProps {
  chat: ProtectedChat;
  /** Global Messenger rules; these win, so a row they cover is locked on. */
  globals: ChatRules;
  onPatch: (patch: Partial<Omit<ProtectedChat, "id">>) => void;
  onRemove: () => void;
}

export function ChatDetailView({
  chat,
  globals,
  onPatch,
  onRemove,
}: ChatDetailViewProps) {
  const [name, setName] = useState(chat.name ?? "");
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Another popup or another signed-in device can rename this while it is open.
  useEffect(() => setName(chat.name ?? ""), [chat.id, chat.name]);

  const commitName = (): void => {
    const next = name.trim();
    if (next === (chat.name ?? "")) return;
    onPatch(next ? { name: next } : { name: undefined });
  };

  const rows = (
    keys: typeof MESSENGER_CALL_ROWS,
    lockWhenFieldHidden: boolean,
  ) =>
    keys.map((row) => {
      const global = globals[row.key];
      const fieldHidden =
        lockWhenFieldHidden &&
        row.key !== "hideChatField" &&
        (chat.hideChatField || globals.hideChatField);

      return (
        <SettingRow
          key={row.key}
          icon={row.icon}
          label={row.label}
          checked={global || chat[row.key]}
          disabled={global || fieldHidden}
          disabledHint={
            global
              ? "Hidden in every chat by the global setting."
              : "The whole chat field is already hidden."
          }
          onChange={(next) => onPatch({ [row.key]: next })}
        />
      );
    });

  return (
    <div className="space-y-3.5">
      <div className="flex items-start gap-2 px-0.5">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[19px] leading-tight font-semibold tracking-tight">
            {chat.name ?? "Messenger chat"}
          </h2>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {chat.subtitle ?? "Protected conversation"}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="mt-0.5 bg-tint-success! text-tint-success-foreground!"
        >
          <ShieldCheck />
          Protected
        </Badge>
      </div>

      <SettingSection
        title="Calls and group actions"
        description="Stops a misclick from ringing everyone in the chat."
      >
        {rows(MESSENGER_CALL_ROWS, false)}
      </SettingSection>

      <SettingSection
        title="Chat field"
        description="Hiding the field leaves reading, scrolling and media intact."
      >
        {rows(MESSENGER_FIELD_ROWS, true)}
      </SettingSection>

      <SettingSection title="This chat">
        <div className="space-y-2 px-3 py-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="chat-name"
              className="text-[12px] text-muted-foreground"
            >
              Display name
            </Label>
            <Input
              id="chat-name"
              value={name}
              placeholder="Office Group"
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitName();
              }}
              className="border-gray-400"
            />
            <p className="text-[11px] leading-snug text-muted-foreground">
              Just a label for this popup. The conversation ID below is the real
              identifier.
            </p>
          </div>
          <p
            className="truncate font-mono text-[11px] text-muted-foreground"
            title={chat.id}
          >
            ID {chat.id}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5">
          {confirmRemove ? (
            <>
              <p className="flex-1 text-[12.5px]">
                Remove protection from this chat?
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmRemove(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive!"
                onClick={onRemove}
              >
                Remove
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive!"
              onClick={() => setConfirmRemove(true)}
            >
              Remove protection
            </Button>
          )}
        </div>
      </SettingSection>
    </div>
  );
}
