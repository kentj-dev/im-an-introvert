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
import { ascendUntil, containsAny, queryAll, type SelectorCandidates } from '../../shared/query';
import { facebookSelectors, isStoryRoute } from '../selectors';

const POST_ROOT_SELECTOR = '[aria-posinset], div[role="article"]';
const BUTTON_SELECTOR = 'button, a[role="button"], div[role="button"], [role="button"]';
const RENDERED_POST_ACTION_SELECTOR = [
  '[data-ad-rendering-role="like_button"]',
  '[data-ad-rendering-role="comment_button"]',
  '[data-ad-rendering-role="share_button"]',
] as const;

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

/** Resolve nested labels/wrappers to the actual interactive control. */
function physicalAction(element: HTMLElement): HTMLElement | null {
  if (element.matches(BUTTON_SELECTOR)) return element;

  const ancestor = element.closest(BUTTON_SELECTOR);
  if (ancestor instanceof HTMLElement) return ancestor;

  const descendant = element.querySelector(BUTTON_SELECTOR);
  return descendant instanceof HTMLElement ? descendant : null;
}

function physicalActionsIn(root: ParentNode, candidates: SelectorCandidates): HTMLElement[] {
  return [
    ...new Set(
      queryAll(root, candidates)
        .map(physicalAction)
        .filter((element): element is HTMLElement => element !== null),
    ),
  ];
}

function physicalActionsInPost(post: HTMLElement, candidates: SelectorCandidates): HTMLElement[] {
  return physicalActionsIn(post, candidates).filter((element) => belongsToPost(element, post));
}

function findAction(candidates: SelectorCandidates): HTMLElement[] {
  return topLevelPosts().flatMap((post) => actionsIn(post, candidates));
}

function distinctActionKindsWithin(candidate: HTMLElement, groups: readonly HTMLElement[][]): number {
  return groups.filter((group) => group.some((action) => candidate.contains(action))).length;
}

/** Collapse a labelled child and its matching wrapper into one physical control. */
function outermostActionControls(actions: readonly HTMLElement[]): HTMLElement[] {
  return actions.filter((action) => !actions.some((other) => other !== action && other.contains(action)));
}

function hasCompactButtonRow(candidate: HTMLElement): boolean {
  const controls = outermostActionControls(queryAll(candidate, [BUTTON_SELECTOR]));
  return controls.length >= 3;
}

function hasRenderedPostAction(candidate: HTMLElement): boolean {
  return containsAny(candidate, RENDERED_POST_ACTION_SELECTOR);
}

/**
 * The action bar is not identifiable on its own, so it is derived: the nearest
 * ancestor that contains either multiple recognised action kinds or a compact
 * row around a rendered post-action marker, and none of the post's content.
 *
 * Counting raw selector matches is not enough: Facebook commonly gives one
 * action both a labelled inner button and a data-ad-rendering-role wrapper.
 * Those two nodes represent one action and previously caused us to stop at the
 * individual button wrapper instead of reaching the shared action row.
 */
function sharedRows(groups: HTMLElement[][], boundary?: HTMLElement): HTMLElement[] {
  const actions = outermostActionControls([...new Set(groups.flat())]);
  const candidates = new Set<HTMLElement>();

  for (const action of actions) {
    const bar = ascendUntil(
      action,
      (candidate) =>
        ((actions.filter((control) => candidate.contains(control)).length >= 2 &&
          distinctActionKindsWithin(candidate, groups) >= 2) ||
          ((boundary !== undefined || hasRenderedPostAction(candidate)) && hasCompactButtonRow(candidate))) &&
        !containsAny(candidate, facebookSelectors.postContent),
      8,
    );
    if (bar && bar !== boundary) candidates.add(bar);
  }

  // A match from the reaction summary can point at a larger footer. Keep the
  // deepest shared rows so reaction counts and comment areas remain visible.
  return [...candidates].filter(
    (candidate) => ![...candidates].some((other) => other !== candidate && candidate.contains(other)),
  );
}

function findActionBars(): HTMLElement[] {
  // Story controls use several of the same labels. Never let a post rule act
  // on that dedicated surface.
  if (isStoryRoute(location.pathname)) return [];

  const globalGroups = [
    physicalActionsIn(document, facebookSelectors.postLike),
    physicalActionsIn(document, facebookSelectors.postComment),
    physicalActionsIn(document, facebookSelectors.postShare),
    physicalActionsIn(document, facebookSelectors.postSend),
  ].filter((group) => group.length > 0);
  const globalRows = sharedRows(globalGroups);
  if (globalRows.length > 0) return globalRows;

  const posts = topLevelPosts();
  return posts.flatMap((post) => {
    const groups = [
      physicalActionsInPost(post, facebookSelectors.postLike),
      physicalActionsInPost(post, facebookSelectors.postComment),
      physicalActionsInPost(post, facebookSelectors.postShare),
      physicalActionsInPost(post, facebookSelectors.postSend),
    ].filter((group) => group.length > 0);
    const rows = sharedRows(groups, post);

    // Fail narrowly on an unusual post layout: hiding the controls is still
    // useful, but never hide the post when a shared row cannot be proven.
    return rows.length > 0 ? rows : outermostActionControls(groups.flat());
  });
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
