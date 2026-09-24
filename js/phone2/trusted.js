/* phone2 section 8, Trusted by (r94: three whole columns, an odd number of
   rows from under the title to the bottom, the open cell in the true middle).
   One phone screen, filled edge to edge and top to bottom with the logo
   wall (tiles bleed past every edge, like the PC wall). The title sits in
   the wall, in one wide dark screen, centred.
   The fill (r102): the logos switch on in a random order, out of sequence,
   exactly as on the laptop (slow, then faster: 700ms down to 100ms between
   them), each one coming towards you from small and far. The first logo
   lands as soon as the wall is 60% on screen, so the section never reads
   as a black loading screen. The ending is the box (the r69 laptop idea,
   Sabrina's choice for the phone; the laptop keeps its r75 shade): the
   middle cell stays open while the wall fills; when it is full the two
   tiles beside it go dark and one wide dark screen across the whole row
   holds "Room for one more."; it holds and fades, then the screen shrinks
   onto the middle cell and the "Take your place." card appears there with
   its pulsing soft #FF9900 glow, which stops on tap; the tap goes to #demo.
   The ending uses the r69 classes (lw-room, lw-room__say, lw-card, lw-glow
   in sections.css), restored for the phone in css/phone2-trusted.css.
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

  /* the ending (r102, the r69 box): the wide dark screen with the line in
     it, which shrinks to the open cell and becomes the card, and the glow */
  const say = el('p', 'lw-room__say', T['trusted by invite line'] || 'Room for one more.');
  const room = el('div', 'lw-room');
  const card = el('a', 'lw-card'); card.href = '#demo'; card.tabIndex = -1;
  const cardT = el('span', 'lw-card__t', T['trusted by card text'] || 'Take your place.');
  card.appendChild(cardT); card.setAttribute('aria-label', cardT.textContent + ' Book a demo');
  card.addEventListener('click', () => sec.classList.add('is-seen'));   /* the glow pulses until the card is tapped */
  room.append(say, card);
  const glow = el('i', 'lw-glow'); glow.setAttribute('aria-hidden', 'true');

  stage.append(grid, band);
  if (band2) stage.appendChild(band2);
  stage.append(room);
  wrap.append(stage, names);
  sec.prepend(wrap);
  /* the testimonial, when content.js turns it on, sits after the wall */
  const quote = sec.querySelector('.quote');
  if (quote && document.documentElement.classList.contains('lsq-quote')) wrap.after(quote);

  /* ------------------------------------------------------------ the wall */
  let tiles = [], sides = [], sched = [], FULL = 0, SAY = 0, GONE = 0, CARD = 0, w0 = 0, h0 = 0;
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
    /* r94: three whole columns inside the phone with small even gutters (no
       logo cut at the edges); the title plain on black at the top; an odd
       number of rows fills the rest of the screen to the very bottom, so the
       open cell sits in the middle column of the true middle row */
    const W = stage.clientWidth, H = stage.clientHeight, gap = 10, cols = 3, K = 1;
    h0 = H;
    const tw = Math.floor((W - gap * (cols + 1)) / cols), side = (W - cols * tw - (cols - 1) * gap) / 2;
    const top = Math.round(gap * 2);
    band.style.left = '0px'; band.style.width = W + 'px'; band.style.height = ''; band.style.top = top + 'px';
    const y0 = top + band.offsetHeight + top;   /* the same room above and below the title */
    let yEnd = H - side;                          /* the last row ends one gutter from the bottom, as at the sides */
    if (band2) {
      band2.style.left = '0px'; band2.style.width = W + 'px'; band2.style.height = '';
      const h2 = band2.offsetHeight;
      band2.style.top = (H - top - h2) + 'px';
      yEnd = H - top - h2 - top;
    }
    const A = yEnd - y0, th0 = tw / 1.9;
    let n = Math.max(1, Math.round((A + gap) / (th0 + gap)));
    if (n % 2 === 0) {
      const thOf = (k) => (A - (k - 1) * gap) / k;
      n = Math.abs(thOf(n - 1) - th0) <= Math.abs(thOf(n + 1) - th0) ? n - 1 : n + 1;
    }
    const th = Math.floor((A - (n - 1) * gap) / n), rows = n, M = (n - 1) / 2;
    const gy = rows > 1 ? (A - rows * th) / (rows - 1) : 0;   /* even gaps, the rounding spread over them */
    stage.style.setProperty('--tw', tw + 'px'); stage.style.setProperty('--th', th + 'px'); stage.style.setProperty('--g', gap + 'px');
    const X = (c) => side + c * (tw + gap), Y = (r) => y0 + r * (th + gy);
    const skip = (r, c) => r === M && c === K;
    const g = deal(rows, cols, skip);
    const cx = X(K) + tw / 2, cy = Y(M) + th / 2;   /* the open cell */
    const list = []; sides = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = X(c), y = Y(r);
      if (g[r * cols + c] < 0 || x + tw <= 0 || x >= W || y + th <= 0 || y >= H) continue;
      const l = LOGOS[g[r * cols + c]];
      const t = el('div', 'p2t__tile'); t.style.left = x + 'px'; t.style.top = y + 'px';
      const p = el('span', 'p2t__panel'), im = el('img'); im.src = l.src; im.alt = ''; im.decoding = 'async';
      p.appendChild(im); t.appendChild(p); grid.appendChild(t);
      list.push(t);
      if (r === M) sides.push(t);   /* the two tiles beside the open cell: they go dark under the wide screen */
    }
    tiles = shuffle(list);
    /* the open cell: the wide screen is centred on it (three tiles wide, then one), and the glow */
    room.style.left = cx + 'px'; room.style.top = (cy - th / 2) + 'px';
    glow.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;width:' + (tw * 1.85) + 'px;height:' + (th * 2.5) + 'px';
    grid.appendChild(glow);
    /* the schedule (r96): the first logo lands at once, then 700ms, each gap
       22% shorter than the last, never under 100ms (a little shorter than r95) */
    sched = []; let at = 0, gapT = 700;
    tiles.forEach((t, k) => {
      const dur = Math.max(380, 620 - k * 16);
      sched.push([at, dur]); at += gapT; gapT = Math.max(100, gapT * .78);
    });
    const last = sched[sched.length - 1] || [0, 0];
    /* r69 timing: the wide screen and its line come in 250ms after the wall
       is full, the line holds and fades, then the screen shrinks onto the
       open cell and the card appears in it */
    FULL = last[0] + last[1]; SAY = FULL + 250; GONE = SAY + 900 + 1100; CARD = GONE + 500;
    if (stage_ >= 3 || RM) finish();
    else for (let k = 0; k < launched; k++) land(k, true);
  };

  /* the order (r102): random, out of sequence, as on the laptop */
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

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
    room.style.transition = 'none'; card.style.transition = 'none';
    sides.forEach((t) => t.classList.remove('is-off'));
    sec.classList.remove('is-say'); sec.classList.add('is-full', 'is-room', 'is-card'); card.tabIndex = 0;
    stage_ = 3; stop();
  };
  const step = (now) => {
    raf = 0;
    const dt = Math.min(100, now - prev); prev = now;
    if (!visible) return;
    clock += dt;
    while (launched < tiles.length && sched[launched][0] <= clock) land(launched++, false);
    if (stage_ < 1 && clock >= FULL) { stage_ = 1; sec.classList.add('is-full'); }
    if (stage_ < 2 && clock >= SAY) {   /* the two tiles beside the open cell go dark, the wide screen and Room for one more. come in */
      stage_ = 2; sides.forEach((t) => t.classList.add('is-off')); sec.classList.add('is-room', 'is-say');
    }
    if (stage_ === 2 && clock >= GONE) { stage_ = 2.5; sec.classList.remove('is-say'); }     /* ...the line fades */
    if (clock >= CARD) {   /* the screen shrinks onto the open cell and becomes the card; the side tiles light again behind it */
      stage_ = 3; sec.classList.add('is-card'); card.tabIndex = 0;
      setTimeout(() => sides.forEach((t) => t.classList.remove('is-off')), 500);
      return;
    }
    raf = requestAnimationFrame(step);
  };
  const go = () => { if (raf || stage_ >= 3 || !visible) return; prev = performance.now(); raf = requestAnimationFrame(step); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };

  const start = () => {
    build();
    if (RM) { finish(); return; }
    sec.classList.add('is-armed');
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio >= .6) started = true;
      visible = e.isIntersecting && started;
      if (visible) go(); else stop();
    }, { threshold: [0, .3, .6, .9] }).observe(stage);
    /* someone who lands below the wall (a link, a restored scroll) sees it finished */
    if (wrap.getBoundingClientRect().bottom < 0) finish();
  };
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(innerWidth - w0) > 40 || Math.abs(stage.clientHeight - h0) > 2) build(); }, 200); }, { passive: true });
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve()).then(start);
})();
