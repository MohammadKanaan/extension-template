export interface UiToastAction {
  label: string;
  onClick: () => void;
}

export interface UiToastOptions {
  /** A button after the message. Clicking it hides the toast first. */
  action?: UiToastAction;
  durationMs?: number;
}

export interface UiToast {
  /** Hide this toast early. Does nothing once another toast replaced it. */
  hide(): void;
}

export const UI_TOAST_DURATION_MS = 5000;

let toastEl: HTMLDivElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let currentId = 0;

function createToastElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "ui-toast";
  el.setAttribute("role", "status");
  el.inert = true;
  document.body.append(el);
  return el;
}

/**
 * Show `message` at the bottom of the page. A page has one toast, so this
 * replaces any toast already showing.
 */
export function showToast(
  message: string,
  options: UiToastOptions = {},
): UiToast {
  const el = (toastEl ??= createToastElement());
  const id = ++currentId;

  function hide(): void {
    if (id !== currentId) return;
    clearTimeout(hideTimer);
    el.classList.remove("ui-toast--visible");
    el.inert = true;
  }

  el.inert = false;
  if (options.action) {
    const { label, onClick } = options.action;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ui-toast__action";
    button.textContent = label;
    button.addEventListener("click", () => {
      hide();
      onClick();
    });
    el.replaceChildren(message, button);
  } else {
    el.replaceChildren(message);
  }
  el.classList.add("ui-toast--visible");

  clearTimeout(hideTimer);
  hideTimer = setTimeout(hide, options.durationMs ?? UI_TOAST_DURATION_MS);
  return { hide };
}

/** Show `message` with an Undo button that calls `onUndo`. */
export function showUndoToast(
  message: string,
  onUndo: () => void,
  durationMs?: number,
): UiToast {
  return showToast(message, {
    action: { label: "Undo", onClick: onUndo },
    durationMs,
  });
}
