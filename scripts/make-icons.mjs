/**
 * Generate all extension icon sizes from the shared SVG artwork.
 *
 * `currentColor` in logo.svg is the UI accent: the light value of
 * `--ui-color-accent` in src/ui/styles/tokens.css. Use it for the brand colour
 * so the icon follows a rebrand; literal colours are left alone.
 */
import sharp from "sharp";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const ICONS_DIR = resolve(ROOT, "icons");
const TOKENS = resolve(ROOT, "src/ui/styles/tokens.css");
const SIZES = [16, 32, 48, 128];

/** The light-theme accent, from either `light-dark(<light>, <dark>)` or a plain colour. */
function readAccent() {
  if (!existsSync(TOKENS)) return null;
  const value = readFileSync(TOKENS, "utf8").match(
    /--ui-color-accent:\s*([^;]+);/,
  )?.[1];
  if (!value) return null;
  return value.match(/^light-dark\(\s*([^,]+?)\s*,/)?.[1] ?? value.trim();
}

let svg = readFileSync(resolve(ICONS_DIR, "logo.svg"), "utf8");
if (svg.includes("currentColor")) {
  const accent = readAccent();
  if (!accent) {
    console.error(
      `make-icons failed: logo.svg uses currentColor but no --ui-color-accent was found in ${TOKENS}`,
    );
    process.exit(1);
  }
  svg = svg.replace(/<svg\b/, `<svg color="${accent}"`);
}

for (const size of SIZES) {
  // Rasterize above the target resolution, then downsample for smooth small icons.
  await sharp(Buffer.from(svg), { density: 288 })
    .resize(size, size)
    .png()
    .toFile(resolve(ICONS_DIR, `icon-${size}.png`));
  console.log(`icons/icon-${size}.png generated`);
}
