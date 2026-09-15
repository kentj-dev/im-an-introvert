import { Switch } from "@/popup/components/ui/switch";
import { FREE_LIMITS } from "@/shared/constants";
import { Moon } from "lucide-react";
import { useEffect, useState } from "react";

interface LeaveMeAloneCardProps {
  enabled: boolean;
  /** Epoch ms when the running session switches itself off. */
  endsAt: number | null;
  onChange: (next: boolean) => void;
}

/** "1 hour", "2 hours", "30 minutes". */
function sessionLength(): string {
  const minutes = Math.round(FREE_LIMITS.leaveMeAloneMs / 60_000);
  if (minutes % 60 !== 0) return `${minutes} minutes`;
  const hours = minutes / 60;
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

/** Rounded up, so it never reads "0 min" while the mode is still on. */
function timeLeft(endsAt: number, now: number): string {
  const ms = endsAt - now;
  if (ms < 60_000) return "Turns off in under a minute.";
  return `Turns off in ${Math.ceil(ms / 60_000)} min.`;
}

/**
 * A preset rather than a mode with its own state: switching it on writes the
 * recommended cleanup for every platform, and it reads back on while those
 * settings are in place. That includes Messenger's global call, group and chat
 * field rules; protected chats keep their own records. Each activation ends on
 * its own after FREE_LIMITS.leaveMeAloneMs and puts the previous settings back.
 */
export function LeaveMeAloneCard({
  enabled,
  endsAt,
  onChange,
}: LeaveMeAloneCardProps) {
  const [now, setNow] = useState(Date.now);
  const running = enabled && endsAt !== null;

  useEffect(() => {
    if (!running) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, [running, endsAt]);

  return (
    <div className="flex items-center gap-3 rounded-md bg-[#f2f1fd] dark:bg-tint-night border border-edge shadow-none px-3 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/70 dark:bg-white/10 text-tint-night-foreground">
        <Moon className="size-[18px]" strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-tight font-medium">
          Leave me alone mode
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
          {running
            ? timeLeft(endsAt, now)
            : `Blur side panels and hide social noise, Messenger calls, group actions, and chat for ${sessionLength()}.`}
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onChange}
        aria-label="Leave me alone mode"
      />
    </div>
  );
}
