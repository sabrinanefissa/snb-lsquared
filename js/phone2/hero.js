/* phone2 section 1, the hero (r92).
   Same screen as r77 to r91 (the orange boot pixel, the traced orange edge,
   the wall of glowing 16:9 screens drawn in code, the counts 10, 50, 100,
   500, infinite, the soft #FF9900 glow), but it now behaves like the old
   hero (js/hero.js + js/herowall.js, r76): an automatic loop on a timer,
   one phone screen tall, no pinning, the page scrolls away at any moment.
   A tap anywhere on the hero skips to the next beat.
   At the end of every loop the wall goes dark, "One platform." shows (the
   content.js "hero title"), then it becomes the L Squared logo, as on PC.
   The screens flicker the way the old wall did: every screen swells and
   dips on its own slow beat and changes colour as it dips, never a strobe.
   All new DOM is made here; the r76 hero markup stays in the page, hidden. */
(() => {
  'use strict';
  const P2 = window.P2, hero = document.getElementById('hero');
  if (!P2 || !hero) return;
  const RM = P2.RM, T = window.LSQ || {};
  const ORANGE = [255, 140, 0], BLUE = [86, 176, 228], WHITE = [208, 222, 238], OFF = [9, 13, 19];   /* herowall.js colours: 255,140,0 reads as #FF9900 once lit */

  /* the words: "hero title" from content.js (a | is a new line); the logo is the one the PC hero shows */
  const title = (T['hero title'] || (document.querySelector('.bigA') || {}).textContent || 'One platform.').trim();
  const logoImg = document.querySelector('#h_logo img');
  const logoSrc = (logoImg && logoImg.getAttribute('src')) || 'assets/lsquared-logo.png';
  const NUMS = [10, 50, 100, 500, 'inf'];
  const INF = '<svg class="p2h__inf" viewBox="0 0 100 50" aria-hidden="true"><path d="M50 25C40 11 33 7 25 7a18 18 0 0 0 0 36c8 0 15-4 25-18S65 7 75 7a18 18 0 0 1 0 36c-8 0-15-4-25-18z"/></svg>';

  /* ------------------------------------------------------------ DOM */
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const wrap = el('div', 'p2h');
  const stage = el('div', 'p2h__stage');
  const screen = el('div', 'p2h__screen');
  const cvs = [el('canvas', 'p2h__cv'), el('canvas', 'p2h__cv')];
  cvs.forEach((c) => c.setAttribute('aria-hidden', 'true'));
  const glow = el('div', 'p2h__glow');          /* soft #FF9900 light behind the words */
  const lock = el('div', 'p2h__lock');          /* the count: number and SCREENS, one lockup */
  const num = el('span', 'p2h__num'), word = el('span', 'p2h__word', 'Screens');
  num.setAttribute('aria-hidden', 'true'); word.setAttribute('aria-hidden', 'true');
  lock.append(num, word);
  const plat = el('div', 'p2h__plat');          /* "One platform." on its own, at the end */
  const platT = el('span', 'p2h__platt');
  title.split('|').forEach((p, i) => { if (i) platT.appendChild(document.createElement('br')); platT.appendChild(document.createTextNode(p.trim())); });
  plat.appendChild(platT); plat.setAttribute('aria-hidden', 'true');
  const logo = el('div', 'p2h__logo'), lim = el('img');
  lim.src = logoSrc; lim.alt = ''; lim.decoding = 'async'; logo.appendChild(lim); logo.setAttribute('aria-hidden', 'true');
  const sr = el('p', 'sr-only'); sr.textContent = 'From 10 screens to countless screens. ' + title.replace(/\|/g, ' ') + ' L Squared.';
  const svgNS = 'http://www.w3.org/2000/svg';
  const edge = document.createElementNS(svgNS, 'svg'); edge.setAttribute('class', 'p2h__edge'); edge.setAttribute('aria-hidden', 'true');
  const eL = document.createElementNS(svgNS, 'path'), eR = document.createElementNS(svgNS, 'path');
  edge.append(eL, eR);
  const px = el('i', 'p2h__px'); px.setAttribute('aria-hidden', 'true');
  screen.append(cvs[0], cvs[1]);
  stage.append(screen, glow, lock, plat, logo, edge, px, sr);
  wrap.appendChild(stage);
  hero.appendChild(wrap);

  /* ------------------------------------------------------------ the wall of screens
     Five walls, one per count (columns x rows). Each is drawn live, so every
     screen can flicker on its own like the old wall; frames are drawn at
     most 30 times a second and only while the hero is on screen. Moving to
     the next count is a zoom and a cross-fade between the two canvases. */
  const LV = [{ c: 2, r: 5 }, { c: 5, r: 10 }, { c: 7, r: 14 }, { c: 14, r: 36 }, { c: 44, r: 0 }];
  let W = 0, H = 0, D = 1, geo = [], ratio = [], box = null, w0 = 0;
  const IN = 24;
  let sprites = {};
  const fr = (v) => v - Math.floor(v);
  const hsh = (a, b) => fr(Math.sin(a * 127.1 + b * 311.7) * 43758.5453);
  const sst = (e) => { e = e < 0 ? 0 : e > 1 ? 1 : e; return e * e * (3 - 2 * e); };
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
  const FILL = new Map([[BLUE, 'rgb(86,176,228)'], [ORANGE, 'rgb(255,140,0)'], [WHITE, 'rgb(208,222,238)'], [OFF, 'rgb(20,28,38)']]);

  /* the old wall's flicker (herowall.js look/drawCell): colours dealt on an
     even lattice, mostly blue, some orange, some white, a few off (none off
     at ten). Every screen changes on the same slow beat but at its own
     moment, and dips to dark as it changes; lit screens also swell softly. */
  const look = (i, j, t, lv) => {
    const v = lv >= 3 ? fr(i * .7548776662 + j * .5698402910 + .18 * hsh(i, j)) : fr(i * .7548776662 + j * .5698402910);
    const u = RM ? .5 : (t / 5200 + fr(i * .362 + j * .814)), k = Math.floor(u), f = u - k, r = fr(v + k * .6180339887);
    const col = r < .58 ? BLUE : r < .76 ? ORANGE : r < .89 ? WHITE : (lv === 0 ? BLUE : OFF);
    return [col, sst(Math.min(f, 1 - f) * 7)];
  };
  const shimmer = (i, j, t) => {
    if (RM) return 1;
    const seed = i * 73 + j * 131 + 1, f1 = .7 + .6 * hsh(seed, 3), f2 = .7 + .6 * hsh(seed, 4);
    return .8 + .2 * (.6 * Math.sin(t * .0012 * f1 + seed) + .4 * Math.sin(t * .0019 * f2 + seed * 2.3));
  };
  /* the screens behind the words step back, so the words always read */
  const dimAt = (x, y) => {
    if (!box) return 1;
    const dx = (x - box.cx) / box.rx, dy = (y - box.cy) / box.ry, d = Math.sqrt(dx * dx + dy * dy);
    return d < 1 ? .2 : Math.min(1, .2 + (d - 1) * 1.1);
  };
  const layout = () => {
    geo = LV.map((L, lv) => {
      const AW = W - IN * 2, AH = H - IN * 2, cw = AW / L.c;
      const sw = cw * (lv === 4 ? .7 : .8), sh = sw * 9 / 16;
      const rows = L.r || Math.floor(AH / (sh / .62));
      const cells = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < L.c; i++) {
        const x = IN + cw * (i + .5), y = IN + (AH / rows) * (j + .5);
        cells.push([i, j, x, y, dimAt(x, y)]);
      }
      return { lv, sw, sh, cw, cells };
    });
    ratio = [1];
    for (let lv = 1; lv < LV.length; lv++) ratio[lv] = geo[lv - 1].cw / geo[lv].cw;
  };
  const drawWall = (cv, lv, t) => {
    const g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    if (lv < 0) return;
    g.setTransform(D, 0, 0, D, 0, 0);
    const G = geo[lv], sw = G.sw, sh = G.sh;
    for (const [i, j, x, y, dim] of G.cells) {
      const [col, level] = look(i, j, t, lv), off = col === OFF;
      const a = (off ? .9 * Math.max(.3, level) : (.06 + .94 * level) * shimmer(i, j, t)) * dim;
      if (a <= .01) continue;
      g.globalAlpha = a > 1 ? 1 : a;
      if (lv === 4) { g.fillStyle = FILL.get(col); g.fillRect(x - sw / 2, y - sh / 2, sw, sh); continue; }
      const s = sprite(col, sw, sh);
      g.drawImage(s.c, x - sw / 2 - s.pad, y - sh / 2 - s.pad, sw + s.pad * 2, sh + s.pad * 2);
    }
    g.globalAlpha = 1;
  };

  /* the edge the orange line traces: the phone screen, inset 12px */
  const INSET = 12, RAD = 30;
  let edgeLen = 0;
  const layoutEdge = () => {
    const x0 = INSET, y0 = INSET, x1 = W - INSET, y1 = H - INSET, cx = W / 2, r = RAD;
    edge.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    eR.setAttribute('d', 'M' + cx + ' ' + y0 + 'H' + (x1 - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + (y0 + r) + 'V' + (y1 - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x1 - r) + ' ' + y1 + 'H' + cx);
    eL.setAttribute('d', 'M' + cx + ' ' + y0 + 'H' + (x0 + r) + 'A' + r + ' ' + r + ' 0 0 0 ' + x0 + ' ' + (y0 + r) + 'V' + (y1 - r) + 'A' + r + ' ' + r + ' 0 0 0 ' + (x0 + r) + ' ' + y1 + 'H' + cx);
    edgeLen = eR.getTotalLength();
    [eL, eR].forEach((p) => { p.style.strokeDasharray = edgeLen + ' ' + edgeLen; });
  };

  const build = () => {
    W = stage.clientWidth; H = stage.clientHeight; w0 = innerWidth;
    D = Math.min(1.5, window.devicePixelRatio || 1);
    cvs.forEach((c) => { c.width = Math.round(W * D); c.height = Math.round(H * D); });
    const keep = num.innerHTML;
    num.textContent = '500';   /* the widest count sets the quiet area behind the words */
    const s = stage.getBoundingClientRect(), b = lock.getBoundingClientRect();
    num.innerHTML = keep;
    box = { cx: b.left - s.left + b.width / 2, cy: b.top - s.top + b.height / 2, rx: Math.max(b.width / 2 + 34, W * .36), ry: b.height / 2 + 40 };
    /* "One platform." sits on one line as on PC (a | in content.js makes more
       lines): as large as 16vw, smaller only if a longer title needs it */
    platT.style.fontSize = '';
    const fs = parseFloat(getComputedStyle(platT).fontSize), avail = W - 2 * 28;
    if (platT.scrollWidth > avail) platT.style.fontSize = Math.floor(fs * avail / platT.scrollWidth) + 'px';
    sprites = {};
    layout();
    layoutEdge();
  };

  /* ------------------------------------------------------------ the renderer
     front: the canvas showing the settled count. During a move to the next
     count the back canvas holds it, zooming in from far while the front
     zooms past; then they swap roles. */
  let front = 0, cur = -1, nxt = -1, mv = null, visible = true, wallOn = false, raf = 0, lastDraw = 0;
  const tf = (e, s, o) => { e.style.transform = 'scale(' + s.toFixed(4) + ')'; e.style.opacity = o.toFixed(3); };
  const glowAt = (L) => { glow.style.opacity = (.34 + .11 * L).toFixed(3); };
  const tick = (now) => {
    raf = 0;
    if (!visible || document.hidden || !wallOn) return;
    let k = 0;
    if (mv) {
      k = Math.min(1, (now - mv.t0) / mv.dur);
      const e = sst(k), rt = ratio[nxt] || 1;
      tf(cvs[front], 1 + (1 / rt - 1) * e, 1 - e);
      tf(cvs[1 - front], rt + (1 - rt) * e, e);
      glowAt(cur + e);
    }
    if (now - lastDraw > 32 || (mv && k >= 1)) {
      lastDraw = now;
      drawWall(cvs[front], cur, now);
      if (nxt >= 0) drawWall(cvs[1 - front], nxt, now);
    }
    if (mv && k >= 1) settle();
    raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf && visible && !document.hidden && wallOn) raf = requestAnimationFrame(tick); };
  const settle = () => {
    if (!mv) return;
    const done = mv.res; mv = null;
    front = 1 - front; cur = nxt; nxt = -1;
    tf(cvs[front], 1, 1); tf(cvs[1 - front], 1, 0);
    drawWall(cvs[1 - front], -1, 0);
    glowAt(cur);
    done();
  };
  /* show one count at once (the start of a loop) */
  const setWall = (lv) => {
    mv = null; cur = lv; nxt = -1;
    tf(cvs[front], 1, 1); tf(cvs[1 - front], 1, 0);
    drawWall(cvs[front], lv, performance.now()); drawWall(cvs[1 - front], -1, 0);
    glowAt(lv); wallOn = true; kick();
  };
  /* move to the next count: a zoom and cross-fade; a tap finishes it at once */
  const moveTo = (lv, dur) => new Promise((res) => {
    nxt = lv; mv = { t0: performance.now(), dur, res };
    drawWall(cvs[1 - front], lv, performance.now());
    if (!visible || document.hidden) { settle(); return; }
    kick();
  });

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); else if (mv) settle(); }, { threshold: .02 }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); else if (mv) settle(); });

  /* ------------------------------------------------------------ the numbers */
  const setNum = (v) => {
    if (v === 'inf') { num.innerHTML = INF; num.classList.add('is-inf'); }
    else { num.textContent = String(v); num.classList.remove('is-inf'); }
  };

  /* ------------------------------------------------------------ the loop, timed as the old hero.js
     Tapping the hero cuts the current count or hold short (old behaviour). */
  let skip = null;
  hero.addEventListener('click', () => { if (skip) { const f = skip; skip = null; f(); } });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const hold = (ms) => new Promise((r) => { const t = setTimeout(() => { skip = null; r(); }, ms); skip = () => { clearTimeout(t); r(); }; });
  const whenVisible = async () => { while (!visible || document.hidden) await wait(400); };
  /* the count climbs to its number (520ms, as the old hero) while the wall zooms to the next count */
  const count = (i) => new Promise((res) => {
    const to = NUMS[i], lv = i;
    let done = false, raf2 = 0;
    const fin = () => { if (done) return; done = true; skip = null; cancelAnimationFrame(raf2); setNum(to); if (mv) settle(); res(); };
    skip = fin;
    const walk = i === 0 ? Promise.resolve() : moveTo(lv, 700);
    if (to === 'inf') { setNum('inf'); walk.then(fin); return; }
    const s = i === 0 ? 0 : NUMS[i - 1], t0 = performance.now();
    const step = (x) => {
      if (done) return;
      const k = Math.min(1, (x - t0) / 520), e = 1 - Math.pow(1 - k, 3);
      num.textContent = String(Math.round(s + (to - s) * e));
      if (k < 1) raf2 = requestAnimationFrame(step); else walk.then(fin);
    };
    raf2 = requestAnimationFrame(step);
  });
  const phase = (name) => { stage.dataset.phase = name; };
  let loops = 0;
  const run = async () => {
    await whenVisible();
    phase('count'); loops++;
    stage.classList.remove('is-end', 'is-plat', 'is-logo', 'is-full');
    num.textContent = '';
    setWall(0);
    if (loops > 1) P2.scanline(screen, { dur: 620 });   /* each new loop, the screen refreshes on under the orange scanline */
    await wait(300);
    for (let i = 0; i < NUMS.length; i++) {
      stage.dataset.count = String(NUMS[i]);
      await count(i);
      await hold(NUMS[i] === 'inf' ? 4200 : NUMS[i] >= 500 ? 3600 : 1000);
    }
    /* the wall goes dark, then "One platform.", then the L Squared logo, as on PC */
    phase('end'); stage.classList.add('is-end');
    await wait(900);
    wallOn = false; cur = -1; drawWall(cvs[0], -1, 0); drawWall(cvs[1], -1, 0);
    phase('plat'); stage.classList.add('is-plat'); await hold(3000);
    stage.classList.remove('is-plat'); await wait(450);
    phase('logo'); stage.classList.add('is-logo'); await hold(650);
    stage.classList.add('is-full'); await hold(4200);
    stage.classList.remove('is-logo'); await wait(1300);
    stage.classList.remove('is-full');
    run();
  };

  /* ------------------------------------------------------------ power on (once) */
  const boot = () => new Promise((res) => {
    edge.style.opacity = '1';
    if (scrollY > 40) { [eL, eR].forEach((p) => { p.style.strokeDashoffset = '0'; }); res(); return; }
    stage.classList.add('is-boot');
    [eL, eR].forEach((p) => { p.style.strokeDashoffset = edgeLen; });
    px.animate([{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 200, easing: P2.EASE_OUT, fill: 'forwards' });
    const traces = [eL, eR].map((p) => p.animate([{ strokeDashoffset: edgeLen }, { strokeDashoffset: 0 }], { duration: 600, delay: 200, easing: P2.EASE_IO, fill: 'forwards' }));
    const done = () => {
      [eL, eR].forEach((p) => { p.style.strokeDashoffset = '0'; });
      traces.forEach((a) => a.cancel());
      px.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
      stage.classList.remove('is-boot');
      /* the screen refreshes on: the orange scanline brings the wall and the words in */
      P2.scanline(screen, { dur: 620 });
      lock.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: 260, easing: P2.EASE_OUT, fill: 'backwards' });
      res();
    };
    traces[0].finished.then(done).catch(done);
  });

  /* ------------------------------------------------------------ go */
  const start = () => {
    build();
    let rt = 0;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { if (Math.abs(innerWidth - w0) > 40) { build(); if (wallOn) { if (mv) settle(); setWall(cur); } } }, 200);
    }, { passive: true });
    if (RM) {
      /* reduced motion: the end frame, still: the orange edge and the full logo */
      edge.style.opacity = '1'; [eL, eR].forEach((p) => { p.style.strokeDashoffset = '0'; });
      stage.classList.add('is-end', 'is-logo', 'is-full'); phase('logo');
      glow.style.opacity = '.3';
      return;
    }
    whenVisible().then(boot).then(run);
  };
  /* the lockup is measured for the quiet area behind the words, so wait for Archivo */
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve()).then(start);
})();
