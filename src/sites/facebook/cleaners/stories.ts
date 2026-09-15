/**
 * Hides the interaction strip at the bottom of a Facebook Story.
 *
 * The strategy is deliberately anchor-based: find the reply box (a textbox is
 * one of the few reliably identifiable elements), then walk up only as far as
 * is provably safe. An ancestor is unsafe as soon as it contains story
 * navigation, the close button, playback controls or the story media, so the
 * story stays fully watchable and navigable.
 */
import { RULES } from "../../../shared/constants";
import { debugOnce } from "../../../shared/debug";
import type { ExtensionSettings } from "../../../shared/types";
import { applyRule } from "../../shared/hider";
import { ascendWhileSafe, containsAny, queryAll } from "../../shared/query";
import { createFloatingChatTest } from "../../messenger/floating";
import { facebookSelectors, isStoryRoute } from "../selectors";

/** Drops targets that are already inside another target. */
function dropNested(elements: HTMLElement[]): HTMLElement[] {
  return elements.filter(
    (element) =>
      !elements.some((other) => other !== element && other.contains(element)),
  );
}

function isSafeStoryAncestor(candidate: HTMLElement): boolean {
  return !containsAny(candidate, facebookSelectors.storyProtected);
}

function findStoryActionTargets(): HTMLElement[] {
  if (!isStoryRoute(location.pathname)) return [];

  const targets: HTMLElement[] = [];
  const isInsideChat = createFloatingChatTest();

  // The current story composer has no stable attribute of its own. Its
  // sibling reaction tray does: role="dialog" aria-label="Reactions". On the
  // already-verified /stories/ route, climb from that anchor to the highest
  // safe bottom-strip wrapper so both the tray and message field disappear.
  for (const tray of queryAll(
    document,
    facebookSelectors.storyReactionTray,
  ).filter((candidate) => !isInsideChat(candidate))) {
    targets.push(ascendWhileSafe(tray, isSafeStoryAncestor, 6));
  }

  // Facebook keeps adjacent stories mounted and swaps which one is active.
  // Query every composer on the dedicated story route instead of trusting the
  // first viewer container, which can point at the story that just closed.
  const composers = queryAll(
    document,
    facebookSelectors.storyReplyComposer,
  ).filter((composer) => !isInsideChat(composer));
  for (const composer of composers) {
    // The reply box sits inside the bottom bar, so the highest safe ancestor
    // is the bar itself — including the emoji row and send button next to it.
    targets.push(ascendWhileSafe(composer, isSafeStoryAncestor, 6));
  }
  if (composers.length === 0) {
    debugOnce("story:no-composer", "story reply composer not found");
  }

  // Quick reactions can render outside the composer's subtree, so they are
  // collected separately with a much shorter ascent.
  for (const action of queryAll(
    document,
    facebookSelectors.storyQuickActions,
  ).filter((candidate) => !isInsideChat(candidate))) {
    targets.push(ascendWhileSafe(action, isSafeStoryAncestor, 2));
  }

  return dropNested(targets.filter((target) => target !== document.body));
}

export function applyStoryCleanup(settings: ExtensionSettings): void {
  applyRule(
    RULES.storyActions,
    settings.facebook.hideStoryActions,
    findStoryActionTargets,
  );
}
