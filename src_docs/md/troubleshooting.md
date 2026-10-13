# Troubleshooting

This page lists known limits of the current code and what to do about them.

## The page turned into one slide

**Cause.** With the block split, slides start at `h1` and `h2` headings. A page
that uses only `h3` and smaller, or styled `div` elements as headings, has no
split points.

**Fix.** Pass `breaks` with the vertical offsets where slides should start, or
use the `webflow` or `framer` value if the page is built from top-level
sections.

## Webflow or Framer produced the wrong slides

**Cause.** The top-level path takes every content-bearing direct child of
`<body>`. On sites that wrap everything in one container it finds fewer than
two, and falls back to `section`, `.section` and `[data-framer-name]` elements
anywhere in the page, which may be nested at different depths.

**Fix.** Try `generic`, which splits by headings, and add `breaks` where needed.

## Content is missing from the output

Check these causes in order:

1. **Chrome detection.** Top-level elements whose class names or `id` contain
   `menu`, `nav`, `footer`, `header`, `banner`, `sidebar` or `search` are
   treated as chrome and dropped: candidate sections for `webflow` and
   `framer`, and direct children of the content root for the block split.
   This is a substring match: `class="research"` contains `search`, and
   `class="navigation-cards"` contains `nav`.
2. **Hidden or empty blocks.** The block split drops elements with
   `display: none` or zero height. Content that only appears after scrolling,
   in a closed accordion, or in an inactive tab is not collected. Scroll
   through the page and open what you need before calling `preprocess()`.
3. **Scripts.** The body is replaced. `<script>` elements that were in the
   body and not inside a slide are gone.

## A slide is tagged light although it is dark

`getBgClass()` relies on the colour map. Check these causes:

- **Colour set by other means.** Only class rules, an inline
  `background-color`, and an existing `data-background-color` are read.
  Colours set by an `id` selector, an element selector, a gradient or an image
  are not seen, and the slide defaults to `slide-light-bg`.
- **Named colours.** `luminance()` parses only hex and `rgb()`/`rgba()`. Named
  colours such as `navy` count as white.
- **Spaces inside `rgb()` in a `<style>` element.** `parseCssBackgroundColors()`
  stops reading a `background-color` value at the first space. For
  `.x { background-color: rgb(0, 0, 0); }` it records `rgb(0,`, which
  `luminance()` cannot parse, so the slide counts as light. Rules from linked
  stylesheets are read through the CSSOM instead and are not affected, but
  values from `<style>` elements override them.
- **Cross-origin stylesheets.** Browsers block `cssRules` access to
  stylesheets from another origin without CORS headers. Those sheets are
  skipped silently.

## `stageWidth` and `stageHeight` have no effect

They are accepted and given defaults (`1920` and `1080`) but the current code
does not use them. Set the size of the slides in the downstream renderer, and
set the browser viewport before calling `preprocess()`, because the block split
measures element positions in the current layout.

## `ReferenceError: document is not defined`

`preprocess()` reads the global `document` and `window`, and
`wrapContentsInDiv()` (called by `normalizeSlideDom()`) uses the global `Node`.
In Node.js, run them in a headless browser through `page.evaluate()` (see
[Quick start](quickstart.md#convert-a-page-from-a-headless-browser)).
`isChromeElement()` and `ensureSectionTag()` only need `Element` objects, and
the four colour helpers run anywhere.

## The script tag is blocked

A page's Content Security Policy can forbid scripts from a CDN. Use the
[Chrome extension](extension.md), which injects the bundle from the
extension, or a headless browser with `page.addScriptTag()`.

## `npm install vexy-dexyjs` returns 404

The package has not been published to npm. Build it from source as described
in [Installation](installation.md#from-source).
