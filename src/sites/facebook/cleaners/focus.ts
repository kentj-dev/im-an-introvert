/**
 * Focus mode: frosted glass over the panels around the feed so the middle of
 * the page holds the attention.
 *
 * Nothing is hidden or removed. Each panel gets a marker attribute and
 * src/styles/content.css draws a glass pane over it with pseudo-elements,
 * blurring what is underneath. Hovering a panel, or tabbing into it with the
 * keyboard, clears the glass so its links stay usable.
 *
 * Two kinds of panel are marked, both found as landmarks rather than by class:
 *   - the side columns: a navigation or complementary landmark that is a
 *     direct sibling of the main column
 *   - the top bar: the page's banner landmark, which is never a sibling of
 *     main, so the two searches can never claim the same element
 *
 * The marker's value is where the panel sits relative to main: "start" before
 * it in DOM order, "end" after it, "top" for the bar above it. The stylesheet
 * uses that to ramp the blur, lightest next to the feed and deepest at the
 * panel's outer edge (and flips start/end for RTL pages).
 *
 * This module only ever sets the marker. It deliberately never reads or
 * forces a panel's position: Facebook reuses these columns across routes and
 * can apply their position styles after they mount, so any decision made from
 * getComputedStyle at marking time goes stale. The stylesheet handles it
 * instead, with a fallback Facebook's own styles always win over.
 */
import { FOCUS_ATTR } from "../../../shared/constants";
import type { ExtensionSettings } from "../../../shared/types";
import { queryAll } from "../../shared/query";
import { facebookSelectors, isStoryRoute } from "../selectors";

/** Where a panel sits relative to the main column. */
type Side = "start" | "end" | "top";

const SIDEBAR_SELECTOR = facebookSelectors.focusSidebars.join(", ");

function findPanels(): Map<HTMLElement, Side> {
  const panels = new Map<HTMLElement, Side>();
  // The Story viewer's side list is how you move between stories.
  if (isStoryRoute(location.pathname)) return panels;

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
        panels.set(sibling, side);
      }
    }
  }

  for (const header of queryAll(document, facebookSelectors.focusHeader)) {
    // A banner inside a dialog is that dialog's own header, not the page's.
    if (header.closest('[role="dialog"]')) continue;
    panels.set(header, "top");
  }

  return panels;
}

/** Marks exactly `panels` and releases every panel no longer in it. */
function markPanels(panels: ReadonlyMap<HTMLElement, Side>): void {
  for (const element of document.querySelectorAll(`[${FOCUS_ATTR}]`)) {
    if (!panels.has(element as HTMLElement)) {
      element.removeAttribute(FOCUS_ATTR);
    }
  }
  for (const [panel, side] of panels) {
    if (panel.getAttribute(FOCUS_ATTR) !== side) {
      panel.setAttribute(FOCUS_ATTR, side);
    }
  }
}

export function applyFocusCleanup(settings: ExtensionSettings): void {
  markPanels(settings.facebook.blurSidebars ? findPanels() : new Map());
}

/** Clears the glass everywhere, used when Facebook cleanup is released. */
export function clearFocus(): void {
  markPanels(new Map());
}
