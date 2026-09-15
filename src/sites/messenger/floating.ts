/**
 * Finds Facebook's floating Messenger chat widgets.
 *
 * Several `floatingThreadRoot` candidates are generic (a dialog holding a
 * textbox, grid or log). That also describes the Story viewer when Facebook
 * opens it as an overlay above the feed — which is what happens when a story
 * is clicked from the tray, but not when /stories/ is loaded directly. Left
 * unfiltered, the whole viewer counts as a chat widget: the Story cleaner
 * skips its reply bar and the Messenger cleaners claim it instead.
 */
import { facebookSelectors, isStoryRoute } from "../facebook/selectors";
import { containsAny, queryAll } from "../shared/query";
import { messengerSelectors } from "./selectors";

/** Markers only the Story viewer carries, never a chat tab. */
const STORY_VIEWER_MARKERS = [
  ...facebookSelectors.storyReactionTray,
  '[aria-label="Next card"]',
  '[aria-label="Previous card"]',
];

export function queryFloatingThreadRoots(): HTMLElement[] {
  const roots = queryAll(document, messengerSelectors.floatingThreadRoot);
  if (!isStoryRoute(location.pathname)) return roots;
  return roots.filter((root) => !containsAny(root, STORY_VIEWER_MARKERS));
}

export function isInsideFloatingChat(element: HTMLElement): boolean {
  return queryFloatingThreadRoots().some((root) => root.contains(element));
}

const MAX_CHAT_TAB_DEPTH = 25;

/**
 * True when `element` sits in one of Facebook's floating chat tabs: walking
 * up, some ancestor holds the tab's window controls ("Minimize chat", "Close
 * chat") before any ancestor reaches the feed, page header or Story viewer.
 *
 * Inside a dialog, that dialog must itself be the chat. A post dialog can share
 * a layer with the chat dock, and its comment box must never count.
 */
export function isInsideChatTab(element: HTMLElement): boolean {
  const dialog = element.closest('[role="dialog"]');
  if (dialog && !containsAny(dialog, facebookSelectors.chatWidgetAnchors))
    return false;

  let current = element.parentElement;
  for (
    let depth = 0;
    depth < MAX_CHAT_TAB_DEPTH && current && current !== document.body;
    depth++
  ) {
    if (containsAny(current, facebookSelectors.chatWidgetProtected))
      return false;
    if (containsAny(current, facebookSelectors.chatWidgetAnchors)) return true;
    current = current.parentElement;
  }
  return false;
}
