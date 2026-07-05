// this_file: vexy-dexyjs/src/index.js

/**
 * Scan raw CSS text into a `class -> background-color` map.
 *
 * Walks the stylesheet by brace depth (so nested at-rules like `@media` are
 * flattened, not misread), and for each rule records the background color of
 * the last class in the selector. Ties and higher-specificity selectors
 * (`#id.foo`) win, so the color that would actually paint is the one kept.
 *
 * @param {string} cssContent Raw CSS source (contents of a `<style>` or stylesheet).
 * @returns {Record<string, string>} Map of class name to CSS color string.
 */
export function parseCssBackgroundColors(cssContent) {
  const classColors = {};
  
  // Clean comments first
  cssContent = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
  
  let depth = 0;
  let selectorBuffer = '';
  let rulesBuffer = '';
  const classSpecificity = {};
  
  function processBlock(selector, rules) {
    selector = selector.trim();
    rules = rules.trim();
    
    if (rules.includes('{')) {
      Object.assign(classColors, parseCssBackgroundColors(rules));
      return;
    }
    
    const bgColorPattern = /background-color:\s*([^;!\s]+)/i;
    const bgPattern = /\bbackground:\s*([^;!]+)/i;
    
    let color = null;
    const bgColorMatch = bgColorPattern.exec(rules);
    const bgMatch = bgPattern.exec(rules);
    
    if (bgColorMatch) {
      color = bgColorMatch[1].trim();
    } else if (bgMatch) {
      const val = bgMatch[1].trim();
      if (val.startsWith('#') || ['red', 'blue', 'green', 'white', 'black', 'transparent'].includes(val) || val.startsWith('rgb')) {
        color = val;
      }
    }
    
    if (color) {
      const parts = selector.split(',');
      for (let part of parts) {
        part = part.trim();
        const specificity = (part.match(/\./g) || []).length + (part.match(/#/g) || []).length * 10;
        
        const classRegex = /\.([a-zA-Z0-9_-]+)/g;
        let classMatch;
        const classesInPart = [];
        while ((classMatch = classRegex.exec(part)) !== null) {
          classesInPart.push(classMatch[1]);
        }
        
        if (classesInPart.length > 0) {
          const cls = classesInPart[classesInPart.length - 1];
          if (specificity >= (classSpecificity[cls] || 0)) {
            classColors[cls] = color;
            classSpecificity[cls] = specificity;
          }
        }
      }
    }
  }
  
  for (let i = 0; i < cssContent.length; i++) {
    const char = cssContent[i];
    if (char === '{') {
      depth++;
      if (depth > 1) {
        rulesBuffer += char;
      }
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        processBlock(selectorBuffer, rulesBuffer);
        selectorBuffer = '';
        rulesBuffer = '';
      } else {
        rulesBuffer += char;
      }
    } else {
      if (depth === 0) {
        selectorBuffer += char;
      } else {
        rulesBuffer += char;
      }
    }
  }
  
  return classColors;
}

/**
 * Relative luminance (0..1) of a CSS color. Accepts `#rgb`, `#rrggbb`, and
 * `rgb()/rgba()`; anything unparseable falls back to white (1.0).
 *
 * @param {string | null | undefined} color CSS color string.
 * @returns {number} Perceptual luminance, 0 (black) to 1 (white).
 */
export function luminance(color) {
  color = (color || "").trim().toLowerCase();
  let r = 255, g = 255, b = 255;
  if (color.startsWith("#")) {
    const hex = color.substring(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else {
    const m = color.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const parts = m[1].split(",").map(p => p.trim());
      if (parts.length >= 3) {
        r = parseInt(parts[0], 10);
        g = parseInt(parts[1], 10);
        b = parseInt(parts[2], 10);
      }
    }
  }
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  return 0.2126 * rf + 0.7152 * gf + 0.0722 * bf;
}

/**
 * Pick the slide background class for a color. Transparent, missing, or
 * inherited colors are treated as light; otherwise luminance decides.
 *
 * @param {string | null | undefined} color CSS color string.
 * @returns {"slide-light-bg" | "slide-dark-bg"} The background class.
 */
export function getBgClass(color) {
  if (!color || ['transparent', 'rgba(0, 0, 0, 0)', 'rgba(0,0,0,0)', 'initial', 'inherit'].includes(color)) {
    return "slide-light-bg";
  }
  return luminance(color) >= 0.5 ? "slide-light-bg" : "slide-dark-bg";
}

/**
 * Resolve a section's background color from its class list. Later classes win,
 * mirroring how the last-declared background paints in the browser.
 *
 * @param {string[]} classes The element's class names, in source order.
 * @param {Record<string, string>} classColors Map from {@link parseCssBackgroundColors}.
 * @returns {string | null} The resolved color, or null if none of the classes carry one.
 */
export function getSectionBgColor(classes, classColors) {
  for (let i = classes.length - 1; i >= 0; i--) {
    const cls = classes[i];
    const color = classColors[cls];
    if (color) {
      return color;
    }
  }
  return null;
}

/**
 * Move a parent's content children into a new `<div class=wrapperClass>`, while
 * leaving `<script>`/`<style>` and known media wrappers (`mask`, `video-wrap`,
 * `hover-video`) untouched in place. Used to give slide text a single, styleable
 * container without disturbing background media.
 *
 * @param {Element} parent Element whose children get wrapped.
 * @param {string} wrapperClass Class applied to the inserted wrapper div.
 * @returns {void} Mutates `parent` in place.
 */
export function wrapContentsInDiv(parent, wrapperClass) {
  const doc = parent.ownerDocument;
  const wrapper = doc.createElement('div');
  wrapper.className = wrapperClass;
  
  const children = Array.from(parent.childNodes);
  const toWrap = [];
  const toKeep = [];
  
  for (const child of children) {
    if (child.nodeName.toLowerCase() === 'script' || child.nodeName.toLowerCase() === 'style') {
      toKeep.push(child);
    } else if (child.nodeType === Node.ELEMENT_NODE && 
               Array.from(child.classList).some(cls => ['mask', 'video-wrap', 'hover-video'].some(k => cls.toLowerCase().includes(k)))) {
      toKeep.push(child);
    } else {
      toWrap.push(child);
    }
  }
  
  for (const child of toWrap) {
    wrapper.appendChild(child);
  }
  
  parent.appendChild(wrapper);
  for (const child of toKeep) {
    parent.appendChild(child);
  }
}

/**
 * Rewrite one section into the shared slide vocabulary. Tags the section
 * `slide` plus a background class, then detects its shape — a badge/card, a
 * two-column split, a multi-column row, or a single text/image block — and
 * applies `slide-split-layout`, `slide-column`, `slide-text-container`,
 * `slide-image-cover`, `slide-image-container`, and `slide-badge` accordingly.
 *
 * @param {Element} sec The section element to normalize (mutated in place).
 * @param {Record<string, string>} classColors Map from {@link parseCssBackgroundColors}.
 * @returns {void}
 */
export function normalizeSlideDom(sec, classColors) {
  sec.classList.add('slide');
  
  const classes = Array.from(sec.classList);
  const secBg = getSectionBgColor(classes, classColors) || sec.style.backgroundColor || sec.getAttribute('data-background-color');
  if (secBg) {
    sec.setAttribute('data-background-color', secBg);
    sec.classList.add(getBgClass(secBg));
  } else {
    sec.classList.add('slide-light-bg');
  }
  
  let badgeEl = null;
  const divs = Array.from(sec.getElementsByTagName('div'));
  
  const cardDivs = divs.filter(div => {
    const cls = Array.from(div.classList).join(' ').toLowerCase();
    return cls.includes('card') || cls.includes('badge');
  });

  if (cardDivs.length === 1) {
    badgeEl = cardDivs[0];
  } else if (cardDivs.length > 1) {
    const kaprCards = cardDivs.filter(div => {
      const cls = Array.from(div.classList).join(' ').toLowerCase();
      return cls.includes('kapr-');
    });
    if (kaprCards.length === 1) {
      badgeEl = kaprCards[0];
    }
  }
  
  if (badgeEl) {
    badgeEl.classList.add('slide-badge');
    const imgs = Array.from(sec.getElementsByTagName('img'));
    for (const img of imgs) {
      img.classList.add('slide-image-cover');
      if (img.parentElement) {
        img.parentElement.classList.add('slide-image-container');
      }
    }
    return;
  }
  
  const directChildren = [];
  for (let i = 0; i < sec.children.length; i++) {
    const child = sec.children[i];
    if (child.tagName.toLowerCase() === 'div' || child.tagName.toLowerCase() === 'section') {
      const classesStr = Array.from(child.classList).join(' ').toLowerCase();
      if (!['menu', 'nav', 'footer', 'mask', 'header', 'banner'].some(k => classesStr.includes(k))) {
        directChildren.push(child);
      }
    }
  }
  
  let gridWrapper = null;
  let layoutElements = directChildren;
  if (directChildren.length === 1) {
    const wrapper = directChildren[0];
    const wrapperClasses = Array.from(wrapper.classList).join(' ').toLowerCase();
    if (['grid', 'container', 'row', 'wrap', 'bleed'].some(k => wrapperClasses.includes(k))) {
      const wrapperChildren = [];
      for (let i = 0; i < wrapper.children.length; i++) {
        const sub = wrapper.children[i];
        if (sub.tagName.toLowerCase() === 'div' || sub.tagName.toLowerCase() === 'section') {
          const subClasses = Array.from(sub.classList).join(' ').toLowerCase();
          if (!['mask', 'video-wrap', 'hover-video'].some(k => subClasses.includes(k))) {
            wrapperChildren.push(sub);
          }
        }
      }
      if (wrapperChildren.length > 0) {
        gridWrapper = wrapper;
        layoutElements = wrapperChildren;
      }
    }
  }
  
  if (layoutElements.length === 2) {
    const parentContainer = gridWrapper ? gridWrapper : sec;
    parentContainer.classList.add('slide-split-layout');
    
    for (const col of layoutElements) {
      col.classList.add('slide-column');
      
      const colBg = getSectionBgColor(Array.from(col.classList), classColors);
      if (colBg) {
        col.style.setProperty('background-color', colBg, 'important');
      }
      
      const imgEl = col.querySelector('img');
      if (imgEl) {
        col.classList.add('slide-image-container');
        imgEl.classList.add('slide-image-cover');
      } else {
        let textWrapper = null;
        const children = Array.from(col.children).filter(c => c.tagName.toLowerCase() === 'div');
        if (children.length === 1 && Array.from(children[0].classList).some(cls => ['text', 'head'].some(k => cls.toLowerCase().includes(k)))) {
          textWrapper = children[0];
        }
        
        if (textWrapper) {
          textWrapper.classList.add('slide-text-container');
        } else {
          wrapContentsInDiv(col, 'slide-text-container');
        }
      }
    }
    return;
  } else if (layoutElements.length > 2) {
    for (const col of layoutElements) {
      const colBg = getSectionBgColor(Array.from(col.classList), classColors);
      if (colBg) {
        col.style.setProperty('background-color', colBg, 'important');
      }
    }
    return;
  }
  
  const imgEl = sec.querySelector('img');
  const hasText = sec.querySelector('h1, h2, h3, p') !== null;
  if (imgEl && !hasText) {
    const parent = imgEl.parentElement;
    if (parent) {
      parent.classList.add('slide-image-container');
    }
    imgEl.classList.add('slide-image-cover');
  } else {
    let textWrapper = null;
    const divs = Array.from(sec.getElementsByTagName('div'));
    for (const div of divs) {
      const divClasses = Array.from(div.classList).join(' ').toLowerCase();
      if (['hero-wrap', 'container', 'front'].some(k => divClasses.includes(k))) {
        textWrapper = div;
        break;
      }
    }
    if (textWrapper) {
      textWrapper.classList.add('slide-text-container');
    } else {
      wrapContentsInDiv(sec, 'slide-text-container');
    }
  }
}

/**
 * Heuristic: is this element page chrome rather than slide content? Matches
 * nav/menu/footer/header/banner/sidebar/search by tag, id, or class token.
 *
 * @param {Element} el Element to test.
 * @returns {boolean} True if the element looks like page chrome.
 */
export function isChromeElement(el) {
  const classes = Array.from(el.classList).join(' ').toLowerCase();
  const id = (el.id || '').toLowerCase();
  const tag = el.tagName.toLowerCase();
  
  const keywords = ['menu', 'nav', 'footer', 'header', 'banner', 'sidebar', 'search'];
  return keywords.some(k => classes.includes(k) || id.includes(k) || tag === k);
}

/**
 * Return `el` unchanged if it is already a `<section>`, else a `<section>` that
 * adopts its attributes and children. Lets downstream code assume every slide
 * is a real section without discarding the source element's markup.
 *
 * @param {Element} el Candidate slide element.
 * @returns {Element} A `<section>` (possibly `el` itself).
 */
export function ensureSectionTag(el) {
  if (el.tagName.toLowerCase() === 'section') {
    return el;
  }
  const sec = el.ownerDocument.createElement('section');
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    sec.setAttribute(attr.name, attr.value);
  }
  while (el.firstChild) {
    sec.appendChild(el.firstChild);
  }
  return sec;
}

/**
 * Rewrite the current `document` in place into a flat list of
 * `<section class="slide">` elements with the shared layout vocabulary, then
 * return the serialized result. Runs in a browser/DOM context (page script,
 * content script, or `page.evaluate`).
 *
 * The pipeline: resolve `class -> background-color` from live and inline
 * stylesheets, drop framework chrome, pick or build sections (top-level blocks
 * on Webflow/Framer; a heading/`breaks`-driven split elsewhere), normalize each
 * via {@link normalizeSlideDom}, and replace the body with the new sections
 * while preserving `<link>`/`<style>` so rendering stays intact.
 *
 * @param {object} [config] Options.
 * @param {("generic"|"webflow"|"framer"|"mkdocs-material"|"docusaurus"|"bubble"|string)} [config.framework="generic"]
 *   Framework hint that selects chrome-removal and section rules. `"generic"` works on any page.
 * @param {number} [config.stageWidth=1920] Target stage width in px (reserved for downstream layout).
 * @param {number} [config.stageHeight=1080] Target stage height in px (reserved for downstream layout).
 * @param {{y: number}[]} [config.breaks=[]] Optional pagination breaks (y-offsets in px) to snap slide boundaries to.
 * @returns {{html: string}} The rewritten document serialized as HTML.
 */
export function preprocess(config = {}) {
  const framework = config.framework || "generic";
  const stageWidth = config.stageWidth || 1920;
  const stageHeight = config.stageHeight || 1080;
  const breaks = config.breaks || []; // list of Break objects: [{y: 100}, ...]
  
  // Extract background colors from stylesheets
  const classColors = {};
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j];
            if (rule.selectorText && rule.style) {
              const bgColor = rule.style.backgroundColor || rule.style.background;
              if (bgColor && !['transparent', 'rgba(0, 0, 0, 0)', 'rgba(0,0,0,0)', 'initial', 'inherit'].includes(bgColor)) {
                const parts = rule.selectorText.split(',');
                for (let part of parts) {
                  part = part.trim();
                  const classRegex = /\.([a-zA-Z0-9_-]+)/g;
                  let classMatch;
                  while ((classMatch = classRegex.exec(part)) !== null) {
                    classColors[classMatch[1]] = bgColor;
                  }
                }
              }
            }
          }
        }
      } catch (e) {}
    }
  } catch (e) {}

  const styleTags = Array.from(document.getElementsByTagName('style'));
  for (const style of styleTags) {
    if (style.textContent) {
      Object.assign(classColors, parseCssBackgroundColors(style.textContent));
    }
  }

  // Pre-clean: drop common chrome elements if we are not in webflow/framer,
  // or handle framework-specific chrome dropping.
  if (framework === "webflow") {
    const badges = document.querySelectorAll('.w-webflow-badge');
    badges.forEach(b => b.remove());
  } else if (framework === "mkdocs-material") {
    const selectors = [
      ".md-sidebar", ".md-header", ".md-footer", ".md-search", 
      ".md-nav", ".md-source-file", ".md-content__button", "header", "nav", "footer"
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.remove());
    });
  } else if (framework === "docusaurus") {
    const selectors = [".navbar", ".theme-doc-sidebar-container", "footer", "nav"];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.remove());
    });
  } else if (framework === "bubble") {
    // Bubble absolute to relative positioning
    const els = document.querySelectorAll('*');
    els.forEach(el => {
      if (el.style && el.style.position === 'absolute') {
        el.style.position = 'relative';
      }
    });
  }

  // Determine slide content root container
  let contentRoot = document.body;
  if (framework === "mkdocs-material") {
    contentRoot = document.querySelector('article.md-content__inner') || document.body;
  } else if (framework === "docusaurus") {
    contentRoot = document.querySelector('.theme-doc-markdown') || document.body;
  }

  // Core slide extraction / sectioning
  let sections = [];

  if (framework === "webflow" || framework === "framer") {
    const keep = el => {
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'noscript', 'iframe', 'link'].includes(tag)) return false;
      if (isChromeElement(el)) return false;
      if (el.classList.contains('w-webflow-badge')) return false;
      return true;
    };
    const hasContent = el =>
      (el.textContent || '').trim().length > 0 || el.querySelector('img, svg, video, picture');

    // Webflow/Framer lay each section out as a top-level block. These are often
    // <div class="tr-section1">, <div class="hero">, etc. — not <section> tags or
    // a literal `.section` class — so prefer the content-bearing top-level
    // children. querySelectorAll('section, .section, ...') would miss those and
    // match only stray footer/menu blocks that happen to carry a `section` token.
    const topLevel = Array.from(contentRoot.children).filter(el => keep(el) && hasContent(el));
    if (topLevel.length >= 2) {
      sections = topLevel;
    } else {
      // Wrapper-nested layouts (everything under one .page-wrapper): fall back to
      // explicit section selectors within the content root.
      const rawSections = Array.from(
        contentRoot.querySelectorAll('section, .section, [data-framer-name]')
      ).filter(keep);
      if (rawSections.length >= 2) {
        sections = rawSections;
      }
    }
  }

  // Fallback or Generic/Mkdocs/Docusaurus/Bubble heading-based split matching SlidePlan breaks
  if (sections.length < 2) {
    // Drop remaining chrome elements
    const bodyChildren = Array.from(contentRoot.children);
    bodyChildren.forEach(child => {
      if (isChromeElement(child) && child.tagName.toLowerCase() !== 'section') {
        child.remove();
      }
    });

    // Gather all block-level elements
    const contentTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'table', 'ul', 'ol', 'img', 'blockquote'];
    const containerTags = ['div', 'section', 'article', 'main', 'aside', 'form', 'body', 'header', 'footer'];

    function isContentBlock(el) {
      const tag = el.tagName.toLowerCase();
      if (contentTags.includes(tag)) {
        return true;
      }
      // Check if it's a container with inline styles that we want to preserve (like absolute positioning)
      if (el.style && (el.style.position === 'absolute' || el.style.position === 'relative' || el.style.backgroundColor)) {
        return true;
      }
      const styleAttr = el.getAttribute('style') || '';
      if (styleAttr.includes('position') || styleAttr.includes('background')) {
        return true;
      }
      if (containerTags.includes(tag)) {
        const hasBlockChild = Array.from(el.children).some(child => {
          const childTag = child.tagName.toLowerCase();
          return contentTags.includes(childTag) || containerTags.includes(childTag);
        });
        return !hasBlockChild;
      }
      return false;
    }

    const blocks = [];
    function collectBlocks(container) {
      if (isContentBlock(container)) {
        blocks.push(container);
      } else {
        const kids = Array.from(container.children);
        for (const kid of kids) {
          collectBlocks(kid);
        }
      }
    }
    
    collectBlocks(contentRoot);

    // Filter blocks that are visible and have some height
    const visibleBlocks = blocks.filter(b => {
      const rect = b.getBoundingClientRect();
      const style = window.getComputedStyle(b);
      return style.display !== 'none' && rect.height > 0;
    });

    // Sort visible blocks by top position
    visibleBlocks.sort((a, b) => {
      const rA = a.getBoundingClientRect();
      const rB = b.getBoundingClientRect();
      return (rA.top + window.scrollY) - (rB.top + window.scrollY);
    });

    // Determine split boundaries matching breaks
    const splitIndices = new Set();
    const breakYList = (breaks || []).map(b => b.y).sort((a, b) => a - b);

    for (const breakY of breakYList) {
      let closestBlockIdx = -1;
      let minDiff = Infinity;
      for (let i = 0; i < visibleBlocks.length; i++) {
        const blockY = visibleBlocks[i].getBoundingClientRect().top + window.scrollY;
        const diff = Math.abs(blockY - breakY);
        if (diff < minDiff) {
          minDiff = diff;
          closestBlockIdx = i;
        }
      }
      if (closestBlockIdx !== -1 && minDiff < 200) {
        splitIndices.add(closestBlockIdx);
      }
    }

    // Heading-based fallback if no breaks matched or breaks list is empty
    if (splitIndices.size === 0) {
      for (let i = 0; i < visibleBlocks.length; i++) {
        const tag = visibleBlocks[i].tagName.toLowerCase();
        if (tag === 'h1' || tag === 'h2') {
          if (i > 0) splitIndices.add(i);
        }
      }
    }

    // Reconstruct sections
    const sortedSplits = Array.from(splitIndices).sort((a, b) => a - b);
    let currentSec = document.createElement('section');
    sections.push(currentSec);

    let splitCursor = 0;
    for (let i = 0; i < visibleBlocks.length; i++) {
      if (sortedSplits[splitCursor] === i) {
        currentSec = document.createElement('section');
        sections.push(currentSec);
        splitCursor++;
      }
      // Clone the element or move it into the section
      const el = visibleBlocks[i].cloneNode(true);
      currentSec.appendChild(el);
    }
  }

  // Normalize each section and add layout classes
  sections = sections.map(sec => {
    const newSec = ensureSectionTag(sec);
    normalizeSlideDom(newSec, classColors);
    return newSec;
  });

  // Replace contentRoot body contents with the normalized section elements
  // We keep style/script tags
  const origStyles = Array.from(document.querySelectorAll('link, style'));
  document.body.innerHTML = '';
  origStyles.forEach(s => document.head.appendChild(s));

  sections.forEach(sec => {
    document.body.appendChild(sec);
  });

  return {
    html: document.documentElement.outerHTML
  };
}
