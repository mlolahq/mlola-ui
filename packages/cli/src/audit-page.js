/**
 * What a careful reviewer catches by eye once a page is drawn, as functions
 * that run inside the page. `mlola-ui audit` runs them on any page; the
 * library's own audits (scripts/audit-layout.mjs, scripts/audit-contrast.mjs)
 * run the same ones over every item in every theme, so the audit a project
 * gets is the one Mlola holds itself to.
 *
 * Each function is sent to the browser as text: it reads nothing outside
 * its own body.
 */

/**
 * Layout: a control over another element's text, text cut off or running
 * out of its card, fields in a row that do not line up, sideways scroll,
 * images that did not load, floating content past the window's edge, and a
 * centered column that takes its content's width. Returns the findings.
 */
export function inspectLayout() {
  const found = [];
  const describe = (element) => {
    const name = element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 40) || "";
    const cls = typeof element.className === "string" ? element.className.split(" ").filter(Boolean)[0] : element.getAttribute("class")?.split(" ")[0];
    return `${element.tagName.toLowerCase()}${cls ? `.${cls}` : ""}${name ? ` "${name}"` : ""}`;
  };
  const shown = (element) => {
    for (let node = element; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || style.contentVisibility === "hidden") return false;
      if (node.hasAttribute("hidden") || node.getAttribute("aria-hidden") === "true" && node.closest("[inert]")) return false;
      if (node.closest("[inert]")) return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  // Visually hidden text (any 1px clip technique) and decorative layers are not seen.
  const clip = (element) => {
    for (let node = element; node && node !== document.body; node = node.parentElement) {
      if (node.getAttribute("aria-hidden") === "true") return true;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      if (rect.width <= 1 || rect.height <= 1) return true;
      if (style.clip && style.clip !== "auto" || style.clipPath && style.clipPath.startsWith("inset(50%")) return true;
    }
    return false;
  };
  // The part of an element that is not cut away by an ancestor that clips or scrolls.
  const visibleBox = (element) => {
    let { left, top, right, bottom } = element.getBoundingClientRect();
    for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.overflowX === "visible" && style.overflowY === "visible") continue;
      const frame = node.getBoundingClientRect();
      left = Math.max(left, frame.left); top = Math.max(top, frame.top);
      right = Math.min(right, frame.right); bottom = Math.min(bottom, frame.bottom);
    }
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  };

  // Text on the page, as one box per visible run.
  const texts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    const parent = node.parentElement;
    if (!parent || clip(parent) || !shown(parent)) continue;
    if (Number(getComputedStyle(parent).opacity) < 0.2) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const seen = visibleBox(parent);
    for (const rect of range.getClientRects()) {
      const box = { left: Math.max(rect.left, seen.left), top: Math.max(rect.top, seen.top), right: Math.min(rect.right, seen.right), bottom: Math.min(rect.bottom, seen.bottom) };
      if (box.right - box.left > 2 && box.bottom - box.top > 2) texts.push({ parent, rect: box });
    }
  }

  // 1. A floating control on top of another element's text. Controls that
  //    wait for hover or focus (opacity 0) count: a reader will reveal them.
  const floating = [...document.querySelectorAll("button, a[href], [role=button], input, select")].filter((element) => {
    const style = getComputedStyle(element);
    return (style.position === "absolute" || style.position === "fixed") && style.display !== "none" && style.visibility !== "hidden" && !clip(element) && element.getBoundingClientRect().width > 0;
  });
  for (const control of floating) {
    const box = visibleBox(control);
    if (box.width <= 2 || box.height <= 2) continue;
    for (const text of texts) {
      if (control.contains(text.parent) || text.parent.contains(control)) continue;
      // The same widget's own label (a clear button inside its field) is by design.
      if (control.closest("label")?.contains(text.parent)) continue;
      // A layer (a popover, a menu, a dialog) sits over the page on purpose; inside it, overlap still counts.
      const layer = control.closest("[data-ml-portal], dialog, [role=dialog], [role=alertdialog]");
      if (layer && !layer.contains(text.parent)) continue;
      const x = Math.min(box.right, text.rect.right) - Math.max(box.left, text.rect.left);
      const y = Math.min(box.bottom, text.rect.bottom) - Math.max(box.top, text.rect.top);
      if (x > 4 && y > 4) {
        found.push({ kind: "overlap", detail: `${describe(control)} covers "${text.parent.textContent.trim().slice(0, 40)}"` });
        break;
      }
    }
  }

  // 2. Text cut off without an ellipsis.
  for (const element of document.querySelectorAll("body *")) {
    if (!(element instanceof HTMLElement) || clip(element) || !shown(element)) continue;
    const hasText = [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim());
    if (!hasText) continue;
    const style = getComputedStyle(element);
    const hidesX = ["hidden", "clip"].includes(style.overflowX);
    const hidesY = ["hidden", "clip"].includes(style.overflowY);
    if (hidesX && element.scrollWidth > element.clientWidth + 1 && style.textOverflow !== "ellipsis") {
      found.push({ kind: "clipped", detail: `${describe(element)} cut off sideways (${element.scrollWidth} in ${element.clientWidth}px)` });
    }
    const clamped = style.webkitLineClamp && style.webkitLineClamp !== "none";
    if (hidesY && !clamped && element.scrollHeight > element.clientHeight + 2 && element.clientHeight > 0) {
      found.push({ kind: "clipped", detail: `${describe(element)} cut off at the bottom (${element.scrollHeight} in ${element.clientHeight}px)` });
    }
  }

  // 3. Text running out of the card or panel that holds it.
  const boxes = document.querySelectorAll(".ml-card, .ml-popover-content, .ml-dialog, .ml-sheet-panel, .ml-alert, .ml-toast, .ml-empty");
  for (const card of boxes) {
    if (!shown(card)) continue;
    const frame = card.getBoundingClientRect();
    for (const text of texts) {
      if (!card.contains(text.parent)) continue;
      // Text inside something that scrolls is meant to reach past the edge.
      let scroller = false;
      for (let node = text.parent; node && node !== card; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (["auto", "scroll"].includes(style.overflowX) || ["auto", "scroll"].includes(style.overflowY)) scroller = true;
      }
      if (scroller) continue;
      if (text.rect.right > frame.right + 1 || text.rect.left < frame.left - 1) {
        found.push({ kind: "escapes", detail: `"${text.parent.textContent.trim().slice(0, 40)}" runs out of ${describe(card)}` });
        break;
      }
    }
  }

  // 4. Fields in one row with different heights.
  const fields = [...document.querySelectorAll("input.ml-input, .ml-select, .ml-combobox-input, .ml-date-picker-trigger, .ml-number-input, .ml-time-picker-control")].filter((element) => shown(element) && !element.closest("[data-size]:not([data-size='md'])"));
  for (let i = 0; i < fields.length; i++) {
    for (let j = i + 1; j < fields.length; j++) {
      const a = fields[i].getBoundingClientRect();
      const b = fields[j].getBoundingClientRect();
      const sameRow = Math.abs(a.top - b.top) < 12 && (a.right <= b.left + 1 || b.right <= a.left + 1) && Math.abs(a.left - b.left) < 900;
      if (sameRow && Math.abs(a.height - b.height) > 2) {
        found.push({ kind: "uneven", detail: `${describe(fields[i])} ${Math.round(a.height)}px beside ${describe(fields[j])} ${Math.round(b.height)}px` });
      }
      const across = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const down = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (across > 2 && down > 2 && !fields[i].contains(fields[j]) && !fields[j].contains(fields[i])) {
        found.push({ kind: "overlap", detail: `${describe(fields[i])} runs into ${describe(fields[j])} by ${Math.round(across)}px` });
      }
    }
  }

  // 5. Sideways scroll and broken images.
  const overflow = document.documentElement.scrollWidth - window.innerWidth;
  if (overflow > 1) found.push({ kind: "sideways", detail: `the page scrolls ${overflow}px sideways` });
  for (const image of document.images) {
    if (image.complete && image.naturalWidth === 0 && shown(image)) found.push({ kind: "image", detail: `${image.getAttribute("src")?.slice(0, 80)} did not load` });
  }

  // 6. Floating content (a menu, a listbox, a popover, a dialog) cut by the window's edge.
  const floats = document.querySelectorAll("[role=menu], [role=listbox], [role=dialog], [role=alertdialog], [role=tooltip], .ml-popover-content, .ml-hover-card-content");
  for (const float of floats) {
    if (!shown(float) || clip(float)) continue;
    const style = getComputedStyle(float);
    if (style.position !== "fixed" && style.position !== "absolute" && !float.matches("dialog, [role=dialog], [role=alertdialog]")) continue;
    const box = float.getBoundingClientRect();
    const out = Math.max(-box.left, box.right - window.innerWidth, -box.top, box.bottom - window.innerHeight);
    if (out > 2) found.push({ kind: "offscreen", detail: `${describe(float)} reaches ${Math.round(out)}px past the window's edge` });
  }

  // 7. A centered column narrower than its room. In a grid or flex parent,
  // auto margins size an item to its content, so a page centered that way
  // changes width with every tab and every line typed into it.
  for (const element of document.querySelectorAll("body *")) {
    const style = getComputedStyle(element);
    if (style.maxWidth === "none" || style.position === "fixed" || style.position === "absolute" || style.display.startsWith("inline") || style.display === "contents") continue;
    const parent = element.parentElement;
    if (!parent || !/grid|flex/.test(getComputedStyle(parent).display) || !shown(element)) continue;
    // The margins as written: the resolved ones read 0px for an auto margin in a grid.
    const written = element.computedStyleMap?.();
    const auto = (side) => String(written?.get(`margin-${side}`) ?? "") === "auto";
    if (!auto("left") || !auto("right")) continue;
    const width = element.getBoundingClientRect().width;
    const before = element.style.width;
    element.style.width = "100%";
    const room = element.getBoundingClientRect().width;
    element.style.width = before;
    if (room - width > 2) found.push({ kind: "shrunk", detail: `${describe(element)} is ${Math.round(width)}px wide in ${Math.round(room)}px of room: centered by auto margins in a grid or flex parent, it takes its content's width and changes with it` });
  }

  const unique = new Map(found.map((item) => [`${item.kind} ${item.detail}`, item]));
  return [...unique.values()];
}

/**
 * Contrast: every visible run of text against the solid color behind it.
 * Text under 4.5:1 (3:1 when large) is returned with the colors involved.
 * Disabled controls, which WCAG exempts, are skipped; so is text over an
 * image or a gradient, whose backdrop cannot be read as one color.
 */
export function measureContrast() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const rgba = (value) => {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = "rgba(0,0,0,0)";
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const luminance = ([r, g, b]) => {
    const channel = (value) => {
      const c = value / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const over = (top, bottom) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1);
  };
  /** The solid color behind an element, or null when an image or gradient is in the way. */
  const backdrop = (element) => {
    const layers = [];
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.backgroundImage !== "none" && !/^radial-gradient\(.*transparent/.test(style.backgroundImage)) {
        // Grain and highlight overlays are faint; anything else is a picture behind the text.
        if (!/radial-gradient\(color-mix|surface-grain/.test(style.backgroundImage) && !/^(radial|linear)-gradient\(rgba?\(0, 0, 0, 0\)/.test(style.backgroundImage)) return null;
      }
      const color = rgba(style.backgroundColor);
      if (color[3] > 0) {
        layers.push(color);
        if (color[3] >= 0.99) break;
      }
      if (Number(style.opacity) < 1) return null;
    }
    let result = rgba(getComputedStyle(document.body).backgroundColor);
    if (result[3] < 1) result = [255, 255, 255, 1];
    for (const layer of layers.reverse()) result = over(layer, result);
    return result;
  };
  const failures = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!element || !node.textContent.trim() || seen.has(element)) continue;
    seen.add(element);
    if (element.closest("[aria-hidden='true'], [inert], [hidden], svg, script, style, noscript, :disabled, [aria-disabled='true'], [data-disabled]")) continue;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const style = getComputedStyle(element);
    if (style.visibility === "hidden" || Number(style.opacity) < 0.99) continue;
    // Text faded by an ancestor (a disabled group, a leaving toast) is not text at rest.
    let faded = false;
    for (let up = element.parentElement; up; up = up.parentElement) if (Number(getComputedStyle(up).opacity) < 0.99) faded = true;
    if (faded) continue;
    const text = rgba(style.color);
    if (text[3] < 0.05 || style.webkitTextFillColor === "rgba(0, 0, 0, 0)" || /transparent/.test(style.webkitTextFillColor)) continue;
    const back = backdrop(element);
    if (!back) continue;
    const shown = text[3] < 1 ? over(text, back) : text;
    const [l1, l2] = [luminance(shown), luminance(back)].sort((a, b) => b - a);
    const ratio = (l1 + 0.05) / (l2 + 0.05);
    const size = parseFloat(style.fontSize);
    const bold = Number(style.fontWeight) >= 700;
    const large = size >= 24 || (bold && size >= 18.66);
    const need = large ? 3 : 4.5;
    if (ratio + 0.02 < need) {
      const cls = (element.className?.toString() || "").split(" ").filter(Boolean).slice(0, 2).join(".");
      failures.push({ where: `${element.tagName.toLowerCase()}${cls ? `.${cls}` : ""}`, text: node.textContent.trim().slice(0, 32), ratio: Math.round(ratio * 100) / 100, need, fg: `rgb(${shown.slice(0, 3).map(Math.round).join(",")})`, bg: `rgb(${back.slice(0, 3).map(Math.round).join(",")})` });
    }
  }
  return failures;
}

/**
 * Open each thing on the page that opens (a menu, a select, a popover, a
 * dialog, a tab) and walk a template's own navigation, checking the page
 * after each step. Up to twelve steps an item keeps the run bounded.
 */
export async function openEachLayer(page) {
  const results = [];
  const targets = await page.evaluate(() => {
    const seen = new Set();
    const list = [];
    // What announces that it opens something first, then plain buttons, which
    // is how a dialog or a sheet controlled by its page is opened.
    const selector = "[aria-haspopup]:not([aria-haspopup=false]), button[aria-expanded=false], [role=tab][aria-selected=false], .ml-sidebar-item, .ml-nav-link, [data-ml-open]";
    // "Open Vantage" opens a record page, a page of its own: one of those comes
    // first, before a grid's column menus use up the steps.
    const record = document.querySelector("button[aria-label^='Open ']");
    const candidates = [...(record ? [record] : []), ...document.querySelectorAll(selector), ...document.querySelectorAll("button.ml-button:not([type=submit])")];
    candidates.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height || element.closest("[inert], [aria-hidden=true]") || element.disabled) return;
      const name = (element.getAttribute("aria-label") || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
      const key = /^Open /.test(name) ? "open a record" : `${element.tagName}:${name}`;
      if (!name || seen.has(key)) return;
      seen.add(key);
      element.setAttribute("data-audit-step", String(index));
      list.push({ step: String(index), name });
    });
    return list.slice(0, 12);
  });
  for (const target of targets) {
    const locator = page.locator(`[data-audit-step="${target.step}"]`);
    if (!(await locator.count())) continue;
    try {
      await locator.first().click({ timeout: 3000 });
      await page.waitForTimeout(350);
      results.push({ name: `opening "${target.name}"`, findings: await page.evaluate(inspectLayout) });
      // Close whatever opened, so the next step starts from the page.
      await page.keyboard.press("Escape");
      await page.waitForTimeout(150);
    } catch {
      // A control that moved or closed with the last step is skipped.
    }
  }
  return results;
}
