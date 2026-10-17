# WebExtension Template

A cross-browser WebExtension.

<!-- template:start -->

[![CI](https://github.com/MohammadKanaan/webextension-template/actions/workflows/ci.yml/badge.svg)](https://github.com/MohammadKanaan/webextension-template/actions/workflows/ci.yml)

Manifest V3 template for Chromium and Firefox. One TypeScript codebase, no framework. It ships a background script, an ES-module content script, a popup with a per-site switch, an options page, settings in sync storage, a light/dark UI kit in `src/ui/`, store packaging, and CI.

## Start an extension

```bash
cp -R webextension-template sample-extension   # or "Use this template" on GitHub
cd sample-extension && rm -rf .git && git init
bun install
bun run init --name "Sample Extension" --id sample-extension@you.dev --description "A sample extension." \
  --email you@you.dev --repo https://github.com/you/sample-extension
```

`init` writes these values into the manifest, `package.json`, pages, privacy policy, and store copy, then removes this section and deletes itself. Omitted flags keep their placeholders. `--id` defaults to `<slug>@example.com`.

Then:

1. Set `--ui-color-accent` and `--ui-color-on-accent` in `src/ui/styles/tokens.css`. The other shades and the icon derive from them.
2. Replace `icons/logo.svg`.
3. Write the feature in `src/content.ts`, `src/background.ts`, and the popup and options pages.
4. Trim `permissions` and `host_permissions` in `manifest.json`, then update `PRIVACY.html` and `store/listing.md`. Keep `activeTab`, since the per-site switch reads the tab's URL through it.

<!-- template:end -->

## Build

Needs Bun and Node 20.19+. The CSS uses `light-dark()`, so it runs in Chrome 123+ and Firefox 121+.

```bash
bun install
bun run build            # Chromium, to dist/
bun run build:firefox    # Firefox, to dist/
bun run watch            # recompile TypeScript only
bun run test             # build, then node --test
bun run lint && bun run typecheck
bun run package:chrome   # artifacts/*-chrome.zip
bun run package:firefox  # artifacts/*-firefox.xpi
```

In Chrome, open `chrome://extensions`, turn on Developer mode, and load `dist/` unpacked. In Firefox, open `about:debugging#/runtime/this-firefox`, choose Load Temporary Add-on, and pick `dist/manifest.json`. Firefox drops it on restart.

## Notes

- `watch` skips the manifest and static files, so rerun `build` after changing them. New HTML, CSS, or images also need an entry in `STATIC_ASSETS` in `scripts/copy-static.mjs`.
- Every module `content.js` imports must be listed in `web_accessible_resources`. The tests fail if one is missing.
- AMO only accepts `.zip`, `.xpi`, or `.crx`. Upload the `.xpi` from `package:firefox`, not `dist/`.
- In Chrome, any page can detect the extension by fetching a web-accessible module at its fixed ID. `use_dynamic_url` would hide it but breaks the content script's relative imports. Firefox randomizes the ID per install.

## License

MIT, see [LICENSE](LICENSE).
