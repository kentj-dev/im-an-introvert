import { useEffect, useState } from "react";
import type { UsageStats } from "@/shared/types";
import { emptyStats, loadStats, watchStats } from "@/storage/stats";

/** Today's local-only counters, kept live while the popup is open. */
export function useStats(): UsageStats {
  const [stats, setStats] = useState<UsageStats>(emptyStats);

  useEffect(() => {
    let active = true;
    void loadStats().then((loaded) => {
      if (active) setStats(loaded);
    });
    const unwatch = watchStats(setStats);
    return () => {
      active = false;
      unwatch();
    };
  }, []);

  return stats;
}
