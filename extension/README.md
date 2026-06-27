<!-- this_file: extension/README.md -->

# vexy-dexyjs Chrome extension (MV3 scaffold)

A minimal Manifest V3 extension that runs `vexy-dexyjs` against the active tab:
it injects the IIFE bundle (`window.VexyDexy`) and calls `preprocess()`, rewriting
the page DOM into the slide vocabulary in place.

## Build & load

```bash
npm run build        # also copies dist/vexy-dexyjs.global.min.js into extension/
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load
unpacked** → select this `extension/` folder. Open any page, click the toolbar
icon, pick a framework, and hit **Convert to slides**. The serialized HTML length
is logged to the page console.

## Files

- `manifest.json` — MV3 manifest (`activeTab` + `scripting`, popup action).
- `popup.html` / `popup.js` — UI + `chrome.scripting.executeScript` driver.
- `vexy-dexyjs.global.min.js` — copied from `dist/` by `npm run build:ext`
  (git-ignored; produced by the build).

## Notes

This is a starting point, not a finished product: it preprocesses in place. A
fuller version would open the rewritten DOM in a reveal.js shell or trigger
print-to-PDF — both are downstream of `preprocess()` and intentionally left out
of the scaffold.
