/**
 * Hides group management shortcuts: add people,
 * start a group call, member management, leaving the chat.
 *
 * Menus and the chat info panel mount as portals outside the conversation
 * pane, so those two containers are searched as well. Message rendering is
 * never touched.
 */
import { RULES } from '../../../shared/constants';
import { applyRule } from '../../shared/hider';
import { queryAll } from '../../shared/query';
import type { MessengerContext } from '../context';
import { messengerSelectors } from '../selectors';

const PORTAL_CONTAINERS = ['[role="menu"]', '[role="dialog"]'];

function findGroupActions(context: MessengerContext): HTMLElement[] {
  const scopes: ParentNode[] = [...context.threadRoots];
  if (context.onMessengerRoute) {
    for (const selector of PORTAL_CONTAINERS) {
      scopes.push(...Array.from(document.querySelectorAll(selector)));
    }
  }

  const found = new Set<HTMLElement>();
  for (const scope of scopes) {
    for (const element of queryAll(scope, messengerSelectors.groupActions)) {
      found.add(element);
    }
  }
  return [...found];
}

export function applyMessengerGroupCleanup(context: MessengerContext): void {
  applyRule(RULES.messengerGroupActions, context.rules.hideGroupActions, () =>
    findGroupActions(context),
  );
}
