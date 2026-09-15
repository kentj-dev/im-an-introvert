/**
 * "Leave me alone mode" in Chrome's right-click menus.
 *
 * One checkbox on the toolbar icon's menu, and the same checkbox when
 * right-clicking a Facebook or Messenger page. Both mirror the setting: they
 * follow changes made in the popup or on another synced device, and show the
 * session's end time while it runs.
 *
 * A session ends on its own through parseSettings(), with no timer. The worker
 * is usually asleep by then, so an alarm wakes it just after the end to untick
 * the menu; it is only ever the menu that needs the alarm.
 */
import { debug } from "../shared/debug";
import type { ExtensionSettings } from "../shared/types";
import {
  loadSettings,
  setLeaveMeAloneMode,
  watchSettings,
} from "../storage/storage";

export const LEAVE_ME_ALONE_MENU = {
  action: "leave-me-alone:action",
  page: "leave-me-alone:page",
} as const;

export const LEAVE_ME_ALONE_ALARM = "leave-me-alone:ends";

const MENU_IDS: readonly string[] = Object.values(LEAVE_ME_ALONE_MENU);

const TITLE = "Leave me alone mode";

/** Everything a right-click can land on, so the item is there on links too. */
const PAGE_CONTEXTS: chrome.contextMenus.ContextType[] = [
  "page",
  "frame",
  "selection",
  "link",
  "editable",
  "image",
  "video",
  "audio",
];

/** The page item appears only on the sites the extension runs on. */
function sitePatterns(): string[] {
  return chrome.runtime.getManifest().host_permissions ?? [];
}

/** Callback APIs report failures here; reading it keeps Chrome quiet. */
function ignoreLastError(): void {
  const error = chrome.runtime.lastError;
  if (error) debug("context menu", error.message);
}

function titleFor(settings: ExtensionSettings): string {
  const { until } = settings.leaveMeAlone;
  if (!settings.leaveMeAloneMode || until === null) return TITLE;
  const ends = new Date(until).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${TITLE} (until ${ends})`;
}

/** Wakes the worker just after a running session ends, to untick the menu. */
function scheduleEndRefresh(settings: ExtensionSettings): void {
  const { until } = settings.leaveMeAlone;
  if (!settings.leaveMeAloneMode || until === null) {
    void chrome.alarms.clear(LEAVE_ME_ALONE_ALARM);
    return;
  }
  // A moment late, never early: the settings read then must see it as over.
  void chrome.alarms.create(LEAVE_ME_ALONE_ALARM, { when: until + 1_000 });
}

async function refreshMenus(settings?: ExtensionSettings): Promise<void> {
  const current = settings ?? (await loadSettings());
  const properties = {
    checked: current.leaveMeAloneMode,
    title: titleFor(current),
  };
  for (const id of MENU_IDS) {
    chrome.contextMenus.update(id, properties, ignoreLastError);
  }
  scheduleEndRefresh(current);
}

/**
 * (Re)creates both items. Menus survive restarts, so everything is removed
 * first: creating an id that already exists is an error.
 */
function createMenus(): void {
  chrome.contextMenus.removeAll(() => {
    ignoreLastError();
    chrome.contextMenus.create(
      {
        id: LEAVE_ME_ALONE_MENU.action,
        type: "checkbox",
        title: TITLE,
        checked: false,
        contexts: ["action"],
      },
      ignoreLastError,
    );
    chrome.contextMenus.create(
      {
        id: LEAVE_ME_ALONE_MENU.page,
        type: "checkbox",
        title: TITLE,
        checked: false,
        contexts: PAGE_CONTEXTS,
        documentUrlPatterns: sitePatterns(),
      },
      ignoreLastError,
    );
    void refreshMenus();
  });
}

/** Call once, at the top level of the service worker. */
export function registerLeaveMeAloneMenu(): void {
  chrome.runtime.onInstalled.addListener(createMenus);
  chrome.runtime.onStartup.addListener(createMenus);

  chrome.contextMenus.onClicked.addListener((info) => {
    if (!MENU_IDS.includes(String(info.menuItemId))) return;
    // Chrome has already flipped the checkbox; `checked` is the new state. If
    // the write fails, re-reading puts the checkmark back where it belongs.
    void setLeaveMeAloneMode(info.checked === true).then(
      (settings) => refreshMenus(settings),
      (error: unknown) => {
        debug("leave me alone from menu failed", error);
        return refreshMenus();
      },
    );
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === LEAVE_ME_ALONE_ALARM) void refreshMenus();
  });

  // The popup, another tab or another device changed something.
  watchSettings((settings) => void refreshMenus(settings));
}
