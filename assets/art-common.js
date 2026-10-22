/* bonfire site: shared drawing helpers. Plain script; works in the browser
   (after glyphs.js) and in node (tools/build.mjs sets globalThis.window). */
(function (root) {
  "use strict";
  const G = () => (root.SAUCE_GLYPHS || (root.window && root.window.SAUCE_GLYPHS));

  // Deterministic PRNG so every render of a piece is identical (seed is logged in sidecars).
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A 5x5 (or 7x7 for the mark) pantry glyph as SVG rects.
  function glyph(name, x, y, cell, fill) {
    const rows = G()[name];
    let out = `<g fill="${fill}" shape-rendering="crispEdges">`;
    rows.forEach((r, j) => [...r].forEach((c, i) => {
      if (c === "X") out += `<rect x="${x + i * cell}" y="${y + j * cell}" width="${cell}" height="${cell}"/>`;
    }));
    return out + "</g>";
  }

  // 16-cell seed strip: a number in binary, most significant bit first.
  function seedStrip(n, x, y, cell, gap, on, off) {
    let out = "";
    for (let i = 0; i < 16; i++) {
      const bit = (n >> (15 - i)) & 1;
      out += `<rect x="${x + i * (cell + gap)}" y="${y}" width="${cell}" height="${cell}" fill="${bit ? on : off}"/>`;
    }
    return out;
  }

  // SVG text with font properties as separate attributes (Chromium drops
  // font-stretch after a font: shorthand that contains var()).
  function text(x, y, str, o = {}) {
    const fam = { mono: "'IBM Plex Mono', ui-monospace, monospace", sans: "Archivo, system-ui, sans-serif",
      serif: "Newsreader, Georgia, serif" }[o.face || "mono"];
    const a = [`x="${x}"`, `y="${y}"`, `font-family="${fam}"`, `font-size="${o.size || 11}"`,
      `font-weight="${o.weight || (o.face === "sans" ? 800 : 500)}"`, `fill="${o.fill || "var(--ink)"}"`];
    if (o.stretch) a.push(`font-stretch="${o.stretch}"`);
    if (o.italic) a.push(`font-style="italic"`);
    if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
    if (o.ls != null) a.push(`letter-spacing="${o.ls}"`);
    if (o.cls) a.push(`class="${o.cls}"`);
    if (o.extra) a.push(o.extra);
    return `<text ${a.join(" ")}>${esc(str)}</text>`;
  }
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Light token values for standalone (fixed-artwork) SVG files.
  const LIGHT = `:root{--paper:#eeede7;--sheet:#f9f9f5;--ink:#16181d;--ink-muted:#555a61;--rule:#c9c9c0;--rule-faint:#e0e0d8;--cobalt:#2236b0;--cobalt-text:#2236b0;--on-cobalt:#f9f9f5;--cobalt-tint:#dde1f2;--vermilion:#ee5228;--vermilion-text:#b8300c;--on-vermilion:#16181d;--vermilion-tint:#f7dcd2;--sun:#f2c81b;--on-sun:#16181d;--sun-tint:#f6ebbd;--phosphor:#9cbc2c;--phosphor-text:#4f6512}`;
  const DARK = `:root{--paper:#121417;--sheet:#1b1e22;--ink:#ecebe4;--ink-muted:#a2a7ad;--rule:#3a3e44;--rule-faint:#25282d;--cobalt:#3d55d8;--cobalt-text:#9fb0ff;--on-cobalt:#f9f9f5;--cobalt-tint:#1e2444;--vermilion:#ff6a3d;--vermilion-text:#ff8a63;--on-vermilion:#16181d;--vermilion-tint:#3b1e15;--sun:#f5cf2a;--on-sun:#16181d;--sun-tint:#36301a;--phosphor:#b8d84c;--phosphor-text:#b8d84c}`;
  const FONTS = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&amp;family=IBM+Plex+Mono:wght@400;500;600&amp;family=Newsreader:ital,opsz,wght@1,6..72,400&amp;display=swap";

  // Wrap inner SVG as a standalone file with tokens and fonts baked in.
  function standalone(w, h, inner, title, theme) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}">` +
      `<title>${esc(title)}</title><style>@import url("${FONTS}");${theme === "dark" ? DARK : LIGHT}</style>${inner}</svg>`;
  }

  // Rule 90 cellular automaton rows (used as "static" texture). Returns array of bit arrays.
  function rule90(width, rows, seedBits) {
    let row = new Array(width).fill(0);
    (seedBits || [Math.floor(width / 2)]).forEach((i) => (row[i] = 1));
    const out = [row];
    for (let r = 1; r < rows; r++) {
      const n = row.map((_, i) => (row[i - 1] || 0) ^ (row[i + 1] || 0));
      out.push(n); row = n;
    }
    return out;
  }

  root.BONFIRE_ART = { rng, glyph, seedStrip, text, esc, standalone, rule90 };
})(typeof window !== "undefined" ? window : globalThis);
