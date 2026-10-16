export type Theme = "light" | "dark";

export interface Settings {
  enabledByDefault: boolean;
  theme: Theme;
}

/** Per-hostname overrides of `Settings.enabledByDefault`. */
export type SiteOverrides = Record<string, boolean>;

export const DEFAULT_SETTINGS: Settings = {
  enabledByDefault: true,
  /**
   * Placeholder theme. The first run adopts the system preference instead
   * (see `concreteTheme()` in storage.ts); a stored choice always wins.
   */
  theme: "light",
};

/** Storage is already scoped per extension, so keys need no prefix. */
export const STORAGE_KEYS = {
  settings: "settings",
  siteOverrides: "siteOverrides",
} as const;
