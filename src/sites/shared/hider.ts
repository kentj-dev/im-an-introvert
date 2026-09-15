/**
 * Hiding and restoring elements.
 *
 * Nothing is ever removed from Facebook's DOM. An element gets a marker
 * attribute, the stylesheet in src/styles/content.css hides anything carrying
 * it, and dropping the marker brings the element straight back — which is what
 * makes "turn the setting off and the button returns" work without a reload.
 *
 * An element can be claimed by more than one rule (e.g. "Hide Like" and "Hide
 * entire action bar"), so markers are reference counted by rule key.
 */
import { HIDDEN_ATTR, RULES_ATTR, type RuleKey } from "../../shared/constants";
import { safely } from "../../shared/debug";

function rulesOf(element: Element): string[] {
  const raw = element.getAttribute(RULES_ATTR);
  return raw ? raw.split(" ").filter(Boolean) : [];
}

function writeRules(element: Element, rules: string[]): void {
  if (rules.length === 0) {
    element.removeAttribute(RULES_ATTR);
    element.removeAttribute(HIDDEN_ATTR);
    return;
  }
  element.setAttribute(RULES_ATTR, rules.join(" "));
  element.setAttribute(HIDDEN_ATTR, "true");
}

/**
 * Counts elements that went from visible to hidden, for the popup's
 * "elements hidden today". Drained by the content-script runtime.
 */
let newlyHidden = 0;

export function takeHiddenCount(): number {
  const count = newlyHidden;
  newlyHidden = 0;
  return count;
}

export function hideElement(element: Element, rule: RuleKey): void {
  const rules = rulesOf(element);
  if (rules.length === 0) newlyHidden++;
  if (!rules.includes(rule)) rules.push(rule);
  writeRules(element, rules);
}

export function restoreElement(element: Element, rule: RuleKey): void {
  const rules = rulesOf(element).filter((entry) => entry !== rule);
  writeRules(element, rules);
}

function claimedBy(rule: RuleKey, scope: ParentNode = document): Element[] {
  return Array.from(scope.querySelectorAll(`[${RULES_ATTR}~="${rule}"]`));
}

/** Releases every element a rule is hiding, anywhere in the document. */
export function restoreRule(rule: RuleKey, scope: ParentNode = document): void {
  for (const element of claimedBy(rule, scope)) restoreElement(element, rule);
}

export function restoreRules(
  rules: readonly RuleKey[],
  scope: ParentNode = document,
): void {
  for (const rule of rules) restoreRule(rule, scope);
}

/**
 * The single entry point every cleaner uses.
 *
 * Idempotent by construction: it hides what `find` currently returns and
 * releases anything the rule was hiding that `find` no longer returns, so
 * running it repeatedly — or after Facebook re-renders — converges on the same
 * state. When `enabled` is false it only restores.
 */
export function applyRule(
  rule: RuleKey,
  enabled: boolean,
  find: () => Element[],
): void {
  if (!enabled) {
    restoreRule(rule);
    return;
  }

  const targets = safely(`find:${rule}`, find) ?? [];
  const wanted = new Set(targets);

  for (const element of claimedBy(rule)) {
    if (!wanted.has(element)) restoreElement(element, rule);
  }
  for (const element of wanted) hideElement(element, rule);
}
