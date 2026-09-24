/* phone2 section 8, Trusted by (r92).
   One phone screen, filled edge to edge and top to bottom with the logo
   wall (tiles bleed past every edge, like the PC wall). The title sits in
   the wall, in one wide dark screen, centred.
   The fill is the r77 one: the logos come towards you one at a time from
   the open middle cell (slow, then faster: 900ms down to 120ms between
   them). The ending is the old one (page.js 6b, r75): the middle cell stays
   open while the wall fills, a soft shade brings "Room for one more." in
   over the logos, it holds and fades, then the "Take your place." card
   fades into the open cell with its pulsing soft #FF9900 glow, which stops
   on tap; the tap goes to #demo. The ending uses the r76 classes and styles
   (lw-say, lw-room, lw-card, lw-glow in sections.css), so it looks as before.
   Time drives it once the wall is half in view, and only while on screen.
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
  /* the title's screen: one wide dark screen in the wall */
  const band = el('div', 'p2t__band'); band.appendChild(title);
  const end = sec.querySelector('.sec-end');
  const band2 = end ? el('div', 'p2t__band p2t__band--end') : null;
  if (band2) band2.appendChild(end);
  const names = el('ul', 'sr-only'); names.setAttribute('aria-label', 'Clients');
  LOGOS.forEach((l) => { if (l.name) names.appendChild(el('li', '', l.name)); });

  /* the old ending (r75): the shade with the line, the card in the open cell, the glow */
  const shade = el('div', 'lw-say');
  const say = el('p', 'lw-room__say', T['trusted by invite line'] || 'Room for one more.');
  shade.appendChild(say);
  const room = el('div', 'lw-room');
  const card = el('a', 'lw-card'); card.href = '#demo'; card.tabIndex = -1;
  const cardT = el('span', 'lw-card__t', T['trusted by card text'] || 'Take your place.');
  card.appendChild(cardT); card.setAttribute('aria-label', cardT.textContent + ' Book a demo');
  card.addEventListener('click', () => sec.classList.add('is-seen'));   /* the glow pulses until the card is tapped */
  room.appendChild(card);
  const glow = el('i', 'lw-glow'); glow.setAttribute('aria-hidden', 'true');

  stage.append(grid, band);
  if (band2) stage.appendChild(band2);
  stage.append(room, shade);
  wrap.append(stage, names);
  sec.prepend(wrap);
  /* the testimonial, when content.js turns it on, sits after the wall */
  const quote = sec.querySelector('.quote');
  if (quote && document.documentElement.classList.contains('lsq-quote')) wrap.after(quote);

  /* ------------------------------------------------------------ the wall */
  let tiles = [], sched = [], FULL = 0, SAY = 0, GONE = 0, CARD = 0, w0 = 0;
  /* one key per real logo: two list entries with the same file are
     the same logo, so they may not sit side by side either */
  const keyOf = (l) => String(l.src || '').split(/[?#]/)[0].replace(/^.*\//, '').replace(/-hq(?=\.)/, '').toLowerCase() || (l.name || '').trim().toLowerCase();
  const KEY = LOGOS.map(keyOf);
  /* the full wall with repeats, with the r76 rule: never the same logo
     beside, above or on the diagonal of itself, every logo used as evenly
     as possible. skip(r, c) marks the open cell and the title's screen. */
  const deal = (rows, cols, skip) => {
    const N = LOGOS.length, g = [], count = LOGOS.map(() => 0);
    const at = (r, c) => { if (r < 0 || c < 0 || c >= cols) return undefined; const v = g[r * cols + c]; return v == null || v < 0 ? undefined : KEY[v]; };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (skip(r, c)) { g[r * cols + c] = -1; continue; }
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
    const W = stage.clientWidth, H = P2.appH(), gap = 10;
    /* tiles sized so the middle column is whole and the two beside it run past the edges */
    const tw = Math.round(W * .36), th = Math.round(tw / 2.1), pw = tw + gap, ph = th + gap;
    stage.style.setProperty('--tw', tw + 'px'); stage.style.setProperty('--th', th + 'px'); stage.style.setProperty('--g', gap + 'px');
    const K = Math.ceil((W / 2 + tw / 2) / pw), M = Math.ceil((H / 2 + th / 2) / ph);   /* columns and rows each side of the middle */
    const cols = K * 2 + 1, rows = M * 2 + 1;
    const X = (c) => W / 2 + (c - K) * pw - tw / 2, Y = (r) => H / 2 + (r - M) * ph - th / 2;
    /* the title's screen: three rows above the open cell (more room if the title
       has a line under it), clear of the shade that later holds the line */
    [band, band2].forEach((b) => { if (b) { b.style.left = X(0) + 'px'; b.style.width = (X(cols - 1) + tw - X(0)) + 'px'; b.style.height = ''; } });
    const need = title.offsetHeight + 16, span = need > th ? 2 : 1;
    /* r93: the title sits at the top on the black ground, above the wall, as on PC */
    const bRows = [];
    let r0 = 0; while (Y(r0) < 0) r0++;   /* first row that is fully on screen */
    for (let k = 0; k < span; k++) bRows.push(r0 + k);
    const endRows = [];
    if (band2) { const need2 = band2.firstChild.offsetHeight + 16, s2 = need2 > th ? 2 : 1; for (let k = 0; k < s2; k++) endRows.push(M + 3 + k); }
    const place = (b, rs) => {
      const x0 = X(0), x1 = X(cols - 1) + tw;
      b.style.left = x0 + 'px'; b.style.width = (x1 - x0) + 'px';
      b.style.top = Y(rs[0]) + 'px'; b.style.height = (rs.length * ph - gap) + 'px';
    };
    place(band, bRows);
    if (band2) place(band2, endRows);
    const skip = (r, c) => (r === M && c === K) || r < bRows[0] || bRows.includes(r) || endRows.includes(r);   /* r93: nothing above the title */
    const g = deal(rows, cols, skip);
    const cx = W / 2, cy = H / 2;   /* the open cell: where every logo comes from */
    const list = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = X(c), y = Y(r);
      if (g[r * cols + c] < 0 || x + tw <= 0 || x >= W || y + th <= 0 || y >= H) continue;
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
    /* the open cell's card, the shade and the glow, as r75 placed them */
    room.style.left = cx + 'px'; room.style.top = (cy - th / 2) + 'px';
    shade.style.left = cx + 'px'; shade.style.top = cy + 'px';
    shade.style.width = (tw * 5) + 'px'; shade.style.height = (th * 3.4) + 'px';
    glow.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;width:' + (tw * 1.85) + 'px;height:' + (th * 2.5) + 'px';
    grid.appendChild(glow);
    /* the schedule: the first logo waits 900ms, each gap is a fifth shorter than the last, never under 120ms */
    sched = []; let at = 0, gapT = 900;
    tiles.forEach((t, k) => {
      const dur = Math.max(420, 760 - k * 22);
      sched.push([at, dur]); at += gapT; gapT = Math.max(120, gapT * .8);
    });
    const last = sched[sched.length - 1] || [0, 0];
    /* r75 timing: the line comes in 250ms after the wall is full, holds, fades,
       and the card fades into the open cell */
    FULL = last[0] + last[1]; SAY = FULL + 250; GONE = SAY + 900 + 700; CARD = GONE + 350;
    if (stage_ >= 3 || RM) finish();
    else for (let k = 0; k < launched; k++) land(k, true);
  };

  /* ------------------------------------------------------------ the sequence */
  let launched = 0, stage_ = 0, clock = 0, raf = 0, prev = 0, visible = false, started = false;
  const land = (k, instant) => {
    const t = tiles[k]; if (!t) return;
    if (instant) t.style.transition = 'none';
    else t.style.transitionDuration = sched[k][1] + 'ms';
    t.classList.add('is-in');
  };
  const finish = () => {
    tiles.forEach((t, k) => land(k, true)); launched = tiles.length;
    shade.style.transition = 'none'; card.style.transition = 'none';
    sec.classList.remove('is-say'); sec.classList.add('is-full', 'is-card'); card.tabIndex = 0;
    stage_ = 3; stop();
  };
  const step = (now) => {
    raf = 0;
    const dt = Math.min(100, now - prev); prev = now;
    if (!visible) return;
    clock += dt;
    while (launched < tiles.length && sched[launched][0] <= clock) land(launched++, false);
    if (stage_ < 1 && clock >= FULL) { stage_ = 1; sec.classList.add('is-full'); }
    if (stage_ < 2 && clock >= SAY) { stage_ = 2; sec.classList.add('is-say'); }             /* Room for one more. */
    if (stage_ === 2 && clock >= GONE) { stage_ = 2.5; sec.classList.remove('is-say'); }     /* ...fades slowly */
    if (clock >= CARD) { stage_ = 3; sec.classList.add('is-card'); card.tabIndex = 0; return; }   /* the card fades into the open cell */
    raf = requestAnimationFrame(step);
  };
  const go = () => { if (raf || stage_ >= 3 || !visible) return; prev = performance.now(); raf = requestAnimationFrame(step); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };

  const start = () => {
    build();
    if (RM) { finish(); return; }
    sec.classList.add('is-armed');
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio >= .5) started = true;
      visible = e.isIntersecting && started;
      if (visible) go(); else stop();
    }, { threshold: [0, .5] }).observe(stage);
    /* someone who lands below the wall (a link, a restored scroll) sees it finished */
    if (wrap.getBoundingClientRect().bottom < 0) finish();
  };
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(innerWidth - w0) > 40) build(); }, 200); }, { passive: true });
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve()).then(start);
})();
