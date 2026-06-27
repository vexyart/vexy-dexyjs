// this_file: test/smoke.mjs
// Minimal smoke test: import the built ESM bundle and exercise the DOM-free
// helpers. Full preprocess() needs a browser DOM and is covered by the Python
// integration tests in vexy-dexypy; here we just guard the public API + math.

import assert from "node:assert/strict";
import * as vexy from "../dist/index.mjs";

const expected = [
  "preprocess",
  "parseCssBackgroundColors",
  "luminance",
  "getBgClass",
  "getSectionBgColor",
  "wrapContentsInDiv",
  "normalizeSlideDom",
  "isChromeElement",
  "ensureSectionTag",
];
for (const name of expected) {
  assert.equal(typeof vexy[name], "function", `export ${name} should be a function`);
}

// luminance: white is bright, black is dark.
assert.ok(vexy.luminance("#ffffff") > 0.9, "white luminance ~1");
assert.ok(vexy.luminance("#000000") < 0.1, "black luminance ~0");
assert.equal(vexy.getBgClass("#ffffff"), "slide-light-bg");
assert.equal(vexy.getBgClass("#000000"), "slide-dark-bg");
assert.equal(vexy.getBgClass("transparent"), "slide-light-bg");

// CSS parsing: last-wins by specificity for a class background.
const colors = vexy.parseCssBackgroundColors(".a { background-color: #112233; }");
assert.equal(colors.a, "#112233");

assert.equal(vexy.getSectionBgColor(["x", "a"], { a: "#112233" }), "#112233");
assert.equal(vexy.getSectionBgColor(["x"], { a: "#112233" }), null);

console.log("smoke ok: %d exports, helpers verified", expected.length);
