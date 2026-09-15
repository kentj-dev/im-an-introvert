/**
 * Pre-emptive hiding, so nothing flashes on screen before it disappears.
 *
 * The marker approach in hider.ts can only hide an element *after* a pass has
 * found it, which means the browser paints the control and removes it a frame
 * or two later. That is the twitch you see when a conversation loads.
 *
 * This module takes the other half of the job: for rules whose selector is
 * precise enough to stand on its own, it keeps one `display: none` stylesheet
 * against the document. CSS applies as the element is created, so the control
 * is never painted at all — and on an SPA route change the sheet can be
 * updated *before* the new conversation mounts.
 *
 * The two layers are complements, not duplicates:
 *   - this one is fast but blind: no DOM walking, no guards, so only
 *     high-confidence selectors belong here (see the `cosmetic` lists in the
 *     selector modules)
 *   - hider.ts is slower but careful: it derives containers, scopes queries and
 *     covers portals, and it is what makes a fuzzy selector safe
 *
 * Both restore instantly: the sheet is rewritten, or the marker is dropped.
 *
 * ## Why a constructed stylesheet
 * Appending a `<style>` element is the obvious approach and it is wrong here:
 * the element belongs to the page, so a page CSP with `style-src` and no
 * `'unsafe-inline'` blocks it, and the whole point of this layer is lost.
 * A constructed `CSSStyleSheet` adopted by the document is CSSOM, which CSP
 * does not govern, so it survives any policy the site sends. The `<style>`
 * path stays as a fallback for the rare engine without constructed sheets, and
 * if both fail the marker layer still hides everything one frame later.
 */
import { debugOnce, safely } from "../../shared/debug";

const STYLE_ID = "introvert-cosmetic";

let sheet: CSSStyleSheet | null = null;
let fallbackStyle: HTMLStyleElement | null = null;
let lastText = "";

/** Constructed sheet, adopted by the document. Re-adopted if it goes missing. */
function adoptedSheet(): CSSStyleSheet | null {
  if (
    typeof CSSStyleSheet === "undefined" ||
    !("replaceSync" in CSSStyleSheet.prototype)
  ) {
    return null;
  }
  try {
    sheet ??= new CSSStyleSheet();
    // The page could replace the array wholesale; keep ours in it.
    if (!document.adoptedStyleSheets.includes(sheet)) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }
    return sheet;
  } catch (error) {
    debugOnce("cosmetic:adopted", "constructed stylesheet unavailable", error);
    sheet = null;
    return null;
  }
}

/** Last resort: a real <style> element, which a page CSP may reject. */
function styleFallback(): HTMLStyleElement | null {
  const existing = document.getElementById(STYLE_ID);
  if (existing instanceof HTMLStyleElement) return existing;

  const parent = document.head ?? document.documentElement;
  if (!parent) return null;

  fallbackStyle = document.createElement("style");
  fallbackStyle.id = STYLE_ID;
  parent.appendChild(fallbackStyle);
  return fallbackStyle;
}

/**
 * Replaces the stylesheet with one rule hiding everything in `selectors`.
 * Idempotent: identical input is a no-op, so this can run on every pass.
 */
export function applyCosmeticRules(selectors: readonly string[]): void {
  const text =
    selectors.length > 0
      ? `${selectors.join(",\n")} {\n  display: none !important;\n}\n`
      : "";
  if (text === lastText && sheet !== null) return;

  safely("cosmetic", () => {
    const adopted = adoptedSheet();
    if (adopted) {
      adopted.replaceSync(text);
      lastText = text;
      return;
    }
    const style = styleFallback();
    if (!style) return;
    style.textContent = text;
    lastText = text;
  });
}

export function clearCosmeticRules(): void {
  applyCosmeticRules([]);
}

/** Prefixes each selector with a scope, e.g. the open conversation pane. */
export function scoped(scope: string, selectors: readonly string[]): string[] {
  return selectors.map((selector) => `${scope} ${selector}`);
}
