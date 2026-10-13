# Chrome extension

The `extension/` folder holds a minimal Manifest V3 extension. It runs
`preprocess()` against the active tab and rewrites that page into slides in
place. It is a starting point, not a finished product.

## What it contains

| File                          | Purpose |
| ----------------------------- | ------- |
| `manifest.json`               | Manifest V3. Requests the `activeTab` and `scripting` permissions and opens `popup.html` from the toolbar button. |
| `popup.html`                  | A framework selector (`generic`, `webflow`, `framer`, `mkdocs-material`, `docusaurus`, `bubble`) and a **Convert to slides** button. |
| `popup.js`                    | Injects the bundle into the active tab with `chrome.scripting.executeScript`, then calls `preprocess()` there. |
| `vexy-dexyjs.global.min.js`   | The minified global bundle. Produced by `npm run build:ext` and ignored by git. |

## Build and load the extension

Prerequisites: Google Chrome (or another Chromium browser that loads unpacked
Manifest V3 extensions), Node.js and npm.

1. In the repository root, install the dependencies:

    ```bash
    npm ci
    ```

2. Build the bundle into the extension folder:

    ```bash
    npm run build:ext
    ```

    `extension/vexy-dexyjs.global.min.js` now exists. (`npm run build` also
    runs this step.)

3. In Chrome, open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Click **Load unpacked** and select the `extension/` folder.

The extension appears as **vexy-dexyjs — page to slides**. Chrome lists new
extensions under the puzzle-piece menu; pin it to keep the button in the
toolbar. Its tooltip reads **Convert page to slides**.

## Convert a tab

1. Open the page you want to convert.
2. Click the extension's toolbar button.
3. Pick a framework from the list.
4. Click **Convert to slides**.

The popup shows `working…`, then `done — N chars (see page console)`, where `N`
is the length of the serialized HTML. The page itself now shows only the slide
sections. The page console logs
`[vexy-dexyjs] preprocessed HTML length: N`.

If anything fails, the popup shows `error:` followed by the message. A common
cause is a browser page that extensions may not script, such as
`chrome://` pages.

## What happens inside

`popup.js` runs two scripts in the tab:

1. `files: ["vexy-dexyjs.global.min.js"]` loads the bundle, which defines
   `window.VexyDexy`.
2. A function that calls `window.VexyDexy.preprocess({ framework })`, logs the
   HTML length, and returns `{ length }` to the popup.

Both run in the extension's isolated world for that tab, so the page's own
Content Security Policy does not block the injection.

## Limits

- The page is changed in place. Reload it to get the original back.
- The extension does not save the HTML, open it in reveal.js, or print it.
  Those steps happen downstream of `preprocess()` and are left out on purpose.
- `manifest.json` declares no icons, so Chrome shows a default one.
