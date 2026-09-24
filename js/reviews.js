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
   3. It freezes. The crowd holds where it is and dims a step back into the
      black. Alone in the middle, bright, the invitation and the Leave a
      review button (the G2 page).
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
  const SOLO_HOLD = (isFinite(secs) && secs > 0 ? secs : 1.2) * 1000;
  const ASK = T['reviews invite'] || "If we've earned it,|we'd love to hear it.";
  const ASK_LINE = T['reviews invite line'] || 'Two minutes to leave a review.';
  const BTN = T['reviews button'] || 'Leave a review';
  const LINK = T['reviews link'] || 'https://www.g2.com/products/l-squared/reviews';
  const phone = matchMedia('(max-width:760px)').matches;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };

  /* ------------------------------------------------------------ the words
     "Above and *beyond*." > words, some blue (*our own* spans two), | breaks */
  const fillQ = (q, s) => {
    let em = false;
    s.split('|').forEach((seg, n) => {
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
  };
  const plain = (s) => s.replace(/[*|]/g, ' ').replace(/\s+/g, ' ').trim();
  const card = (r, solo, k) => {
    const c = el('div', 'rv__card' + (solo ? ' is-solo' : '') + (k % 2 ? ' is-orange' : '')), q = el('p', 'rv__q');
    fillQ(q, r.words); c.appendChild(q);
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
  sr.textContent = 'What our customers say. ' + LIST.map((r) => plain(r.words) + ' ' + [r.name, r.role].filter(Boolean).join(', ') + '.').join(' ') + ' ' + plain(ASK) + ' ' + ASK_LINE;
  sec.insertBefore(sr, stage);
  stage.setAttribute('aria-hidden', 'true');
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

  /* ------------------------------------------------------------ the end */
  const finish = (instant) => {
    if (sec.classList.contains('is-ask')) return;
    clear();
    cards.forEach((c) => { if (!c.classList.contains('is-off')) c.classList.add('is-on', 'is-by'); });
    sec.classList.add('is-frozen');
    fitAsk();
    if (instant || RM) { sec.classList.add('is-ask', 'is-ask2'); return; }
    later(() => { sec.classList.add('is-ask'); later(() => sec.classList.add('is-ask2'), 700); }, 1100);
  };

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
    /* sizes: while few, medium; in the fill, everything from tiny to huge
       (a fifth huge, a third medium, the rest small), so the wall has depth */
    let s;
    if (spread) s = phone ? .6 + hash(k, 4) * .4 : .55 + hash(k, 4) * .45;
    else { const u = hash(k, 4), v = hash(k, 6); s = u < .25 ? 1.6 + v * (phone ? .8 : 1.3) : u < .6 ? .85 + v * .7 : .3 + v * .5; }
    const rot = (hash(k, 5) - .5) * (phone ? 16 : 22) * busy;   /* straight, then tilting once it is busy */
    c.style.left = (best.x * 100).toFixed(2) + '%'; c.style.top = (best.y * 100).toFixed(2) + '%';
    c.style.setProperty('--s', s.toFixed(3)); c.style.setProperty('--r', rot.toFixed(2) + 'deg');
    stage.appendChild(c); cards.push(c);
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
  /* the beat, written out: the gap before each arrival after the solo, in
     ms. 1.4s down to a tenth of a second: two on screen, three, four, then
     the rush. Each card stays a little longer than the one before it, so
     the crowd only ever grows; the last wave never leaves. */
  const GAPS = [1300, 1000, 900, 800, 700, 600, 520, 460, 400, 350, 300, 260, 230, 200, 180, 160, 150, 140, 130, 120, 110, 100];
  const FILL_N = phone ? 130 : 180;   /* arrivals in the fill, 50ms apart, none of them ever leaves: it keeps filling until the words mesh into one wall */
  const TOTAL = GAPS.length + 1 + FILL_N, STAY_FROM = 12;   /* from this arrival on, nothing leaves */
  const gapAt = (k) => (k <= GAPS.length ? GAPS[k - 1] : 50);
  const stayAt = (k) => 2400 + k * 180;
  const on = (c) => { void c.offsetWidth; c.classList.add('is-on'); later(() => c.classList.add('is-by'), c.classList.contains('is-solo') ? 350 : 300); };
  const off = (c) => { c.classList.remove('is-on'); c.classList.add('is-off'); live = live.filter((p) => p !== c._pos); later(() => c.remove(), 1000); };
  const arrive = () => {
    if (!visible) { playing = false; return; }
    if (k >= TOTAL) { finish(false); return; }
    const r = LIST[k % N], solo = k === 0;
    const c = solo ? card(r, true, k) : place(card(r, false, k), k, live.length < (phone ? 4 : 6));   /* apart while there are few, then the overlaps */
    if (solo) {
      c.style.left = '50%'; c.style.top = '50%'; c._pos = { x: .5, y: .5 }; live.push(c._pos);
      stage.appendChild(c); cards.push(c);
      fitQ(c.querySelector('.rv__q'), stage.clientWidth * (phone ? .9 : .92));
      on(c);
      later(() => off(c), 350 + 900 + SOLO_HOLD);
      k++; later(arrive, 350 + 900 + SOLO_HOLD + 900);
      return;
    }
    on(c);
    if (k < STAY_FROM) later(() => off(c), stayAt(k));
    k++; later(arrive, gapAt(k));
  };
  const start = () => { if (playing || sec.classList.contains('is-ask')) return; playing = true; clear(); later(arrive, k === 0 ? 400 : 200); };
  const stop = () => { clear(); playing = false; };
  sec.addEventListener('click', (e) => { if (e.target.closest('a')) return; if (visible && !sec.classList.contains('is-ask')) finish(false); });   /* a tap skips to the end */

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
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { fitAsk(); const s = stage.querySelector('.rv__card.is-solo .rv__q'); if (s) fitQ(s, stage.clientWidth * .92); }, 160); }, { passive: true });
})();
