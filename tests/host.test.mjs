import test from "node:test";
import assert from "node:assert/strict";

import { isSiteEnabled } from "../dist/host.js";

const on = { enabledByDefault: true, theme: "light" };
const off = { enabledByDefault: false, theme: "light" };

test("sites follow the global default without an override", () => {
  assert.equal(isSiteEnabled(on, {}, "example.com"), true);
  assert.equal(isSiteEnabled(off, {}, "example.com"), false);
});

test("a site override wins over the global default", () => {
  assert.equal(
    isSiteEnabled(on, { "example.com": false }, "example.com"),
    false,
  );
  assert.equal(
    isSiteEnabled(off, { "example.com": true }, "example.com"),
    true,
  );
});

test("pages without a hostname follow the global default", () => {
  assert.equal(isSiteEnabled(off, { "": true }, ""), false);
});
