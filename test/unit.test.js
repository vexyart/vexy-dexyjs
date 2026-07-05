// this_file: test/unit.test.js
// Unit tests for the DOM-free helpers, run directly against src (no build step).
// preprocess() and the DOM-mutating helpers need a live document and are covered
// by the built-bundle smoke test (test/smoke.mjs) and vexy-dexypy integration.

import { describe, it, expect } from "vitest";
import {
  parseCssBackgroundColors,
  luminance,
  getBgClass,
  getSectionBgColor,
} from "../src/index.js";

describe("luminance", () => {
  it("reads white as bright and black as dark", () => {
    expect(luminance("#ffffff")).toBeGreaterThan(0.9);
    expect(luminance("#000000")).toBeLessThan(0.1);
  });

  it("expands 3-digit hex", () => {
    expect(luminance("#fff")).toBeCloseTo(luminance("#ffffff"), 5);
  });

  it("parses rgb() and rgba()", () => {
    expect(luminance("rgb(255,255,255)")).toBeGreaterThan(0.9);
    expect(luminance("rgba(0, 0, 0, 0.5)")).toBeLessThan(0.1);
  });

  it("defaults to white for empty or unknown input", () => {
    expect(luminance("")).toBeGreaterThan(0.9);
    expect(luminance(null)).toBeGreaterThan(0.9);
  });
});

describe("getBgClass", () => {
  it("maps light colors to slide-light-bg", () => {
    expect(getBgClass("#ffffff")).toBe("slide-light-bg");
  });

  it("maps dark colors to slide-dark-bg", () => {
    expect(getBgClass("#000000")).toBe("slide-dark-bg");
  });

  it("treats transparent and missing colors as light", () => {
    expect(getBgClass("transparent")).toBe("slide-light-bg");
    expect(getBgClass("rgba(0, 0, 0, 0)")).toBe("slide-light-bg");
    expect(getBgClass(null)).toBe("slide-light-bg");
  });
});

describe("parseCssBackgroundColors", () => {
  it("maps a class to its background-color", () => {
    expect(parseCssBackgroundColors(".a { background-color: #112233; }")).toEqual({
      a: "#112233",
    });
  });

  it("strips comments before parsing", () => {
    const css = "/* .ghost { background-color: #ff0000; } */ .a { background-color: #00ff00; }";
    expect(parseCssBackgroundColors(css)).toEqual({ a: "#00ff00" });
  });

  it("keeps the higher-specificity rule (last wins on a tie)", () => {
    const css = ".a { background-color: #111111; } #id.a { background-color: #222222; }";
    expect(parseCssBackgroundColors(css).a).toBe("#222222");
  });

  it("accepts named and rgb backgrounds via the background shorthand", () => {
    expect(parseCssBackgroundColors(".a { background: red; }").a).toBe("red");
    expect(parseCssBackgroundColors(".a { background: rgb(1,2,3); }").a).toBe("rgb(1,2,3)");
  });

  it("returns an empty map for CSS with no class backgrounds", () => {
    expect(parseCssBackgroundColors("body { margin: 0; }")).toEqual({});
  });
});

describe("getSectionBgColor", () => {
  const colors = { a: "#112233", b: "#445566" };

  it("returns the last matching class color (later classes win)", () => {
    expect(getSectionBgColor(["a", "b"], colors)).toBe("#445566");
  });

  it("returns null when no class matches", () => {
    expect(getSectionBgColor(["x", "y"], colors)).toBeNull();
  });
});
