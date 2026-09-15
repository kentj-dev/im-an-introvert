# I'm an Introvert

**Make social media a little less social.**

A Chrome extension that removes the Facebook and Messenger controls you never wanted to
touch by accident. It does not block anything, gate anything, or count your
minutes. It just takes the risky buttons out of reach.

> Remove the UI people never wanted to accidentally touch.

## What it does

Everything is grouped by platform. The popup opens on the available sites and shows future
platforms as coming soon.

### Facebook

| Tab     | Options                                                                                             |
| ------- | --------------------------------------------------------------------------------------------------- |
| General | Hide Story actions, hide the entire post action bar (Like, Comment, Share, Send), hide chat widgets |
| Other   | A reset for this platform                                                                           |

Stories stay watchable: navigation, playback, closing and the author link are never
hidden. Posts keep their text, media and reaction counts, and actions inside comments are
left alone.

### Messenger

Its own platform with its own master switch, covering messenger.com, facebook.com/messages
and the floating chat tabs on facebook.com.

| Tab        | Options                                                                     |
| ---------- | --------------------------------------------------------------------------- |
| General    | Protected Chats, plus global rules for calls and group actions              |
| Chat Field | The whole composer, or its attachment, emoji, GIF, sticker and like buttons |
| Other      | The "messaging disabled" note, and a reset for this platform                |

### Instagram

Coming soon. The extension does not request access to or run a content script on
instagram.com.

### Messenger: two layers

Messenger rules exist at two levels, and a control is hidden if either says so:

- **Global** — applies to every conversation. All off by default, because the point of the
  feature is one work group chat, not all of Messenger.
- **Protected Chats** — applies to one conversation, identified by its ID in the URL.

A row that a global rule already covers shows as locked on in the per-chat view, with the
reason, so the two layers can never disagree silently.

"Hide chat field" hides the composer _region_, so the attachment, GIF, sticker, emoji and
quick-like buttons go with it rather than being left stranded around an empty gap. Reading,
scrolling and opening media are untouched.

### Leave me alone mode

One switch that applies the recommended cleanup across every supported platform: Facebook's
Story actions, whole post action bar and floating chat widgets, plus Messenger's global voice
call, video call, group action and "Hide chat field" rules. Protected chats keep their own records, though the
global rules it turns on apply to every conversation.

Each activation lasts 1 hour, and the popup shows the time left. When it ends, whether the
hour runs out or you switch it off, those settings go back to what they were before you turned
it on. Switching one of them off by hand ends the session early and keeps your choice. The end
time is stored with the settings and checked on every read, so the mode ends on time even with
the popup closed, and no extra permission is needed.

Everything is hidden, never deleted. Turn a setting off and the control is back
immediately, with no page reload.

## Privacy philosophy

The extension has no backend, and nothing about your browsing leaves the browser.

- No analytics, no telemetry, no remote logging.
- No external APIs and no background network requests, and the popup's font is bundled
  rather than fetched from a CDN. The only page the extension opens on its own is a
  one-time thank-you page on apps.hamiken.com right after install; nothing is sent to it.
- No account, no sign-in, no sync service of our own.
- Message content is never read or stored. The only text the extension reads is the
  conversation title (for the popup label) and, if present, a strictly count-shaped string
  like "6 members". See `src/sites/messenger/chatInfo.ts`.
- Settings and protected chat IDs live in `chrome.storage.sync`: your own Chrome profile
  and, with Chrome sync on, your own Google account. Nothing else.
- Debug logging is off by default and never logs page text.

### The one thing that is recorded: Quick Stats

The popup shows two counters for today, and they are the only record the extension keeps:

- elements hidden today
- time spent on a supported site with cleanup active

They live in `chrome.storage.local`, so they are never synced anywhere. They hold two
integers and a date: no URLs, no per-site breakdown, no history. When the day rolls over,
yesterday's numbers are gone rather than archived, and "Reset" in the popup clears them
immediately. The code is [src/storage/stats.ts](src/storage/stats.ts).

### Permissions, and why each one is needed

| Permission                                            | Why                                                                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                             | Save settings and protected chats in `chrome.storage.sync`, and the daily counters in `chrome.storage.local`.                                           |
| `host_permissions` for facebook.com and messenger.com | Lets the popup read the active tab's URL so it can tell which site and conversation you are on, and ask that tab's content script for the chat's title. |
| `content_scripts` matches for the same sites          | The cleaners have to run on the page to hide anything.                                                                                                  |

There is deliberately no `tabs` permission: a host permission is enough to read `tab.url`
for those sites and nothing else. No `activeTab`, no `scripting`, no `webNavigation`, no
optional permissions.

## Requirements

- Node.js 20 or newer (built and tested on 22)
- npm 10 or newer
- Chrome 114 or newer, or any recent Chromium (Edge, Brave)

## Installation

```bash
npm install
npm run build
```

Then load it:

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the **`dist`** folder in this repository

Pin the extension to the toolbar and click it to open the popup.

## Local development

```bash
npm run dev        # rebuilds every target on change
npm run build      # one-shot production build into dist/
npm run typecheck  # tsc --noEmit, strict
npm run assets     # regenerate icons and popup artwork from images/
npm run clean      # delete dist/
```

`npm run dev` watches all four build targets. Chrome does not hot-reload extensions, so
after a rebuild:

- **Popup change** — close and reopen the popup.
- **Content script change** — click reload on `chrome://extensions`, then reload the tab.
- **Manifest or background change** — reload on `chrome://extensions`.

While adjusting selectors, set `DEBUG = true` in [src/shared/debug.ts](src/shared/debug.ts)
and rebuild. You get one-time messages such as `composer textbox not found` in the page
console, which say exactly which selector list needs attention.

### UI stack

- **React 18 + TypeScript** in strict mode, functional components only, no state library:
  React state plus `chrome.storage` is enough.
- **Tailwind CSS v4** with the theme in [src/styles/popup.css](src/styles/popup.css). Colours
  are shadcn tokens (`--primary`, `--card`, `--border`, …) plus three tints the design uses
  for the night card, the current-site card and the "Enabled" badge.
- **shadcn/ui** components in [src/popup/components/ui/](src/popup/components/ui/), added
  with the CLI and owned in-tree. `components.json` is configured, so
  `npx shadcn@latest add <component>` keeps working.
- **lucide-react** for icons.
- **@fontsource/inter**, self-hosted: the popup never calls a font CDN.

Two Tailwind notes worth knowing before editing the popup:

- The popup is light-only. shadcn components ship `dark:` classes, and in Tailwind v4 that
  variant follows `prefers-color-scheme`, which would apply dark rules to a light palette
  (a black switch thumb, for one). `@custom-variant dark (&:where(.dark, .dark *))` binds
  it to a class that is never set.
- `tailwind-merge` cannot know theme colours defined in CSS, so `bg-tint-success` does not
  reliably beat a shadcn `bg-secondary`. Custom colour overrides on shadcn components carry
  the `!` modifier (`bg-tint-success!`) to make the outcome deterministic.

### Build process

There is no `vite.config.ts`; [scripts/build.mjs](scripts/build.mjs) runs four small Vite
builds, because MV3 wants a different module format per target:

| Target                   | Output                      | Format                                            |
| ------------------------ | --------------------------- | ------------------------------------------------- |
| Popup (React + Tailwind) | `dist/popup/`               | ES modules, fine inside an extension page         |
| Service worker           | `dist/background.js`        | ES module (`"type": "module"` in the manifest)    |
| Facebook content script  | `dist/content/facebook.js`  | IIFE — classic content scripts cannot use imports |
| Messenger content script | `dist/content/messenger.js` | IIFE                                              |

The script also copies `src/manifest.json`, `src/styles/content.css` (as
`content/introvert.css`) and `src/icons/`. Content scripts are not minified on purpose:
when Facebook changes and you need to debug a selector on a live page, readable output
saves time.

### Artwork

`images/` holds the source art: `logo.png` (the brand mark), the Facebook logo and the white
Instagram glyph. `npm run assets` turns those into what ships: 128px copies in `src/assets/`
for the popup, and 16/32/48/128 toolbar icons in `src/icons/` derived from the logo.
[scripts/prepare-assets.mjs](scripts/prepare-assets.mjs) does it with a small PNG decoder,
a premultiplied box filter and a PNG encoder, so there is no image dependency. The large
Instagram source glyph becomes a lightweight 3.6 KB popup asset.

## Project structure

```text
images/                          Source artwork (checked in, not shipped as-is)
src/
├── assets/                      Generated popup artwork (npm run assets)
├── icons/                       Generated toolbar icons (npm run assets)
├── background/index.ts          Worker: seeds defaults, folds in stats reports
├── content/
│   ├── facebook.ts              Entry: Facebook site module
│   ├── messenger.ts             Entry: Messenger module + popup chat-info responder
│   └── instagram.ts             Unshipped placeholder for future support
├── sites/
│   ├── shared/                  Reusable machinery, no site knowledge
│   │   ├── runtime.ts           Lifecycle: settings, observers, routes, stats
│   │   ├── hider.ts             Mark/restore elements, reference counted by rule
│   │   ├── cosmetic.ts          Pre-paint stylesheet, so nothing flashes
│   │   ├── query.ts             Selector candidates, safe queries, DOM ascent
│   │   ├── observer.ts          MutationObserver with a trivial callback
│   │   ├── scheduler.ts         Leading edge, trailing debounce, ceiling
│   │   └── route.ts             SPA route detection
│   ├── facebook/
│   │   ├── cleaners/{stories,posts,chatWidgets}.ts
│   │   ├── selectors.ts         All Facebook selectors
│   │   ├── observer.ts          Which node to observe, and why
│   │   └── index.ts             The Facebook site module
│   ├── messenger/
│   │   ├── cleaners/{calls,groupActions,chatField}.ts
│   │   ├── router.ts            The only place Messenger URLs are parsed
│   │   ├── selectors.ts         All Messenger selectors
│   │   ├── context.ts           Conversation + effective rules (global | per-chat)
│   │   ├── cosmetic.ts          Builds that stylesheet for the current chat
│   │   ├── chatInfo.ts          Conversation label for the popup
│   │   ├── floating.ts          Finds Facebook's floating chat tabs
│   │   ├── observer.ts
│   │   └── index.ts
│   └── instagram/                Unshipped work for future support
│       ├── cleaners/{stories,posts}.ts
│       ├── selectors.ts
│       ├── observer.ts
│       └── index.ts
├── popup/
│   ├── App.tsx                  View stack and wiring
│   ├── platforms.ts             Platform metadata, tabs, setting-row descriptors
│   ├── components/
│   │   ├── ui/                  shadcn components
│   │   ├── views/               Home, platform, protected chats, chat, add, about
│   │   └── *.tsx                AppHeader, SettingRow, SettingSection, NavCard, …
│   ├── hooks/                   useSettings, useStats, useCurrentTab
│   ├── lib/utils.ts             cn()
│   └── index.tsx
├── storage/
│   ├── schema.ts                Validation and the version migration seam
│   ├── defaults.ts              Defaults and the "leave me alone" preset
│   ├── storage.ts               The only module that touches storage.sync
│   └── stats.ts                 The daily counters, in storage.local
├── shared/{types,constants,debug}.ts
├── styles/
│   ├── popup.css                Tailwind v4, theme tokens, Inter
│   └── content.css              The two rules that do the hiding
└── manifest.json
```

## How Protected Chats work

A protected chat is one record keyed by conversation ID:

```ts
interface ProtectedChat extends ChatRules {
  id: string; // from the URL — the real identifier
  name?: string; // cosmetic label, yours to rename
  subtitle?: string; // cosmetic, e.g. "6 members"
  addedAt: number;
}

// The nine rules, shared with the global Messenger settings so the two can
// never drift apart:
type ChatRules = {
  hideVoiceCall: boolean;
  hideVideoCall: boolean;
  hideGroupActions: boolean;
  hideChatField: boolean;
  hideAttachments: boolean;
  hideEmojiButton: boolean;
  hideGifButton: boolean;
  hideStickerButton: boolean;
  hideLikeButton: boolean;
};
```

The normal flow: open the conversation, open the popup, and the home view's **Current
Site** card points straight at Protected Chats with **Protect this chat**. It starts with
the recommended profile (calls and group actions hidden, chat field usable), which you then
adjust. **Add chat manually** exists for a conversation you are not currently looking at;
it accepts a bare ID, a path, or a full Messenger URL.

Up to 10 chats can be protected. At the limit, **Protect this chat** and **Add chat manually**
are disabled until one is removed.

Renaming only changes the popup label. Two chats with the same name are still two different
conversations, because the ID is what everything keys off.

On every pass each Messenger cleaner asks: what are the effective rules for the
conversation in the URL? With no global rules and no record for this conversation, the
answer is "hide nothing", and anything previously hidden is released. That is why switching
from a protected chat to an ordinary one leaves the ordinary one looking untouched.

## Messenger ID detection

All URL parsing lives in [src/sites/messenger/router.ts](src/sites/messenger/router.ts).
When Facebook changes a URL shape, that file is the only edit.

```ts
getMessengerConversationId(location: Location): string | null
```

Recognised shapes:

```text
facebook.com/messages/t/{id}
facebook.com/messages/e2ee/t/{id}
facebook.com/messages/thread/{id}
messenger.com/t/{id}
messenger.com/e2ee/t/{id}
```

Sub-pages that look like IDs (`/messages/requests`, `/t/new`, the inbox root) return `null`,
as does any host that is not exactly `facebook.com` or `messenger.com`.

Because these sites are single-page apps, the route is re-read continuously rather than
once at load: `popstate`, `hashchange`, the Navigation API when available, and a cheap
`location.href` comparison every 500 ms. The poll is not laziness — a content script runs
in an isolated world, so patching `history.pushState` there would only observe calls made
by the extension, never the ones the page makes.

## Storage schema

One `chrome.storage.sync` key, `introvertSettings`:

```ts
interface ExtensionSettings {
  version: 3;
  facebook: {
    enabled: boolean; // the platform master switch
    hideStoryActions: boolean;
    hideChatWidgets: boolean; // floating chat tabs, not full Messenger
    posts: {
      hideEntireActionBar: boolean; // the Like, Comment, Share and Send row
    };
  };
  messenger: ChatRules & {
    enabled: boolean; // Messenger's own master switch
    showDisabledNotice: boolean;
  };
  instagram: {
    enabled: boolean;
    hideStoryActions: boolean;
    posts: {
      hideLike: boolean;
      hideComment: boolean;
      hideShare: boolean;
      hideSave: boolean;
      hideEntireActionBar: boolean;
    };
  };
  protectedChats: Record<string, ProtectedChat>;
  leaveMeAlone: {
    until: number | null; // when the running session ends, epoch ms
    previous: LeaveMeAloneSnapshot | null; // the preset's settings before it started
  };
  leaveMeAloneMode: boolean;
}
```

The Instagram branch is reserved for forward compatibility with the unshipped work. It is
not exposed as settings and has no effect in the current build.

A single key means one `chrome.storage.onChanged` event that the popup and every open tab
react to. `parseSettings()` in [src/storage/schema.ts](src/storage/schema.ts) validates
whatever comes back: unknown keys are dropped, missing keys fall back to defaults, and a
malformed object can never crash a cleaner.

**Migrations** happen in that same function, one version step at a time. Version 1 kept
Messenger's only global at the top level and had no platforms, so `migrateV1()` moves it
under `facebook.messenger`. Version 2 then made Messenger follow Facebook's switch, so
`migrateV2()` lifts those rules to the top-level `messenger` and starts its new `enabled`
switch from Facebook's. The normaliser fills in the rest. To add a version 4, add a step
there before normalising.

Note the sync quota: 8 KB for this one key. The base settings take about 0.6 KB and each
protected chat about 0.3 KB, so the key would fill up at around 23 chats. The 10-chat limit
keeps it well under that, and if a write does fail the popup says so instead of silently
dropping the change.

`leaveMeAloneMode` is derived rather than authoritative: it reads as on only while a session
is running (`leaveMeAlone.until` is in the future) and all of the preset's settings are still
on. Both limits live in `FREE_LIMITS` in [src/shared/constants.ts](src/shared/constants.ts).

## How selectors work

Facebook ships generated class names (`.x1abc123`, `.x78zum5`) that rotate constantly, so
they are not used. Every selector is a **list of candidates** built from more durable
attributes: `aria-label`, `role`, `href` shape, `data-testid`, `data-visualcompletion`,
`data-ad-rendering-role`, `contenteditable`, `data-lexical-editor`.

```ts
voiceCallButton: [
  '[aria-label="Start a voice call"]',
  '[aria-label*="Start a voice call" i]',
  '[aria-label="Voice call"]',
  // ...
],
```

Helpers in [src/sites/shared/query.ts](src/sites/shared/query.ts) try candidates in order
and never throw:

- `queryOne(root, candidates)` — first match from the first candidate that matches
- `queryAll(root, candidates)` — the de-duplicated union of all matches
- `byAriaLabel(names)` / `byAriaLabelButton(names)` — expand accessible names into exact and
  case-insensitive substring selectors, which absorbs a lot of locale and A/B variance
- `ascendWhileSafe(el, isSafe, depth)` — walk up to the highest ancestor that still passes a
  guard, to find a wrapper worth hiding without knowing its class name
- `ascendUntil(el, predicate, depth)` — walk up until a positive signal, e.g. "the ancestor
  that contains at least two post action buttons"

The draft Instagram implementation needs one extra trick: its controls are buttons wrapping an `svg` that carries the
accessible name, so its selectors reach the button _through_ its icon with
`button:has(svg[aria-label="Like"])`. Hiding the svg alone would leave an invisible but
clickable button — exactly the accident this extension exists to prevent.

### Two layers: one fast, one careful

Marking elements can only happen after a pass has found them, which means the browser
paints the control and the extension removes it a frame later. That visible twitch is why
there is a second layer.

| Layer                                                  | When it acts                            | What belongs in it                                                          |
| ------------------------------------------------------ | --------------------------------------- | --------------------------------------------------------------------------- |
| [cosmetic.ts](src/sites/shared/cosmetic.ts) stylesheet | As the element is created, before paint | Exact, high-confidence selectors under a stable scope                       |
| [hider.ts](src/sites/shared/hider.ts) markers          | On the next cleanup pass                | Everything else: derived containers, fuzzy labels, portals, guarded ascents |

The cosmetic layer keeps one `display: none` rule in a constructed `CSSStyleSheet` adopted
by the document, built from the `messengerCosmetic` lists and scoped by `messengerScopes`
(the open conversation, `div[role="main"]`, and the composer region). Because it depends
only on the settings and the conversation ID, it is rewritten the moment the route changes,
_before_ Messenger mounts the new conversation, so a protected chat's controls are never
painted at all.

A constructed sheet rather than a `<style>` element for one specific reason: a `<style>`
appended by a content script belongs to the page, so a site sending `style-src` without
`'unsafe-inline'` blocks it outright. That is verified rather than assumed — one browser
check serves the harness under exactly that policy and asserts the controls still never
paint. CSSOM is not governed by CSP, so the constructed sheet survives it. The `<style>`
path remains as a fallback, and if both fail the marker layer still hides everything one
frame later.

The layers are complements, not duplicates. A label missing from a cosmetic list still gets
hidden, one frame later, by the JS pass. A selector too fuzzy to trust unscoped stays out of
the cosmetic list entirely. When adding a selector, the rule of thumb is: exact
`aria-label` match plus a scope you can name, put it in both; anything else, candidate list
only.

Three patterns matter more than any single selector:

**Anchor, then ascend.** Containers are never guessed. The story cleaners find the reply box
and ascend; the composer cleaner finds the message textbox and ascends. Each ascent stops
before any ancestor containing something the user must keep: story navigation, the media,
the message list, the conversation title. No anchor means nothing is hidden.

**Derive, do not assume.** An action bar is "the nearest ancestor holding at least two action
buttons and none of the post's content". If that cannot be established, the buttons
themselves are hidden instead, which looks the same and cannot over-reach.

**Fail safe, loudly only in debug.** A selector that no longer matches produces no change
and, with `DEBUG = true`, exactly one console line. No repeated errors, no retries, no
guessing at "something nearby".

### Accuracy of the shipped selectors

Selectors marked `// TODO: Verify ...` were written from published markup patterns rather
than pinned to one confirmed DOM snapshot, and accessible names differ by locale, surface
and rollout. They are honest guesses in a structure designed for them to be wrong: the
mechanism around them is verified, and a wrong selector costs you a control that stays
visible, never a broken page.

## How to update a selector when Facebook or Messenger changes

1. Set `DEBUG = true` in [src/shared/debug.ts](src/shared/debug.ts), `npm run build`, reload
   the extension and the tab.
2. Open DevTools and inspect the control that is no longer hidden. Look for an `aria-label`,
   `role`, `data-*` attribute or `href` shape — not a class name.
3. Add it to the **front** of the relevant list in
   [src/sites/facebook/selectors.ts](src/sites/facebook/selectors.ts) or
   [src/sites/messenger/selectors.ts](src/sites/messenger/selectors.ts). Leave the old
   candidates: they cost nothing and may still be right for other accounts or locales.
4. Rebuild, reload, confirm. Set `DEBUG` back to `false`.

If what changed is a _container_ rather than a button, check the guard lists instead
(`storyProtected`, `postContent`, `messageList`) — an ascent that stops too early usually
means a guard is matching something new.

## How to add another cleanup option

Example: hiding the "Send" button inside a Messenger chat.

1. **Rule key** — add `hideSendButton` to `CHAT_RULE_KEYS` in
   [src/shared/types.ts](src/shared/types.ts). That one line gives it a place in both the
   global settings and every protected chat, and the schema normaliser picks it up
   automatically.
2. **Default** — add it to `DEFAULT_CHAT_RULES` in
   [src/storage/defaults.ts](src/storage/defaults.ts) if it should be on for newly protected
   chats.
3. **DOM rule** — add `messengerSend: 'mx-send'` to `RULES` in
   [src/shared/constants.ts](src/shared/constants.ts), and list it in `MESSENGER_RULES` in
   `src/sites/messenger/index.ts` so route changes release it.
4. **Selector** — add a candidate list to `messengerSelectors`.
5. **Cleaner** — add one entry to the `buttonRules` array in
   [src/sites/messenger/cleaners/chatField.ts](src/sites/messenger/cleaners/chatField.ts).
6. **UI** — add a row to `MESSENGER_FIELD_ROWS` in
   [src/popup/platforms.ts](src/popup/platforms.ts). It appears in both the global list and
   the per-chat list, with the right disabled states, without touching either view.

No new plumbing: hiding, restoring, live updates and route handling all come from the shared
layer.

## How to add another supported website

The unshipped Instagram scaffolding is a worked example — it reuses the shared runtime,
hider and observer without changes. For Reddit, YouTube, LinkedIn or X:

1. **Site folder** — `src/sites/<site>/` with `selectors.ts`, `cleaners/*.ts`, `observer.ts`
   and `index.ts`. Each cleaner calls `applyRule(rule, enabled, find)` and nothing else;
   that is what makes it idempotent and reversible.
2. **Rule keys** — add them to `RULES` and collect them in a `<SITE>_RULES` array so route
   changes can release all of them.
3. **Site module** — export a `SiteModule` with `apply`, `onRouteChange`, `isActive` (the
   platform master switch) and `observeRoot`. If the site loads more than one content
   script, exactly one should return true from `ownsUsageClock` so page time is not counted
   twice.
4. **Settings** — add the platform to `PlatformId` and `ExtensionSettings` in
   [src/shared/types.ts](src/shared/types.ts), plus defaults and validation. Bump the schema
   version and extend the migration if existing installs need a shape change.
5. **Popup** — add an entry to `PLATFORMS` in [src/popup/platforms.ts](src/popup/platforms.ts)
   with its logo, summary and tabs, and a panel component. It shows up on the home list
   automatically.
6. **Entry and manifest** — `src/content/<site>.ts` with two lines (import the module, call
   `startSiteModule`), a target in [scripts/build.mjs](scripts/build.mjs), and a
   `content_scripts` block plus `host_permissions` entry in the manifest.

## Verification

There are no automated tests in this repository yet. `npm run typecheck` and `npm run build`
catch type and bundling errors; behaviour on the live sites has to be checked by hand.

Before a release, load the built `dist/` folder and check each of these on a real account:

- Facebook: Story actions hidden while navigation, playback, closing and the author link keep
  working; the post action bar hidden with post text, media, counts and comments intact;
  floating chat widgets hidden.
- Messenger, on both `messenger.com/t/...` and `facebook.com/messages/t/...`: each call, group
  action and chat field rule, both globally and for a protected chat, and switching between a
  protected and an unprotected conversation.
- Every setting brings its controls back immediately when switched off, with no reload.
- Leave me alone mode puts the previous settings back when switched off and when its hour
  runs out.
- Protected chats stop accepting new entries at 10.

Selectors can only be confirmed this way: an `aria-label` that matches one account or locale
may not match another. The selector-update procedure above covers what to do when one misses.

## License

MIT. See [LICENSE](LICENSE).
