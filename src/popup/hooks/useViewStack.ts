import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { PLATFORMS } from "@/popup/platforms";
import type { PlatformId } from "@/shared/types";

export type View =
  | { kind: "home" }
  | { kind: "platform"; platform: PlatformId }
  | { kind: "chats" }
  | { kind: "chat"; id: string }
  | { kind: "add" }
  | { kind: "about" };

/** Reopening the popup within this long picks up where it was closed. */
export const VIEW_RESTORE_MS = 10 * 60 * 1000;

/**
 * The popup's page stack, kept in the popup's own localStorage. It is UI
 * state only: which page was open, never anything read from a site. Being
 * synchronous is the point — the saved page renders on the first frame
 * instead of flashing home first.
 */
const VIEW_KEY = "introvert:popup-view";

/**
 * How often an open popup refreshes the saved time. A popup closing is not
 * guaranteed to fire pagehide, and without this a popup left open for a while
 * would come back as if it had been closed when it was opened.
 */
const HEARTBEAT_MS = 15_000;

const HOME: View[] = [{ kind: "home" }];

function isView(value: unknown): value is View {
  if (typeof value !== "object" || value === null) return false;
  const view = value as Record<string, unknown>;
  switch (view.kind) {
    case "home":
    case "chats":
    case "add":
    case "about":
      return true;
    case "platform":
      return PLATFORMS.some((platform) => platform.id === view.platform);
    case "chat":
      return typeof view.id === "string" && view.id.length > 0;
    default:
      return false;
  }
}

function readSavedStack(now = Date.now()): View[] {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    if (!raw) return HOME;
    const saved = JSON.parse(raw) as { stack?: unknown; savedAt?: unknown };
    const { savedAt, stack } = saved;
    if (typeof savedAt !== "number" || savedAt > now) return HOME;
    if (now - savedAt > VIEW_RESTORE_MS) return HOME;
    if (!Array.isArray(stack) || stack.length === 0) return HOME;
    return stack.every(isView) ? stack : HOME;
  } catch {
    // Unreadable or blocked storage: start from home, as a fresh popup would.
    return HOME;
  }
}

function saveStack(stack: readonly View[]): void {
  try {
    localStorage.setItem(
      VIEW_KEY,
      JSON.stringify({ stack, savedAt: Date.now() }),
    );
  } catch {
    // Remembering the page is a convenience; never let it break the popup.
  }
}

/**
 * The popup's navigation stack, restored if the popup was closed less than
 * VIEW_RESTORE_MS ago and reset to home otherwise.
 */
export function useViewStack(): [View[], Dispatch<SetStateAction<View[]>>] {
  const [stack, setStack] = useState<View[]>(() => readSavedStack());

  useEffect(() => {
    saveStack(stack);
    const save = (): void => saveStack(stack);
    const timer = setInterval(save, HEARTBEAT_MS);
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", save);
    };
  }, [stack]);

  return [stack, setStack];
}
