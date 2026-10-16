import { APP_NAME, LOG_PREFIX, SAVE_STATUS_DURATION_MS } from "../constants.js";
import { loadSettings, onStorageChanged, saveSettings } from "../storage.js";
import type { Settings, Theme } from "../types.js";
import { applyTheme, systemTheme } from "../shared/theme.js";
import { requireElement } from "../shared/dom.js";

const appName = requireElement("app-name", HTMLSpanElement);
const enabledByDefault = requireElement("enabled-by-default", HTMLInputElement);
const themeSelect = requireElement("theme-select", HTMLSelectElement);
const saveStatus = requireElement("save-status", HTMLDivElement);

let settings: Settings;
let saveStatusTimer: ReturnType<typeof setTimeout> | null = null;

// Paint the system guess before the stored setting has loaded.
applyTheme(document, systemTheme());

function render(): void {
  enabledByDefault.checked = settings.enabledByDefault;
  themeSelect.value = settings.theme;
  applyTheme(document, settings.theme);
}

function showSaved(): void {
  saveStatus.textContent = "Saved";
  saveStatus.classList.add("visible");
  if (saveStatusTimer) clearTimeout(saveStatusTimer);
  saveStatusTimer = setTimeout(
    () => saveStatus.classList.remove("visible"),
    SAVE_STATUS_DURATION_MS,
  );
}

async function update(patch: Partial<Settings>): Promise<void> {
  settings = { ...settings, ...patch };
  render();
  await saveSettings(settings);
  showSaved();
}

function run(task: Promise<void>): void {
  task.catch((e) => {
    console.error(`${LOG_PREFIX} could not save settings`, e);
    saveStatus.textContent = "Could not save";
    saveStatus.classList.add("visible");
  });
}

async function init(): Promise<void> {
  appName.textContent = APP_NAME;
  document.title = `${APP_NAME} Settings`;

  settings = await loadSettings();
  render();

  onStorageChanged((changes) => {
    if (changes.settings === undefined) return;
    settings = changes.settings;
    render();
  });

  enabledByDefault.addEventListener("change", () =>
    run(update({ enabledByDefault: enabledByDefault.checked })),
  );
  themeSelect.addEventListener("change", () =>
    run(update({ theme: themeSelect.value as Theme })),
  );
}

void init().catch((e) => console.error(`${LOG_PREFIX} options init failed`, e));
