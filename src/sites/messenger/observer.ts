/**
 * Which node the shared MutationObserver watches on Messenger.
 *
 * Messenger replaces the whole conversation pane when the user switches
 * chats, so an observer scoped to `[role="main"]` would quietly stop firing
 * after the first navigation. `document.body` is therefore the only durable
 * target. What keeps that cheap is on the other side: the observer callback in
 * sites/shared/observer.ts only asks a debounced scheduler to run, and the
 * cleaners scope every query to the conversation pane.
 */
export function messengerObserveRoot(): Node | null {
  return document.body;
}
