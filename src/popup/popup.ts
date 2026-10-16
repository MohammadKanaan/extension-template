import { APP_NAME, LOG_PREFIX } from "../constants.js";
import { b } from "../browser.js";
import { isSiteEnabled } from "../host.js";
import {
  loadSettings,
  loadSiteOverrides,
  onStorageChanged,
  saveSettings,
  saveSiteOverrides,
} from "../storage.js";
import {
  DEFAULT_SETTINGS,
  type Settings,
  type SiteOverrides,
  type Theme,
} from "../types.js";
import {
  applyTheme,
  nextTheme,
  systemTheme,
  themeLabel,
  themeName,
} from "../shared/theme.js";
import { requireElement } from "../shared/dom.js";

const appTitle = requireElement("appTitle", HTMLHeadingElement);
const hostBadge = requireElement("hostBadge", HTMLSpanElement);
const themeToggle = requireElement("themeToggle", HTMLButtonElement);
const siteToggleInput = requireElement("siteToggleInput", HTMLInputElement);
const siteToggleLabel = requireElement("siteToggleLabel", HTMLSpanElement);
const siteStatus = requireElement("siteStatus", HTMLSpanElement);
const optionsBtn = requireElement("optionsBtn", HTMLButtonElement);

let settings: Settings | null = null;
let siteOverrides: SiteOverrides = {};
let hostname = "";

// Paint the system guess before the stored setting has loaded, so the popup
// does not open in the wrong theme for a frame.
applyThemeToDoc(systemTheme());

function applyThemeToDoc(theme: Theme): void {
  applyTheme(document, theme);
  themeToggle.textContent = themeName(theme);
  themeToggle.title = themeLabel(theme);
  themeToggle.setAttribute("aria-label", themeLabel(theme));
}

function cycleTheme(): void {
  if (!settings) return;
  settings = { ...settings, theme: nextTheme(settings.theme) };
  saveSettings(settings).catch((e) =>
    console.error(`${LOG_PREFIX} could not save theme`, e),
  );
  applyThemeToDoc(settings.theme);
}

function truncateHost(host: string): string {
  return host.length > 28 ? `${host.slice(0, 25)}…` : host;
}

async function getCurrentTabHostname(): Promise<string> {
  try {
    const [tab] = await b.tabs.query({ active: true, currentWindow: true });
    return tab?.url ? new URL(tab.url).hostname : "";
  } catch {
    return "";
  }
}

function renderToggle(): void {
  if (!hostname) {
    hostBadge.textContent = "";
    siteToggleLabel.textContent = "Unavailable on this page";
    siteStatus.textContent = "Open a regular website to change its setting.";
    siteToggleInput.checked = false;
    siteToggleInput.disabled = true;
    return;
  }

  hostBadge.textContent = truncateHost(hostname);
  hostBadge.title = hostname;
  siteToggleInput.checked = isSiteEnabled(
    settings ?? DEFAULT_SETTINGS,
    siteOverrides,
    hostname,
  );
  siteToggleInput.disabled = false;
  siteToggleLabel.textContent = "Use on this site";

  const override = siteOverrides[hostname];
  if (override === true) siteStatus.textContent = "Custom setting: enabled";
  else if (override === false)
    siteStatus.textContent = "Custom setting: disabled";
  else if (settings?.enabledByDefault)
    siteStatus.textContent = "Following global setting: enabled";
  else siteStatus.textContent = "Following global setting: disabled";
}

/** Store an override only when it differs from the global default. */
async function handleToggle(): Promise<void> {
  if (!hostname || !settings) return;
  const enabled = siteToggleInput.checked;
  const next = { ...siteOverrides };
  if (enabled === settings.enabledByDefault) delete next[hostname];
  else next[hostname] = enabled;
  siteOverrides = next;
  renderToggle();
  await saveSiteOverrides(siteOverrides);
}

async function init(): Promise<void> {
  appTitle.textContent = APP_NAME;
  document.title = APP_NAME;

  [settings, siteOverrides, hostname] = await Promise.all([
    loadSettings(),
    loadSiteOverrides(),
    getCurrentTabHostname(),
  ]);
  applyThemeToDoc(settings.theme);
  renderToggle();

  onStorageChanged((changes) => {
    if (changes.settings !== undefined) {
      settings = changes.settings;
      applyThemeToDoc(settings.theme);
    }
    if (changes.siteOverrides !== undefined)
      siteOverrides = changes.siteOverrides;
    renderToggle();
  });

  themeToggle.addEventListener("click", cycleTheme);
  siteToggleInput.addEventListener("change", () => {
    handleToggle().catch((e) =>
      console.error(`${LOG_PREFIX} could not save site setting`, e),
    );
  });
  optionsBtn.addEventListener("click", () => void b.runtime.openOptionsPage());
}

void init().catch((e) => console.error(`${LOG_PREFIX} popup init failed`, e));
