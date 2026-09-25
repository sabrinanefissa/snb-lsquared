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
  const PRE = (T['reviews line before logo'] || 'Every voice.|Every screen.').split('|').map((x) => x.trim()).filter(Boolean);   /* the lines beside the mark, one at a time */
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
  sr.textContent = 'What our customers say. ' + LIST.map((r) => plain(r.words) + ' ' + [r.name, r.role].filter(Boolean).join(', ') + '.').join(' ') + ' ' + PRE.join(' ') + ' L Squared. ' + plain(ASK) + ' ' + ASK_LINE;
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
  const lText = el('span', 'rv__lock-text', PRE[0] || '');
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
  let timers = [], visible = false, k = 0, playing = false, ended = false;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clear = () => { timers.forEach(clearTimeout); timers = []; };

  /* ------------------------------------------------------------ placing
     Real packing. Each new review is measured as drawn (its size and angle)
     and tried at hundreds of spots across the screen; it takes the spot
     where it overlaps the others least. While there is empty room it lands
     in it, apart from the others (no overlap at all, the spot farthest
     from the rest). Only once nothing fits without overlapping do they
     start to overlap, and only once every spot is heavily covered do the
     placings run past the edges and get cut off. Straight while apart;
     tilting from the first overlap on. Sizes: the first arrivals run
     through a fixed set of clearly different sizes, then everything from
     tiny to huge, the biggest growing as it goes. */
  const GAPS = [1000, 900, 800, 700, 600, 520, 460, 400, 350, 300, 260, 230, 200, 180, 160, 150, 140, 130, 120, 110, 100];
  const FILL_N = phone ? 130 : 180;
  const TOTAL = GAPS.length + 1 + FILL_N;
  const gapAt = (j) => (j <= GAPS.length ? GAPS[j - 1] : 50);
  const EARLY = [1.15, .6, .9, 1.35, .7, 1.05, .55, 1.25, .8];
  const GX = phone ? 14 : 28, GY = phone ? 26 : 18;
  let rects = [], overlapAt = -1, overflow = false, heavy = 0;
  const remember = (c) => {
    const sr = stage.getBoundingClientRect(), r = c.getBoundingClientRect();
    rects.push({ l: r.left - sr.left, t: r.top - sr.top, r: r.right - sr.left, b: r.bottom - sr.top, cx: r.left - sr.left + r.width / 2, cy: r.top - sr.top + r.height / 2 });
  };
  function place(c, j) {
    const W = stage.clientWidth, H = stage.clientHeight, n = rects.length;
    const t = Math.min(1, j / (TOTAL - 1));
    const lo = .55 - .25 * t, hi = (phone ? 1.15 : 1.25) + (phone ? 1.4 : 1.7) * t;
    const s = j <= EARLY.length ? EARLY[j - 1] * (phone ? .9 : 1) : lo + (hi - lo) * Math.pow(hash(j, 4), 1.7);
    const busy = overlapAt < 0 ? 0 : clamp((n - overlapAt) / 14, 0, 1);
    const rot = (hash(j, 5) - .5) * (phone ? 16 : 22) * busy;
    c.style.setProperty('--s', s.toFixed(3)); c.style.setProperty('--r', rot.toFixed(2) + 'deg');
    c.style.left = '50%'; c.style.top = '50%'; c.style.visibility = 'hidden';
    wall.appendChild(c); cards.push(c);
    const r0 = c.getBoundingClientRect(), w = r0.width, h = r0.height, area = Math.max(1, w * h);
    /* where may its centre go: inside the screen, or (once overflowing) past the edges */
    const inset = overflow ? -.12 : 0;
    const xMin = Math.min(.5, w / 2 / W + inset), xMax = Math.max(.5, 1 - w / 2 / W - inset);
    const yMin = Math.min(.5, h / 2 / H + inset), yMax = Math.max(.5, 1 - h / 2 / H - inset);
    let best = null;
    for (let gy = 0; gy < GY; gy++) for (let gx = 0; gx < GX; gx++) {
      let x = (gx + .5) / GX + (hash(j, gx * 31 + gy) - .5) * .8 / GX, y = (gy + .5) / GY + (hash(j, gy * 37 + gx + 9) - .5) * .8 / GY;
      x = clamp(x, xMin, xMax); y = clamp(y, yMin, yMax);
      const l = x * W - w / 2, tp = y * H - h / 2, rr = l + w, bb = tp + h;
      let cover = 0, dmin = 1e9;
      for (const q of rects) {
        const ix = Math.min(rr, q.r) - Math.max(l, q.l), iy = Math.min(bb, q.b) - Math.max(tp, q.t);
        if (ix > 0 && iy > 0) cover += ix * iy;
        const d = Math.hypot((x * W - q.cx), (y * H - q.cy)); if (d < dmin) dmin = d;
      }
      const score = cover / area;
      /* no overlap: the spot farthest from the others wins; otherwise the least covered spot */
      const key = score === 0 ? -dmin : 1e6 + score * 1e4 + hash(j, gx + gy * 101) * 10;
      if (!best || key < best.key) best = { key, x, y, score };
    }
    if (best.score > 0 && overlapAt < 0) overlapAt = n;           /* from here on they tilt */
    if (best.score > .3) heavy++; else heavy = 0;
    if (heavy >= 3) overflow = true;                              /* every spot is heavily covered: past the edges from here on */
    c.style.left = (best.x * 100).toFixed(2) + '%'; c.style.top = (best.y * 100).toFixed(2) + '%';
    c.style.visibility = '';
    remember(c);
    c._score = best.score;
    return c;
  }

  /* ------------------------------------------------------------ the end
     The wall's mark: a square of side MK centred on the wall. The wall zooms
     to the size of the lockup's mark, centred on the section; the lockup's
     mark then takes over at the same pixels. */
  const MARK_FRAC = .1506;   /* measured from the logo image: the mark is 290 of 1926 px */
  let LWlogo = 0, mw = 0;
  const layoutEnd = () => {
    const W = stage.clientWidth, H = stage.clientHeight, MK = Math.min(W, H) * .86;
    wall.style.setProperty('--mk', MK.toFixed(1) + 'px');
    LWlogo = Math.min(W * .8, phone ? 440 : 1180);   /* the hero's logo size, exactly (css/hero.css .hlogo, css/phone2-hero.css .p2h__logo) */
    mw = LWlogo * MARK_FRAC;
    const gap = LWlogo * .05;
    lock.style.width = LWlogo.toFixed(1) + 'px';
    lock.style.setProperty('--mw', mw.toFixed(1) + 'px');
    lock.style.setProperty('--gap', gap.toFixed(1) + 'px');
    lock.style.setProperty('--tx', ((LWlogo - mw) / 2).toFixed(1) + 'px');
    /* the lines sit exactly where the wordmark will: one line each, one
       size for all of them, the longest spanning the wordmark's width */
    const room = LWlogo - mw - gap;
    let fs = mw * 1.04;   /* never taller than the wordmark's letters */
    PRE.forEach((line) => {
      lText.textContent = line; lText.style.fontSize = fs.toFixed(1) + 'px';
      while (fs > 8 && lText.scrollWidth - gap > room) { fs *= .96; lText.style.fontSize = fs.toFixed(1) + 'px'; }
    });
    lText.textContent = PRE[0] || ''; lText.style.fontSize = fs.toFixed(1) + 'px';
    /* the wall zooms so its mark is exactly the lockup's mark on a laptop;
       on a phone the mark stays a little larger for the handover (--k) and settles as the line slides out */
    const wallMark = phone ? Math.min(W * .34, 132) : mw;
    lock.style.setProperty('--k', (wallMark / mw).toFixed(4));
    return 'scale(' + (wallMark / MK).toFixed(4) + ')';
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
      later(() => sec.classList.add('is-lock'), t); t += 450;                 /* the real mark fades in over the wall's, same pixels */
      later(() => sec.classList.add('is-lock2'), t); t += 900;                /* the wall goes, unseen beneath it; the mark holds, as in the hero */
      later(() => lock.classList.add('is-open', 'is-settled'), t); t += SLIDE + 2000;   /* the first line slides out of the mark; holds */
      for (let i = 1; i < PRE.length; i++) {                                 /* each next line fades in where the last one was */
        later(() => lock.classList.add('is-hide'), t); t += 450;
        later(() => { lText.textContent = PRE[i]; lock.classList.remove('is-hide'); }, t); t += 600 + 2000;
      }
      later(() => lock.classList.add('is-word'), t); t += 700 + 2600;         /* L SQUARED fades in where the words were; holds */
      later(() => sec.classList.add('is-gone'), t); t += 1100 + 500;          /* the logo fades to black */
      later(() => sec.classList.add('is-ask'), t); t += 1000;                 /* the invitation, alone, slowly */
      later(() => sec.classList.add('is-ask2'), t); t += 900;
      later(() => sec.classList.add('is-ask3'), t);
    }, 200);
  };

  /* ------------------------------------------------------------ reduced motion: the end, still */
  if (RM) {
    LIST.forEach((r, i) => place(card(r, false), i + 1));
    finish(true);
    return;
  }

  /* ------------------------------------------------------------ the play */
  const on = (c) => { void c.offsetWidth; c.classList.add('is-on'); later(() => c.classList.add('is-by'), 250); };
  const arrive = () => {
    if (!visible && !ended) { playing = false; return; }
    if (k >= TOTAL) { finish(false); return; }
    const r = LIST[k % N], solo = k === 0;
    if (solo) {
      const c = card(r, true);
      c.style.left = '50%'; c.style.top = '50%';
      wall.appendChild(c); cards.push(c);
      fitQ(c.querySelector('.rv__q'), stage.clientWidth * (phone ? .9 : .92));
      remember(c);
      on(c);
      k++; later(arrive, 250 + SOLO_HOLD);   /* the next one lands beside it within half a second */
      return;
    }
    on(place(card(r, false), k));
    k++; later(arrive, gapAt(k));
  };
  const start = () => { if (playing || ended) return; playing = true; clear(); later(arrive, k === 0 ? 150 : 150); };
  /* scrolling away resets it; coming back plays it again from the start */
  const reset = () => {
    clear(); playing = false; ended = false; k = 0; rects = []; overlapAt = -1; overflow = false; heavy = 0;
    cards.forEach((c) => c.remove()); cards.length = 0;
    wall.getAnimations().forEach((a) => a.cancel()); wall.style.transform = '';
    sec.classList.remove('is-ending', 'is-mark', 'is-solid', 'is-lock', 'is-lock2', 'is-gone', 'is-ask', 'is-ask2', 'is-ask3');
    lock.classList.remove('is-open', 'is-settled', 'is-word', 'is-hide'); lText.textContent = PRE[0] || '';
  };
  sec.addEventListener('click', (e) => { if (e.target.closest('a')) return; if (visible && !ended) finish(false); });

  const io = new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting && e.intersectionRatio >= .5 && !document.hidden;
    if (visible && !was) start();
    else if (!e.isIntersecting) reset();   /* fully gone: it plays again from the start next time */
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
