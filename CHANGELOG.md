<!-- this_file: CHANGELOG.md -->

# Changelog

All notable changes to `vexy-dexyjs` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project uses git-tag
semver (`vX.Y.Z`).

## [1.0.0] — 2026-07-05

First tagged release. The package was already built and documented; this pass
made it publishable and testable.

### Added

- GitHub Actions CI (`.github/workflows/ci.yml`): build + unit + smoke tests on
  Node 18/20/22 for every push and pull request.
- Tag-triggered npm publish workflow (`.github/workflows/npm-publish.yml`) with
  provenance.
- `vitest` unit suite (`test/unit.test.js`) covering the DOM-free helpers
  (`parseCssBackgroundColors`, `luminance`, `getBgClass`, `getSectionBgColor`)
  directly against `src/`, no build step required. Run with `npm run test:unit`.
- JSDoc on every exported function in `src/index.js`, including per-option
  `@param` docs for `preprocess()`.
- Framework detection table in the README (what each `framework` hint strips and
  where it reads slides from).
- Project icon at `docs/assets/icon.png` and a Jekyll docs landing page.

### Fixed

- `preprocess()` no longer throws when called with no arguments; `config`
  defaults to `{}`, matching the optional type in `index.d.ts`.

### Changed

- `.gitignore` now excludes `.DS_Store`, `.codegraph/`, and `.omc/`; those
  operational artifacts are no longer tracked.
