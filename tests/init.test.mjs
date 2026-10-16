import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

/** Copy the template's text files into a scratch directory init can rewrite. */
function makeFixture(t) {
  const fixture = mkdtempSync(resolve(tmpdir(), "extension-init-"));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  for (const entry of [
    "manifest.json",
    "package.json",
    "bun.lock",
    "README.md",
    "PRIVACY.html",
    "store",
    "scripts",
    "src",
    "tests",
  ]) {
    cpSync(resolve(root, entry), resolve(fixture, entry), { recursive: true });
  }
  return fixture;
}

function runInit(fixture, args) {
  execFileSync(
    process.execPath,
    [resolve(fixture, "scripts/init.mjs"), ...args],
    {
      cwd: fixture,
      stdio: "pipe",
    },
  );
}

test("init replaces every placeholder and removes itself", (t) => {
  const fixture = makeFixture(t);
  runInit(fixture, [
    "--name",
    'Tab "Tamer"',
    "--id",
    "tabs@me.dev",
    "--description",
    "Tames <tabs>.",
  ]);

  const manifest = JSON.parse(
    readFileSync(resolve(fixture, "manifest.json"), "utf8"),
  );
  assert.equal(manifest.name, 'Tab "Tamer"');
  assert.equal(manifest.description, "Tames <tabs>.");
  assert.equal(manifest.action.default_title, 'Tab "Tamer"');
  assert.equal(manifest.browser_specific_settings.gecko.id, "tabs@me.dev");

  const pkg = JSON.parse(
    readFileSync(resolve(fixture, "package.json"), "utf8"),
  );
  assert.equal(pkg.name, "tab-tamer");
  assert.equal(pkg.scripts.init, undefined);

  assert.match(
    readFileSync(resolve(fixture, "src/constants.ts"), "utf8"),
    /APP_NAME = "Tab \\"Tamer\\"";/,
  );
  assert.match(
    readFileSync(resolve(fixture, "src/popup/popup.html"), "utf8"),
    /<title>Tab &quot;Tamer&quot;<\/title>/,
  );
  assert.match(
    readFileSync(resolve(fixture, "src/options/options.html"), "utf8"),
    /Tames &lt;tabs&gt;\./,
  );

  const readme = readFileSync(resolve(fixture, "README.md"), "utf8");
  assert.doesNotMatch(readme, /template:start/);
  assert.doesNotMatch(readme, /bun run init/);

  for (const file of [
    "manifest.json",
    "package.json",
    "bun.lock",
    "README.md",
    "PRIVACY.html",
    "store/listing.md",
    "src/content-loader.ts",
  ]) {
    const text = readFileSync(resolve(fixture, file), "utf8");
    assert.doesNotMatch(text, /My Extension|my-extension/, file);
  }

  assert.equal(existsSync(resolve(fixture, "scripts/init.mjs")), false);
  assert.equal(existsSync(resolve(fixture, "tests/init.test.mjs")), false);
});

test("init derives a placeholder Firefox id from the name", (t) => {
  const fixture = makeFixture(t);
  runInit(fixture, ["--name", "Read Later"]);
  const manifest = JSON.parse(
    readFileSync(resolve(fixture, "manifest.json"), "utf8"),
  );
  assert.equal(
    manifest.browser_specific_settings.gecko.id,
    "read-later@example.com",
  );
  assert.equal(manifest.description, "A cross-browser WebExtension.");
});

test("init refuses to run without a name", (t) => {
  const fixture = makeFixture(t);
  assert.throws(() => runInit(fixture, []), /pass the extension name/);
  assert.equal(existsSync(resolve(fixture, "scripts/init.mjs")), true);
});
