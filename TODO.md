<!-- this_file: TODO.md -->

# TODO

Bigger ideas beyond the v1.0.0 modernization pass. Small, unordered, honest.

## Tests

- [ ] Add a DOM-backed test (jsdom or Playwright) that runs the full
      `preprocess()` against a saved HTML fixture per framework and asserts the
      section count and layout classes.
- [ ] Capture one real saved page per framework (webflow, framer,
      mkdocs-material, docusaurus, bubble) as a fixture under `test/fixtures/`.

## API

- [ ] `stageWidth` / `stageHeight` are accepted but unused — either wire them
      into the split heuristics or drop them from the signature and types.
- [ ] Let `preprocess()` accept a target document/root instead of always
      mutating the global `document`, so it can run over a detached DOM.
- [ ] Return richer metadata (`{ html, slideCount, framework }`) so callers
      don't have to re-parse the output.

## Framework coverage

- [ ] Add a `notion` and a `gamma` framework profile.
- [ ] Auto-detect the framework when none is passed (sniff for
      `.w-webflow-badge`, `[data-framer-name]`, `.md-content`, etc.).

## Distribution

- [ ] Add a demo page under `docs/` that loads the CDN bundle and converts a
      sample page live in the browser.
- [ ] Flesh out the Chrome extension scaffold (`extension/`) into a working
      one-click "convert this tab" action.

## Coordination with vexy-dexypy

- [ ] Document the pinning strategy: which `vexy-dexyjs` version the vendored
      `vexy-dexypy` asset is built from, and how to keep them in lockstep.
