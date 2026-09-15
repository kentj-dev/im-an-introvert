import { Card } from "@/popup/components/ui/card";
import type { UsageStats } from "@/shared/types";
import { formatDuration } from "@/storage/stats";
import { EyeOff, Leaf, type LucideIcon } from "lucide-react";

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <Card className="flex-1 gap-0 px-3 py-3 shadow-none border rounded-md border-gray-400">
      <span className="flex size-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="size-[15px]" strokeWidth={1.9} />
      </span>
      <p className="mt-2 text-[20px] leading-none font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
        {label}
      </p>
    </Card>
  );
}

/**
 * Today's two local counters. They live in chrome.storage.local, hold nothing
 * but numbers, and reset when the day turns over.
 */
export function QuickStats({ stats }: { stats: UsageStats }) {
  return (
    <section className="space-y-1.5">
      <h2 className="px-0.5 text-[15px] leading-tight font-semibold tracking-tight">
        Quick Stats
      </h2>
      <div className="flex gap-2.5">
        <StatCard
          icon={EyeOff}
          value={stats.hiddenCount.toLocaleString()}
          label="Elements hidden today"
        />
        <StatCard
          icon={Leaf}
          value={formatDuration(stats.activeSeconds)}
          label="Distraction-free browsing"
        />
      </div>
    </section>
  );
}
