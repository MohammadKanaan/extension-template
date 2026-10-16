# Portable UI layer

Framework-free CSS components and a few DOM helpers. Nothing in here touches extension APIs, storage, or app state, so you can copy the folder into any browser project.

## Use it

Copy `src/ui/` into the target project, then load the CSS entrypoint:

```css
@import url("./ui/styles/index.css");
```

To create controls from script, import the TypeScript helpers:

```ts
import { createUiButton } from "./ui/index.js";

const removeButton = createUiButton({
  label: "Remove item",
  variant: "icon",
  density: "compact",
  icon: "delete",
});
```

Static markup uses the same classes with no JavaScript:

```html
<button class="ui-button ui-button--primary">Save</button>

<label class="ui-switch">
  <input type="checkbox" />
  <span class="ui-switch__track" aria-hidden="true"></span>
</label>

<div class="ui-field">
  <label for="name">Name</label>
  <input class="ui-input" id="name" type="text" />
</div>
```

Add the `--compact` modifier to buttons, inputs, switches, list rows, and empty states where space is tight. Buttons come in `primary`, `secondary`, `ghost`, `danger`, `success`, and `icon` variants.

## Restyle it

Override the custom properties on `:root` after you import the entrypoint. The kit's styles sit in a cascade layer, so any unlayered rule of yours wins.

```css
:root {
  --ui-color-accent: #3157d5;
  --ui-color-accent-hover: #2444ad;
  --ui-color-accent-soft: #e7edff;
  --ui-color-on-accent: #ffffff;
  --ui-font-sans: Inter, system-ui, sans-serif;
  --ui-radius-control: 6px;
  --ui-shadow-raised: 0 12px 30px rgb(29 42 68 / 14%);
}
```

By default the theme follows `prefers-color-scheme`. To force one, set `data-theme="light"` or `data-theme="dark"` on the document element.

## State and accessibility

- Use native `disabled`, `hidden`, `aria-selected`, and `aria-invalid` attributes for state.
- Associate validation messages with inputs through `aria-describedby`.
- `createUiButton` gives icon-only buttons an accessible name from `ariaLabel`, or from `label` if that's missing.
- Use `ui-visually-hidden` to hide a label on screen while keeping it for screen readers.
