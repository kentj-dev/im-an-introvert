/**
 * Hides Facebook post actions: Like, Comment, Share, Send, the reaction
 * picker, or the whole action bar.
 *
 * Only the controls go away — post text, media and reaction counts stay
 * exactly where they were. Comment actions are left alone: nested
 * `role="article"` elements (comments) are filtered out so "Hide Like" does
 * not quietly strip reply controls inside threads.
 */
import { RULES, type RuleKey } from '../../../shared/constants';
import type { ExtensionSettings } from '../../../shared/types';
import { applyRule } from '../../shared/hider';
import {
  ascendUntil,
  containsAny,
  queryAll,
  type SelectorCandidates,
} from '../../shared/query';
import { facebookSelectors, postActionCandidates } from '../selectors';

const POST_ROOT_SELECTOR = 'div[role="article"]';

/** Feed-level posts only; comments are articles nested inside a post. */
function topLevelPosts(): HTMLElement[] {
  return queryAll(document, facebookSelectors.postRoot).filter(
    (post) => post.parentElement?.closest(POST_ROOT_SELECTOR) == null,
  );
}

function belongsToPost(element: HTMLElement, post: HTMLElement): boolean {
  return element.closest(POST_ROOT_SELECTOR) === post;
}

function actionsIn(post: HTMLElement, candidates: SelectorCandidates): HTMLElement[] {
  return queryAll(post, candidates).filter((element) => belongsToPost(element, post));
}

function findAction(candidates: SelectorCandidates): HTMLElement[] {
  return topLevelPosts().flatMap((post) => actionsIn(post, candidates));
}

/**
 * The action bar is not identifiable on its own, so it is derived: the nearest
 * ancestor of an action button that contains at least two action buttons and
 * none of the post's content. If that cannot be established the individual
 * buttons are hidden instead, which looks the same and cannot over-reach.
 */
function findActionBars(): HTMLElement[] {
  const bars: HTMLElement[] = [];

  for (const post of topLevelPosts()) {
    const actions = actionsIn(post, postActionCandidates);
    const anchor = actions[0];
    if (!anchor) continue;

    const bar = ascendUntil(
      anchor,
      (candidate) =>
        actions.filter((action) => candidate.contains(action)).length >= 2 &&
        !containsAny(candidate, facebookSelectors.postContent),
      6,
    );

    if (bar && bar !== post) bars.push(bar);
    else bars.push(...actions);
  }

  return bars;
}

/**
 * The reaction picker mounts in a portal near the end of <body>, not inside
 * the post, so it is looked up document-wide.
 */
function findReactionControls(): HTMLElement[] {
  return queryAll(document, facebookSelectors.postReactions);
}

export function applyPostCleanup(settings: ExtensionSettings): void {
  const posts = settings.facebook.posts;

  applyRule(RULES.postActionBar, posts.hideEntireActionBar, findActionBars);

  // Individual rules still run while the bar rule is on; markers are reference
  // counted, so turning the bar rule off leaves the individual ones intact.
  const individual: ReadonlyArray<[RuleKey, boolean, SelectorCandidates]> = [
    [RULES.postLike, posts.hideLike, facebookSelectors.postLike],
    [RULES.postComment, posts.hideComment, facebookSelectors.postComment],
    [RULES.postShare, posts.hideShare, facebookSelectors.postShare],
    [RULES.postSend, posts.hideSend, facebookSelectors.postSend],
  ];

  for (const [rule, enabled, candidates] of individual) {
    applyRule(rule, enabled, () => findAction(candidates));
  }

  applyRule(RULES.postReactions, posts.hideReactions, findReactionControls);
}
