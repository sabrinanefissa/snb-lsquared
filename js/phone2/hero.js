/* phone2 section 1, the hero: "Power on".
   Spec: scratchpad/mobile-plan-blind.md, section 2.1.
   The phone boots as a screen (one orange pixel, then the edge traced),
   then the thumb scrubs the count 10, 50, 100, 500, infinite over a wall
   of glowing screens drawn in code. Press and hold runs the count by
   itself. At infinite the wall collapses into one screen, the phone, and
   the ground washes from black to the statement's own navy, so the
   next scroll lands on the statement with no step. The edge stays
   orange, dimmed, never grey.
   Hands the signal on as {shape:'edge', rect} (the traced edge line).
   All new DOM is made here; the r76 hero markup stays in the page, hidden. */
(() => {
  'use strict';
  const P2 = window.P2, hero = document.getElementById('hero');
  if (!P2 || !hero) return;
  const RM = P2.RM, clamp = P2.clamp, T = window.LSQ || {};
  const ORANGE = [255, 140, 0], BLUE = [86, 176, 228], WHITE = [208, 222, 238], OFF = [9, 13, 19];   /* herowall.js colours: 255,140,0 reads as #FF9900 once lit */

  /* the words: "hero title" from content.js (a | is a new line) */
  const title = (T['hero title'] || (document.querySelector('.bigA') || {}).textContent || 'One platform.').trim();
  const NUMS = ['10', '50', '100', '500', 'inf'];
  const INF = '<svg class="p2h__inf" viewBox="0 0 100 50" aria-hidden="true"><path d="M50 25C40 11 33 7 25 7a18 18 0 0 0 0 36c8 0 15-4 25-18S65 7 75 7a18 18 0 0 1 0 36c-8 0-15-4-25-18z"/></svg>';

  /* ------------------------------------------------------------ DOM */
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const wrap = el('div', 'p2h');
  const stage = el('div', 'p2h__stage');
  const screen = el('div', 'p2h__screen');
  const cvLo = el('canvas', 'p2h__cv'), cvHi = el('canvas', 'p2h__cv'), cvFl = el('canvas', 'p2h__cv p2h__cv--fl');
  [cvLo, cvHi, cvFl].forEach((c) => c.setAttribute('aria-hidden', 'true'));
  const flw = el('div', 'p2h__flw'); flw.appendChild(cvFl);
  const one = el('div', 'p2h__one');            /* the single screen the wall collapses into */
  const wash = el('div', 'p2h__wash');          /* black to the statement's top colour, opacity only */
  const glow = el('div', 'p2h__glow');          /* soft #FF9900 light behind the number */
  const mkLock = () => {
    const l = el('div', 'p2h__lock');
    const n = el('span', 'p2h__num'), w = el('span', 'p2h__word', 'Screens'), t = el('span', 'p2h__plat');
    title.split('|').forEach((p, i) => { if (i) t.appendChild(document.createElement('br')); t.appendChild(document.createTextNode(p.trim())); });
    l.append(n, w, t);
    return l;
  };
  const lock = mkLock();   /* white on the navy wash too: one lockup, never swapped */
  lock.querySelector('.p2h__num').setAttribute('aria-hidden', 'true');
  const sr = el('span', 'sr-only'); sr.textContent = 'From 10 screens to countless screens.';
  lock.prepend(sr);
  const svgNS = 'http://www.w3.org/2000/svg';
  const edge = document.createElementNS(svgNS, 'svg'); edge.setAttribute('class', 'p2h__edge'); edge.setAttribute('aria-hidden', 'true');
  const eL = document.createElementNS(svgNS, 'path'), eR = document.createElementNS(svgNS, 'path');
  edge.append(eL, eR);
  const px = el('i', 'p2h__px'); px.setAttribute('aria-hidden', 'true');
  screen.append(cvLo, cvHi, flw, one, glow);
  stage.append(screen, wash, lock, edge, px);
  wrap.appendChild(stage);
  hero.appendChild(wrap);
  P2.sec('hero');

  /* ------------------------------------------------------------ the wall of screens
     Each count is drawn once into its own offscreen canvas. On screen only
     two canvases are shown at a time (the count and the next one); moving
     between counts is a scale and a cross-fade of those two, nothing redraws
     while you scroll. A third canvas holds a slightly different brightness of
     the settled count and breathes over it: her slow, soft flicker. */
  const LV = [{ c: 2, r: 5 }, { c: 5, r: 10 }, { c: 7, r: 14 }, { c: 14, r: 36 }, { c: 44, r: 0 }];
  let W = 0, H = 0, D = 1, cache = [], cacheFl = [], ratio = [], box = null, IN = 24, w0 = 0;
  const sprites = {};
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const sprite = (col, w, h) => {
    const key = col.join() + '|' + Math.round(w * 2) + 'x' + Math.round(h * 2);
    if (sprites[key]) return sprites[key];
    const pad = Math.max(6, w * .5), c = document.createElement('canvas');
    c.width = Math.ceil((w + pad * 2) * D); c.height = Math.ceil((h + pad * 2) * D);
    const g = c.getContext('2d'); g.setTransform(D, 0, 0, D, 0, 0);
    const r = Math.max(1, w * .035), rgb = col.join(',');
    if (col === OFF) {
      g.fillStyle = 'rgb(9,13,19)'; rr(g, pad, pad, w, h, r); g.fill();
      g.lineWidth = 1; g.strokeStyle = 'rgba(120,150,180,.16)'; rr(g, pad, pad, w, h, r); g.stroke();
      return (sprites[key] = { c, pad });
    }
    g.fillStyle = 'rgba(' + rgb + ',.9)'; g.shadowColor = 'rgba(' + rgb + ',1)';
    for (const b of [.9, .45]) { g.shadowBlur = pad * b * D; rr(g, pad, pad, w, h, r); g.fill(); }
    g.shadowBlur = 0;
    const lg = g.createLinearGradient(0, pad, 0, pad + h);
    lg.addColorStop(0, 'rgb(' + col.map((v) => Math.round(v * .94)).join(',') + ')');
    lg.addColorStop(1, 'rgb(' + col.map((v) => Math.round(v * .72)).join(',') + ')');
    g.fillStyle = lg; rr(g, pad, pad, w, h, r); g.fill();
    g.lineWidth = Math.max(.75, w * .02); g.strokeStyle = 'rgba(' + (col === ORANGE ? col : col.map((v) => Math.min(255, v + 24))).join(',') + ',.75)';
    rr(g, pad, pad, w, h, r); g.stroke();
    return (sprites[key] = { c, pad });
  };
  /* colours dealt on an even lattice, never at random, so none bunch up:
     mostly blue, some orange, some white, a few off (none off at ten) */
  const colAt = (i, j, lv) => {
    /* the dense counts use a 2D low discrepancy lattice with a little jitter:
       even, no clusters, and no diagonal stripes */
    const f = lv >= 3 ? (i * .7548776662 + j * .5698402910 + .18 * (Math.abs(Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1)) % 1 : (i * .618034 + j * .414214 + lv * .2) % 1;
    return f < .58 ? BLUE : f < .76 ? ORANGE : f < .89 ? WHITE : (lv === 0 ? BLUE : OFF);
  };
  /* the screens behind the words dim themselves, so the words always read */
  const dimAt = (x, y) => {
    if (!box) return 1;
    const dx = (x - box.cx) / box.rx, dy = (y - box.cy) / box.ry, d = Math.sqrt(dx * dx + dy * dy);
    return d < 1 ? .2 : Math.min(1, .2 + (d - 1) * 1.1);
  };
  const drawLevel = (lv, alt) => {
    const c = document.createElement('canvas'); c.width = Math.round(W * D); c.height = Math.round(H * D);
    const g = c.getContext('2d'); g.setTransform(D, 0, 0, D, 0, 0);
    const L = LV[lv], AW = W - IN * 2, AH = H - IN * 2;
    const cols = L.c, cw = AW / cols;
    const sw = cw * (lv === 4 ? .7 : .8), sh = sw * 9 / 16;
    const rows = L.r || Math.floor(AH / (sh / .62));
    const chh = AH / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = IN + cw * (i + .5), y = IN + chh * (j + .5);
      let col = colAt(i, j, lv);
      let a = dimAt(x, y);
      if (alt) a *= .78 + .22 * (((i * 7 + j * 13 + lv) % 5) / 4);   /* the flicker copy: each screen a touch brighter or dimmer */
      if (lv === 4) {
        g.globalAlpha = a * (col === OFF ? 1 : .9);
        g.fillStyle = col === OFF ? 'rgb(20,28,38)' : 'rgb(' + col.join(',') + ')';
        g.fillRect(x - sw / 2, y - sh / 2, sw, sh);
        continue;
      }
      const s = sprite(col, sw, sh);
      g.globalAlpha = a;
      g.drawImage(s.c, x - sw / 2 - s.pad, y - sh / 2 - s.pad, sw + s.pad * 2, sh + s.pad * 2);
    }
    g.globalAlpha = 1;
    return { c, cw };
  };
  const paint = (cv, src) => { const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); if (src) g.drawImage(src, 0, 0); };

  /* the edge the orange line traces: the phone screen, inset 12px */
  const INSET = 12, RAD = 30;
  const edgeRect = () => ({ x0: INSET, y0: INSET, x1: W - INSET, y1: H - INSET });
  const layoutEdge = () => {
    const { x0, y0, x1, y1 } = edgeRect(), cx = W / 2, r = RAD;
    edge.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    eR.setAttribute('d', 'M' + cx + ' ' + y0 + 'H' + (x1 - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + (y0 + r) + 'V' + (y1 - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x1 - r) + ' ' + y1 + 'H' + cx);
    eL.setAttribute('d', 'M' + cx + ' ' + y0 + 'H' + (x0 + r) + 'A' + r + ' ' + r + ' 0 0 0 ' + x0 + ' ' + (y0 + r) + 'V' + (y1 - r) + 'A' + r + ' ' + r + ' 0 0 0 ' + (x0 + r) + ' ' + y1 + 'H' + cx);
    const len = eR.getTotalLength();
    [eL, eR].forEach((p) => { p.style.strokeDasharray = len + ' ' + len; });
    return len;
  };

  /* the wash ends on the colour the next section starts with (read from the
     page, so a reordered or restyled section still meets it with no step) */
  const washTo = () => {
    const nx = P2.signal.next('hero'), n = nx && document.getElementById(P2.SEC[nx]);
    if (!n) return;
    const cs = getComputedStyle(n), m = (cs.backgroundImage.match(/rgba?\([^)]*\)/) || [])[0] || cs.backgroundColor;
    const c = (m.match(/[\d.]+/g) || []).map(Number);
    if (c.length < 3 || c[3] === 0) return;
    const top = 'rgb(' + c.slice(0, 3).map((v) => Math.round(v * .82)).join(',') + ')';
    wash.style.background = 'linear-gradient(180deg,' + top + ' 0%,rgb(' + c.slice(0, 3).join(',') + ') 100%)';
  };
  let edgeLen = 0, pair = -1;
  const build = () => {
    W = stage.clientWidth; H = stage.clientHeight; w0 = innerWidth;
    D = Math.min(1.5, window.devicePixelRatio || 1);
    [cvLo, cvHi, cvFl].forEach((c) => { c.width = Math.round(W * D); c.height = Math.round(H * D); });
    const s = stage.getBoundingClientRect(), b = lock.getBoundingClientRect();
    box = { cx: b.left - s.left + b.width / 2, cy: b.top - s.top + b.height / 2, rx: Math.max(b.width / 2 + 34, W * .36), ry: b.height / 2 + 40 };
    for (const k in sprites) delete sprites[k];
    cache = []; cacheFl = []; ratio = [1];
    for (let lv = 0; lv < LV.length; lv++) cache[lv] = drawLevel(lv, false);
    for (let lv = 1; lv < LV.length; lv++) ratio[lv] = cache[lv - 1].cw / cache[lv].cw;
    edgeLen = layoutEdge();
    washTo();
    pair = -1; flOf = -1;
  };

  /* ------------------------------------------------------------ the scrub
     The hero is 3 screens tall with the stage pinned (2 screens of scroll).
     The first two thirds of the scroll are the count, then the wall
     collapses into one screen, then the last quarter (half a screen)
     washes the ground to the statement's navy. */
  const CP = 2 / 3, CL = .75, B = [.25, .5, .625, .75];
  const sm = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const levelOf = (c) => RM ? B.filter((b) => c >= b).length : B.reduce((s, b) => s + sm((c - (b - .015)) / .06), 0);
  const labelOf = (c) => B.filter((b) => c >= b).length;
  const nums = [lock.querySelector('.p2h__num')];
  let shown = -1, flOf = -1, holdC = -1, holding = false, handed = false, lastP = 0;
  const setNum = (i) => {
    if (i === shown) return; shown = i;
    nums.forEach((n) => { n.innerHTML = NUMS[i] === 'inf' ? INF : NUMS[i]; n.classList.toggle('is-inf', NUMS[i] === 'inf'); });
    stage.dataset.count = NUMS[i];
  };
  const tf = (e, s, o) => { e.style.transform = 'scale(' + s.toFixed(4) + ')'; e.style.opacity = o.toFixed(3); };
  const render = (p) => {
    lastP = p;
    const c = clamp(p / CP, 0, 1), cc = holdC >= 0 ? Math.max(c, holdC) : c;
    const L = levelOf(cc);
    setNum(labelOf(cc));
    const pr = Math.min(3, Math.floor(L)), t = L - pr;
    if (pr !== pair) { pair = pr; paint(cvLo, cache[pr].c); paint(cvHi, cache[pr + 1].c); }
    const rt = ratio[pr + 1] || 1;
    const k = RM ? (p >= (CP + CL) / 2 ? 1 : 0) : sm((p - CP) / (CL - CP));
    tf(cvLo, 1 + (1 / rt - 1) * t, 1 - t);
    tf(cvHi, (rt + (1 - rt) * t) * (1 - .04 * k), t * (1 - k));
    /* the flicker copy sits on the settled count only */
    const settled = t < .02 ? pr : (t > .98 ? pr + 1 : -1);
    if (!RM && settled >= 0 && settled !== flOf) { flOf = settled; paint(cvFl, (cacheFl[settled] = cacheFl[settled] || drawLevel(settled, true)).c); }
    flw.style.opacity = (!RM && settled >= 0 && settled === flOf) ? (1 - k).toFixed(3) : '0';
    one.style.opacity = k.toFixed(3); one.style.transform = 'scale(' + (.985 + .015 * k).toFixed(4) + ')';
    const w = clamp((p - CL) / (1 - CL), 0, 1);
    wash.style.opacity = w.toFixed(3);
    glow.style.opacity = ((.34 + .11 * L) * (1 - w)).toFixed(3);
    /* the phone's edge stays #FF9900 and dims to 55%: the signal is still lit when it hands on.
       (At 35% over the navy the 1px line mixes to a grey olive, rgb 105,105,81; 55% still reads orange.) */
    edge.style.opacity = booted ? (1 - .45 * w).toFixed(3) : edge.style.opacity;
    if (!handed && w > .9) {
      handed = true;
      const s = stage.getBoundingClientRect(), r = edgeRect();
      P2.signal.handoff('hero', { shape: 'edge', rect: { left: s.left + r.x0, top: s.top + r.y0, width: r.x1 - r.x0, height: r.y1 - r.y0 } });
    }
  };

  /* ------------------------------------------------------------ power on (once) */
  let booted = false;
  const boot = () => {
    if (RM || scrollY > 40) {
      booted = true; edge.style.opacity = '1';
      [eL, eR].forEach((p) => { p.style.strokeDashoffset = '0'; });
      return;
    }
    stage.classList.add('is-boot');
    [eL, eR].forEach((p) => { p.style.strokeDashoffset = edgeLen; });
    edge.style.opacity = '1';
    px.animate([{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 200, easing: P2.EASE_OUT, fill: 'forwards' });
    const traces = [eL, eR].map((p) => p.animate([{ strokeDashoffset: edgeLen }, { strokeDashoffset: 0 }], { duration: 600, delay: 200, easing: P2.EASE_IO, fill: 'forwards' }));
    traces[0].finished.then(() => {
      [eL, eR].forEach((p) => { p.style.strokeDashoffset = '0'; });
      traces.forEach((a) => a.cancel());
      booted = true;
      px.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
      stage.classList.remove('is-boot');
      /* the screen refreshes on: the orange scanline brings the wall and the words in */
      P2.scanline(screen, { dur: 620 });
      lock.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: 260, easing: P2.EASE_OUT, fill: 'backwards' });
    }).catch(() => { booted = true; stage.classList.remove('is-boot'); });
  };

  /* ------------------------------------------------------------ press and hold
     Holding anywhere on the hero runs the count to infinite by itself;
     letting go hands it back to the scroll. A scroll that starts under the
     finger cancels the hold (the browser sends pointercancel). */
  if (!RM) {
    let timer = 0, raf = 0, sx = 0, sy = 0, tPrev = 0;
    const loop = (now) => {
      const dt = Math.min(64, now - tPrev) / 1000; tPrev = now;
      const c = clamp(lastP / CP, 0, 1);
      if (holding) holdC = Math.min(1, Math.max(holdC, c) + dt / 2.6);
      else { holdC += (c - holdC) * Math.min(1, dt * 7); if (Math.abs(holdC - c) < .004) holdC = -1; }
      render(lastP);
      raf = holdC >= 0 ? requestAnimationFrame(loop) : 0;
    };
    const start = () => { holding = true; stage.classList.add('is-held'); if (holdC < 0) holdC = clamp(lastP / CP, 0, 1); if (!raf) { tPrev = performance.now(); raf = requestAnimationFrame(loop); } };
    const end = () => { clearTimeout(timer); if (holding) { holding = false; stage.classList.remove('is-held'); } };
    stage.addEventListener('pointerdown', (e) => {
      if (lastP >= CP || e.button > 0) return;
      sx = e.clientX; sy = e.clientY; clearTimeout(timer); timer = setTimeout(start, 220);
    }, { passive: true });
    stage.addEventListener('pointermove', (e) => { if (!holding && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) clearTimeout(timer); }, { passive: true });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => stage.addEventListener(n, end, { passive: true }));
    stage.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /* ------------------------------------------------------------ go */
  const start = () => {
    build();
    const pg = P2.progress(hero, render);
    pg.force();
    boot();
    let rt = 0;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { if (Math.abs(innerWidth - w0) > 40) { build(); pg.force(); } }, 200);
    }, { passive: true });
  };
  /* the lockup is measured for the dim area behind the words, so wait for Archivo */
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve()).then(start);
  setNum(0);

  P2.signal.station('hero', {});
})();
