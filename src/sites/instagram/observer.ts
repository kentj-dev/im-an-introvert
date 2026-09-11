/**
 * Which node the shared MutationObserver watches on Instagram.
 *
 * Instagram replaces `main` on navigation and mounts the story viewer and
 * post dialogs elsewhere in the tree, so `document.body` is the only durable
 * target. The observer callback stays trivial and the cleaners scope their
 * queries, which is what keeps that cheap.
 */
export function instagramObserveRoot(): Node | null {
  return document.body;
}
