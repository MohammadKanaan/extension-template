/**
 * Turn a fresh copy of the template into a named extension.
 *
 * Replaces the template placeholders (name, slug, Firefox add-on id,
 * description, contact email, and repository URL) in every file that carries
 * them, names the README after the project and drops its template-only
 * section, then deletes this script and its test.
 *
 * Usage:
 *   bun run init --name "Tab Tamer" [--id tab-tamer@you.dev] [--description "..."]
 *     [--email you@you.dev] [--repo https://github.com/you/tab-tamer]
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
  email: "you@example.com",
  repo: "https://github.com/your-username/my-extension",
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

/** The README heading, which names the template until init names the project. */
const TEMPLATE_TITLE = /^# WebExtension Template$/m;

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
      email: { type: "string" },
      repo: { type: "string" },
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
const email = values.email?.trim() || PLACEHOLDER.email;
const repo = values.repo?.trim().replace(/\/+$/, "") || PLACEHOLDER.repo;

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

// The id and repository URL contain the slug, so they are replaced first. An
// omitted --repo keeps the placeholder owner but still picks up the new slug.
const replacements = [
  [PLACEHOLDER.id, id],
  [PLACEHOLDER.repo, repo],
  [PLACEHOLDER.email, email],
  [PLACEHOLDER.name, name],
  [PLACEHOLDER.slug, slug],
  [PLACEHOLDER.description, description],
];

for (const file of FILES) {
  const path = resolve(root, file);
  if (!existsSync(path)) fail(`${file} is missing — was init already run?`);
  let text = readFileSync(path, "utf8").replace(TEMPLATE_SECTION, "");
  if (file === "README.md") text = text.replace(TEMPLATE_TITLE, `# ${name}`);
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
if (!values.email) {
  console.log(
    `note: set a real contact email in PRIVACY.html before publishing`,
  );
}
if (!values.repo) {
  console.log(`note: set the repository URL in store/listing.md`);
}
console.log("next: replace icons/logo.svg, then run `bun run build`");
