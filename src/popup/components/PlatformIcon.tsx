import { cn } from "@/popup/lib/utils";
import type { PlatformMeta } from "@/popup/platforms";

interface PlatformIconProps {
  platform: PlatformMeta;
  size?: "list" | "header";
}

export function PlatformIcon({ platform, size = "list" }: PlatformIconProps) {
  const instagram = platform.id === "instagram";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl",
        size === "header" ? "size-11" : "size-10",
        instagram && "instagram-gradient p-1.5",
      )}
    >
      <img
        src={platform.icon}
        alt=""
        className={cn("size-full object-contain", !instagram && "rounded-xl")}
      />
    </span>
  );
}
