# Frameworks

The `framework` option tells `preprocess()` which page chrome to remove and
where the slide content lives. `generic` is the default and works on any page.

```js
VexyDexy.preprocess({ framework: "mkdocs-material" });
```

## Summary

| `framework`       | Removed before slicing                                         | Content root                  | Slides from                                    |
| ----------------- | -------------------------------------------------------------- | ----------------------------- | ---------------------------------------------- |
| `generic`         | chrome children of the content root                            | `<body>`                      | block split at `h1`/`h2` or `breaks`           |
| `webflow`         | `.w-webflow-badge`                                             | `<body>`                      | top-level sections, else `section` blocks      |
| `framer`          | nothing extra                                                  | `<body>`                      | top-level sections, else `[data-framer-name]`  |
| `mkdocs-material` | `.md-sidebar`, `.md-header`, `.md-footer`, `.md-search`, `.md-nav`, `.md-source-file`, `.md-content__button`, `header`, `nav`, `footer` | `article.md-content__inner` | block split |
| `docusaurus`      | `.navbar`, `.theme-doc-sidebar-container`, `footer`, `nav`     | `.theme-doc-markdown`         | block split                                    |
| `bubble`          | none; inline `position: absolute` becomes `relative`           | `<body>`                      | block split                                    |

"Block split" and "top-level sections" are described in
[How it works](how-it-works.md#stage-2-select-or-build-slides). Whichever path
builds the slides, every slide then goes through the same normalization, so the
output classes are the same for all frameworks.

If the content root selector matches nothing, `<body>` is used instead. Any
`framework` string not in the table behaves like `generic`.

## `generic`

Use it for hand-written HTML, blogs and any site not listed below.

No framework-specific elements are removed up front. During the block split,
direct children of `<body>` that look like chrome (see
[`isChromeElement()`](api.md#ischromeelement)) are removed, then the page is
split before every `h1` and `h2`, or at the positions given in `breaks`.

## `webflow`

1. Removes every `.w-webflow-badge` element.
2. Takes the direct children of `<body>` that carry content and are not chrome.
   Webflow sections are often `div` elements such as `<div class="hero">` rather
   than `<section>` tags, so this matches them where a `section` selector would
   not.
3. If fewer than two qualify (for example, when everything sits inside one
   `.page-wrapper`), uses `section`, `.section` and `[data-framer-name]`
   elements anywhere in the body.
4. If that also yields fewer than two, falls back to the block split.

## `framer`

Same as `webflow`, without the badge removal. Framer layers carry a
`data-framer-name` attribute, which the second step picks up.

## `mkdocs-material`

Removes the Material for MkDocs header, navigation, sidebars, search, footer,
the "edit this page" buttons and the source-file footer, then splits the
article (`article.md-content__inner`) at its `h1` and `h2` headings. Each
second-level section of the documentation page becomes one slide.

## `docusaurus`

Removes the navbar, the docs sidebar, `footer` and `nav` elements, then splits
`.theme-doc-markdown` at its headings.

## `bubble`

Bubble pages position most elements absolutely. The preprocessor sets every
element whose inline style is `position: absolute` to `position: relative`, so
the elements flow vertically, then applies the block split to `<body>`.

## Choosing a value

- The site was built with one of the listed tools: use that value.
- Webflow or Framer produced fewer slides than expected: the page probably
  nests its sections. Try `generic`, which splits by headings, or pass
  `breaks`.
- Anything else: use `generic`.
