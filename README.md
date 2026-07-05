<!-- this_file: README.md -->

# vexy-dexyjs

Turn **any** web page into reveal.js-compatible slides — in the browser.

`vexy-dexyjs` is a small, dependency-free DOM preprocessor. Pointed at a live
document, it rewrites the page into a flat list of `<section class="slide">`
elements with a shared layout vocabulary, ready to be wrapped by reveal.js (or
any paged-media renderer) and printed to PDF. It is the generalized successor to
[`webflow2revealjs`](https://www.npmjs.com/package/webflow2revealjs): instead of
assuming Webflow markup, it classifies and normalizes pages from Webflow, Framer,
MkDocs Material, Docusaurus, Bubble, or plain generic HTML.

It runs where the page already lives — the browser — so fonts, CSS, and assets
stay loaded and rendered rather than being downloaded and rewired offline.

![A web page unspooling and pleating into a fan of slides](docs/assets/icon.png)

## Install

```bash
npm install vexy-dexyjs
```

Or load the prebuilt global bundle from a CDN (no build step):

```html
<script src="https://cdn.jsdelivr.net/npm/vexy-dexyjs/dist/vexy-dexyjs.global.min.js"></script>
<script>
  const { html } = window.VexyDexy.preprocess({ framework: "generic" });
</script>
```

## Usage

```js
import { preprocess } from "vexy-dexyjs";

// Runs against the current document, in place, and returns serialized HTML.
const { html } = preprocess({
  framework: "webflow",   // "generic" | "webflow" | "framer" | "mkdocs-material" | "docusaurus" | "bubble"
  stageWidth: 1920,
  stageHeight: 1080,
  breaks: [{ y: 1080 }, { y: 2160 }], // optional: snap slide boundaries to these y-offsets
});
```

`preprocess()` mutates `document` and returns `{ html }`, the serialized result.
Call it inside a browser context (page script, content script, or a headless
browser via `page.evaluate`).

## What it does

1. **Resolve colours** — scans inline and linked stylesheets into a
   `class → background-color` map.
2. **Select / build slides** — uses top-level `<section>`s on framework pages,
   else splits the visible block flow at headings or supplied `breaks`.
3. **Normalize layout** — rewrites each slide into the shared vocabulary:
   `slide-split-layout`, `slide-column`, `slide-text-container`,
   `slide-image-cover`, `slide-badge`.
4. **Classify backgrounds** — sets `data-background-color` and tags each slide
   `slide-light-bg` or `slide-dark-bg` by luminance.

The output is framework-neutral — *not* reveal.js-shaped — so the same DOM can
feed reveal.js, impress.js, or CSS paged media downstream.

## Frameworks

The `framework` hint tells the preprocessor which chrome to strip and where the
slide content lives. `generic` is the safe default and works on any page.

| `framework`       | Strips                                                        | Slides from                                       |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| `generic`         | nav / header / footer / sidebar / search chrome              | Heading (`h1`/`h2`) or `breaks`-driven block split |
| `webflow`         | `.w-webflow-badge` and chrome                                | Top-level content sections, else `section` blocks |
| `framer`          | chrome                                                        | Top-level content sections, else `[data-framer-name]` |
| `mkdocs-material` | `.md-header` / `.md-sidebar` / `.md-footer` / `.md-nav` / `.md-search` | `article.md-content__inner`, heading split |
| `docusaurus`      | `.navbar` / `.theme-doc-sidebar-container` / `footer`        | `.theme-doc-markdown`, heading split              |
| `bubble`          | rewrites `position: absolute` to `relative`                  | Heading / `breaks` block split                    |

Every framework then runs the same normalization pass — background-color
resolution, split/column detection, and light/dark tagging — so downstream
renderers see one consistent slide vocabulary regardless of the source.

## Consumers

- **[vexy-dexypy](https://github.com/vexyart/vexy-dexypy)** — the Python CLI that
  drives a headless browser, injects this bundle, and renders the slides to PDF.
- **Chrome extension** — the global bundle can run as a content script to convert
  the active tab (scaffold under `extension/`).
- **Any tool** — `import` it, or drop the CDN `<script>` tag in a page.

## Build

```bash
npm run build
```

Emits `dist/index.mjs` (ESM), `dist/index.cjs` (CommonJS),
`dist/vexy-dexyjs.global.js` + `.min.js` (IIFE global `VexyDexy`, for CDN/script
tags), and refreshes the bundle vendored by `vexy-dexypy`.

```bash
npm test          # DOM-free smoke test of the public API
```

## Publish

`./publish.sh` bumps the git-tag semver (`gitnextver`), syncs `package.json`,
builds, and publishes to npm.

## License

MIT © Adam Twardoch