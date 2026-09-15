/**
 * Hides Instagram post actions: like, comment, share, save, or the whole
 * action bar. The photo, video, caption and comments are never touched.
 */
import { RULES, type RuleKey } from "../../../shared/constants";
import type { ExtensionSettings } from "../../../shared/types";
import { applyRule } from "../../shared/hider";
import {
  ascendUntil,
  containsAny,
  queryAll,
  type SelectorCandidates,
} from "../../shared/query";
import {
  instagramPostActionCandidates,
  instagramSelectors,
} from "../selectors";

const POST_ROOT_SELECTOR = "article";

function posts(): HTMLElement[] {
  return queryAll(document, instagramSelectors.postRoot);
}

function actionsIn(
  post: HTMLElement,
  candidates: SelectorCandidates,
): HTMLElement[] {
  return queryAll(post, candidates).filter(
    (element) => element.closest(POST_ROOT_SELECTOR) === post,
  );
}

function findAction(candidates: SelectorCandidates): HTMLElement[] {
  return posts().flatMap((post) => actionsIn(post, candidates));
}

/**
 * The action bar is derived, not guessed: the nearest ancestor of an action
 * button that holds at least two actions and none of the post's content. If
 * that cannot be established the buttons themselves are hidden instead.
 */
function findActionBars(): HTMLElement[] {
  const bars: HTMLElement[] = [];

  for (const post of posts()) {
    const actions = actionsIn(post, instagramPostActionCandidates);
    const anchor = actions[0];
    if (!anchor) continue;

    const bar = ascendUntil(
      anchor,
      (candidate) =>
        actions.filter((action) => candidate.contains(action)).length >= 2 &&
        !containsAny(candidate, instagramSelectors.postContent),
      6,
    );

    if (bar && bar !== post) bars.push(bar);
    else bars.push(...actions);
  }

  return bars;
}

export function applyInstagramPostCleanup(settings: ExtensionSettings): void {
  const posts = settings.instagram.posts;

  applyRule(RULES.igPostActionBar, posts.hideEntireActionBar, findActionBars);

  const individual: ReadonlyArray<[RuleKey, boolean, SelectorCandidates]> = [
    [RULES.igPostLike, posts.hideLike, instagramSelectors.postLike],
    [RULES.igPostComment, posts.hideComment, instagramSelectors.postComment],
    [RULES.igPostShare, posts.hideShare, instagramSelectors.postShare],
    [RULES.igPostSave, posts.hideSave, instagramSelectors.postSave],
  ];

  for (const [rule, enabled, candidates] of individual) {
    applyRule(rule, enabled, () => findAction(candidates));
  }
}
