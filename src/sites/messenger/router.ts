/**
 * The only place Messenger URLs are parsed.
 *
 * Facebook moves these paths around (and added the /e2ee/ variant when
 * end-to-end encrypted chats shipped), so when a URL shape changes this file
 * is the single edit. Nothing else in the extension inspects `location`
 * beyond asking the helpers below.
 *
 * Supported shapes:
 *   facebook.com/messages/t/{id}
 *   facebook.com/messages/e2ee/t/{id}
 *   facebook.com/messages/thread/{id}
 *   messenger.com/t/{id}
 *   messenger.com/e2ee/t/{id}
 */

export interface MessengerLocation {
  hostname: string;
  pathname: string;
}

const CONVERSATION_PATTERNS: readonly RegExp[] = [
  /^\/messages\/e2ee\/t\/([^/?#]+)/,
  /^\/messages\/t\/([^/?#]+)/,
  /^\/messages\/thread\/([^/?#]+)/,
  /^\/e2ee\/t\/([^/?#]+)/,
  /^\/t\/([^/?#]+)/,
];

/** Path segments that look like an id but are really Messenger sub-pages. */
const RESERVED_IDS = new Set([
  "new",
  "requests",
  "archived",
  "spam",
  "pending",
  "filtered",
  "marketplace",
  "e2ee",
  "t",
]);

/** Conversation ids are numeric thread ids, usernames, or "cid.g.xxx" forms. */
const ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

function isMessengerHost(hostname: string): boolean {
  return /(^|\.)messenger\.com$/.test(hostname);
}

export function isFacebookHost(hostname: string): boolean {
  return /(^|\.)facebook\.com$/.test(hostname);
}

/** True when this URL is a Messenger surface rather than ordinary Facebook. */
export function isMessengerRoute(location: MessengerLocation): boolean {
  if (isMessengerHost(location.hostname)) return true;
  return (
    isFacebookHost(location.hostname) &&
    location.pathname.startsWith("/messages")
  );
}

/**
 * Reads the conversation id out of the URL, or null when the user is not
 * looking at a single conversation (inbox root, requests, a Facebook page).
 */
export function getMessengerConversationId(
  location: MessengerLocation,
): string | null {
  if (!isMessengerRoute(location)) return null;

  for (const pattern of CONVERSATION_PATTERNS) {
    const match = pattern.exec(location.pathname);
    const raw = match?.[1];
    if (!raw) continue;

    let id: string;
    try {
      id = decodeURIComponent(raw);
    } catch {
      // A malformed escape such as a stray "%" is never a real conversation.
      return null;
    }
    if (RESERVED_IDS.has(id.toLowerCase())) return null;
    if (!ID_PATTERN.test(id)) return null;
    return id;
  }

  return null;
}

/** Normalises whatever a user types into the manual "add chat" field. */
export function parseConversationIdInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return getMessengerConversationId({
        hostname: url.hostname,
        pathname: url.pathname,
      });
    } catch {
      return null;
    }
  }

  // A pasted path, e.g. "/messages/t/123" or "t/123".
  if (trimmed.includes("/")) {
    const pathname = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return getMessengerConversationId({
      hostname: "www.messenger.com",
      pathname,
    });
  }

  if (RESERVED_IDS.has(trimmed.toLowerCase())) return null;
  return ID_PATTERN.test(trimmed) ? trimmed : null;
}
