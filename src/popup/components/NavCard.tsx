import { cn } from "@/popup/lib/utils";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface NavCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** An image instead of an icon, for platform logos. */
  image?: string;
  badge?: ReactNode;
  onClick?: () => void;
  /** Tinted variants used by the "Protected chats" and "Current site" cards. */
  tone?: "plain" | "site";
  className?: string;
}

/**
 * A tappable row that leads somewhere. Rendered as a button when it navigates
 * and a plain div when it is only informational, so nothing unclickable ever
 * takes keyboard focus.
 */
export function NavCard({
  title,
  description,
  icon: Icon,
  image,
  badge,
  onClick,
  tone = "plain",
  className,
}: NavCardProps) {
  const inner = (
    <>
      {image ? (
        <img src={image} alt="" className="size-10 shrink-0 rounded-xl" />
      ) : Icon ? (
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            tone === "site"
              ? "bg-white/70 text-tint-site-foreground dark:bg-white/10"
              : "bg-tint-site text-tint-site-foreground",
          )}
        >
          <Icon className="size-[18px]" strokeWidth={1.9} />
        </span>
      ) : null}

      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[14px] leading-tight font-medium">
          {title}
        </span>
        {description ? (
          <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>

      {badge}
      {onClick ? (
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          strokeWidth={2}
        />
      ) : null}
    </>
  );

  const shell = cn(
    "group flex w-full items-center gap-3 rounded-md border border-edge! px-3 py-2.5 shadow-none transition-colors",
    tone === "site" ? "bg-tint-site" : "bg-card",
    onClick && (tone === "site" ? "hover:bg-tint-site/70" : "hover:bg-accent"),
    onClick &&
      "cursor-pointer focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
    className,
  );

  if (!onClick) return <div className={shell}>{inner}</div>;

  return (
    <button type="button" onClick={onClick} className={shell}>
      {inner}
    </button>
  );
}
