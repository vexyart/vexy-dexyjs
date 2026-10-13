# Quick start

This page converts one page to slides two ways: by hand in the browser, and
automatically from a headless browser.

`preprocess()` rewrites the page it runs in. Reload the page to get the
original back.

## Convert a page in the browser

Prerequisites: a desktop browser with developer tools, and the minified global
bundle `vexy-dexyjs.global.min.js`, either from a CDN or from your own build
(see [Installation](installation.md)).

1. Open the page you want to convert and wait until it has finished loading.
2. Scroll to the bottom and back to the top, so that lazily loaded images and
   sections are in the DOM.
3. Open the developer tools console.
4. Load the bundle into the page:

    ```js
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/vexy-dexyjs/dist/vexy-dexyjs.global.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    ```

    `window.VexyDexy` is now defined. Pages with a strict Content Security Policy
    can block this step. Use the [Chrome extension](extension.md) or a headless
    browser for those.

5. Run the preprocessor with the framework hint that matches the site:

    ```js
    const { html } = VexyDexy.preprocess({ framework: "generic" });
    document.querySelectorAll("section.slide").length;
    ```

The page now shows only the slide sections, and the console prints how many
there are. `html` holds the serialized document.

## Convert a page from a headless browser

[vexy-dexypy](https://github.com/vexyart/vexy-dexypy) works this way: it
injects the bundle with Playwright for Python and calls
`window.VexyDexy.preprocess(config)`. The example uses Playwright for Node.js; any tool that can add a script
to a page and evaluate a function in it works the same way.

Prerequisites: Node.js, Playwright (`npm install playwright`), and a local
build of `dist/vexy-dexyjs.global.min.js`.

1. Save this script as `convert.mjs` next to the `dist/` folder:

    ```js
    import { chromium } from "playwright";
    import { writeFileSync } from "node:fs";

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto("https://example.com/", { waitUntil: "networkidle" });

    // Inject the IIFE bundle; it defines window.VexyDexy in the page.
    await page.addScriptTag({ path: "dist/vexy-dexyjs.global.min.js" });

    // Run preprocess() inside the page and bring the HTML back to Node.
    const html = await page.evaluate(
      (cfg) => window.VexyDexy.preprocess(cfg).html,
      { framework: "generic" },
    );

    writeFileSync("slides.html", html);
    await browser.close();
    ```

2. Run it:

    ```bash
    node convert.mjs
    ```

The script writes `slides.html`, the rewritten page with one
`<section class="slide">` per slide. `<link>` and `<style>` elements from the
original page are kept in `<head>`, so the file still refers to the original
stylesheets.

## Snap slides to known positions

On pages without framework sections, `preprocess()` splits the page before each
`h1` and `h2`. To choose the split points yourself, pass `breaks`: a list of
vertical offsets in CSS pixels, measured from the top of the document.

```js
VexyDexy.preprocess({
  framework: "generic",
  breaks: [{ y: 1080 }, { y: 2160 }],
});
```

For each break, the content block whose top edge is closest to `y` starts a new
slide, provided it lies within 200 px. See
[How it works](how-it-works.md#stage-2-select-or-build-slides) for the details.

## Next steps

- Choose the right `framework` value in [Frameworks](frameworks.md).
- Read the classes the output carries in
  [How it works](how-it-works.md#the-layout-vocabulary).
