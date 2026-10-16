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

Every colour, size, and timing is a custom property in [`styles/tokens.css`](styles/tokens.css). Edit that file, or override tokens on `:root` in your own stylesheet. The kit's styles sit in a cascade layer, so any unlayered rule of yours wins.

| Group     | Tokens                                                                                                     | Notes                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Colour    | `--ui-color-*`                                                                                             | Each written once as `light-dark(<light>, <dark>)`.                                  |
| Brand     | `--ui-color-accent`, `--ui-color-on-accent`                                                                | `accent-hover`, `accent-soft`, and `--ui-focus-ring` are derived with `color-mix()`. |
| Elevation | `--ui-shadow-color`, `--ui-shadow-raised`, `--ui-shadow-overlay`, `--ui-shadow-control`                    |                                                                                      |
| Type      | `--ui-font-sans`, `--ui-font-mono`, `--ui-text-2xs` … `--ui-text-xl`, `--ui-text-display`, `--ui-weight-*` |                                                                                      |
| Spacing   | `--ui-space-1` … `--ui-space-12`                                                                           | 2px steps to 16px (`--ui-space-8`), then 20, 24, 28, 32.                             |
| Controls  | `--ui-control-height`, `--ui-control-height-compact`, `--ui-icon-size`                                     | Buttons, inputs, and selects share heights.                                          |
| Shape     | `--ui-radius-sm`, `--ui-radius-control`, `--ui-radius-panel`, `--ui-radius-pill`                           |                                                                                      |
| Motion    | `--ui-motion-*`                                                                                            |                                                                                      |

Most rebrands only change the accent pair. This example also swaps the font and corner radius:

```css
:root {
  --ui-color-accent: light-dark(#0f7b5f, #5fd3ae);
  --ui-color-on-accent: light-dark(#ffffff, #04211a);
  --ui-font-sans: Inter, system-ui, sans-serif;
  --ui-radius-control: 6px;
}
```

Override on `:root`, not on a descendant. The derived accent shades resolve where `tokens.css` declares them, on `:root`, so an accent set lower in the tree won't reach them. A plain value without `light-dark()` applies to both themes.

By default the theme follows `prefers-color-scheme`. To force one, set `data-theme="light"` or `data-theme="dark"` on the document element. That sets `color-scheme`, which decides which side of every `light-dark()` pair applies. `light-dark()` needs Chrome 123+ or Firefox 120+.

## State and accessibility

- Use native `disabled`, `hidden`, `aria-selected`, and `aria-invalid` attributes for state.
- Associate validation messages with inputs through `aria-describedby`.
- `createUiButton` gives icon-only buttons an accessible name from `ariaLabel`, or from `label` if that's missing.
- Use `ui-visually-hidden` to hide a label on screen while keeping it for screen readers.
