/**
 * Hides the interaction strip at the bottom of an Instagram story.
 *
 * Same anchor-then-ascend approach as the Facebook story cleaner: find the
 * reply box, walk up only while no ancestor contains navigation, playback,
 * the media or the author link. No anchor means nothing is hidden.
 */
import { RULES } from '../../../shared/constants';
import { debugOnce } from '../../../shared/debug';
import type { ExtensionSettings } from '../../../shared/types';
import { applyRule } from '../../shared/hider';
import { ascendWhileSafe, containsAny, queryAll, queryOne } from '../../shared/query';
import { instagramSelectors, isInstagramStoryRoute } from '../selectors';

function dropNested(elements: HTMLElement[]): HTMLElement[] {
  return elements.filter(
    (element) => !elements.some((other) => other !== element && other.contains(element)),
  );
}

function isSafeAncestor(candidate: HTMLElement): boolean {
  return !containsAny(candidate, instagramSelectors.storyProtected);
}

function findStoryActionTargets(): HTMLElement[] {
  if (!isInstagramStoryRoute(location.pathname)) return [];

  const viewer = queryOne(document, instagramSelectors.storyViewer);
  if (!viewer) {
    debugOnce('ig-story:no-viewer', 'instagram story viewer not found');
    return [];
  }

  const targets: HTMLElement[] = [];

  const composer = queryOne(viewer, instagramSelectors.storyReplyComposer);
  if (composer) {
    targets.push(ascendWhileSafe(composer, isSafeAncestor, 5));
  } else {
    debugOnce('ig-story:no-composer', 'instagram story reply box not found');
  }

  for (const action of queryAll(viewer, instagramSelectors.storyQuickActions)) {
    targets.push(ascendWhileSafe(action, isSafeAncestor, 2));
  }

  return dropNested(targets.filter((target) => target !== document.body));
}

export function applyInstagramStoryCleanup(settings: ExtensionSettings): void {
  applyRule(RULES.igStoryActions, settings.instagram.hideStoryActions, findStoryActionTargets);
}
