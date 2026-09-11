# I'm an Introvert

**Make social media a little less social.**

A Chrome extension that removes the Facebook, Messenger and Instagram controls you never
wanted to touch by accident. It does not block anything, gate anything, or count your
minutes. It just takes the risky buttons out of reach.

> Remove the UI people never wanted to accidentally touch.

## What it does

Everything is grouped by platform. The popup opens on a list of supported sites, each with
its own master switch and its own settings page.

### Facebook

| Tab       | Options                                                                             |
| --------- | ----------------------------------------------------------------------------------- |
| General   | Hide Story actions (reply box, emoji reactions, share and send)                      |
| Messenger | Protected Chats, plus global rules for calls, group actions and the composer         |
| Posts     | Like, Comment, Share, Send, the reaction picker, or the entire action bar            |
| Other     | The "messaging disabled" note, and a reset for this platform                         |

Stories stay watchable: navigation, playback, closing and the author link are never
hidden. Posts keep their text, media and reaction counts, and actions inside comments are
left alone.

### Instagram

| Tab     | Options                                                            |
| ------- | ------------------------------------------------------------------ |
| General | Hide Story actions (reply box and quick reactions)                 |
| Posts   | Like, Comment, Share, Save, or the entire action bar               |
| Other   | A reset for this platform                                          |

### Messenger: two layers

Messenger rules exist at two levels, and a control is hidden if either says so:

- **Global** — applies to every conversation. All off by default, because the point of the
  feature is one work group chat, not all of Messenger.
- **Protected Chats** — applies to one conversation, identified by its ID in the URL.

A row that a global rule already covers shows as locked on in the per-chat view, with the
reason, so the two layers can never disagree silently.

### Leave me alone mode

One switch that applies the recommended noise cleanup across every platform: Story actions
and the whole post action bar. It never touches Messenger rules or protected chats, because
those are about accidental clicks rather than noise.

Everything is hidden, never deleted. Turn a setting off and the control is back
immediately, with no page reload.

## Privacy philosophy

The extension has no backend, and nothing about your browsing leaves the browser.

- No analytics, no telemetry, no remote logging.
- No external APIs, no network requests of any kind. There is no code that can make one,
  and the popup's font is bundled rather than fetched from a CDN.
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

| Permission                                                    | Why                                                                                                                                                        |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                                     | Save settings and protected chats in `chrome.storage.sync`, and the daily counters in `chrome.storage.local`.                                                |
| `host_permissions` for facebook.com, messenger.com, instagram.com | Lets the popup read the active tab's URL so it can tell which site and conversation you are on, and ask that tab's content script for the chat's title. |
| `content_scripts` matches for the same sites                  | The cleaners have to run on the page to hide anything.                                                                                                     |

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

`npm run dev` watches all five build targets. Chrome does not hot-reload extensions, so
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

There is no `vite.config.ts`; [scripts/build.mjs](scripts/build.mjs) runs five small Vite
builds, because MV3 wants a different module format per target:

| Target                   | Output                       | Format                                            |
| ------------------------ | ---------------------------- | ------------------------------------------------- |
| Popup (React + Tailwind) | `dist/popup/`                | ES modules, fine inside an extension page         |
| Service worker           | `dist/background.js`         | ES module (`"type": "module"` in the manifest)    |
| Facebook content script  | `dist/content/facebook.js`   | IIFE — classic content scripts cannot use imports |
| Messenger content script | `dist/content/messenger.js`  | IIFE                                              |
| Instagram content script | `dist/content/instagram.js`  | IIFE                                              |

The script also copies `src/manifest.json`, `src/styles/content.css` (as
`content/introvert.css`) and `src/icons/`. Content scripts are not minified on purpose:
when Facebook changes and you need to debug a selector on a live page, readable output
saves time.

### Artwork

`images/` holds the source art: `logo.png` (the brand mark) and the Facebook and Instagram
logos at 980px. `npm run assets` turns those into what ships: 128px copies in `src/assets/`
for the popup, and 16/32/48/128 toolbar icons in `src/icons/` derived from the logo.
[scripts/prepare-assets.mjs](scripts/prepare-assets.mjs) does it with a small PNG decoder,
a premultiplied box filter and a PNG encoder, so there is no image dependency. It matters
more than it sounds: the Instagram logo goes from 500 KB to 18 KB.

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
│   └── instagram.ts             Entry: Instagram site module
├── sites/
│   ├── shared/                  Reusable machinery, no site knowledge
│   │   ├── runtime.ts           Lifecycle: settings, observers, routes, stats
│   │   ├── hider.ts             Mark/restore elements, reference counted by rule
│   │   ├── query.ts             Selector candidates, safe queries, DOM ascent
│   │   ├── observer.ts          MutationObserver with a trivial callback
│   │   ├── scheduler.ts         Debounce with a ceiling
│   │   └── route.ts             SPA route detection
│   ├── facebook/
│   │   ├── cleaners/{stories,posts}.ts
│   │   ├── selectors.ts         All Facebook selectors
│   │   ├── observer.ts          Which node to observe, and why
│   │   └── index.ts             The Facebook site module
│   ├── messenger/
│   │   ├── cleaners/{calls,groupActions,chatField}.ts
│   │   ├── router.ts            The only place Messenger URLs are parsed
│   │   ├── selectors.ts         All Messenger selectors
│   │   ├── context.ts           Conversation + effective rules (global | per-chat)
│   │   ├── chatInfo.ts          Conversation label for the popup
│   │   ├── observer.ts
│   │   └── index.ts
│   └── instagram/
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
  id: string;          // from the URL — the real identifier
  name?: string;       // cosmetic label, yours to rename
  subtitle?: string;   // cosmetic, e.g. "6 members"
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
  version: 2;
  facebook: {
    enabled: boolean;              // the platform master switch
    hideStoryActions: boolean;
    posts: {
      hideLike: boolean;
      hideComment: boolean;
      hideShare: boolean;
      hideSend: boolean;
      hideReactions: boolean;
      hideEntireActionBar: boolean;
    };
    messenger: ChatRules & { showDisabledNotice: boolean };
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
  leaveMeAloneMode: boolean;
}
```

A single key means one `chrome.storage.onChanged` event that the popup and every open tab
react to. `parseSettings()` in [src/storage/schema.ts](src/storage/schema.ts) validates
whatever comes back: unknown keys are dropped, missing keys fall back to defaults, and a
malformed object can never crash a cleaner.

**Migrations** happen in that same function, which is what version 2 already does: version
1 kept Messenger's only global at the top level and had no platforms, so `migrateV1()`
moves it under `facebook.messenger` and the normaliser fills in the rest. To add a version
3, upgrade the shape there before normalising.

Note the sync quota: about 8 KB per key, which is roughly 30 to 40 protected chats. Far more
than the handful of work group chats this is built for, but worth knowing.

`leaveMeAloneMode` is derived rather than authoritative: it reads as on exactly when the
preset's settings are in place, so switching one of them off by hand is reflected honestly.

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

Instagram needs one extra trick: its controls are buttons wrapping an `svg` that carries the
accessible name, so its selectors reach the button *through* its icon with
`button:has(svg[aria-label="Like"])`. Hiding the svg alone would leave an invisible but
clickable button — exactly the accident this extension exists to prevent.

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

## How to update a selector when Facebook or Instagram changes

1. Set `DEBUG = true` in [src/shared/debug.ts](src/shared/debug.ts), `npm run build`, reload
   the extension and the tab.
2. Open DevTools and inspect the control that is no longer hidden. Look for an `aria-label`,
   `role`, `data-*` attribute or `href` shape — not a class name.
3. Add it to the **front** of the relevant list in
   [src/sites/facebook/selectors.ts](src/sites/facebook/selectors.ts),
   [src/sites/messenger/selectors.ts](src/sites/messenger/selectors.ts) or
   [src/sites/instagram/selectors.ts](src/sites/instagram/selectors.ts). Leave the old
   candidates: they cost nothing and may still be right for other accounts or locales.
4. Rebuild, reload, confirm. Set `DEBUG` back to `false`.

If what changed is a *container* rather than a button, check the guard lists instead
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

Instagram is the worked example — it reuses the shared runtime, hider and observer without
changes. For Reddit, YouTube, LinkedIn or X:

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

The URL parser and the cleaners were exercised against a real Chromium engine during
development, not only type-checked:

| Check                                                | Result |
| ---------------------------------------------------- | ------ |
| URL parser cases                                     | 21/21  |
| Content-script behaviour in headless Chrome          | 89/89  |

The browser checks drive the **built** content scripts against a synthetic
Facebook/Messenger/Instagram DOM and assert on what ends up hidden: story strips hidden
while navigation, media, close and the author link stay; post actions hidden without
touching post text, counters or comment actions; call buttons hidden in the thread but not
in the sidebar; composer buttons hidden without affecting message reactions; the composer
hidden without affecting the message list; global Messenger rules applying with no protected
chat while leaving their neighbours alone; a platform master switch restoring everything;
instant restore when any setting flips; full release when a chat is unprotected; and correct
behaviour across SPA navigation between a protected and an unprotected conversation, on
`facebook.com/messages/t/...`, `messenger.com/t/...`, and Instagram's feed and story routes.

Those checks validate the mechanism against a stand-in DOM. They cannot validate that a
given `aria-label` is what your account actually renders — that is what the selector-update
procedure above is for.

## License

MIT. Add a `LICENSE` file with your own name and year before publishing.
