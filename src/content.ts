/**
 * Content-script entry, loaded as a module by content-loader.ts.
 *
 * Every module this file imports (directly or transitively) must be listed in
 * `web_accessible_resources` in manifest.json; tests/manifest.test.mjs fails if
 * one is missing.
 */
import { LOG_PREFIX } from "./constants.js";
import { currentHostname, isSiteEnabled } from "./host.js";
import {
  loadSettings,
  loadSiteOverrides,
  onStorageChanged,
} from "./storage.js";
import type { Settings, SiteOverrides } from "./types.js";

let settings: Settings;
let overrides: SiteOverrides = {};
let active = false;

function activate(): void {
  if (active) return;
  active = true;
  // Start the extension's page behaviour here: attach listeners, observe the DOM, ...
  console.debug(`${LOG_PREFIX} active on ${currentHostname() || "this page"}`);
}

function deactivate(): void {
  if (!active) return;
  active = false;
  // Undo everything activate() did, so a site can be switched off without a reload.
  console.debug(`${LOG_PREFIX} inactive`);
}

function reevaluate(): void {
  if (isSiteEnabled(settings, overrides, currentHostname())) activate();
  else deactivate();
}

async function init(): Promise<void> {
  [settings, overrides] = await Promise.all([
    loadSettings(),
    loadSiteOverrides(),
  ]);

  onStorageChanged((changes) => {
    if (changes.settings !== undefined) settings = changes.settings;
    if (changes.siteOverrides !== undefined) overrides = changes.siteOverrides;
    reevaluate();
  });

  reevaluate();
}

void init().catch((e) => console.error(`${LOG_PREFIX} init failed`, e));
