import test, { mock } from "node:test";
import assert from "node:assert/strict";

// Just enough DOM for toast.ts, which runs in extension pages.
class FakeElement {
  constructor(tag) {
    this.tag = tag;
    this.className = "";
    this.inert = false;
    this.attributes = {};
    this.children = [];
    this.listeners = {};
    const classes = new Set();
    this.classList = {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    };
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  append(...nodes) {
    this.children.push(...nodes);
  }
  replaceChildren(...nodes) {
    this.children = nodes;
  }
  addEventListener(type, fn) {
    this.listeners[type] = fn;
  }
}

const body = new FakeElement("body");
globalThis.document = { body, createElement: (tag) => new FakeElement(tag) };
mock.timers.enable({ apis: ["setTimeout"] });

const { showToast, showUndoToast, UI_TOAST_DURATION_MS } =
  await import("../dist/ui/toast.js");

const toast = () => body.children[0];
const visible = () => toast().classList.contains("ui-toast--visible");

test("showToast shows a message, then hides it after the duration", () => {
  showToast("Saved", { durationMs: 1000 });
  assert.equal(body.children.length, 1);
  assert.equal(toast().attributes.role, "status");
  assert.deepEqual(toast().children, ["Saved"]);
  assert.ok(visible());
  assert.equal(toast().inert, false);

  mock.timers.tick(999);
  assert.ok(visible());
  mock.timers.tick(1);
  assert.ok(!visible());
  assert.equal(toast().inert, true);
});

test("a new toast reuses the element and the old handle can't hide it", () => {
  const first = showToast("First");
  showToast("Second");
  assert.equal(body.children.length, 1);
  assert.deepEqual(toast().children, ["Second"]);

  first.hide();
  assert.ok(visible());
  mock.timers.tick(UI_TOAST_DURATION_MS);
  assert.ok(!visible());
});

test("showUndoToast hides the toast and calls onUndo when Undo is clicked", () => {
  let undone = 0;
  showUndoToast("Deleted", () => undone++);
  const [message, button] = toast().children;
  assert.equal(message, "Deleted");
  assert.equal(button.textContent, "Undo");
  assert.equal(button.className, "ui-toast__action");

  button.listeners.click();
  assert.equal(undone, 1);
  assert.ok(!visible());
});
