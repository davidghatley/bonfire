/* Variant A, "the plate": the loop drawn as an exploded technical plate.
   One job card fans out to four lanes of saved steps, a forced restart cuts
   every lane, the lanes carry on, each is reviewed, then verified and merged. */
(function (root) {
  "use strict";
  const A = root.BONFIRE_ART;

  // compact: true draws the phone layout (fewer steps, short labels, larger type).
  function loop(o = {}) {
    const compact = !!o.compact, anim = !!o.animate;
    const W = compact ? 420 : 800, H = compact ? 330 : 420;
    const T = (x, y, s, opt) => A.text(x, y, s, opt);
    const fs = compact ? 13 : 11;
    let s = "";
    // construction dot grid
    s += `<defs><pattern id="a-dots" width="20" height="20" patternUnits="userSpaceOnUse"><rect x="9.5" y="9.5" width="1" height="1" fill="var(--rule)"/></pattern></defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#a-dots)"/>`;

    // 1 job card
    const jx = compact ? 8 : 20, jy = compact ? 95 : 120, jw = compact ? 92 : 140, jh = compact ? 140 : 180;
    const midY = jy + jh / 2;
    s += `<rect x="${jx}" y="${jy}" width="${jw}" height="${jh}" fill="var(--sheet)" stroke="var(--ink)" stroke-width="1.5"/>`;
    s += `<rect x="${jx}" y="${jy}" width="${jw}" height="${compact ? 20 : 22}" fill="var(--ink)"/>`;
    s += T(jx + 8, jy + (compact ? 15 : 15), "JOB", { fill: "var(--paper)", size: fs, weight: 600, ls: ".14em" });
    const checks = compact ? ["BUILDS", "TESTS PASS", "LEVEL 2"] : ["GAME BUILDS", "TESTS PASS", "REACHES LEVEL 2"];
    if (!compact) {
      ["“Make a one-screen", "game where a frog", "crosses a busy road”"].forEach((l, i) =>
        s += T(jx + 10, jy + 42 + i * 15, l, { face: "serif", size: 13, italic: true, weight: 400, fill: "var(--ink-muted)" }));
    }
    const cy0 = compact ? jy + 44 : jy + 100;
    s += `<line x1="${jx + 8}" x2="${jx + jw - 8}" y1="${cy0 - 14}" y2="${cy0 - 14}" stroke="var(--rule)"/>`;
    s += T(jx + 10, cy0 - (compact ? 0 : 0), "CHECKS", { size: fs - 1, ls: ".14em", fill: "var(--ink-muted)" });
    checks.forEach((c, i) => {
      const y = cy0 + 14 + i * (compact ? 24 : 20);
      s += `<rect class="a-chk" style="--d:${5.6 + i * .15}s" x="${jx + 10}" y="${y - 9}" width="10" height="10" fill="var(--cobalt)" stroke="var(--ink)"/>`;
      s += T(jx + 26, y, c, { size: compact ? 11 : 11 });
    });

    // 2 four lanes
    const names = compact ? ["W1", "W2", "W3", "W4"] : ["W1 · SMOOTH MOVEMENT", "W2 · GRID HOPS", "W3 · THE CARS", "W4 · SCORE SCREEN"];
    const N = compact ? 7 : 12, step = compact ? 26 : 26, x0 = compact ? 132 : 222, cut = compact ? 3 : 6;
    const lanesY = compact ? [70, 140, 210, 280] : [70, 160, 250, 340];
    const xEnd = x0 + (N - 1) * step + 12, revX = xEnd + 22, mergeX = compact ? revX + 24 : 640;
    const cutX = x0 + cut * step + 19;
    lanesY.forEach((y, l) => {
      s += `<path d="M${jx + jw} ${midY} C${jx + jw + 40} ${midY} ${x0 - 40} ${y} ${x0 - 6} ${y} L${revX} ${y}${compact ? "" : ` C${revX + 40} ${y} ${mergeX - 40} 210 ${mergeX} 210`}" fill="none" stroke="var(--cobalt)" stroke-width="1.5"/>`;
      s += T(x0, y - 14, names[l], { size: fs - (compact ? 2 : 0), weight: 600, ls: ".1em", fill: "var(--cobalt-text)" });
      for (let i = 0; i < N; i++) {
        const x = x0 + i * step, d = (i <= cut ? i * 0.28 : 2.2 + i * 0.22) + l * 0.07;
        s += `<rect class="a-ck" style="--d:${d.toFixed(2)}s" x="${x}" y="${y - 6}" width="12" height="12" fill="var(--ink)" stroke="var(--ink)" stroke-width="1"/>`;
      }
      // per-lane fresh reviewer: a diamond
      s += `<rect class="a-rv" style="--d:${4.9 + l * .1}s" x="${revX - 7}" y="${y - 7}" width="14" height="14" transform="rotate(45 ${revX} ${y})" fill="var(--sheet)" stroke="var(--ink)" stroke-width="1.5"/>`;
      s += T(revX, y + 4, "R", { size: 10, weight: 600, anchor: "middle" });
    });

    // 3 forced restart: a torn vermilion cut through every lane
    const top = lanesY[0] - 44, bot = lanesY[3] + 26;
    let d = `M${cutX} ${top}`; for (let y = top, k = 0; y < bot; y += 12, k++) d += ` L${cutX + (k % 2 ? -5 : 5)} ${y + 12}`;
    s += `<path class="a-cut" d="${d}" fill="none" stroke="var(--vermilion)" stroke-width="3" stroke-linejoin="bevel"/>`;
    s += T(cutX + 12, top + 8, compact ? "RESTART" : "FORCED RESTART", { size: fs, weight: 600, ls: ".12em", fill: "var(--vermilion-text)" });

    // 5 verify + merge, then the pass stamp
    let calls;
    if (compact) {
      calls = [[jx + 10, jy - 14, 1], [x0 - 14, lanesY[0] - 30 + 4, 2], [cutX - 14, top + 4, 3], [revX, lanesY[0] - 26, 4]];
    } else {
      s += `<rect x="${mergeX}" y="178" width="140" height="64" fill="var(--sheet)" stroke="var(--ink)" stroke-width="1.5"/>`;
      s += T(mergeX + 12, 202, "VERIFY CLAIMS", { size: 11, weight: 600, ls: ".1em" });
      s += `<line x1="${mergeX}" x2="${mergeX + 140}" y1="210" y2="210" stroke="var(--rule)"/>`;
      s += T(mergeX + 12, 230, "MERGE THE BEST", { size: 11, weight: 600, ls: ".1em" });
      s += `<g class="a-pass"><rect x="${mergeX}" y="262" width="140" height="56" fill="var(--cobalt)"/>`;
      s += T(mergeX + 70, 286, "3 / 3 CHECKS", { size: 13, weight: 600, ls: ".1em", anchor: "middle", fill: "var(--on-cobalt)" });
      s += T(mergeX + 70, 306, "PASS", { size: 11, weight: 600, ls: ".3em", anchor: "middle", fill: "var(--on-cobalt)" }) + "</g>";
      calls = [[jx + 10, jy - 16, 1], [x0 - 18, lanesY[0] - 18, 2], [cutX - 16, top + 3, 3], [revX, lanesY[0] - 26, 4], [mergeX + 140, 166, 5]];
    }
    calls.forEach(([x, y, n]) => {
      const focal = n === 3;
      s += `<circle cx="${x}" cy="${y}" r="10" fill="${focal ? "var(--vermilion)" : "var(--sheet)"}" stroke="var(--ink)"/>`;
      s += T(x, y + 4, n, { size: 11, weight: 600, anchor: "middle", fill: focal ? "var(--on-vermilion)" : "var(--ink)" });
    });
    return { w: W, h: H, svg: s, anim };
  }

  // Animation (one pass on load). Without it, everything shows its end state.
  const CSS = `
  @media (prefers-reduced-motion: no-preference) {
    .is-anim .a-ck { animation: a-fill .25s var(--d) both; }
    .is-anim .a-rv, .is-anim .a-chk { animation: a-fill .3s var(--d) both; }
    .is-anim .a-cut { animation: a-cut 1.1s 1.55s both; }
    .is-anim .a-pass { animation: a-pop .4s 6.1s both; }
  }
  @keyframes a-fill { from { fill: var(--sheet); } }
  @keyframes a-cut { 0% { opacity: 0; } 15%, 45% { opacity: 1; } 30% { opacity: .2; } }
  @keyframes a-pop { from { opacity: 0; } }`;

  // OG card 1200x630.
  function og() {
    const f = loop({});
    let s = `<rect width="1200" height="630" fill="var(--paper)"/>`;
    s += `<rect width="64" height="630" fill="var(--cobalt)"/>` + A.glyph("bonfire", 17, 28, 6, "var(--on-cobalt)");
    s += `<text transform="translate(44 600) rotate(-90)" font-family="Archivo, sans-serif" font-size="40" font-weight="850" font-stretch="62%" fill="var(--on-cobalt)">BONFIRE</text>`;
    s += A.text(112, 72, "PLATE 0 · BONFIRE · IN BUILD", { size: 13, ls: ".14em", weight: 500 });
    s += `<line x1="112" x2="1148" y1="88" y2="88" stroke="var(--ink)"/>`;
    ["Your agent keeps going", "until every check passes."].forEach((l, i) =>
      s += A.text(108, 158 + i * 58, l, { face: "sans", size: 56, weight: 850, ls: "-0.02em" }));
    s += `<g transform="translate(250 214) scale(.84)">${f.svg}</g>`;
    s += `<line x1="112" x2="1148" y1="580" y2="580" stroke="var(--ink)"/>`;
    s += A.text(112, 606, "EXAMPLE RUN · 4 AGENTS · 3 CHECKS · 1 FORCED RESTART", { size: 13, ls: ".14em" });
    s += A.glyph("mark", 1110, 594, 4, "var(--ink)");
    return A.standalone(1200, 630, s.replace(/id="a-dots"/, 'id="a-dots-og"').replace(/url\(#a-dots\)/, "url(#a-dots-og)"), "bonfire: your agent keeps going until every check passes.");
  }

  // README header 1280x320.
  function readme(theme) {
    const f = loop({});
    let s = `<rect width="1280" height="320" fill="var(--paper)"/><rect width="1280" height="6" fill="var(--cobalt)"/>`;
    s += A.glyph("bonfire", 48, 70, 16, "var(--cobalt)");
    s += A.text(176, 132, "bonfire", { face: "sans", size: 72, weight: 850, stretch: "125%", ls: "-0.02em" });
    s += A.text(178, 178, "Four AI agents on one job until every check passes.", { face: "sans", size: 20, weight: 400 });
    s += A.text(178, 208, "Picks up where it left off after a crash.", { face: "sans", size: 20, weight: 400 });
    s += A.text(178, 246, "AGENT HARNESS · LOCAL FIRST · IN BUILD", { size: 13, ls: ".14em", fill: "var(--ink-muted)" });
    s += `<line x1="48" x2="640" y1="276" y2="276" stroke="var(--ink)"/>`;
    s += A.text(48, 298, "EXAMPLE RUN · 4 AGENTS · 3 CHECKS · 1 RESTART", { size: 11, ls: ".14em" });
    s += `<g transform="translate(704 16) scale(.7)">${f.svg}</g>`;
    s += A.glyph("mark", 1236, 286, 3, "var(--ink)");
    return A.standalone(1280, 320, s, "bonfire: four AI agents on one job until every check passes.", theme);
  }

  root.BONFIRE_A = { loop, CSS, og, readme };
})(typeof window !== "undefined" ? window : globalThis);
