# Development

This page covers the repository layout, the build, the tests, the
documentation site and the release process.

## Repository layout

| Path                   | Contents |
| ---------------------- | -------- |
| `src/index.js`         | The whole library: nine exported functions. |
| `index.d.ts`           | Hand-maintained type declarations that mirror `src/index.js`. |
| `test/unit.test.js`    | `vitest` unit tests for the DOM-free helpers, run against `src/`. |
| `test/smoke.mjs`       | Smoke test that imports the built `dist/index.mjs`. |
| `extension/`           | Manifest V3 Chrome extension scaffold. See [Chrome extension](extension.md). |
| `src_docs/md/`         | Source of this documentation. |
| `src_docs/mkdocs.yml`  | Documentation site configuration. |
| `docs/`                | The built documentation site, served by GitHub Pages. Generated; do not edit. |

## Build the bundles

Prerequisites: Node.js and npm.

1. Install the development dependencies:

    ```bash
    npm ci
    ```

2. Run the build:

    ```bash
    npm run build
    ```

`npm run build` runs six `esbuild` scripts in sequence:

| Script       | Output                                                 | Format |
| ------------ | ------------------------------------------------------ | ------ |
| `build:esm`  | `dist/index.mjs`                                       | ES module |
| `build:cjs`  | `dist/index.cjs`                                       | CommonJS |
| `build:iife` | `dist/vexy-dexyjs.global.js`                           | IIFE, global `VexyDexy` |
| `build:cdn`  | `dist/vexy-dexyjs.global.min.js`                       | IIFE, minified |
| `build:py`   | `../vexy-dexypy/src/vexy_dexypy/assets/vexy-dexyjs.js` | IIFE, minified |
| `build:ext`  | `extension/vexy-dexyjs.global.min.js`                  | IIFE, minified |

`build:py` writes into a sibling checkout of
[vexy-dexypy](https://github.com/vexyart/vexy-dexypy), which vendors the bundle.
Keep the two repositories side by side, or run the other scripts individually.

The root `build.sh` wraps both builds:

```bash
./build.sh            # documentation and bundles
./build.sh docs       # documentation only
./build.sh package    # npm run build only
```

## Run the tests

```bash
npm run test:unit     # vitest, against src/, no build needed
npm test              # smoke test, needs dist/index.mjs from npm run build
```

The unit tests cover `luminance`, `getBgClass`, `parseCssBackgroundColors` and
`getSectionBgColor`. The smoke test checks that all nine exports are functions
and repeats a few helper checks against the built bundle.

`preprocess()` itself needs a browser DOM, so these tests do not exercise it.
The repository's `TODO.md` plans DOM-backed tests with saved fixture pages.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`. On
Node 18, 20 and 22 it runs `npm ci`, `npm run build`, `npm run test:unit` and
`npm test`.

## Build the documentation

The site is built with ProperDocs and the MaterialX theme. You need
[`uv`](https://docs.astral.sh/uv/); `uvx` downloads the pinned tools on first
use.

```bash
src_docs/build.sh          # strict build of src_docs/md/ into docs/
src_docs/build.sh serve    # live preview on http://127.0.0.1:8000
```

`.github/workflows/docs.yml` runs the same build on every push to `main` that
changes `src_docs/` and commits the result to `docs/`. GitHub Pages serves
`docs/` at <https://vexy.dev/vexy-dexyjs/>.

Edit pages in `src_docs/md/`, never in `docs/`: the build replaces `docs/`
completely.

## Release

The version comes from git tags (`vX.Y.Z`).

`./publish.sh` releases from your machine. It:

1. stages all changes with `git add .`,
2. runs `uvx gitnextver`, which commits and creates the next semver tag,
3. pushes `main` and the tags to `origin`,
4. sets the `package.json` version to the latest tag without the `v`,
5. runs `npm run build`, and
6. runs `npm publish --access public`.

`.github/workflows/npm-publish.yml` also publishes. It runs when a tag matching
`v*` is pushed: it builds, runs both test suites, and runs
`npm publish --provenance --access public` with the `NPM_TOKEN` secret.

!!! warning
    `publish.sh` pushes a tag, which starts the workflow, and also publishes
    locally. Only one of the two `npm publish` calls can succeed for a given
    version. The tagged commit also still carries the previous
    `package.json` version, because step 4 runs after the tag is created.

## Coding notes

- Source files start with a `this_file` comment that holds their path.
- `src/index.js` has no runtime dependencies. Keep it that way: the bundle is
  injected into arbitrary pages.
- When you change an exported signature, update `index.d.ts` and the
  `window.VexyDexy` declaration in it.
