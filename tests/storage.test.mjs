import test from "node:test";
import assert from "node:assert/strict";

// storage.ts reads `chrome` through browser.ts when it is first imported, so the
// mock has to be in place before the dynamic import below.
function createMockStorage() {
  const store = {};
  const listeners = new Set();
  const area = {
    get(key) {
      return Promise.resolve(key in store ? { [key]: store[key] } : {});
    },
    set(obj) {
      const changes = {};
      for (const [k, v] of Object.entries(obj))
        changes[k] = { oldValue: store[k], newValue: v };
      Object.assign(store, obj);
      for (const listener of listeners) listener(changes, "sync");
      return Promise.resolve();
    },
  };
  return {
    sync: area,
    onChanged: {
      addListener: (fn) => listeners.add(fn),
      removeListener: (fn) => listeners.delete(fn),
    },
    clear() {
      for (const k of Object.keys(store)) delete store[k];
    },
    store,
  };
}

const mockStorage = createMockStorage();
globalThis.chrome = { storage: mockStorage };

const storage = await import("../dist/storage.js");
const { DEFAULT_SETTINGS } = await import("../dist/types.js");

test("loadSettings returns defaults when nothing is stored", async () => {
  mockStorage.clear();
  assert.deepEqual(await storage.loadSettings(), DEFAULT_SETTINGS);
});

test("saveSettings then loadSettings round-trips", async () => {
  mockStorage.clear();
  const settings = { enabledByDefault: false, theme: "dark" };
  await storage.saveSettings(settings);
  assert.deepEqual(await storage.loadSettings(), settings);
});

test("loadSettings fills in missing fields and replaces an unknown theme", async () => {
  mockStorage.clear();
  mockStorage.store.settings = { enabledByDefault: false, theme: "auto" };
  assert.deepEqual(await storage.loadSettings(), {
    enabledByDefault: false,
    theme: "light",
  });
});

test("site overrides round-trip", async () => {
  mockStorage.clear();
  assert.deepEqual(await storage.loadSiteOverrides(), {});
  await storage.saveSiteOverrides({ "example.com": false });
  assert.deepEqual(await storage.loadSiteOverrides(), { "example.com": false });
});

test("onStorageChanged reports sync changes until unsubscribed", async () => {
  mockStorage.clear();
  const seen = [];
  const unsubscribe = storage.onStorageChanged((changes) => seen.push(changes));
  await storage.saveSiteOverrides({ "example.com": true });
  unsubscribe();
  await storage.saveSiteOverrides({});
  assert.deepEqual(seen, [{ siteOverrides: { "example.com": true } }]);
});

test("onStorageChanged normalizes settings like loadSettings does", async () => {
  mockStorage.clear();
  const seen = [];
  const unsubscribe = storage.onStorageChanged((changes) => seen.push(changes));
  // e.g. written by an older version of the extension on another device
  await mockStorage.sync.set({ settings: { enabledByDefault: "yes" } });
  await mockStorage.sync.set({ settings: undefined, siteOverrides: null });
  unsubscribe();
  assert.deepEqual(seen, [
    { settings: DEFAULT_SETTINGS },
    { settings: DEFAULT_SETTINGS, siteOverrides: {} },
  ]);
});
