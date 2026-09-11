/**
 * Hides the interaction strip at the bottom of a Facebook Story.
 *
 * The strategy is deliberately anchor-based: find the reply box (a textbox is
 * one of the few reliably identifiable elements), then walk up only as far as
 * is provably safe. An ancestor is unsafe as soon as it contains story
 * navigation, the close button, playback controls or the story media, so the
 * story stays fully watchable and navigable.
 */
import { RULES } from '../../../shared/constants';
import { debugOnce } from '../../../shared/debug';
import type { ExtensionSettings } from '../../../shared/types';
import { applyRule } from '../../shared/hider';
import {
  ascendWhileSafe,
  containsAny,
  queryAll,
  queryOne,
} from '../../shared/query';
import { facebookSelectors, isStoryRoute } from '../selectors';

/** Drops targets that are already inside another target. */
function dropNested(elements: HTMLElement[]): HTMLElement[] {
  return elements.filter(
    (element) => !elements.some((other) => other !== element && other.contains(element)),
  );
}

function isSafeStoryAncestor(candidate: HTMLElement): boolean {
  return !containsAny(candidate, facebookSelectors.storyProtected);
}

function findStoryActionTargets(): HTMLElement[] {
  if (!isStoryRoute(location.pathname)) return [];

  const viewer = queryOne(document, facebookSelectors.storyViewer);
  if (!viewer) {
    debugOnce('story:no-viewer', 'story viewer not found');
    return [];
  }

  const targets: HTMLElement[] = [];

  const composer = queryOne(viewer, facebookSelectors.storyReplyComposer);
  if (composer) {
    // The reply box sits inside the bottom bar, so the highest safe ancestor
    // is the bar itself — including the emoji row and send button next to it.
    targets.push(ascendWhileSafe(composer, isSafeStoryAncestor, 6));
  } else {
    debugOnce('story:no-composer', 'story reply composer not found');
  }

  // Quick reactions can render outside the composer's subtree, so they are
  // collected separately with a much shorter ascent.
  for (const action of queryAll(viewer, facebookSelectors.storyQuickActions)) {
    targets.push(ascendWhileSafe(action, isSafeStoryAncestor, 2));
  }

  return dropNested(targets.filter((target) => target !== document.body));
}

export function applyStoryCleanup(settings: ExtensionSettings): void {
  applyRule(RULES.storyActions, settings.facebook.hideStoryActions, findStoryActionTargets);
}
