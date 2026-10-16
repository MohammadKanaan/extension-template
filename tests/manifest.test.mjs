import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, posix, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

/** Run copy-static for Firefox in a scratch copy and return the manifest it writes. */
function buildFirefoxManifest(t) {
  const fixture = mkdtempSync(resolve(tmpdir(), "extension-firefox-"));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  for (const entry of ["manifest.json", "scripts", "icons", "src"]) {
    cpSync(resolve(root, entry), resolve(fixture, entry), { recursive: true });
  }
  execFileSync(
    process.execPath,
    [resolve(fixture, "scripts/copy-static.mjs"), "--target=firefox"],
    { cwd: fixture, stdio: "pipe" },
  );
  return JSON.parse(
    readFileSync(resolve(fixture, "dist/manifest.json"), "utf8"),
  );
}
const IMPORT_RE = /(?:from|import)\s*\(?\s*["'](\.{1,2}\/[^"']+)["']/g;

/** Collect every module reachable from `entry` via relative imports (dist-relative paths). */
function collectModules(entry, seen = new Set()) {
  if (seen.has(entry)) return seen;
  seen.add(entry);
  const source = readFileSync(resolve(dist, entry), "utf8");
  for (const [, spec] of source.matchAll(IMPORT_RE)) {
    collectModules(posix.normalize(posix.join(dirname(entry), spec)), seen);
  }
  return seen;
}

test("every module imported by the content script is web-accessible", () => {
  const manifest = JSON.parse(
    readFileSync(resolve(dist, "manifest.json"), "utf8"),
  );
  const accessible = new Set(
    manifest.web_accessible_resources.flatMap((r) => r.resources),
  );
  const missing = [...collectModules("content.js")].filter(
    (m) => !accessible.has(m),
  );
  assert.deepEqual(missing, []);
});

test("manifest declares the AMO data collection consent", () => {
  const manifest = JSON.parse(
    readFileSync(resolve(dist, "manifest.json"), "utf8"),
  );
  const gecko = manifest.browser_specific_settings?.gecko;
  assert.ok(
    gecko,
    "browser_specific_settings.gecko is required to publish on AMO",
  );
  // AMO refuses new submissions that omit this key. The extension transmits nothing,
  // and "none" cannot be combined with any other data type.
  assert.deepEqual(gecko.data_collection_permissions, { required: ["none"] });
});

test("the Firefox manifest loads background.js as a module", (t) => {
  const manifest = buildFirefoxManifest(t);
  // background.js starts with an import, which is a SyntaxError in a classic script.
  assert.deepEqual(manifest.background, {
    scripts: ["background.js"],
    type: "module",
  });
  assert.equal(manifest.minimum_chrome_version, undefined);
});
