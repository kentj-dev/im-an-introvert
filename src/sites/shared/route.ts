/**
 * SPA route detection.
 *
 * Facebook and Messenger navigate with the History API and never reload, so
 * `location` has to be watched rather than trusted once.
 *
 * Note on why this polls: a content script runs in an isolated world, so
 * monkey-patching `history.pushState` here would only see calls made by this
 * script, never the ones the page makes. Events cover back/forward and hash
 * changes; a cheap href comparison covers everything else.
 */
import { ROUTE_POLL_MS } from '../../shared/constants';
import { debug } from '../../shared/debug';

export function watchRoute(onChange: (href: string) => void): () => void {
  let lastHref = location.href;

  const check = (): void => {
    if (location.href === lastHref) return;
    lastHref = location.href;
    debug('route change', location.pathname);
    onChange(lastHref);
  };

  const interval = setInterval(check, ROUTE_POLL_MS) as unknown as number;
  window.addEventListener('popstate', check);
  window.addEventListener('hashchange', check);

  // Navigation API, when available, reacts on the same tick instead of waiting
  // for the next poll. Guarded because it is not in every Chrome build.
  const navigation = (window as unknown as { navigation?: EventTarget }).navigation;
  navigation?.addEventListener('navigatesuccess', check);

  return () => {
    clearInterval(interval);
    window.removeEventListener('popstate', check);
    window.removeEventListener('hashchange', check);
    navigation?.removeEventListener('navigatesuccess', check);
  };
}
