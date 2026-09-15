/**
 * Service worker.
 *
 * Deliberately almost empty: the extension has no backend, makes no network
 * calls and does no background polling. Content scripts read settings straight
 * from chrome.storage.sync and react to storage events.
 *
 * The worker does two small things: seed defaults on install, and act as the
 * single writer for the local Quick Stats counters so reports from several
 * tabs cannot clobber each other.
 */
import { debug } from "../shared/debug";
import { THANK_YOU_URL } from "../shared/constants";
import { MESSAGES, type UsageReport } from "../shared/types";
import { addUsage } from "../storage/stats";
import { loadSettings, saveSettings } from "../storage/storage";

chrome.runtime.onInstalled.addListener(async (details) => {
  // parseSettings() fills in anything missing and upgrades older versions, so
  // writing the parsed result back is also the migration step.
  const settings = await loadSettings();
  await saveSettings(settings);
  debug("installed", details.reason, settings.version);

  if (details.reason === "install") {
    await chrome.tabs.create({ url: THANK_YOU_URL });
  }
});

function isUsageReport(message: unknown): message is UsageReport {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: unknown }).type === MESSAGES.reportUsage
  );
}

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!isUsageReport(message)) return undefined;
  void addUsage({ hidden: message.hidden, seconds: message.seconds });
  return undefined;
});
