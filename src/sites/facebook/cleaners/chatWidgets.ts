/**
 * Hides Facebook's floating Messenger chat widgets: the tabs that pop open in
 * the corner of facebook.com when a message arrives.
 *
 * Anchored on the tab's own header controls ("Minimize chat", "Close chat"),
 * then climbed to the widget. The climb targets the outermost ancestor that
 * carries Messenger's `--mwp-` theme variables — the chat tab's own root — and
 * never passes an ancestor holding the feed, page header, navigation, the
 * contacts rail or the Story viewer. Full Messenger at /messages is untouched:
 * the Facebook module does not run there.
 */
import { RULES } from "../../../shared/constants";
import type { ExtensionSettings } from "../../../shared/types";
import { applyRule } from "../../shared/hider";
import { ascendWhileSafe, containsAny, queryAll } from "../../shared/query";
import { facebookSelectors } from "../selectors";

const MAX_WIDGET_DEPTH = 25;

/** Positioning wrappers directly around the themed root, e.g. its shadow. */
const WRAPPER_ASCENT_DEPTH = 2;

/** Without a themed root, stay close to the header controls. */
const FALLBACK_ASCENT_DEPTH = 4;

function isSafeWidgetAncestor(candidate: HTMLElement): boolean {
  return !containsAny(candidate, facebookSelectors.chatWidgetProtected);
}

/** Outermost safe ancestor matching the chat tab's themed root, if any. */
function themedRootOf(anchor: HTMLElement): HTMLElement | null {
  let root: HTMLElement | null = null;
  let current = anchor.parentElement;
  for (let depth = 0; depth < MAX_WIDGET_DEPTH && current; depth++) {
    if (current === document.body || !isSafeWidgetAncestor(current)) break;
    if (
      facebookSelectors.chatWidgetRoot.some((selector) =>
        current?.matches(selector),
      )
    ) {
      root = current;
    }
    current = current.parentElement;
  }
  return root;
}

function findChatWidgets(): HTMLElement[] {
  const widgets = new Set<HTMLElement>();
  for (const anchor of queryAll(
    document,
    facebookSelectors.chatWidgetAnchors,
  )) {
    const root = themedRootOf(anchor);
    widgets.add(
      root
        ? ascendWhileSafe(root, isSafeWidgetAncestor, WRAPPER_ASCENT_DEPTH)
        : ascendWhileSafe(anchor, isSafeWidgetAncestor, FALLBACK_ASCENT_DEPTH),
    );
  }

  // Two tabs can resolve to one shared wrapper; hide only the outermost.
  const found = [...widgets];
  return found.filter(
    (widget) =>
      !found.some((other) => other !== widget && other.contains(widget)),
  );
}

export function applyChatWidgetCleanup(settings: ExtensionSettings): void {
  applyRule(
    RULES.chatWidgets,
    settings.facebook.hideChatWidgets,
    findChatWidgets,
  );
}
