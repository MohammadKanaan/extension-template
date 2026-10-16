/**
 * Turn a fresh copy of the template into a named extension.
 *
 * Replaces the template placeholders (name, slug, Firefox add-on id, and
 * description) in every file that carries them, drops the template-only
 * section of the README, then deletes this script and its test.
 *
 * Usage:
 *   bun run init --name "Tab Tamer" [--id tab-tamer@you.dev] [--description "..."]
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = resolve(fileURLToPath(import.meta.url), "..", "..");

const PLACEHOLDER = {
  id: "my-extension@example.com",
  name: "My Extension",
  slug: "my-extension",
  description: "A cross-browser WebExtension.",
};

/** Every file that mentions a placeholder. */
const FILES = [
  "manifest.json",
  "package.json",
  "bun.lock",
  "README.md",
  "PRIVACY.html",
  "store/listing.md",
  "src/constants.ts",
  "src/content-loader.ts",
  "src/popup/popup.html",
  "src/options/options.html",
];

const TEMPLATE_SECTION =
  /<!-- template:start -->[\s\S]*?<!-- template:end -->\n*/g;

function fail(message) {
  console.error(`init failed: ${message}`);
  process.exit(1);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      name: { type: "string" },
      id: { type: "string" },
      description: { type: "string" },
    },
  }));
} catch (err) {
  fail(err.message);
}

const name = values.name?.trim();
if (!name) fail('pass the extension name, e.g. --name "Tab Tamer"');

const slug = name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");
if (!slug)
  fail(`"${name}" has no letters or digits to build a package name from`);

const id = values.id?.trim() || `${slug}@example.com`;
const description = values.description?.trim() || PLACEHOLDER.description;

/** Escape a value for the kind of file it lands in. */
function encode(value, file) {
  const ext = extname(file);
  // JSON strings and the double-quoted TS string literals share escaping rules.
  if (ext === ".json" || ext === ".ts")
    return JSON.stringify(value).slice(1, -1);
  if (ext === ".html") {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  return value;
}

// The id contains the slug, so it is replaced first.
const replacements = [
  [PLACEHOLDER.id, id],
  [PLACEHOLDER.name, name],
  [PLACEHOLDER.slug, slug],
  [PLACEHOLDER.description, description],
];

for (const file of FILES) {
  const path = resolve(root, file);
  if (!existsSync(path)) fail(`${file} is missing — was init already run?`);
  let text = readFileSync(path, "utf8").replace(TEMPLATE_SECTION, "");
  for (const [from, to] of replacements) {
    text = text.replaceAll(from, encode(to, file));
  }
  writeFileSync(path, text);
}

const pkgPath = resolve(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
delete pkg.scripts.init;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

rmSync(resolve(root, "tests/init.test.mjs"), { force: true });
rmSync(fileURLToPath(import.meta.url), { force: true });

console.log(`initialised "${name}" (package ${slug}, Firefox id ${id})`);
if (!values.id) {
  console.log(
    `note: set a real Firefox add-on id in manifest.json before publishing to AMO`,
  );
}
console.log("next: replace icons/logo.svg, then run `bun run build`");
