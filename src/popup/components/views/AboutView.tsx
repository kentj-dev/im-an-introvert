import hamikenLogo from "@/assets/hamiken.png";
import { SettingSection } from "@/popup/components/SettingSection";
import { Button } from "@/popup/components/ui/button";
import type { ThemePreference } from "@/popup/lib/theme";
import { cn } from "@/popup/lib/utils";
import { MAKER_URL } from "@/shared/constants";
import type { UsageStats } from "@/shared/types";
import { formatDuration } from "@/storage/stats";
import {
  ExternalLink,
  Lock,
  Monitor,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

interface AboutViewProps {
  stats: UsageStats;
  theme: ThemePreference;
  onThemeChange: (next: ThemePreference) => void;
  onResetStats: () => void;
  onResetAll: () => void;
}

const THEME_OPTIONS: ReadonlyArray<{
  value: ThemePreference;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

function ActionRow({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-tight">{title}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export function AboutView({
  stats,
  theme,
  onThemeChange,
  onResetStats,
  onResetAll,
}: AboutViewProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-3.5">
      <div className="px-0.5">
        <h2 className="text-[19px] leading-tight font-semibold tracking-tight">
          Settings and privacy
        </h2>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
          What this extension keeps, and how to clear it.
        </p>
      </div>

      <div className="flex gap-3 rounded-sm shadow-none border border-edge bg-tint-night px-3 py-3">
        <Lock
          className="mt-0.5 size-[16px] shrink-0 text-tint-night-foreground"
          strokeWidth={1.9}
        />
        <p className="text-[12px] leading-snug">
          Everything runs on this device. No accounts, no analytics, and nothing
          is sent anywhere; the only page it ever opens itself is a one-time
          thank-you page after install. Your settings and protected chat IDs
          live in Chrome storage; message content is never read or stored.
        </p>
      </div>

      <SettingSection
        title="Appearance"
        description="System follows your device's light or dark setting."
      >
        <div
          role="radiogroup"
          aria-label="Theme"
          className="grid grid-cols-3 gap-1.5 px-3 py-2.5"
        >
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
            const selected = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onThemeChange(value)}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-edge px-2 py-1.5 text-[12.5px] transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  selected
                    ? "bg-tint-site font-medium text-tint-site-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" strokeWidth={2} />
                {label}
              </button>
            );
          })}
        </div>
      </SettingSection>

      <SettingSection
        title="Quick Stats"
        description="Two counters for today, stored locally and never synced."
      >
        <ActionRow
          title={`${stats.hiddenCount.toLocaleString()} elements hidden`}
          description={`${formatDuration(stats.activeSeconds)} of distraction-free browsing today.`}
          action={
            <Button variant="outline" size="sm" onClick={onResetStats}>
              Reset
            </Button>
          }
        />
      </SettingSection>

      <SettingSection title="Everything else">
        <ActionRow
          title="Reset all settings"
          description={
            confirming
              ? "This also removes every protected chat."
              : "Puts every platform and protected chat back to defaults."
          }
          action={
            confirming ? (
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive!"
                  onClick={() => {
                    onResetAll();
                    setConfirming(false);
                  }}
                >
                  Reset all
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirming(true)}
              >
                Reset
              </Button>
            )
          }
        />
      </SettingSection>

      <SettingSection title="Maker">
        {/* The logo ships with the extension; only clicking opens the site. */}
        <a
          href={MAKER_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <img
            src={hamikenLogo}
            alt=""
            className="size-9 shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] leading-tight font-medium">Hamiken</p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
              apps.hamiken.com
            </p>
          </div>
          <ExternalLink
            className="size-4 shrink-0 text-muted-foreground"
            strokeWidth={2}
          />
        </a>
      </SettingSection>
    </div>
  );
}
