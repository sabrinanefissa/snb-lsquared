/* phone2 2.7 Reliability: "Everyone notices a dark screen" (r92, back to the
   OLD layout, new automatic behaviour).
   Sabrina 24 Sept: go back to the old layout (title lockup over a 4:5
   off/on photo pair) but make the reveal an AUTOMATIC loop, not a drag. The
   divider is the whole line pixelated (like the CEO quote's orange line
   breaking into pixels, css/phone2-ceo.css, but here the entire divider is
   pixelated, not just falling dust) and it sweeps across on its own,
   pauses 1.5s on the fully-on photo, then the pair changes and it repeats.
   With Retail only today, it resets and replays the same pair; more pairs
   (window.LSQ_RELY_PAIRS, fed by content.js) join the cycle automatically.
   Swipe left/right on the photo goes to the next/previous pair; no
   drag-to-reveal. Dots stay under the frame, one per industry, matching
   fix 11 from r89 (Retail always on, others light up once ready). */
(() => {
  'use strict';
  const P2 = window.P2;
  const sec = document.getElementById('reliability');
  if (!P2 || !sec) return;
  const RM = P2.RM;
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

  const srcOf = (o) => {
    if (!o) return '';
    const dp = o.getAttribute('data-phone');
    if (dp) return dp;
    const m = /url\(["']?([^"')]+)/.exec(o.style.backgroundImage || '');
    return m ? m[1] : '';
  };
  const offEl = sec.querySelector('#rely-off'), onEl = sec.querySelector('#rely-on');
  if (!offEl || !onEl) return;
  const pairs = [{ name: 'Retail', off: srcOf(offEl), on: srcOf(onEl) }];
  (window.LSQ_RELY_PAIRS || []).forEach((x) => pairs.push({ name: x.name, off: x.off, on: x.on }));
  const SLOTS = ['Restaurants', 'Retail', 'Enterprise', 'Manufacturing'];
  const pairIndexOf = (name) => pairs.findIndex((pr) => pr.name === name);

  /* ---------------------------------------------------------------- dom
     Old-layout lockup: title over a 4:5 frame, no handle/grip, a pixel
     divider bar in its place. */
  const oldH = sec.querySelector('.rely__h'), oldSub = sec.querySelector('.rely__sub');
  const wrap = el('div', 'p2r');
  const title = el('h2', 'p2r__title');
  /* r94: fit the title on exactly 2 lines on the phone ("Everyone notices" /
     "a dark screen."), a phone-only line break; content.js and the PC copy
     are untouched. If the copy is ever edited away from that sentence, this
     falls back to the natural wrap. */
  const titleText = (oldH && oldH.textContent.trim()) || 'Everyone notices a dark screen.';
  const BREAK = /\s+(a dark screen\.?)\s*$/i;
  const m = BREAK.exec(titleText);
  if (m) {
    title.appendChild(document.createTextNode(titleText.slice(0, m.index).trim()));
    title.appendChild(el('br'));
    title.appendChild(document.createTextNode(titleText.slice(m.index).trim()));
  } else {
    title.appendChild(document.createTextNode(titleText));
  }
  const sub = el('p', 'p2r__sub'); sub.textContent = (oldSub && oldSub.textContent.trim()) || 'Yours stay on.';

  const frame = el('div', 'p2r__frame');
  const off = el('img', 'p2r__ph p2r__ph--off'); off.alt = ''; off.decoding = 'async';
  const on = el('img', 'p2r__ph p2r__ph--on'); on.alt = ''; on.decoding = 'async';
  const bar = el('canvas', 'p2r__bar'); bar.setAttribute('aria-hidden', 'true');
  frame.append(off, on, bar);

  const live = el('p', 'p2r__live'); live.className = 'sr-only'; live.setAttribute('aria-live', 'polite');
  const dots = el('div', 'p2r__dots'); dots.setAttribute('role', 'tablist'); dots.setAttribute('aria-label', 'Industry');
  const dotBtns = SLOTS.map((name) => {
    const ready = pairIndexOf(name) > -1;
    const b = el('button', 'p2r__dot' + (ready ? '' : ' is-soon'));
    b.type = 'button'; b.setAttribute('aria-label', ready ? name : name + ', coming soon');
    if (ready) b.addEventListener('click', () => manualGoto(pairIndexOf(name)));
    else { b.disabled = true; b.setAttribute('aria-disabled', 'true'); b.tabIndex = -1; }
    dots.appendChild(b);
    return b;
  });

  wrap.append(title, sub, frame, live, dots);
  sec.prepend(wrap);
  P2.sec('reliability');

  /* ---------------------------------------------------------------- pixel divider
     A full-height bar made of small squares, randomised every frame for a
     pixelated look (same idea as the CEO line's falling pixels, but here
     the whole bar is pixels, sweeping instead of falling). */
  let W = 0, H = 0, D = 1;
  const ctx = bar.getContext('2d');
  const CELL = 6, BAR_W = 34;
  const buildCanvas = () => {
    const r = frame.getBoundingClientRect();
    W = r.width; H = r.height;
    D = Math.min(2, window.devicePixelRatio || 1);
    bar.width = Math.round(BAR_W * D); bar.height = Math.round(H * D);
    bar.style.height = H + 'px';
  };
  const drawBar = (fade) => {
    if (!H) return;
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.clearRect(0, 0, BAR_W, H);
    const rows = Math.ceil(H / CELL), cols = Math.ceil(BAR_W / CELL);
    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        if (Math.random() < .16) continue;   /* pixelated gaps */
        const a = (.55 + Math.random() * .45) * (fade == null ? 1 : fade);
        ctx.globalAlpha = a;
        ctx.fillStyle = '#FF9900';
        ctx.fillRect(rx * CELL, ry * CELL, CELL - 1, CELL - 1);
      }
    }
    ctx.globalAlpha = 1;
  };

  /* ---------------------------------------------------------------- state */
  let idx = 0, phase = 'idle', raf = 0, holdT = 0, visible = false;
  let signalSent = false;

  const setSweep = (pct) => {
    frame.style.setProperty('--p', pct.toFixed(2) + '%');
    bar.style.left = 'calc(' + pct.toFixed(2) + '% - ' + (BAR_W / 2) + 'px)';
    bar.style.opacity = (pct > 0 && pct < 100) ? '1' : '0';
  };

  const handoffOnce = () => {
    if (signalSent) return;
    signalSent = true;
    const r = frame.getBoundingClientRect();
    P2.signal.handoff('reliability', { shape: 'light', rect: { left: r.left, top: r.top, width: r.width, height: r.height } });
  };

  const load = (i) => {
    idx = i; off.src = pairs[i].off; on.src = pairs[i].on;
    live.textContent = pairs[i].name + ': dead screens turning on.';
    dotBtns.forEach((b, k) => b.classList.toggle('is-on', SLOTS[k] === pairs[i].name));
  };

  /* r94: the screens stay OFF a few seconds before the sweep starts, and
     that dark hold lasts exactly as long as the fully-lit hold at the end,
     so the loop reads even (dark ... sweep ... lit ... dark ...). */
  const SWEEP_MS = 1100, HOLD_MS = 3000, OFF_HOLD_MS = 3000;
  const sweep = (t0) => {
    if (!visible) return;
    const now = performance.now();
    const k = P2.clamp((now - t0) / SWEEP_MS, 0, 1);
    const eased = 1 - Math.pow(1 - k, 2);
    setSweep(eased * 100);
    drawBar();
    if (k >= 1) {
      handoffOnce();
      phase = 'hold';
      holdT = setTimeout(next, HOLD_MS);
      return;
    }
    raf = requestAnimationFrame(() => sweep(t0));
  };

  const startSweep = () => {
    cancelAnimationFrame(raf); clearTimeout(holdT);
    if (RM) { setSweep(100); drawBar(1); phase = 'hold-rm'; handoffOnce(); return; }
    phase = 'sweep';
    setSweep(0);
    raf = requestAnimationFrame(() => sweep(performance.now()));
  };

  /* dark hold: the frame sits fully off (bar hidden), then the sweep begins */
  const beginOffHold = () => {
    cancelAnimationFrame(raf); clearTimeout(holdT);
    setSweep(0); drawBar(0);
    if (RM) { startSweep(); return; }
    phase = 'off-hold';
    holdT = setTimeout(startSweep, OFF_HOLD_MS);
  };

  const next = () => {
    if (!visible) return;
    load((idx + 1) % pairs.length);
    beginOffHold();
  };

  function manualGoto(i) {
    if (!pairs[i] || i === idx) return;
    cancelAnimationFrame(raf); clearTimeout(holdT);
    load(i);
    startSweep();
  }

  /* ---------------------------------------------------------------- swipe */
  let sx = 0, sy = 0, tracking = false;
  frame.addEventListener('pointerdown', (e) => { tracking = true; sx = e.clientX; sy = e.clientY; });
  frame.addEventListener('pointerup', (e) => {
    if (!tracking) return; tracking = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 32 && Math.abs(dx) > Math.abs(dy)) {
      const dir = dx < 0 ? 1 : -1;
      manualGoto((idx + dir + pairs.length) % pairs.length);
    }
  });
  frame.addEventListener('pointercancel', () => { tracking = false; });

  /* ---------------------------------------------------------------- go */
  load(0);
  buildCanvas();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { buildCanvas(); if (phase === 'sweep') drawBar(); }, 200); }, { passive: true });

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting && !document.hidden;
    if (visible && phase === 'idle') { buildCanvas(); beginOffHold(); }
    else if (visible && phase !== 'sweep') { startSweep(); }
    else if (!visible) { cancelAnimationFrame(raf); clearTimeout(holdT); phase = 'idle'; }
  }, { threshold: .5 }).observe(sec);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); clearTimeout(holdT); } });

  /* -------------------------------------------------------------- signal */
  P2.signal.station('reliability', { receive() { /* decoration only */ } });
})();
