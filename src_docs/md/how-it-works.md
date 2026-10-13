# How it works

`preprocess()` runs four stages against the live `document`. This page explains
each stage and then follows one small page through all of them.

## Stage 1: collect background colours

Slides need to know whether they are light or dark. The preprocessor builds a
map from CSS class name to background colour in two passes.

1. **Live stylesheets.** It walks `document.styleSheets` and their `cssRules`.
   For every rule with a `background-color` (or a `background` value) that is
   not `transparent`, `rgba(0, 0, 0, 0)`, `initial` or `inherit`, it records the
   colour for every class in the selector. Stylesheets that throw on access,
   such as cross-origin sheets, are skipped silently.
2. **Inline `<style>` elements.** It parses the text of every `<style>` element
   with [`parseCssBackgroundColors()`](api.md#parsecssbackgroundcolors) and
   merges the result over the first map, so these values win.

## Stage 2: select or build slides

First the preprocessor removes framework chrome and picks a content root. Both
depend on the `framework` value; [Frameworks](frameworks.md) lists them.

Then it decides what a slide is.

### Webflow and Framer: top-level sections

For `webflow` and `framer`, it takes the direct children of the content root
that:

- are not `script`, `style`, `noscript`, `iframe` or `link` elements,
- are not page chrome according to [`isChromeElement()`](api.md#ischromeelement),
- are not the `.w-webflow-badge`, and
- contain text, or an `img`, `svg`, `video` or `picture` element.

If at least two remain, each one becomes a slide. If not, it looks for
`section`, `.section` and `[data-framer-name]` elements anywhere in the content
root and uses those if there are at least two. If that also fails, it uses the
block split below.

### Every other case: block split

1. Direct children of the content root that look like chrome are removed
   (except `<section>` elements).
2. The content root is walked recursively to collect *content blocks*:
    - headings `h1`–`h6`, `p`, `pre`, `table`, `ul`, `ol`, `img`, `blockquote`;
    - any element with an inline `position: absolute`, `position: relative` or
      `background-color`, or whose `style` attribute mentions `position` or
      `background`;
    - `div`, `section`, `article`, `main`, `aside`, `form`, `body`, `header` and
      `footer` elements that have no block-level children of their own.
3. Blocks that are hidden (`display: none`) or have zero height are dropped.
   The rest are sorted by their vertical position in the document.
4. Split points are chosen:
    - For each entry in `breaks`, the block whose top edge is closest to `y`
      becomes a split point, if it is less than 200 px away.
    - If no break matched, or `breaks` is empty, every `h1` and `h2` after the
      first block becomes a split point.
5. The blocks are cloned, in order, into new `<section>` elements, starting a
   new section at each split point.

## Stage 3: normalize each slide

Each slide element is converted to a `<section>` with
[`ensureSectionTag()`](api.md#ensuresectiontag) and passed to
[`normalizeSlideDom()`](api.md#normalizeslidedom), which adds layout classes:

1. **Background.** The section gets the class `slide`. Its colour comes from the
   colour map (later classes win), else its inline `background-color`, else an
   existing `data-background-color` attribute. A colour found this way is
   written to `data-background-color`, and the section gets `slide-light-bg` or
   `slide-dark-bg` according to [`getBgClass()`](api.md#getbgclass). Without a
   colour, the section gets `slide-light-bg`.
2. **Badge or card.** If exactly one descendant `div` has `card` or `badge` in
   its class names, it gets `slide-badge`. If several do, and exactly one of
   them also has `kapr-` in its class names, that one is chosen. Every image in
   the section then gets `slide-image-cover`, its parent gets
   `slide-image-container`, and normalization stops.
3. **Columns.** The preprocessor lists the direct `div` and `section` children,
   ignoring those whose class names contain `menu`, `nav`, `footer`, `mask`,
   `header` or `banner`. If there is exactly one and its class names contain
   `grid`, `container`, `row`, `wrap` or `bleed`, it looks one level deeper, at
   that wrapper's `div` and `section` children (ignoring `mask`, `video-wrap`
   and `hover-video`).
    - **Two columns:** the wrapper (or the section) gets `slide-split-layout`
      and each column gets `slide-column`. A column whose class carries a
      background colour gets it as an inline `background-color: … !important`.
      A column with an image gets
      `slide-image-container` and its first image gets `slide-image-cover`. A
      column without an image gets a `slide-text-container`: either its only
      `div` child, when that child's class names contain `text` or `head`, or a
      new `div` wrapped around its content.
    - **More than two columns:** each column whose class carries a background
      colour gets that colour as an inline `background-color: … !important`.
      No layout classes are added.
4. **Single block.** With zero or one column, a section that has an image but no
   `h1`, `h2`, `h3` or `p` is treated as a picture: the image gets
   `slide-image-cover` and its parent `slide-image-container`. Otherwise the
   first descendant `div` whose class names contain `hero-wrap`, `container` or
   `front` becomes the `slide-text-container`. If there is none, the section's
   content is wrapped in a new `div.slide-text-container`.

## Stage 4: replace the body

Every `<link>` and `<style>` element in the document is moved into `<head>`.
`document.body` is then emptied and the normalized sections are appended to
it. `preprocess()` returns `{ html: document.documentElement.outerHTML }`.

Body content that did not end up in a slide is gone, including `<script>`
elements in the body.

## Worked example

Take this page:

```html
<html>
  <head>
    <style>
      .hero { background-color: #1a1a2e; }
      .features { background-color: #f5f5f5; }
    </style>
  </head>
  <body>
    <nav class="navbar"><a href="/">Home</a></nav>
    <div class="hero"><div class="hero-wrap"><h1>Fast fonts</h1><p>Intro.</p></div></div>
    <div class="features"><div class="grid">
      <div class="text-block"><h2>Variable</h2><p>One file.</p></div>
      <div class="image-block"><img src="a.png"></div>
    </div></div>
  </body>
</html>
```

and run `preprocess({ framework: "webflow" })`.

1. **Colours.** The colour map is `{ hero: "#1a1a2e", features: "#f5f5f5" }`.
2. **Slides.** The body has three children. `nav` is chrome, so it is skipped.
   `.hero` and `.features` both contain text, which makes two top-level
   sections, so each becomes a slide.
3. **Normalize `.hero`.** It is a `div`, so it is copied into a new `<section>`.
   `#1a1a2e` has a luminance of about 0.11, below 0.5, so the slide gets
   `slide-dark-bg`. Its only child, `.hero-wrap`, has no `div` children, so
   there are no columns. There is no image. `.hero-wrap` matches `hero-wrap`
   and becomes the `slide-text-container`.
4. **Normalize `.features`.** `#f5f5f5` is light. Its only child, `.grid`,
   matches `grid`, so the preprocessor looks at `.grid`'s two children. Two
   columns means a split layout. `.text-block` has no image, so its content is
   wrapped in a new text container. `.image-block` has an image.
5. **Replace the body.** The `<nav>` is gone and only the two sections remain.

Result (whitespace trimmed):

```html
<body>
  <section class="hero slide slide-dark-bg" data-background-color="#1a1a2e">
    <div class="hero-wrap slide-text-container"><h1>Fast fonts</h1><p>Intro.</p></div>
  </section>
  <section class="features slide slide-light-bg" data-background-color="#f5f5f5">
    <div class="grid slide-split-layout">
      <div class="text-block slide-column">
        <div class="slide-text-container"><h2>Variable</h2><p>One file.</p></div>
      </div>
      <div class="image-block slide-column slide-image-container">
        <img src="a.png" class="slide-image-cover">
      </div>
    </div>
  </section>
</body>
```

## The layout vocabulary

These are the classes and attributes downstream renderers can style against.

| Name                     | Set on                         | Meaning                                         |
| ------------------------ | ------------------------------ | ----------------------------------------------- |
| `slide`                  | every slide `<section>`        | One slide.                                      |
| `slide-light-bg`         | slide `<section>`              | Background luminance is 0.5 or above, or unknown. |
| `slide-dark-bg`          | slide `<section>`              | Background luminance is below 0.5.              |
| `data-background-color`  | slide `<section>` (attribute)  | The resolved background colour, as found in the CSS. |
| `slide-split-layout`     | section or its grid wrapper    | Holds exactly two columns.                       |
| `slide-column`           | each of the two columns        | One half of a split layout.                      |
| `slide-text-container`   | a `div`                        | The block that holds the slide's text.          |
| `slide-image-container`  | image parent or image column   | Holds a cover image.                             |
| `slide-image-cover`      | `img`                          | An image meant to fill its container.           |
| `slide-badge`            | a `div`                        | The single card or badge in the slide.          |

`vexy-dexyjs` adds these classes but no CSS for them. Styling them is up to the
renderer that consumes the output.
