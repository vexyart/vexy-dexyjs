// this_file: index.d.ts
// Public type surface for vexy-dexyjs. Hand-maintained; mirrors src/index.js.

/** A pagination break, expressed as a y-offset (px) in the live document. */
export interface Break {
  y: number;
}

/** Supported framework hints. `"generic"` works on any page. */
export type Framework =
  | "generic"
  | "webflow"
  | "framer"
  | "mkdocs-material"
  | "docusaurus"
  | "bubble";

/** Configuration passed to {@link preprocess}. */
export interface PreprocessConfig {
  /** Framework hint that selects chrome-removal and section rules. Default `"generic"`. */
  framework?: Framework | string;
  /** Target stage width in px. Default `1920`. */
  stageWidth?: number;
  /** Target stage height in px. Default `1080`. */
  stageHeight?: number;
  /** Optional pagination breaks (from an upstream planner) to snap slides to. */
  breaks?: Break[];
}

/** Result of {@link preprocess}: the rewritten document as serialized HTML. */
export interface PreprocessResult {
  html: string;
}

/**
 * Rewrite the current `document` in place into a flat list of
 * `<section class="slide">` elements with a shared layout vocabulary
 * (`slide-split-layout`, `slide-column`, `slide-text-container`,
 * `slide-image-cover`, `slide-badge`, `slide-light-bg`/`slide-dark-bg`).
 * Runs in a browser/DOM context. Returns the serialized result.
 */
export function preprocess(config?: PreprocessConfig): PreprocessResult;

/** Parse `class -> background-color` pairs from raw CSS text. */
export function parseCssBackgroundColors(cssContent: string): Record<string, string>;

/** Relative luminance (0..1) of a CSS color string. */
export function luminance(color: string): number;

/** `"slide-light-bg"` or `"slide-dark-bg"` for a given background color. */
export function getBgClass(color: string | null | undefined): string;

/** Resolve a section background color from its classes and a color map. */
export function getSectionBgColor(
  classes: string[],
  classColors: Record<string, string>,
): string | null;

/** Wrap a parent's non-chrome children in a `<div class=wrapperClass>`. */
export function wrapContentsInDiv(parent: Element, wrapperClass: string): void;

/** Apply the slide layout vocabulary to one section element. */
export function normalizeSlideDom(sec: Element, classColors: Record<string, string>): void;

/** Heuristic: is this element page chrome (nav/menu/footer/header/…)? */
export function isChromeElement(el: Element): boolean;

/** Return `el` if it is a `<section>`, else a `<section>` clone of it. */
export function ensureSectionTag(el: Element): Element;

declare global {
  interface Window {
    VexyDexy: {
      preprocess: typeof preprocess;
      parseCssBackgroundColors: typeof parseCssBackgroundColors;
      luminance: typeof luminance;
      getBgClass: typeof getBgClass;
      getSectionBgColor: typeof getSectionBgColor;
      wrapContentsInDiv: typeof wrapContentsInDiv;
      normalizeSlideDom: typeof normalizeSlideDom;
      isChromeElement: typeof isChromeElement;
      ensureSectionTag: typeof ensureSectionTag;
    };
  }
}
