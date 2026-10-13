# Installation

`vexy-dexyjs` ships in four bundle formats. Pick the one that matches how you
load JavaScript.

| File                              | Format           | Use it for                                  |
| --------------------------------- | ---------------- | ------------------------------------------- |
| `dist/index.mjs`                  | ES module        | `import` in bundlers and modern browsers    |
| `dist/index.cjs`                  | CommonJS         | `require()`                                  |
| `dist/vexy-dexyjs.global.js`      | IIFE, unminified | `<script>` tags while debugging             |
| `dist/vexy-dexyjs.global.min.js`  | IIFE, minified   | `<script>` tags, CDN, content scripts       |

The IIFE bundles define one global, `window.VexyDexy`, which holds every
exported function. Type declarations live in `index.d.ts` at the package root.

## From npm

```bash
npm install vexy-dexyjs
```

```js
import { preprocess } from "vexy-dexyjs";
```

The package `exports` map resolves `import` to `dist/index.mjs`, `require` to
`dist/index.cjs`, and `types` to `index.d.ts`.

!!! note "Package not found?"
    If `npm install vexy-dexyjs` fails with a 404 error, the package has not
    been published to the npm registry yet. Build it from source instead (see
    below) and load the files from `dist/`.

## From a CDN

The `unpkg` and `jsdelivr` fields in `package.json` point at the minified global
bundle, so a CDN serves it without a build step:

```html
<script src="https://cdn.jsdelivr.net/npm/vexy-dexyjs/dist/vexy-dexyjs.global.min.js"></script>
<script>
  const { html } = window.VexyDexy.preprocess({ framework: "generic" });
</script>
```

The CDN depends on the npm package, so the same note applies.

## From source

Prerequisites: Node.js and npm. CI tests on Node 18, 20 and 22.

1. Clone the repository.

    ```bash
    git clone https://github.com/vexyart/vexy-dexyjs.git
    cd vexy-dexyjs
    ```

2. Install the development dependencies (`esbuild` and `vitest`).

    ```bash
    npm ci
    ```

3. Build the bundles.

    ```bash
    npm run build
    ```

    The `dist/` folder now contains the four files listed above.

!!! warning "`npm run build` writes outside the repository"
    The full build also runs `build:py`, which writes
    `../vexy-dexypy/src/vexy_dexypy/assets/vexy-dexyjs.js` for the sibling
    `vexy-dexypy` checkout, and `build:ext`, which writes
    `extension/vexy-dexyjs.global.min.js`. To build only the npm bundles, run
    the individual scripts:

    ```bash
    npm run build:esm && npm run build:cjs && npm run build:iife && npm run build:cdn
    ```

## Runtime requirements

`preprocess()` needs a real, rendered DOM. It reads `document.styleSheets`,
calls `getBoundingClientRect()` and `window.getComputedStyle()`, and uses
`window.scrollY`. Run it in:

- a page script or the browser console,
- an extension content script, or
- a headless browser through `page.evaluate()`.

The pure helpers (`parseCssBackgroundColors`, `luminance`, `getBgClass`,
`getSectionBgColor`) do not touch the DOM and run in Node.js as well.
