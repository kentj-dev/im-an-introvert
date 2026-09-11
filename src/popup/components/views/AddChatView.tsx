import { SettingSection } from '@/popup/components/SettingSection';
import { Button } from '@/popup/components/ui/button';
import { Input } from '@/popup/components/ui/input';
import { Label } from '@/popup/components/ui/label';
import { parseConversationIdInput } from '@/sites/messenger/router';
import { useState } from 'react';

interface AddChatViewProps {
  /** Ids already protected, so duplicates are reported instead of merged. */
  existingIds: readonly string[];
  onAdd: (id: string, name?: string) => void;
  onCancel: () => void;
}

export function AddChatView({ existingIds, onAdd, onCancel }: AddChatViewProps) {
  const [value, setValue] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();

  const submit = (): void => {
    const id = parseConversationIdInput(value);
    if (!id) {
      setError('That does not look like a conversation ID or Messenger link.');
      return;
    }
    if (existingIds.includes(id)) {
      setError('That chat is already protected.');
      return;
    }
    onAdd(id, name.trim() || undefined);
  };

  const submitOnEnter = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter') submit();
  };

  return (
    <div className="space-y-3.5">
      <div className="px-0.5">
        <h2 className="text-[19px] leading-tight font-semibold tracking-tight">Add chat manually</h2>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
          Normally you protect a chat by opening it. This is for one you are not viewing.
        </p>
      </div>

      <SettingSection title="Advanced">
        <div className="space-y-3 px-3 py-3">
          <div className="space-y-1.5">
            <Label htmlFor="chat-id" className="text-[12px] text-muted-foreground">
              Conversation ID
            </Label>
            <Input
              id="chat-id"
              value={value}
              placeholder="1234567890 or a Messenger link"
              autoFocus
              aria-invalid={error !== undefined}
              onChange={(event) => {
                setValue(event.target.value);
                setError(undefined);
              }}
              onKeyDown={submitOnEnter}
              className="border-gray-400"
            />
            <p className="text-[11px] leading-snug text-muted-foreground">
              {error ?? 'Paste the full URL of the chat and the ID is pulled out for you.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="chat-label" className="text-[12px] text-muted-foreground">
              Display name (optional)
            </Label>
            <Input
              id="chat-label"
              value={name}
              placeholder="Office Group"
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={submitOnEnter}
              className="border-gray-400"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={value.trim().length === 0}>
              Protect chat
            </Button>
          </div>
        </div>
      </SettingSection>
    </div>
  );
}
