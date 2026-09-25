/* In their words (r111): the critics' quotes of a film trailer, for what
   customers say. Sabrina's vision, in order:
   1. One review alone in the middle, whole; its name and role fade in
      beneath. Within half a second the next one lands beside it.
   2. They gather, straight and apart, in clearly different sizes; more and
      more arrive, none ever leaves; once it is busy they start to tilt;
      once the screen is full they run past its edges and keep coming until
      the words mesh into one wall with barely a word readable.
   3. The wall pulls back in one continuous motion and becomes the L Squared
      mark, centred; the reviews fade into its solid squares; the mark
      holds, as in the hero.
   4. "Every voice. Every screen." slides out of the mark on one line,
      exactly the hero's move; it holds; it slides back in; the mark holds.
   5. L SQUARED slides out of the same mark the same way; it holds; the
      whole logo fades to black.
   6. The invitation fades in alone, then its small line, then the Leave a
      review button (the G2 page).
   Plays only while on screen; scrolling away resets it and coming back
   plays it again from the start. A tap skips to the end. Every move is
   transform or opacity. Reduced motion shows the end at once.
   Words from content.js (window.LSQ_REVIEWS via js/edit.js): *word* is
   blue, | is a new line; "reviews seconds each" is how long the first
   review is alone; "reviews line before logo", "reviews invite", "reviews
   invite line", "reviews button", "reviews link" are the ending. */
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
  const SOLO_HOLD = (isFinite(secs) && secs >= 0 ? secs : .3) * 1000;
  const PRE = (T['reviews line before logo'] || 'Every voice. Every screen.').replace(/\|/g, ' ');   /* one line, as the wordmark */
  const ASK = T['reviews invite'] || "If we've earned it,|we'd love to hear it.";
  const ASK_LINE = T['reviews invite line'] || 'Two minutes to leave a review.';
  const BTN = T['reviews button'] || 'Leave a review';
  const LINK = T['reviews link'] || 'https://www.g2.com/products/l-squared/reviews';
  const heroLogo = document.querySelector('#hero .hlogo img, #h_logo img');
  const logoSrc = (heroLogo && heroLogo.getAttribute('src')) || 'assets/lsquared-logo.png';
  const phone = matchMedia('(max-width:760px)').matches;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };

  /* ------------------------------------------------------------ the words
     "Above and *beyond*." > words, some blue (*our own* spans two), | breaks,
     curly quotes around a review */
  const fillQ = (q, s, quoted) => {
    let em = false;
    if (quoted) q.appendChild(document.createTextNode('“'));
    s.split('|').forEach((seg, n) => {
      if (n) q.appendChild(el('br'));
      const words = seg.split(/\s+/).filter(Boolean);
      words.forEach((w, k) => {
        const open = w.startsWith('*'), close = /\*[^*\w]*$/.test(w) && !(open && w.length === 1);
        const word = w.replace(/\*/g, '');
        if (open) em = true;
        if (word) q.appendChild(em ? el('em', '', word) : document.createTextNode(word));
        if (close) em = false;
        if (k < words.length - 1) q.appendChild(document.createTextNode(' '));
      });
    });
    if (quoted) q.appendChild(document.createTextNode('”'));
  };
  const plain = (s) => s.replace(/[*|]/g, ' ').replace(/\s+/g, ' ').trim();
  const card = (r, solo) => {
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
  sr.textContent = 'What our customers say. ' + LIST.map((r) => plain(r.words) + ' ' + [r.name, r.role].filter(Boolean).join(', ') + '.').join(' ') + ' ' + PRE + ' L Squared. ' + plain(ASK) + ' ' + ASK_LINE;
  sec.insertBefore(sr, stage);
  stage.setAttribute('aria-hidden', 'true');
  /* the wall: every review lives in it, so the ending can zoom it as one */
  const wall = el('div', 'rv__wall'); stage.appendChild(wall);
  /* the mark the wall becomes: nine cells, the L blue, the rest grey, the
     centre dark; a frame blacks out everything outside the square */
  const mark = el('div', 'rv__mark'), frame = el('div', 'rv__frame');
  const L = [[0, 0], [1, 0], [2, 0], [2, 1]];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const cell = el('i', 'rv__cell' + (L.some((p) => p[0] === r && p[1] === c) ? ' is-blue' : (r === 1 && c === 1) ? ' is-open' : ' is-grey'));
    cell.style.left = (c * 34.48) + '%'; cell.style.top = (r * 34.48) + '%';   /* 90 px squares, 10 px gaps, as the logo */
    mark.appendChild(cell);
  }
  wall.append(frame, mark);
  /* the lockup: the real mark (the logo's left 15.4%) with, to its right,
     either the line or the wordmark. It opens exactly as the hero's logo
     does (the mark moves left, the right part is revealed), closes the same
     way, and swaps what is on its right only while closed. */
  const lock = el('div', 'rv__lock'), lockIn = el('div', 'rv__lock-in');
  const lMark = el('span', 'rv__lock-mark'), lMarkImg = el('img'); lMarkImg.src = logoSrc; lMarkImg.alt = ''; lMarkImg.decoding = 'async'; lMark.appendChild(lMarkImg);
  const lRight = el('span', 'rv__lock-right');
  const lText = el('span', 'rv__lock-text', PRE);
  const lWord = el('span', 'rv__lock-word'), lWordImg = el('img'); lWordImg.src = logoSrc; lWordImg.alt = 'L Squared'; lWordImg.decoding = 'async'; lWord.appendChild(lWordImg);
  lRight.append(lText, lWord); lockIn.append(lMark, lRight); lock.appendChild(lockIn);
  stage.appendChild(lock);
  /* the invitation */
  const ask = el('div', 'rv__ask'), askQ = el('p', 'rv__q');
  fillQ(askQ, ASK);
  const askLine = el('p', 'rv__ask-line', ASK_LINE);
  const btn = el('a', 'btn', BTN); btn.href = LINK; btn.target = '_blank'; btn.rel = 'noopener';
  ask.append(askQ, askLine, btn);
  sec.appendChild(ask);

  /* the biggest words shrink only if a word (or the one-line lockup text) is
     wider than its room; measured off screen, again on resize */
  const fitQ = (q, maxW) => {
    q.style.fontSize = '';
    let fs = parseFloat(getComputedStyle(q).fontSize);
    for (let n = 0; n < 12 && q.scrollWidth > maxW + 1; n++) { fs *= .93; q.style.fontSize = fs.toFixed(1) + 'px'; }
  };

  /* ------------------------------------------------------------ state */
  const cards = [];
  let live = [];
  let timers = [], visible = false, k = 0, playing = false, ended = false;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clear = () => { timers.forEach(clearTimeout); timers = []; };

  /* ------------------------------------------------------------ placing
     Slots on a loose grid while there are few (each new one takes the slot
     farthest from the others); then a finer shuffled grid that covers the
     whole screen. Everything stays inside the screen until the screen is
     busy; from there the placings spread past the edges, more and more, so
     the ones at the edges are cut off only once it is overflowing. Straight
     while few; tilting once busy. Sizes: the first arrivals run through a
     fixed set of clearly different sizes; then everything from tiny to
     huge, the biggest growing as it goes. */
  const GAPS = [1000, 900, 800, 700, 600, 520, 460, 400, 350, 300, 260, 230, 200, 180, 160, 150, 140, 130, 120, 110, 100];
  const FILL_N = phone ? 130 : 180;
  const TOTAL = GAPS.length + 1 + FILL_N;
  const gapAt = (j) => (j <= GAPS.length ? GAPS[j - 1] : 50);
  const COLS = phone ? 2 : 4, ROWS = phone ? 4 : 3, SLOTS = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) SLOTS.push({ x: (c + .5) / COLS, y: (r + .5) / ROWS });
  const FC = phone ? 3 : 6, FR = phone ? 7 : 4, FILL = [];
  for (let r = 0; r < FR; r++) for (let c = 0; c < FC; c++) FILL.push({ x: (c + .5) / FC, y: (r + .5) / FR });
  for (let i = FILL.length - 1; i > 0; i--) { const j = Math.floor(hash(i, 77) * (i + 1)); const t = FILL[i]; FILL[i] = FILL[j]; FILL[j] = t; }
  const TILT_AT = phone ? 12 : 16, TILT_RAMP = phone ? 10 : 14;
  const OVER_AT = phone ? 40 : 55, OVER_RAMP = phone ? 40 : 60;   /* on screen count where the overflow starts, and how many more until it is full */
  const EARLY = [1.15, .6, .9, 1.35, .7, 1.05, .55, 1.25, .8];
  function place(c, j, spread) {
    const W = stage.clientWidth, H = stage.clientHeight, n = live.length;
    let best = null, bestD = -1;
    if (spread) {
      SLOTS.forEach((s, i) => {
        const jx = (hash(j, i + 1) - .5) * (1 / COLS) * .7, jy = (hash(j, i + 2) - .5) * (1 / ROWS) * .7;
        const x = clamp(s.x + jx, .1, .9), y = clamp(s.y + jy, .1, .9);
        let d = 1e9;
        live.forEach((p) => { d = Math.min(d, Math.hypot((x - p.x) * W, (y - p.y) * H)); });
        if (!n) d = 1 - Math.hypot(x - .5, y - .5);
        if (d > bestD) { bestD = d; best = { x, y }; }
      });
    } else {
      const f = FILL[j % FILL.length];
      best = { x: clamp(f.x + (hash(j, 1) - .5) / FC, .06, .94), y: clamp(f.y + (hash(j, 2) - .5) / FR, .06, .94) };
    }
    const over = clamp((n - OVER_AT) / OVER_RAMP, 0, 1);
    if (over > 0) best = { x: .5 + (best.x - .5) * (1 + .3 * over), y: .5 + (best.y - .5) * (1 + .3 * over) };
    const busy = clamp((n - TILT_AT) / TILT_RAMP, 0, 1);
    const t = Math.min(1, j / (TOTAL - 1));
    const lo = .55 - .25 * t, hi = (phone ? 1.15 : 1.25) + (phone ? 1.4 : 1.7) * t;
    const s = j <= EARLY.length ? EARLY[j - 1] * (phone ? .9 : 1) : lo + (hi - lo) * Math.pow(hash(j, 4), 1.7);
    const rot = (hash(j, 5) - .5) * (phone ? 16 : 22) * busy;
    c.style.left = (best.x * 100).toFixed(2) + '%'; c.style.top = (best.y * 100).toFixed(2) + '%';
    c.style.setProperty('--s', s.toFixed(3)); c.style.setProperty('--r', rot.toFixed(2) + 'deg');
    wall.appendChild(c); cards.push(c);
    if (over === 0) {
      /* not yet overflowing: never past the edges, measured as drawn (size and angle included) */
      const sr2 = stage.getBoundingClientRect(), cr = c.getBoundingClientRect(), m = 6;
      let dx = 0, dy = 0;
      if (cr.left < sr2.left + m) dx = sr2.left + m - cr.left; else if (cr.right > sr2.right - m) dx = sr2.right - m - cr.right;
      if (cr.top < sr2.top + m) dy = sr2.top + m - cr.top; else if (cr.bottom > sr2.bottom - m) dy = sr2.bottom - m - cr.bottom;
      if (dx || dy) { best = { x: best.x + dx / W, y: best.y + dy / H }; c.style.left = (best.x * 100).toFixed(2) + '%'; c.style.top = (best.y * 100).toFixed(2) + '%'; }
    }
    c._pos = best; live.push(best);
    return c;
  }

  /* ------------------------------------------------------------ the end
     The wall's mark: a square of side MK centred on the wall. The wall zooms
     to the size of the lockup's mark, centred on the section; the lockup's
     mark then takes over at the same pixels. */
  const MARK_FRAC = .1506;   /* measured from the logo image: the mark is 290 of 1926 px */
  const lockW = () => Math.min(stage.clientWidth * (phone ? .84 : .56), phone ? 440 : 900);
  const markPx = () => (phone ? Math.min(stage.clientWidth * .34, 132) : Math.min(stage.clientHeight * .17, 156));
  const layoutEnd = () => {
    const W = stage.clientWidth, H = stage.clientHeight, MK = Math.min(W, H) * .86;
    wall.style.setProperty('--mk', MK.toFixed(1) + 'px');
    const LW = lockW();
    lock.style.width = LW.toFixed(1) + 'px';
    lock.style.setProperty('--k', (markPx() / (LW * MARK_FRAC)).toFixed(4));
    /* the line, one line, sized to the wordmark's room */
    lText.style.fontSize = '';
    fitQ(lText, LW * .78);
    return 'scale(' + (markPx() / MK).toFixed(4) + ')';
  };
  const fitAsk = () => fitQ(askQ, stage.clientWidth * (phone ? .9 : .92));
  const finish = (instant) => {
    if (ended) return;
    ended = true; clear();
    cards.forEach((c) => c.classList.add('is-on', 'is-by'));
    sec.classList.add('is-ending'); fitAsk();
    const endT = layoutEnd();
    if (instant || RM) {
      wall.style.transform = endT; sec.classList.add('is-mark', 'is-solid', 'is-gone', 'is-ask', 'is-ask2', 'is-ask3'); return;
    }
    const ZOOM = 3000, SLIDE = 1700;
    later(() => {
      wall.animate([{ transform: 'scale(1)' }, { transform: endT }], { duration: ZOOM, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' })
        .finished.then(() => { wall.style.transform = endT; }).catch(() => {});
      sec.classList.add('is-mark');                                           /* the frame, the gutters and the colours wash in over the zoom */
      let t = ZOOM - 600;
      later(() => sec.classList.add('is-solid'), t); t += 900;                /* the reviews fade into solid squares: the mark */
      later(() => sec.classList.add('is-lock'), t); t += 500 + 900;           /* the real mark takes over, same pixels; it holds, as in the hero */
      later(() => lock.classList.add('is-open', 'is-settled'), t); t += SLIDE + 2200;   /* the line slides out; holds */
      later(() => lock.classList.remove('is-open'), t); t += SLIDE + 500;     /* slides back in; the mark holds */
      later(() => lock.classList.add('is-word'), t); t += 120;                /* the wordmark takes the line's place, unseen */
      later(() => lock.classList.add('is-open'), t); t += SLIDE + 2600;       /* L SQUARED slides out; holds */
      later(() => sec.classList.add('is-gone'), t); t += 1100 + 500;          /* the logo fades to black */
      later(() => sec.classList.add('is-ask'), t); t += 1000;                 /* the invitation, alone, slowly */
      later(() => sec.classList.add('is-ask2'), t); t += 900;
      later(() => sec.classList.add('is-ask3'), t);
    }, 200);
  };

  /* ------------------------------------------------------------ reduced motion: the end, still */
  if (RM) {
    LIST.forEach((r, i) => place(card(r, false), i + 1, true));
    finish(true);
    return;
  }

  /* ------------------------------------------------------------ the play */
  const on = (c) => { void c.offsetWidth; c.classList.add('is-on'); later(() => c.classList.add('is-by'), 250); };
  const arrive = () => {
    if (!visible) { playing = false; return; }
    if (k >= TOTAL) { finish(false); return; }
    const r = LIST[k % N], solo = k === 0;
    if (solo) {
      const c = card(r, true);
      c.style.left = '50%'; c.style.top = '50%'; c._pos = { x: .5, y: .5 }; live.push(c._pos);
      wall.appendChild(c); cards.push(c);
      fitQ(c.querySelector('.rv__q'), stage.clientWidth * (phone ? .9 : .92));
      on(c);
      k++; later(arrive, 250 + SOLO_HOLD);   /* the next one lands beside it within half a second */
      return;
    }
    on(place(card(r, false), k, live.length < (phone ? 4 : 6)));
    k++; later(arrive, gapAt(k));
  };
  const start = () => { if (playing || ended) return; playing = true; clear(); later(arrive, k === 0 ? 150 : 150); };
  /* scrolling away resets it; coming back plays it again from the start */
  const reset = () => {
    clear(); playing = false; ended = false; k = 0; live = [];
    cards.forEach((c) => c.remove()); cards.length = 0;
    wall.getAnimations().forEach((a) => a.cancel()); wall.style.transform = '';
    sec.classList.remove('is-ending', 'is-mark', 'is-solid', 'is-lock', 'is-gone', 'is-ask', 'is-ask2', 'is-ask3');
    lock.classList.remove('is-open', 'is-settled', 'is-word');
  };
  sec.addEventListener('click', (e) => { if (e.target.closest('a')) return; if (visible && !ended) finish(false); });

  const io = new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting && e.intersectionRatio >= .5 && !document.hidden;
    if (visible && !was) start();
    else if (!e.isIntersecting) reset();
    else if (!visible && was) { clear(); playing = false; }
  }, { threshold: [0, .5] });
  document.addEventListener('visibilitychange', () => { if (document.hidden && visible) { visible = false; clear(); playing = false; } });

  /* ------------------------------------------------------------ go */
  const ready = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
  ready.then(() => { fitAsk(); io.observe(sec); });
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => {
    fitAsk(); const q = stage.querySelector('.rv__card.is-solo .rv__q'); if (q) fitQ(q, stage.clientWidth * .92);
    if (ended) { const endT = layoutEnd(); wall.getAnimations().forEach((a) => a.cancel()); wall.style.transform = endT; }
  }, 160); }, { passive: true });
})();
