import { b } from "./browser.js";
import { systemTheme } from "./shared/theme.js";
import {
  DEFAULT_SETTINGS,
  type Settings,
  type SiteOverrides,
  STORAGE_KEYS,
  type Theme,
} from "./types.js";

/**
 * Themes are always concrete. A stored "auto" (or anything else unrecognised,
 * including a missing value) becomes the system preference.
 */
function concreteTheme(value: unknown): Theme {
  return value === "light" || value === "dark" ? value : systemTheme();
}

/**
 * Settings as the extension expects them, from whatever storage holds: missing
 * or malformed fields (say, written by an older version on another synced
 * device) fall back to the defaults.
 */
function normalizeSettings(raw: unknown): Settings {
  const stored = (raw && typeof raw === "object" ? raw : {}) as Partial<
    Record<keyof Settings, unknown>
  >;
  return {
    enabledByDefault:
      typeof stored.enabledByDefault === "boolean"
        ? stored.enabledByDefault
        : DEFAULT_SETTINGS.enabledByDefault,
    theme: concreteTheme(stored.theme),
  };
}

function normalizeSiteOverrides(raw: unknown): SiteOverrides {
  return raw && typeof raw === "object" ? (raw as SiteOverrides) : {};
}

export async function loadSettings(): Promise<Settings> {
  const { [STORAGE_KEYS.settings]: raw } = await b.storage.sync.get(
    STORAGE_KEYS.settings,
  );
  return normalizeSettings(raw);
}

export async function saveSettings(s: Settings): Promise<void> {
  await b.storage.sync.set({ [STORAGE_KEYS.settings]: s });
}

export async function loadSiteOverrides(): Promise<SiteOverrides> {
  const { [STORAGE_KEYS.siteOverrides]: raw } = await b.storage.sync.get(
    STORAGE_KEYS.siteOverrides,
  );
  return normalizeSiteOverrides(raw);
}

export async function saveSiteOverrides(o: SiteOverrides): Promise<void> {
  await b.storage.sync.set({ [STORAGE_KEYS.siteOverrides]: o });
}

type StorageChange<T> = { oldValue?: T; newValue?: T };
type StorageChanges = Record<string, StorageChange<unknown>>;

export function onStorageChanged(
  cb: (changes: { settings?: Settings; siteOverrides?: SiteOverrides }) => void,
): () => void {
  const listener = (changes: StorageChanges, area: string) => {
    if (area !== "sync") return;
    const out: { settings?: Settings; siteOverrides?: SiteOverrides } = {};
    if (STORAGE_KEYS.settings in changes)
      out.settings = normalizeSettings(changes[STORAGE_KEYS.settings].newValue);
    if (STORAGE_KEYS.siteOverrides in changes)
      out.siteOverrides = normalizeSiteOverrides(
        changes[STORAGE_KEYS.siteOverrides].newValue,
      );
    if (Object.keys(out).length > 0) cb(out);
  };
  b.storage.onChanged.addListener(listener);
  return () => b.storage.onChanged.removeListener(listener);
}
