/**
 * Which node the shared MutationObserver watches on Facebook.
 *
 * Facebook swaps out `[role="main"]` on navigation and mounts the story viewer
 * and dialogs as siblings elsewhere in the tree, so `document.body` is the
 * only target that survives. The cost is kept down by the trivial observer
 * callback in sites/shared/observer.ts plus debounced passes.
 */
export function facebookObserveRoot(): Node | null {
  return document.body;
}
