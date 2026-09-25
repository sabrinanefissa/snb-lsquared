/* In their words (r104): the critics' quotes of a film trailer, for what
   customers say. Sabrina's vision, in order:
   1. One review alone, whole, dead centre. Its name and role fade in slowly
      beneath. It holds, it fades.
   2. They gather. The next arrives; before it leaves another lands
      elsewhere, so two are on screen, then three, then four, straight and
      apart, at different places and sizes; while some leave, more arrive,
      faster and faster. Once it is busy they start to tilt, and they keep
      coming, dozens of them, larger, overlapping, until the whole screen
      is words and barely any black shows through. The highlighted word
      alternates blue, orange, blue, orange.
   3. The ending, one continuous motion: the wall softens and pulls back,
      as if a camera stepped away from a screen; black gutters open through
      it and cut it into the three by three grid of the L Squared mark, the
      L squares wash blue, the others grey, the centre one goes dark (the
      open screen), and it settles as the mark. Then the hero's own ending:
      a line beneath the mark ("Every voice. Every screen."), it leaves, and
      the mark becomes the full L Squared logo, the wordmark sliding out of
      it exactly as in the hero. Beneath the logo, one by one on the black:
      the invitation, its small line, the Leave a review button (the G2
      page). The wall is white, blue and grey (the logo's colours) so the
      squares really are the reviews, not a repaint. No orange.
   A tap or click during the play skips to the end. It plays once, only
   while on screen (IntersectionObserver), on timers; every move is
   transform or opacity. Leaving and coming back resumes. Reduced motion
   shows the end at once.
   Words from content.js (window.LSQ_REVIEWS via js/edit.js): *word* is
   blue, | is a new line; "reviews seconds each" is the first review's
   hold; "reviews invite", "reviews invite line", "reviews button",
   "reviews link" are the ending. */
(() => {
  'use strict';
  const sec = document.getElementById('reviews'), stage = document.getElementById('rv');
  if (!sec || !stage) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = window.LSQ || {};
  const DEF = [
    { words: 'Above and *beyond*.', name: 'Luis Javier D.', role: 'Owner' },
    { words: 'A single source|of *truth*.', name: 'Ritesh S.', role: 'Senior Project Manager' },
    { words: '*Incredibly* stable.', name: 'Kushal J.', role: 'Senior QA Engineer' },
    { words: 'Live. On-brand.|*Exactly* when they should be.', name: 'Retail marketing team', role: 'L Squared customer' },
    { words: '*Effortlessly*|customizable.', name: 'Sanskruti D.', role: 'Marketing Executive' },
    { words: 'Simple. Human.|*Amazing* support.', name: 'Roshni G.', role: 'Associate Admin Executive' },
    { words: 'No more|*printed* notices.', name: 'Office operations team', role: 'L Squared customer' },
    { words: '*Genuinely*|amazing.', name: 'Kushal J.', role: 'Senior QA Engineer' },
    { words: 'An extension|of *our own* team.', name: 'Samyak J.', role: 'Backend Developer' }
  ];
  const LIST = (window.LSQ_REVIEWS && window.LSQ_REVIEWS.length) ? window.LSQ_REVIEWS : DEF;
  const N = LIST.length;
  const secs = parseFloat(T['reviews seconds each']);
  const SOLO_HOLD = (isFinite(secs) && secs > 0 ? secs : .3) * 1000;
  const ASK = T['reviews invite'] || "If we've earned it,|we'd love to hear it.";
  const ASK_LINE = T['reviews invite line'] || 'Two minutes to leave a review.';
  const BTN = T['reviews button'] || 'Leave a review';
  const LINK = T['reviews link'] || 'https://www.g2.com/products/l-squared/reviews';
  const PRE = T['reviews line before logo'] || 'Every voice.|Every screen.';
  const logoSrc = ((document.querySelector('#hero .hlogo img, #h_logo img') || {}).getAttribute || (() => null)).call(document.querySelector('#hero .hlogo img, #h_logo img'), 'src') || 'assets/lsquared-logo.png';
  const phone = matchMedia('(max-width:760px)').matches;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };

  /* ------------------------------------------------------------ the words
     "Above and *beyond*." > words, some blue (*our own* spans two), | breaks */
  const fillQ = (q, s, quoted) => {
    let em = false;
    if (quoted) q.appendChild(document.createTextNode('\u201C'));
    const segs = s.split('|');
    segs.forEach((seg, n) => {
      if (n) q.appendChild(el('br'));
      const words = seg.split(/\s+/).filter(Boolean);
      words.forEach((w, k) => {
        /* *word* or *word*. or *two words*: the star may sit before the punctuation */
        const open = w.startsWith('*'), close = /\*[^*\w]*$/.test(w) && !(open && w.length === 1);
        const word = w.replace(/\*/g, '');
        if (open) em = true;
        if (word) q.appendChild(em ? el('em', '', word) : document.createTextNode(word));
        if (close) em = false;
        if (k < words.length - 1) q.appendChild(document.createTextNode(' '));
      });
    });
    if (quoted) q.appendChild(document.createTextNode('\u201D'));
  };
  const plain = (s) => s.replace(/[*|]/g, ' ').replace(/\s+/g, ' ').trim();
  const card = (r, solo, k) => {
    const c = el('div', 'rv__card' + (solo ? ' is-solo' : '')), q = el('p', 'rv__q');
    fillQ(q, r.words, true); c.appendChild(q);
    if (r.name || r.role) {
      const by = el('div', 'rv__by');
      if (r.name) by.appendChild(el('span', 'rv__name', r.name));
      if (r.role) by.appendChild(el('span', 'rv__role', r.role));
      c.appendChild(by);
    }
    c.setAttribute('aria-hidden', 'true');
    return c;
  };

  /* ------------------------------------------------------------ DOM */
  const sr = el('p', 'sr-only');
  sr.textContent = 'What our customers say. ' + LIST.map((r) => plain(r.words) + ' ' + [r.name, r.role].filter(Boolean).join(', ') + '.').join(' ') + ' ' + plain(PRE) + ' L Squared. ' + plain(ASK) + ' ' + ASK_LINE;
  sec.insertBefore(sr, stage);
  stage.setAttribute('aria-hidden', 'true');
  const wall = el('div', 'rv__wall'); stage.appendChild(wall);
  /* the mark: the square the wall becomes. Nine cells, the L in blue, the
     rest grey, the centre dark; a frame blacks out everything outside it */
  const mark = el('div', 'rv__mark'), frame = el('div', 'rv__frame');
  const L = [[0, 0], [1, 0], [2, 0], [2, 1]];   /* row, col of the blue squares */
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const cell = el('i', 'rv__cell' + (L.some((p) => p[0] === r && p[1] === c) ? ' is-blue' : (r === 1 && c === 1) ? ' is-open' : ' is-grey'));
    cell.style.left = (c * 34.5) + '%'; cell.style.top = (r * 34.5) + '%';
    mark.appendChild(cell);
  }
  wall.append(frame, mark);
  /* the line before the logo, and the logo itself (the hero's reveal: the
     mark first, then the wordmark slides out of it) */
  const pre = el('div', 'rv__pre'), preMark = el('span', 'rv__pre-mark'), preImg = el('img'), preQ = el('p', 'rv__q');
  preImg.src = logoSrc; preImg.alt = ''; preImg.decoding = 'async'; preMark.appendChild(preImg);
  fillQ(preQ, PRE);
  const preIn = el('div', 'rv__pre-in'); preIn.append(preMark, preQ); pre.appendChild(preIn);   /* the part that slides, as the logo image does */
  const logo = el('div', 'rv__logo'), logoImg = el('img'); logoImg.src = logoSrc; logoImg.alt = 'L Squared'; logoImg.decoding = 'async';
  logo.appendChild(logoImg);
  stage.append(pre, logo);
  const ask = el('div', 'rv__ask'), askQ = el('p', 'rv__q');
  fillQ(askQ, ASK);
  const askLine = el('p', 'rv__ask-line', ASK_LINE);
  const btn = el('a', 'btn', BTN); btn.href = LINK; btn.target = '_blank'; btn.rel = 'noopener';
  ask.append(askQ, askLine, btn);
  sec.appendChild(ask);

  /* the biggest words (the solo card and the invitation) shrink only if a word
     is wider than the screen; measured off screen, again on resize */
  const fitQ = (q, maxW) => {
    q.style.fontSize = '';
    let fs = parseFloat(getComputedStyle(q).fontSize);
    for (let n = 0; n < 10 && q.scrollWidth > maxW + 1; n++) { fs *= .92; q.style.fontSize = fs.toFixed(1) + 'px'; }
  };
  const fitAsk = () => { const w = stage.clientWidth * (phone ? .9 : .92); fitQ(askQ, w); };

  /* ------------------------------------------------------------ state */
  const cards = [];
  let live = [];   /* [{x, y}] of the cards on screen */
  let timers = [], visible = false, k = 0, playing = false;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clear = () => { timers.forEach(clearTimeout); timers = []; };

  /* ------------------------------------------------------------ the end
     The mark: a square of side MK (the stage's smaller side) centred on
     the wall. The wall zooms from 1 to the size of the finished mark and
     rises so the mark's centre lands at MARK_Y of the screen; the ask sits
     beneath. Everything is transform and opacity; the blur (laptop only)
     is one filter on the wall as a single layer, never on the words. */
  const MARK_PX = () => (phone ? Math.min(stage.clientWidth * .34, 132) : Math.min(stage.clientHeight * .17, 156));
  const MARK_Y = phone ? .3 : .32;
  /* the logo image: 1920 x 290, the mark is its left 15.4%, centred at 7.7% */
  const MARK_FRAC = .154, MARK_CX = .077;
  let ended = false;
  const layoutEnd = () => {
    const W = stage.clientWidth, H = stage.clientHeight, MK = Math.min(W, H) * .86;
    wall.style.setProperty('--mk', MK.toFixed(1) + 'px');
    const s = MARK_PX() / MK, dy = (MARK_Y - .5) * H;
    /* the logo, centred where the mark is: its mark starts the same size as
       the wall's mark, and scales to the finished logo as the wordmark slides out */
    const LW = Math.min(W * (phone ? .84 : .56), phone ? 440 : 900);
    [logo, pre].forEach((g) => { g.style.width = LW.toFixed(1) + 'px'; g.style.top = (MARK_Y * 100) + '%'; });
    pre.style.setProperty('--k', (MARK_PX() / (LW * MARK_FRAC)).toFixed(4));
    preQ.style.fontSize = '';
    fitQ(preQ, LW * .8);
    return { s, dy };
  };
  const finish = (instant) => {
    if (ended) return;
    ended = true; clear();
    cards.forEach((c) => c.classList.add('is-on', 'is-by'));
    sec.classList.add('is-ending'); fitAsk();
    const { s, dy } = layoutEnd();
    const endT = 'translateY(' + dy.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
    if (instant || RM) {
      wall.style.transform = endT; sec.classList.add('is-mark', 'is-gone', 'is-ask', 'is-ask2', 'is-ask3'); return;
    }
    const DUR = 3000;
    later(() => {
      const kf = [{ transform: 'translateY(0) scale(1)' }, { transform: endT }];
      wall.animate(kf, { duration: DUR, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }).finished.then(() => { wall.style.transform = endT; }).catch(() => {});
      sec.classList.add('is-mark');   /* the frame, the gutters and the colours wash in over the zoom (css) */
      /* then, one thing on screen at a time, the hero's own move three times:
         1. the real mark takes over from the wall's, and "Every voice. Every
            screen." slides out of it exactly as the wordmark does;
         2. it slides back in, and L SQUARED slides out the same way;
         3. the logo fades, and the invitation comes in alone. */
      let t = DUR + 200;
      later(() => sec.classList.add('is-pre'), t); t += 500;                   /* the real mark over the wall's (same size, same place) */
      later(() => { pre.classList.add('is-open', 'is-settled'); }, t); t += 1700 + 1600;   /* the line slides out, holds */
      later(() => pre.classList.remove('is-open'), t); t += 1700 + 200;        /* and slides back in */
      later(() => sec.classList.add('is-logo'), t); t += 500;                  /* the logo's mark takes over, same pixels */
      later(() => sec.classList.add('is-full'), t); t += 1700 + 1800;          /* L SQUARED slides out, holds */
      later(() => sec.classList.add('is-gone'), t); t += 900;                  /* it fades */
      later(() => sec.classList.add('is-ask'), t); t += 700;                   /* the invitation, alone */
      later(() => sec.classList.add('is-ask2'), t); t += 600;
      later(() => sec.classList.add('is-ask3'), t);
    }, 200);
  };

  /* the beat, written out: the gap before each arrival after the solo, in
     ms. 1.4s down to a tenth of a second: two on screen, three, four, then
     the rush. Each card stays a little longer than the one before it, so
     the crowd only ever grows; the last wave never leaves. */
  const GAPS = [1300, 1000, 900, 800, 700, 600, 520, 460, 400, 350, 300, 260, 230, 200, 180, 160, 150, 140, 130, 120, 110, 100];
  const FILL_N = phone ? 130 : 180;   /* arrivals in the fill, 50ms apart, none of them ever leaves: it keeps filling until the words mesh into one wall */
  const TOTAL = GAPS.length + 1 + FILL_N;
  const gapAt = (k) => (k <= GAPS.length ? GAPS[k - 1] : 50);

  /* ------------------------------------------------------------ placing
     Slots on a loose grid across the stage, jittered, each with its own
     size and small angle. The first arrivals take the slot farthest from
     the cards already showing, so two, three and four sit apart; after
     that any slot, so the crowd overlaps. */
  const COLS = phone ? 2 : 4, ROWS = phone ? 4 : 3;
  const SLOTS = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) SLOTS.push({ x: (c + .5) / COLS, y: (r + .5) / ROWS });
  /* the fill: a finer grid over the whole screen, edges included, dealt in
     a shuffled order and jittered, so every part of the screen gets covered */
  const FC = phone ? 3 : 6, FR = phone ? 7 : 4, FILL = [];
  for (let r = 0; r < FR; r++) for (let c = 0; c < FC; c++) FILL.push({ x: (c + .5) / FC, y: (r + .5) / FR });
  for (let i = FILL.length - 1; i > 0; i--) { const j = Math.floor(hash(i, 77) * (i + 1)); const t = FILL[i]; FILL[i] = FILL[j]; FILL[j] = t; }
  /* straight while there are few; once this many are on screen they start to tilt, more and more */
  const TILT_AT = phone ? 12 : 16, TILT_RAMP = phone ? 10 : 14;
  function place(c, k, spread) {
    const W = stage.clientWidth, H = stage.clientHeight;
    let best = null, bestD = -1;
    const n = live.length;
    if (spread) {
      SLOTS.forEach((s, i) => {
        const jx = (hash(k, i + 1) - .5) * (1 / COLS) * .7, jy = (hash(k, i + 2) - .5) * (1 / ROWS) * .7;
        const x = Math.min(.9, Math.max(.1, s.x + jx)), y = Math.min(.9, Math.max(.1, s.y + jy));
        let d = 1e9;
        live.forEach((p) => { d = Math.min(d, Math.hypot((x - p.x) * W, (y - p.y) * H)); });
        if (!n) d = 1 - Math.hypot(x - .5, y - .5);   /* alone: nearest the middle */
        if (d > bestD) { bestD = d; best = { x, y }; }
      });
    } else {
      /* the fill runs past every edge: centres from 6% outside the screen to
         6% outside on the other side, so the ones at the edges are cut off */
      const f = FILL[k % FILL.length];
      best = { x: -.06 + 1.12 * (f.x + (hash(k, 1) - .5) / FC), y: -.06 + 1.12 * (f.y + (hash(k, 2) - .5) / FR) };
    }
    const busy = Math.min(1, Math.max(0, (n - TILT_AT) / TILT_RAMP));
    /* sizes: mixed from the very start (small, medium, large side by side),
       and the range widens smoothly as it goes, the biggest growing from
       about the base size to huge by the end, so there is never a jump */
    const t = Math.min(1, k / (TOTAL - 1));
    const lo = .55 - .25 * t, hi = (phone ? 1.15 : 1.25) + (phone ? 1.4 : 1.7) * t;
    /* the first arrivals run through a fixed set of clearly different sizes
       (big, small, medium, bigger, small, large...), then the wide range */
    const EARLY = [1.15, .6, .9, 1.35, .7, 1.05, .55, 1.25, .8];
    const s = k <= EARLY.length ? EARLY[k - 1] * (phone ? .9 : 1) : lo + (hi - lo) * Math.pow(hash(k, 4), 1.7);
    const rot = (hash(k, 5) - .5) * (phone ? 16 : 22) * busy;   /* straight, then tilting once it is busy */
    c.style.left = (best.x * 100).toFixed(2) + '%'; c.style.top = (best.y * 100).toFixed(2) + '%';
    c.style.setProperty('--s', s.toFixed(3)); c.style.setProperty('--r', rot.toFixed(2) + 'deg');
    wall.appendChild(c); cards.push(c);
    /* while few: never past the edges of the stage, measured as drawn (size and angle included) */
    if (spread) {
      const sr = stage.getBoundingClientRect(), cr = c.getBoundingClientRect(), m = 6;
      let dx = 0, dy = 0;
      if (cr.left < sr.left + m) dx = sr.left + m - cr.left; else if (cr.right > sr.right - m) dx = sr.right - m - cr.right;
      if (cr.top < sr.top + m) dy = sr.top + m - cr.top; else if (cr.bottom > sr.bottom - m) dy = sr.bottom - m - cr.bottom;
      if (dx || dy) { best = { x: best.x + dx / W, y: best.y + dy / H }; c.style.left = (best.x * 100).toFixed(2) + '%'; c.style.top = (best.y * 100).toFixed(2) + '%'; }
    }
    c._pos = best; live.push(best);
    return c;
  }

  if (RM) {
    /* the end, still: a quiet crowd of every review and the invitation over it */
    LIST.forEach((r, i) => place(card(r, false, i), i, true));
    finish(true);
    return;
  }

  /* ------------------------------------------------------------ the play
     Arrivals k = 0..TOTAL-1 (the reviews in order, then again with new
     places and sizes). Gaps between arrivals shrink from 1.7s to .32s;
     each card's stay grows, so the count on screen climbs: 1, 2, 3, 4...
     The last wave never leaves; it is the crowd that freezes. */
  const on = (c) => { void c.offsetWidth; c.classList.add('is-on'); later(() => c.classList.add('is-by'), 250); };
  const off = (c) => { c.classList.remove('is-on'); c.classList.add('is-off'); live = live.filter((p) => p !== c._pos); later(() => c.remove(), 1000); };
  const arrive = () => {
    if (!visible) { playing = false; return; }
    if (k >= TOTAL) { finish(false); return; }
    const r = LIST[k % N], solo = k === 0;
    const c = solo ? card(r, true, k) : place(card(r, false, k), k, live.length < (phone ? 4 : 6));   /* apart while there are few, then the overlaps */
    if (solo) {
      c.style.left = '50%'; c.style.top = '50%'; c._pos = { x: .5, y: .5 }; live.push(c._pos);
      wall.appendChild(c); cards.push(c);
      fitQ(c.querySelector('.rv__q'), stage.clientWidth * (phone ? .9 : .92));
      on(c);
      k++; later(arrive, 250 + 350 + SOLO_HOLD);   /* the first one stays; the next arrives beside it */
      return;
    }
    on(c);   /* r108: once a review is in, it stays; nothing ever fades out */
    k++; later(arrive, gapAt(k));
  };
  const start = () => { if (playing || ended) return; playing = true; clear(); later(arrive, k === 0 ? 400 : 200); };
  const stop = () => { clear(); playing = false; };
  sec.addEventListener('click', (e) => { if (e.target.closest('a')) return; if (visible && !ended) finish(false); });   /* a tap skips to the end */

  const io = new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting && e.intersectionRatio >= .5 && !document.hidden;
    if (visible && !was) start(); else if (!visible && was) stop();
  }, { threshold: [.5] });
  document.addEventListener('visibilitychange', () => { if (document.hidden && visible) { visible = false; stop(); } });

  /* ------------------------------------------------------------ go */
  const ready = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
  ready.then(() => { fitAsk(); io.observe(sec); });
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => {
    fitAsk(); const q = stage.querySelector('.rv__card.is-solo .rv__q'); if (q) fitQ(q, stage.clientWidth * .92);
    if (ended) { const { s, dy } = layoutEnd(); wall.getAnimations().forEach((a) => a.cancel()); wall.style.transform = 'translateY(' + dy.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')'; }
  }, 160); }, { passive: true });
})();
