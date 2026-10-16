# My Extension

A cross-browser WebExtension.

<!-- template:start -->

## Start a new extension from this template

This is a template for Manifest V3 extensions that run in Chromium browsers and
Firefox from one TypeScript codebase. It comes with:

- A content script that loads as an ES module. `src/content-loader.ts` imports
  `src/content.ts`, and a test fails if one of its imports is missing from
  `web_accessible_resources`.
- A background script, a toolbar popup with a per-site on/off switch, and an
  options page with a global default and a light/dark theme.
- Settings and per-site overrides in sync storage, with change notifications.
- A framework-free UI kit in `src/ui/` with buttons, switches, inputs, lists,
  and toasts in light and dark themes.
- Icons generated from one SVG, Chrome `.zip` and Firefox `.xpi` packaging,
  ESLint, strict TypeScript, `node --test`, and GitHub Actions CI.

Copy the template, then name it:

```bash
cp -R webextension-template my-new-extension   # or "Use this template" on GitHub
cd my-new-extension && rm -rf .git && git init
bun install
bun run init --name "Tab Tamer" --id tab-tamer@you.dev --description "Keeps tabs in check."
```

`init` writes the name, package name, Firefox add-on id, and description into
the manifest, `package.json`, the pages, the privacy policy, and the store
copy. Then it removes this section and deletes itself. `--id` defaults to
`<slug>@example.com`. Leave out `--description` and the placeholder stays.

Then:

1. Replace `icons/logo.svg` with your artwork.
2. Write the feature in `src/content.ts` (page behaviour), `src/background.ts`
   (events), and the popup and options pages.
3. Cut `permissions` and `host_permissions` in `manifest.json` down to what
   the extension needs, then update `PRIVACY.html` and `store/listing.md` to
   match.

<!-- template:end -->

## Requirements

- Bun, and Node.js 20.19+ for `node --test`.
- Chrome, Edge, Brave, or another Chromium browser, or Firefox 121+.

## Install and build

Install dependencies, then build for Chromium:

```bash
bun install --frozen-lockfile
bun run build
```

The build writes the unpacked extension to `dist/`.

For local development:

```bash
bun run watch      # Recompile TypeScript on changes
bun run typecheck  # Check types without writing dist/
bun run lint       # ESLint over src/, scripts/ and tests/
bun run format     # Format with Prettier
bun run test       # Build, then run the Node test suite
bun run build:firefox    # Build with the Firefox manifest
bun run package:chrome   # Build, then zip dist/ to artifacts/*-chrome.zip
bun run package:firefox  # Build, then zip dist/ to artifacts/*-firefox.xpi
```

`tsc --watch` only recompiles TypeScript. Run `bun run build` after you change
the manifest or a static file. A new HTML, CSS, or image file also needs an
entry in `STATIC_ASSETS` in `scripts/copy-static.mjs`.

Every module that `content.js` imports, directly or through another module,
has to be listed in `web_accessible_resources` in `manifest.json`. The tests
fail if one is missing.

## Load the extension

### Chrome, Edge, Brave, and other Chromium browsers

1. Open `chrome://extensions`, or your browser's extensions page.
2. Turn on **Developer mode**.
3. Choose **Load unpacked**.
4. Select this project's `dist/` directory.

### Firefox

Build for Firefox first:

```bash
bun run build:firefox
```

Then:

1. Open `about:debugging#/runtime/this-firefox`.
2. Select **Load Temporary Add-on…**.
3. Choose `dist/manifest.json`.

Firefox drops temporary add-ons when it restarts.

To publish on [addons.mozilla.org](https://addons.mozilla.org/developers/),
upload the `.xpi` from `bun run package:firefox`. AMO only takes `.zip`,
`.xpi`, and `.crx` files. Upload the unpacked `dist/` folder or any other file
type and it fails with "Your add-on should end with .zip, .xpi or .crx".

## Project layout

```
manifest.json          MV3 manifest; copy-static.mjs derives the Firefox variant
src/
├── background.ts      service worker (Chrome) / background script (Firefox)
├── content-loader.ts  classic content script that imports content.js as a module
├── content.ts         page behaviour, switched on and off per site
├── browser.ts         chrome/browser API shim
├── storage.ts         settings and site overrides in sync storage
├── host.ts            per-site enablement
├── popup/             toolbar popup
├── options/           settings page
├── shared/            helpers shared by the pages
└── ui/                portable UI kit (see src/ui/README.md)
scripts/               build, icon, and packaging scripts
tests/                 node --test suites, run against dist/
store/                 store listing copy
```

## Storage and permissions

- Settings and per-site overrides live in `storage.sync`. If the user has
  browser sync on, the browser copies them to their other devices.
- The extension asks for access to all URLs so the content script can run on
  any site. Users can turn it off everywhere or for one site.
- In Chrome, any web page can tell the extension is installed by fetching one
  of its web-accessible modules. The extension ID is fixed, so the URL is
  predictable. Chrome's `use_dynamic_url` would hide it, but Chrome resolves a
  module's relative imports against the fixed ID, so the content script stops
  loading. Firefox gives each install a random ID, so it isn't affected.
