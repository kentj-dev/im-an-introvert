import { useState } from 'react';
import { AppHeader } from '@/popup/components/AppHeader';
import { AboutView } from '@/popup/components/views/AboutView';
import { AddChatView } from '@/popup/components/views/AddChatView';
import { ChatDetailView } from '@/popup/components/views/ChatDetailView';
import { HomeView } from '@/popup/components/views/HomeView';
import { PlatformView } from '@/popup/components/views/PlatformView';
import { ProtectedChatsView } from '@/popup/components/views/ProtectedChatsView';
import { useCurrentTab } from '@/popup/hooks/useCurrentTab';
import { useSettings } from '@/popup/hooks/useSettings';
import { useStats } from '@/popup/hooks/useStats';
import type { PlatformId, ProtectedChat } from '@/shared/types';
import { createProtectedChat } from '@/storage/defaults';
import { resetStats } from '@/storage/stats';
import {
  addProtectedChat,
  listProtectedChats,
  patchProtectedChat,
  removeProtectedChat,
  resetAllSettings,
  resetPlatform,
  setLeaveMeAloneMode,
} from '@/storage/storage';

type View =
  | { kind: 'home' }
  | { kind: 'platform'; platform: PlatformId }
  | { kind: 'chats' }
  | { kind: 'chat'; id: string }
  | { kind: 'add' }
  | { kind: 'about' };

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="max-h-[580px] w-96 overflow-y-auto p-3">{children}</div>;
}

export function App() {
  const { settings, update, run } = useSettings();
  const stats = useStats();
  const current = useCurrentTab();
  // A stack rather than a single value, so Back always returns where you came
  // from: a chat opened from Protected Chats goes back there, not home.
  const [stack, setStack] = useState<View[]>([{ kind: 'home' }]);

  const view = stack[stack.length - 1] ?? { kind: 'home' };
  const push = (next: View): void => setStack((current) => [...current, next]);
  const back = (): void => setStack((current) => (current.length > 1 ? current.slice(0, -1) : current));
  const reset = (next: View): void => setStack([next]);

  const header = (
    <AppHeader
      {...(view.kind === 'home' ? {} : { onBack: back })}
      {...(view.kind === 'home' ? { onOpenSettings: () => push({ kind: 'about' }) } : {})}
      onAddChat={() => push({ kind: 'add' })}
      onResetStats={() => void resetStats()}
      onAbout={() => push({ kind: 'about' })}
    />
  );

  if (!settings) {
    return (
      <Shell>
        {header}
        <p className="px-1 text-[12px] text-muted-foreground">Loading settings…</p>
      </Shell>
    );
  }

  const protectCurrentChat = (): void => {
    const id = current?.conversationId;
    if (!id) return;
    run(() =>
      addProtectedChat(
        createProtectedChat(id, { name: current?.chatName, subtitle: current?.chatSubtitle }),
      ),
    );
    push({ kind: 'chat', id });
  };

  const addManually = (id: string, name?: string): void => {
    run(() => addProtectedChat(createProtectedChat(id, { name })));
    setStack((current) => [...current.slice(0, -1), { kind: 'chat', id }]);
  };

  const patchChat = (id: string, patch: Partial<Omit<ProtectedChat, 'id'>>): void => {
    run(() => patchProtectedChat(id, patch));
  };

  const body = (() => {
    switch (view.kind) {
      case 'platform':
        return (
          <PlatformView
            platform={view.platform}
            settings={settings}
            update={update}
            resetPlatform={() => run(() => resetPlatform(view.platform))}
            onOpenProtectedChats={() => push({ kind: 'chats' })}
          />
        );

      case 'chats':
        return (
          <ProtectedChatsView
            settings={settings}
            current={current}
            onProtectCurrent={protectCurrentChat}
            onOpenChat={(id) => push({ kind: 'chat', id })}
            onAddManually={() => push({ kind: 'add' })}
          />
        );

      case 'chat': {
        const chat = settings.protectedChats[view.id];
        // Protection can be removed from another popup while this is open.
        if (!chat) {
          return (
            <ProtectedChatsView
              settings={settings}
              current={current}
              onProtectCurrent={protectCurrentChat}
              onOpenChat={(id) => push({ kind: 'chat', id })}
              onAddManually={() => push({ kind: 'add' })}
            />
          );
        }
        return (
          <ChatDetailView
            chat={chat}
            globals={settings.facebook.messenger}
            onPatch={(patch) => patchChat(chat.id, patch)}
            onRemove={() => {
              run(() => removeProtectedChat(chat.id));
              back();
            }}
          />
        );
      }

      case 'add':
        return (
          <AddChatView
            existingIds={listProtectedChats(settings).map((chat) => chat.id)}
            onAdd={addManually}
            onCancel={back}
          />
        );

      case 'about':
        return (
          <AboutView
            stats={stats}
            onResetStats={() => void resetStats()}
            onResetAll={() => {
              run(resetAllSettings);
              reset({ kind: 'home' });
            }}
          />
        );

      case 'home':
      default:
        return (
          <HomeView
            settings={settings}
            stats={stats}
            current={current}
            onToggleLeaveMeAlone={(enabled) => run(() => setLeaveMeAloneMode(enabled))}
            onOpenPlatform={(platform) => push({ kind: 'platform', platform })}
            onOpenProtectedChats={() => push({ kind: 'chats' })}
          />
        );
    }
  })();

  return (
    <Shell>
      {header}
      {body}
    </Shell>
  );
}
