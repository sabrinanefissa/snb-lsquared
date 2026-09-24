/* phone2 section 8, Trusted by: "Coming to you".
   Spec: scratchpad/mobile-plan-blind.md, section 2.8 (with Sabrina's change:
   the logos keep their own colours on today's tiles, no plain white tiles).
   Pinned for two screens. The logos come towards you one at a time from the
   middle of the wall (slow, then faster: 900ms down to 120ms between them)
   and land in a 3 column wall. One cell stays open and glows orange,
   "Room for one more." shows under the wall, and two seconds later the open
   cell becomes the "Take your place." pill with a pulsing soft #FF9900 glow.
   A tap stops the glow and goes to #demo.
   Timing: time drives it once it is in view; scrolling through the pinned
   part can only move it forward (it never runs backwards).
   Signal: receives from the section before it (reliability's light) and
   hands off to the next (figures) as {shape:'dot', rect} when the pill is
   tapped, or when the wall scrolls away without a tap (so the thread never stops here).
   Words: content.js "trusted title", "trusted by invite line",
   "trusted by card text", the logo list (window.LSQ_LOGOS), and the optional
   lines and testimonial all keep working. */
(() => {
  'use strict';
  const P2 = window.P2, sec = document.getElementById('clients');
  if (!P2 || !sec) return;
  const RM = P2.RM, T = window.LSQ || {};
  const DEF = ['ups-store', 'cold-stone-creamery', 'hatch', 'mcmaster-university', 'international-centre', 'cisco', 'best-buy-business', 'lenovo', 'sfm']
    .map((k) => ({ name: '', src: 'assets/logos/' + k + '-hq.png?v=r55' }));
  const LOGOS = (window.LSQ_LOGOS && window.LSQ_LOGOS.length) ? window.LSQ_LOGOS : (window.LSQ_LOGOLIST || DEF);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  /* ------------------------------------------------------------ DOM */
  const wrap = el('div', 'p2t'), stage = el('div', 'p2t__stage');
  const title = sec.querySelector('.clients__title') || el('h2', 't clients__title', 'Trusted by');
  title.classList.add('p2-title');
  const grid = el('div', 'p2t__grid'); grid.setAttribute('aria-hidden', 'true');
  const say = el('p', 'p2t__say lw-room__say', T['trusted by invite line'] || 'Room for one more.');
  const cardText = T['trusted by card text'] || 'Take your place.';
  const names = el('ul', 'sr-only'); names.setAttribute('aria-label', 'Clients');
  LOGOS.forEach((l) => { if (l.name) names.appendChild(el('li', '', l.name)); });
  stage.append(title, grid, say);
  const end = sec.querySelector('.sec-end'); if (end) stage.appendChild(end);
  wrap.append(stage, names);
  sec.prepend(wrap);
  /* the testimonial, when content.js turns it on, sits after the wall */
  const quote = sec.querySelector('.quote');
  if (quote && document.documentElement.classList.contains('lsq-quote')) wrap.after(quote);

  /* the open cell, and the pill it becomes; the pill is the part a keyboard and a screen reader need */
  const slot = el('div', 'p2t__slot'); slot.appendChild(el('span', 'p2t__slotpanel'));
  const glow = el('i', 'p2t__glow'); glow.setAttribute('aria-hidden', 'true');
  const card = el('a', 'p2t__card'); card.href = '#demo'; card.tabIndex = -1;
  card.appendChild(el('span', 'p2t__cardt', cardText));
  card.setAttribute('aria-label', cardText + ' Book a demo');
  stage.appendChild(card);   /* outside the hidden wall so it can be reached; placed over the open cell */

  /* ------------------------------------------------------------ the wall */
  let tiles = [], sched = [], FULL = 0, TOTAL = 0, w0 = 0;
  const appH = P2.appH;
  /* one key per real logo: two list entries with the same file are
     the same logo, so they may not sit side by side either */
  const keyOf = (l) => String(l.src || '').split(/[?#]/)[0].replace(/^.*\//, '').replace(/-hq(?=\.)/, '').toLowerCase() || (l.name || '').trim().toLowerCase();
  const KEY = LOGOS.map(keyOf);
  const deal = (rows, cols, skip) => {
    /* the full wall with repeats (Sabrina: a wall that fills completely), with
       the r76 rule: never the same logo beside, above or on the diagonal of
       itself, and every logo used as evenly as possible */
    const N = LOGOS.length, g = [], count = LOGOS.map(() => 0);
    const at0 = (r, c) => (r < 0 || c < 0 || c >= cols) ? undefined : g[r * cols + c];
    const at = (r, c) => { const v = at0(r, c); return v == null || v < 0 ? undefined : KEY[v]; };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (r === skip[0] && c === skip[1]) { g[r * cols + c] = -1; continue; }
      const row = [at(r, c - 1)], col = [at(r - 1, c)], diag = [at(r - 1, c - 1), at(r - 1, c + 1)];
      const tiers = [row.concat(col, diag), row.concat(col), row, []];
      let best = -1;
      for (const ban of tiers) {
        for (let j = 0; j < N; j++) { const q = (j + r * 4 + c * 7) % N; if (ban.includes(KEY[q])) continue; if (best < 0 || count[q] < count[best]) best = q; }
        if (best >= 0) break;
      }
      g[r * cols + c] = best; count[best]++;
    }
    return g;
  };
  const build = () => {
    w0 = innerWidth;
    grid.textContent = '';
    const W = document.documentElement.clientWidth, cols = 3, gap = 10;
    const tw = Math.min(118, Math.floor((W - 40 - gap * (cols - 1)) / cols)), th = Math.round(tw / 2.1);
    stage.style.setProperty('--tw', tw + 'px'); stage.style.setProperty('--th', th + 'px'); stage.style.setProperty('--g', gap + 'px');
    const used = title.offsetHeight + say.offsetHeight + (end ? end.offsetHeight : 0) + 4 * 28;
    let rows = Math.floor((appH() - used + gap) / (th + gap));
    rows = Math.max(3, Math.min(9, rows)); if (rows % 2 === 0) rows--;
    const mid = [(rows - 1) / 2, 1];
    const g = deal(rows, cols, mid);
    const GW = cols * tw + (cols - 1) * gap, GH = rows * th + (rows - 1) * gap;
    grid.style.width = GW + 'px'; grid.style.height = GH + 'px';
    const cx = tw + gap + tw / 2, cy = mid[0] * (th + gap) + th / 2;   /* the open cell: where every logo comes from */
    const list = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * (tw + gap), y = r * (th + gap);
      if (g[r * cols + c] < 0) {
        slot.style.left = x + 'px'; slot.style.top = y + 'px'; grid.appendChild(slot);
        glow.style.left = (x + tw / 2) + 'px'; glow.style.top = (y + th / 2) + 'px'; grid.appendChild(glow);
        continue;
      }
      const l = LOGOS[g[r * cols + c]];
      const t = el('div', 'p2t__tile'); t.style.left = x + 'px'; t.style.top = y + 'px';
      const dx = cx - (x + tw / 2), dy = cy - (y + th / 2);
      t.style.setProperty('--fx', dx.toFixed(1) + 'px'); t.style.setProperty('--fy', dy.toFixed(1) + 'px');
      const p = el('span', 'p2t__panel'), im = el('img'); im.src = l.src; im.alt = ''; im.decoding = 'async';
      p.appendChild(im); t.appendChild(p); grid.appendChild(t);
      /* nearest the open cell first, so the wall grows outwards from it */
      list.push([Math.hypot(dx * 1.25, dy), t]);
    }
    list.sort((a, b) => a[0] - b[0]);
    tiles = list.map((p) => p[1]);
    /* the schedule: the first logo waits 900ms, each gap is a fifth shorter than the last, never under 120ms */
    sched = []; let at = 0, gapT = 900;
    tiles.forEach((t, k) => {
      const dur = Math.max(420, 760 - k * 22);
      sched.push([at, dur]); at += gapT; gapT = Math.max(120, gapT * .8);
    });
    const last = sched[sched.length - 1] || [0, 0];
    FULL = last[0] + last[1]; TOTAL = FULL + 2000;
    /* the pill sits exactly over the open cell */
    const place = () => {
      const s = stage.getBoundingClientRect(), r = slot.getBoundingClientRect();
      card.style.left = (r.left - s.left) + 'px'; card.style.top = (r.top - s.top) + 'px';
    };
    place(); requestAnimationFrame(place);
    if (stateDone >= 2 || RM) finish();
    else for (let k = 0; k < launched; k++) land(k, true);
  };

  /* ------------------------------------------------------------ the sequence */
  let launched = 0, stateDone = 0, clock = 0, running = false, raf = 0, prev = 0, visible = false, pinP = 0, got = null;
  const land = (k, instant) => {
    const t = tiles[k]; if (!t) return;
    if (instant) t.style.transition = 'none';
    else t.style.transitionDuration = sched[k][1] + 'ms';
    t.classList.add('is-in');
  };
  const full = () => {
    if (stateDone >= 1) return; stateDone = 1;
    sec.classList.add('is-full');
    if (got && !RM) {
      /* the signal from the section before arrives in the open cell */
      const r = slot.getBoundingClientRect(), s = stage.getBoundingClientRect();
      P2.signal.fly({ left: s.left + s.width / 2 - 1, top: s.top - 2, width: 2, height: 2 }, r, { shape: 'dot', dur: 520, toOpacity: .0 });
    }
  };
  const cardOn = () => {
    if (stateDone >= 2) return; stateDone = 2;
    sec.classList.add('is-full', 'is-card'); card.tabIndex = 0;
    if (pinP >= 1) handOn();
  };
  const finish = () => {
    tiles.forEach((t, k) => land(k, true)); launched = tiles.length;
    full(); cardOn(); stop();
  };
  const step = (now) => {
    raf = 0;
    const dt = Math.min(100, now - prev); prev = now;
    if (visible) clock += dt;
    const c = Math.max(clock, pinP * TOTAL / .85);   /* scrolling can move it forward, never back */
    if (c > clock) clock = c;
    while (launched < tiles.length && sched[launched][0] <= clock) land(launched++, false);
    if (clock >= FULL) full();
    if (clock >= TOTAL) { cardOn(); stop(); return; }
    if (visible) raf = requestAnimationFrame(step);
  };
  const go = () => { if (running || stateDone >= 2) return; running = true; prev = performance.now(); if (!raf) raf = requestAnimationFrame(step); };
  const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };

  /* the signal goes on once: from the pill when it is tapped, or from the
     wall when it scrolls away untapped */
  let handed = false;
  const handOn = () => {
    if (handed) return; handed = true;
    const r = card.getBoundingClientRect();
    P2.signal.handoff('trusted', { shape: 'dot', rect: { left: r.left, top: r.top, width: r.width, height: r.height } });
  };
  card.addEventListener('click', () => {
    sec.classList.add('is-seen');   /* the glow stops once the pill is tapped */
    handOn();
  });

  P2.signal.station('trusted', { receive(state) { got = state || {}; } });

  const start = () => {
    build();
    if (RM) { finish(); return; }
    sec.classList.add('is-armed');
    let started = false;
    const pg = P2.progress(wrap, (p) => {
      pinP = p;
      if (p >= 1 && stateDone >= 2) handOn();
      if (started && p > 0 && !raf && stateDone < 2) { running = false; go(); }
    });
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio >= .5) started = true;
      visible = e.isIntersecting && started;
      if (visible) { running = false; go(); }
    }, { threshold: [0, .5] }).observe(stage);
    /* someone who lands below the wall (a link, a restored scroll) sees it finished */
    if (wrap.getBoundingClientRect().bottom < 0) finish();
    pg.force();
  };
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(innerWidth - w0) > 40) build(); }, 200); }, { passive: true });
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve()).then(start);
})();
