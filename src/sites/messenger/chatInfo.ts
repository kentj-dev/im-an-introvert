/**
 * Reads the labels the popup shows for the current conversation.
 *
 * Privacy boundary: this only ever reads the conversation title from the
 * thread heading or the document title, plus a strictly count-shaped label
 * such as "6 members". Message content is never read, never stored and never
 * sent anywhere — the response goes to the extension popup and nowhere else.
 */
import { MESSAGES, type ChatInfoResponse } from '../../shared/types';
import { queryOne } from '../shared/query';
import { getMessengerConversationId } from './router';
import { messengerSelectors } from './selectors';

/** Matches "6 members", "12 personas" — a number followed by a single word. */
const COUNT_LABEL = /^\d{1,4}\s+\p{L}{3,20}$/u;

const UNINTERESTING_TITLES = new Set(['messenger', 'facebook', 'chats']);

function cleanTitle(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const text = raw
    .replace(/^\(\d+\)\s*/, '') // "(3) Office Group" unread prefix
    .replace(/\s*[|•·]\s*(Messenger|Facebook).*$/i, '')
    .trim();
  if (!text || UNINTERESTING_TITLES.has(text.toLowerCase())) return undefined;
  return text.slice(0, 80);
}

function readConversationName(): string | undefined {
  const heading = queryOne(document, messengerSelectors.conversationTitle);
  return cleanTitle(heading?.textContent) ?? cleanTitle(document.title);
}

/**
 * Looks for a member count next to the conversation title. Only a count-shaped
 * string is accepted, so this can never surface arbitrary text.
 */
function readSubtitle(): string | undefined {
  const heading = queryOne(document, messengerSelectors.conversationTitle);
  const header = heading?.parentElement?.parentElement;
  if (!header) return undefined;

  for (const node of Array.from(header.querySelectorAll('span, div'))) {
    const text = node.textContent?.trim();
    if (text && COUNT_LABEL.test(text)) return text;
  }
  return undefined;
}

export function readChatInfo(): ChatInfoResponse {
  const response: ChatInfoResponse = {
    conversationId: getMessengerConversationId(location),
  };
  const name = readConversationName();
  const subtitle = readSubtitle();
  if (name) response.name = name;
  if (subtitle) response.subtitle = subtitle;
  return response;
}

/** Answers the popup's "which chat am I looking at?" request. */
export function registerChatInfoResponder(): void {
  chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (
      typeof message !== 'object' ||
      message === null ||
      (message as { type?: unknown }).type !== MESSAGES.getChatInfo
    ) {
      return undefined;
    }
    sendResponse(readChatInfo());
    return undefined;
  });
}
