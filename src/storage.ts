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

export async function loadSettings(): Promise<Settings> {
  const { [STORAGE_KEYS.settings]: raw } = await b.storage.sync.get(
    STORAGE_KEYS.settings,
  );
  if (raw && typeof raw === "object") {
    const partial = raw as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...partial,
      theme: concreteTheme(partial.theme),
    };
  }
  return { ...DEFAULT_SETTINGS, theme: systemTheme() };
}

export async function saveSettings(s: Settings): Promise<void> {
  await b.storage.sync.set({ [STORAGE_KEYS.settings]: s });
}

export async function loadSiteOverrides(): Promise<SiteOverrides> {
  const { [STORAGE_KEYS.siteOverrides]: raw } = await b.storage.sync.get(
    STORAGE_KEYS.siteOverrides,
  );
  if (raw && typeof raw === "object") return raw as SiteOverrides;
  return {};
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
      out.settings = changes[STORAGE_KEYS.settings].newValue as
        Settings | undefined;
    if (STORAGE_KEYS.siteOverrides in changes)
      out.siteOverrides = changes[STORAGE_KEYS.siteOverrides].newValue as
        SiteOverrides | undefined;
    if (Object.keys(out).length > 0) cb(out);
  };
  b.storage.onChanged.addListener(listener);
  return () => b.storage.onChanged.removeListener(listener);
}
