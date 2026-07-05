---
title: vexy-dexyjs
layout: default
---

<!-- this_file: docs/index.md -->

# vexy-dexyjs

Turn **any** web page into reveal.js-compatible slides — in the browser.

![A web page unspooling and pleating into a fan of slides](assets/icon.png)

`vexy-dexyjs` is a small, dependency-free DOM preprocessor. Pointed at a live
document, it rewrites the page into a flat list of `<section class="slide">`
elements with a shared layout vocabulary, ready for reveal.js or any paged-media
renderer. It runs where the page already lives — the browser — so fonts, CSS,
and assets stay rendered rather than downloaded and rewired offline.

## Quick start

Load the prebuilt global bundle from a CDN — no build step:

```html
<script src="https://cdn.jsdelivr.net/npm/vexy-dexyjs/dist/vexy-dexyjs.global.min.js"></script>
<script>
  const { html } = window.VexyDexy.preprocess({ framework: "generic" });
</script>
```

Or install and import:

```bash
npm install vexy-dexyjs
```

```js
import { preprocess } from "vexy-dexyjs";
const { html } = preprocess({ framework: "webflow" });
```

## Frameworks

| `framework`       | Slides from                                        |
| ----------------- | -------------------------------------------------- |
| `generic`         | Heading or `breaks`-driven block split             |
| `webflow`         | Top-level content sections                         |
| `framer`          | Top-level content sections / `[data-framer-name]`  |
| `mkdocs-material` | `article.md-content__inner`                        |
| `docusaurus`      | `.theme-doc-markdown`                              |
| `bubble`          | Heading / `breaks` block split                     |

See the [README on GitHub](https://github.com/vexyart/vexy-dexyjs#readme) for the
full API, the normalization pipeline, and the layout vocabulary.

## Consumers

- **[vexy-dexypy](https://github.com/vexyart/vexy-dexypy)** — the Python CLI that
  drives a headless browser, injects this bundle, and renders slides to PDF.
- **Chrome extension** — the global bundle can run as a content script to convert
  the active tab.
