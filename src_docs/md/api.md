# API reference

All functions are named exports of the module and properties of
`window.VexyDexy` in the global bundle. Types are declared in `index.d.ts`.

```js
import {
  preprocess,
  parseCssBackgroundColors,
  luminance,
  getBgClass,
  getSectionBgColor,
  wrapContentsInDiv,
  normalizeSlideDom,
  isChromeElement,
  ensureSectionTag,
} from "vexy-dexyjs";
```

The first function does the whole job. The others are the steps it is built
from, exported for testing and for tools that want to run only part of the
pipeline.

## `preprocess`

```ts
function preprocess(config?: PreprocessConfig): PreprocessResult;
```

Rewrites the global `document` in place into slide sections and returns the
serialized result. Needs a rendered DOM. See [How it works](how-it-works.md) for
the full pipeline.

`config` is optional. Its fields:

| Field         | Type                 | Default     | Effect |
| ------------- | -------------------- | ----------- | ------ |
| `framework`   | `string`             | `"generic"` | Selects chrome removal and slide rules. One of `generic`, `webflow`, `framer`, `mkdocs-material`, `docusaurus`, `bubble`; other strings act like `generic`. See [Frameworks](frameworks.md). |
| `stageWidth`  | `number`             | `1920`      | Accepted and defaulted, but not used by the current code. |
| `stageHeight` | `number`             | `1080`      | Accepted and defaulted, but not used by the current code. |
| `breaks`      | `{ y: number }[]`    | `[]`        | Vertical offsets in CSS pixels from the top of the document. Used only by the block split. Each break starts a new slide at the closest content block within 200 px. |

Returns `{ html: string }`, where `html` is `document.documentElement.outerHTML`
after the rewrite.

## `parseCssBackgroundColors`

```ts
function parseCssBackgroundColors(cssContent: string): Record<string, string>;
```

Scans raw CSS text and returns a map from class name to background colour.
Does not need a DOM.

- Comments are stripped first.
- The text is walked by brace depth, so rules inside `@media` and other nested
  blocks are read too.
- A `background-color` value is read up to the first space, `;` or `!`, so
  `rgb(0, 0, 0)` is recorded as `rgb(0,` (see
  [Troubleshooting](troubleshooting.md#a-slide-is-tagged-light-although-it-is-dark)).
  A `background` shorthand is
  used only when its value starts with `#` or `rgb`, or is one of `red`,
  `blue`, `green`, `white`, `black` or `transparent`.
- The colour is stored for the **last** class in each comma-separated
  selector, so `.card .title { … }` records `title`.
- When the same class appears more than once, the selector with the higher
  specificity wins: one point per `.`, ten per `#`. On a tie, the later rule
  wins.

```js
parseCssBackgroundColors(`
  .a { background-color: #111111; }
  #id.a { background-color: #222222; }
  @media (min-width: 600px) { .b { background: #fff; } }
`);
// → { a: "#222222", b: "#fff" }
```

## `luminance`

```ts
function luminance(color: string): number;
```

Returns the brightness of a CSS colour from 0 (black) to 1 (white), computed as
`0.2126·R + 0.7152·G + 0.0722·B` on channel values scaled to 0–1.

Accepted formats are `#rgb`, `#rrggbb`, `rgb(r, g, b)` and `rgba(r, g, b, a)`
(alpha is ignored). Anything else, including named colours, `#rgba`,
`#rrggbbaa`, an empty string and `null`, returns `1`, as if the colour were
white.

```js
luminance("#1a1a2e"); // ≈ 0.108
luminance("navy");    // 1 (named colours are not parsed)
```

## `getBgClass`

```ts
function getBgClass(color: string | null | undefined): string;
```

Returns `"slide-dark-bg"` when `luminance(color)` is below 0.5, otherwise
`"slide-light-bg"`. Missing colours and the values `transparent`,
`rgba(0, 0, 0, 0)`, `rgba(0,0,0,0)`, `initial` and `inherit` return
`"slide-light-bg"`.

## `getSectionBgColor`

```ts
function getSectionBgColor(
  classes: string[],
  classColors: Record<string, string>,
): string | null;
```

Walks `classes` from last to first and returns the colour of the first class
found in `classColors`, or `null`. Later classes win, as they usually do in the
browser.

```js
getSectionBgColor(["a", "b"], { a: "#112233", b: "#445566" }); // "#445566"
```

## `normalizeSlideDom`

```ts
function normalizeSlideDom(sec: Element, classColors: Record<string, string>): void;
```

Adds the slide layout classes to one section element, in place: `slide`, a
background class and `data-background-color`, then `slide-badge`,
`slide-split-layout`, `slide-column`, `slide-text-container`,
`slide-image-container` and `slide-image-cover` as the section's shape
requires. The rules are listed in
[How it works](how-it-works.md#stage-3-normalize-each-slide).

## `wrapContentsInDiv`

```ts
function wrapContentsInDiv(parent: Element, wrapperClass: string): void;
```

Moves the child nodes of `parent` into a new `<div class="wrapperClass">`
appended to `parent`. `<script>` and `<style>` children, and element children
whose class names contain `mask`, `video-wrap` or `hover-video`, are not
wrapped; they are moved after the new wrapper. This gives text one container to
style while background media stays where CSS expects it.

Uses the global `Node`, so it needs a browser-like environment.

## `isChromeElement`

```ts
function isChromeElement(el: Element): boolean;
```

Returns `true` when the element looks like page chrome: its class names or `id`
contain, or its tag name equals, one of `menu`, `nav`, `footer`, `header`,
`banner`, `sidebar` or `search`.

The check is a substring match, so a class such as `navigation-cards` or
`researcher` also counts as chrome.

## `ensureSectionTag`

```ts
function ensureSectionTag(el: Element): Element;
```

Returns `el` if it is a `<section>`. Otherwise creates a new `<section>`,
copies all of `el`'s attributes onto it, moves `el`'s children into it and
returns it. The new section is not inserted into the document; `el` is left
empty.

## Types

```ts
interface Break { y: number }

type Framework =
  | "generic" | "webflow" | "framer"
  | "mkdocs-material" | "docusaurus" | "bubble";

interface PreprocessConfig {
  framework?: Framework | string;
  stageWidth?: number;
  stageHeight?: number;
  breaks?: Break[];
}

interface PreprocessResult { html: string }
```

`index.d.ts` also declares `window.VexyDexy` with all nine functions.
