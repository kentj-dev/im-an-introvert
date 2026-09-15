/**
 * Focus mode: frosted glass over the side columns so the feed in the middle
 * holds the attention.
 *
 * Nothing is hidden or removed. Each side column gets a marker attribute and
 * src/styles/content.css draws a glass pane over it with pseudo-elements,
 * blurring what is underneath. Hovering a column, or tabbing into it with the
 * keyboard, clears the glass so its links stay usable.
 *
 * Side columns are found structurally: a navigation or complementary landmark
 * that is a direct sibling of the main column. The header's own navigation is
 * never a sibling of main, so it is never touched.
 *
 * The marker's value is the column's side of main in DOM order: "start" before
 * it, "end" after it. The stylesheet uses that to ramp the blur, lightest next
 * to the feed and deepest at the outer edge (and flips it for RTL pages).
 *
 * This module only ever sets the marker. It deliberately never reads or
 * forces a column's position: Facebook reuses these columns across routes and
 * can apply their position styles after they mount, so any decision made from
 * getComputedStyle at marking time goes stale. The stylesheet handles it
 * instead, with a fallback Facebook's own styles always win over.
 */
import { FOCUS_ATTR } from "../../../shared/constants";
import type { ExtensionSettings } from "../../../shared/types";
import { queryAll } from "../../shared/query";
import { facebookSelectors, isStoryRoute } from "../selectors";

/** Which side of the main column a side column sits on, in DOM order. */
type Side = "start" | "end";

const SIDEBAR_SELECTOR = facebookSelectors.focusSidebars.join(", ");

function findSidebars(): Map<HTMLElement, Side> {
  const sidebars = new Map<HTMLElement, Side>();
  // The Story viewer's side list is how you move between stories.
  if (isStoryRoute(location.pathname)) return sidebars;

  for (const main of queryAll(document, facebookSelectors.focusMain)) {
    const parent = main.parentElement;
    if (!parent) continue;
    let side: Side = "start";
    for (const sibling of Array.from(parent.children)) {
      if (sibling === main) {
        side = "end";
        continue;
      }
      if (sibling instanceof HTMLElement && sibling.matches(SIDEBAR_SELECTOR)) {
        sidebars.set(sibling, side);
      }
    }
  }
  return sidebars;
}

/** Marks exactly `sidebars` and releases every column no longer in it. */
function markSidebars(sidebars: ReadonlyMap<HTMLElement, Side>): void {
  for (const element of document.querySelectorAll(`[${FOCUS_ATTR}]`)) {
    if (!sidebars.has(element as HTMLElement)) {
      element.removeAttribute(FOCUS_ATTR);
    }
  }
  for (const [sidebar, side] of sidebars) {
    if (sidebar.getAttribute(FOCUS_ATTR) !== side) {
      sidebar.setAttribute(FOCUS_ATTR, side);
    }
  }
}

export function applyFocusCleanup(settings: ExtensionSettings): void {
  markSidebars(settings.facebook.blurSidebars ? findSidebars() : new Map());
}

/** Clears the glass everywhere, used when Facebook cleanup is released. */
export function clearFocus(): void {
  markSidebars(new Map());
}
