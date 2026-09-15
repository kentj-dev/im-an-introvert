import { Switch } from '@/popup/components/ui/switch';
import { Moon } from 'lucide-react';

interface LeaveMeAloneCardProps {
  enabled: boolean;
  onChange: (next: boolean) => void;
}

/**
 * A preset rather than a mode with its own state: switching it on writes the
 * recommended cleanup for every platform, and it reads back on while those
 * settings are in place. That includes Messenger's global call, group and chat
 * field rules; protected chats keep their own records.
 */
export function LeaveMeAloneCard({ enabled, onChange }: LeaveMeAloneCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-[#f2f1fd] border border-gray-400 shadow-none px-3 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-tint-night-foreground">
        <Moon className="size-[18px]" strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-tight font-medium">Leave me alone mode</p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
          Hide social noise, Messenger calls, group actions, and chat.
        </p>
      </div>
      <Switch checked={enabled} onCheckedChange={onChange} aria-label="Leave me alone mode" />
    </div>
  );
}
