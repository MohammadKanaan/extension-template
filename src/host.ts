import type { Settings, SiteOverrides } from "./types.js";

export function currentHostname(): string {
  try {
    return location.hostname;
  } catch {
    return "";
  }
}

/** A site override wins over the global default; pages without a host follow the default. */
export function isSiteEnabled(
  settings: Settings,
  overrides: SiteOverrides,
  host: string,
): boolean {
  if (!host) return settings.enabledByDefault;
  const override = overrides[host];
  if (override === true) return true;
  if (override === false) return false;
  return settings.enabledByDefault;
}
