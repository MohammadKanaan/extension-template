import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");

/** Run make-icons in a scratch project holding only `logo` and, optionally, `tokens`. */
function makeIcons(t, { logo, tokens }) {
  const fixture = mkdtempSync(resolve(tmpdir(), "extension-icons-"));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  mkdirSync(resolve(fixture, "scripts"));
  mkdirSync(resolve(fixture, "icons"));
  symlinkSync(
    resolve(root, "node_modules"),
    resolve(fixture, "node_modules"),
    "junction",
  );
  copyFileSync(
    resolve(root, "scripts/make-icons.mjs"),
    resolve(fixture, "scripts/make-icons.mjs"),
  );
  writeFileSync(resolve(fixture, "icons/logo.svg"), logo);
  if (tokens) {
    mkdirSync(resolve(fixture, "src/ui/styles"), { recursive: true });
    writeFileSync(resolve(fixture, "src/ui/styles/tokens.css"), tokens);
  }
  execFileSync(process.execPath, [resolve(fixture, "scripts/make-icons.mjs")], {
    cwd: tmpdir(),
    stdio: "pipe",
  });
  return fixture;
}

/** Check every size is generated, filled with `rgb` on the left and transparent on the right. */
async function assertHalfFilled(fixture, rgb) {
  for (const size of [16, 32, 48, 128]) {
    const { data, info } = await sharp(
      resolve(fixture, `icons/icon-${size}.png`),
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(info.width, size);
    assert.equal(info.height, size);
    const left = (Math.floor(size / 2) * size + Math.floor(size / 4)) * 4;
    const right =
      (Math.floor(size / 2) * size + Math.floor((3 * size) / 4)) * 4;
    assert.deepEqual(
      [...data.subarray(left, left + 4)],
      [...rgb, 255],
      `${size}px artwork`,
    );
    assert.equal(data[right + 3], 0, `${size}px transparency`);
  }
}

// A filled left half and transparent right half make scaling and alpha observable.
const halfSquare = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><path fill="${fill}" d="M0 0h64v128H0z"/></svg>`;

test("icon generation scales the SVG artwork at every manifest size", async (t) => {
  const fixture = makeIcons(t, { logo: halfSquare("#ff0000") });
  await assertHalfFilled(fixture, [255, 0, 0]);
});

test("currentColor in the logo is the light accent token", async (t) => {
  const fixture = makeIcons(t, {
    logo: halfSquare("currentColor"),
    tokens: ":root {\n  --ui-color-accent: light-dark(#00ff00, #0000ff);\n}\n",
  });
  await assertHalfFilled(fixture, [0, 255, 0]);
});

test("currentColor without an accent token fails loudly", (t) => {
  assert.throws(
    () => makeIcons(t, { logo: halfSquare("currentColor") }),
    /no --ui-color-accent/,
  );
});
