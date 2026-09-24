/* In their words (r103): the critics' quotes of a film trailer, for what
   customers say. Black screen. A few words punch on, dead centre, word by
   word on a fast beat; the name and role land quietly beneath; it holds;
   a hard cut; an orange pixel flicks in the centre; the next one. The
   holds get shorter as it goes, and the last review holds the longest.
   Then a longer black, and it plays again.
   Runs only while the section is on screen (IntersectionObserver), on
   timers, transform and opacity only. A tap or click cuts to the next
   review at once. Reduced motion shows every review at once, still (css).
   Words from content.js (window.LSQ_REVIEWS via js/edit.js): *word* is
   orange, | is a new line; "reviews seconds each" is the hold. The type is
   sized so no word is ever wider than the screen and no review taller than
   its stage, measured per review and again on resize. */
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
  const secs = parseFloat(T['reviews seconds each']);
  const HOLD = (isFinite(secs) && secs > 0 ? secs : 2) * 1000;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  /* ------------------------------------------------------------ the words
     "Above and *beyond*." > tokens: words (orange or not) and line breaks.
     An orange run can span several words: *our own* */
  const tokens = (s) => {
    const out = []; let em = false;
    s.split('|').forEach((seg, n) => {
      if (n) out.push({ br: true });
      seg.split(/\s+/).filter(Boolean).forEach((w) => {
        let word = w, open = false, close = false;
        if (word.startsWith('*')) { open = true; word = word.slice(1); }
        if (word.endsWith('*')) { close = true; word = word.slice(0, -1); }
        if (open) em = true;
        if (word) out.push({ word, em });
        if (close) em = false;
      });
    });
    return out;
  };

  /* ------------------------------------------------------------ DOM */
  const sr = el('p', 'sr-only');
  sr.textContent = 'What our customers say. ' + LIST.map((r) => r.words.replace(/[*|]/g, ' ').replace(/\s+/g, ' ').trim() + ' ' + [r.name, r.role].filter(Boolean).join(', ') + '.').join(' ');
  sec.insertBefore(sr, stage);
  stage.setAttribute('aria-hidden', 'true');
  const lines = LIST.map((r) => {
    const line = el('div', 'rv__line'), q = el('p', 'rv__q');
    const words = [];
    tokens(r.words).forEach((t, k, arr) => {
      if (t.br) { q.appendChild(el('br')); return; }
      const i = el('i');
      if (t.em) i.appendChild(el('em', '', t.word)); else i.textContent = t.word;
      q.appendChild(i); words.push(i);
      const nx = arr[k + 1];
      if (nx && !nx.br) q.appendChild(document.createTextNode(' '));
    });
    line.appendChild(q);
    if (r.name || r.role) {
      const by = el('div', 'rv__by');
      if (r.name) by.appendChild(el('span', 'rv__name', r.name));
      if (r.role) by.appendChild(el('span', 'rv__role', r.role));
      line.appendChild(by);
    }
    stage.appendChild(line);
    return { line, q, words };
  });
  const px = el('i', 'rv__px'); px.setAttribute('aria-hidden', 'true'); sec.appendChild(px);

  /* ------------------------------------------------------------ the fit
     Each review at the CSS size, smaller only if a word is wider than the
     stage or the whole review taller than it (measured with every word
     shown, then the words are hidden again). */
  let cur = null;   /* the review playing now */
  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!W || !H) return;
    lines.forEach((L) => {
      L.line.style.visibility = 'visible'; L.line.classList.add('is-by');
      L.words.forEach((w) => w.classList.add('is-in'));
      L.q.style.fontSize = '';
      const base = parseFloat(getComputedStyle(L.q).fontSize);
      let fs = base;
      for (let n = 0; n < 12; n++) {
        const wide = L.q.scrollWidth > W + 1, tall = L.line.offsetHeight > H;
        if (!wide && !tall) break;
        fs = fs * .92; L.q.style.fontSize = fs.toFixed(1) + 'px';
      }
      L.line.style.visibility = '';
      if (L !== cur) { L.line.classList.remove('is-by'); L.words.forEach((w) => w.classList.remove('is-in')); }   /* the one playing stays as it is */
    });
  };

  if (RM) {
    lines.forEach((L) => { L.line.classList.add('is-on', 'is-by'); L.words.forEach((w) => w.classList.add('is-in')); });
    return;
  }

  /* ------------------------------------------------------------ the beat
     word after word 95ms apart (a little quicker on long reviews), the name
     180ms after the last word, then the hold. Holds shorten by a quarter
     from the first review to the second last; the last holds 2.2 times. */
  const N = lines.length;
  const stepOf = (n) => (n <= 3 ? 110 : n <= 6 ? 85 : 65);
  const holdOf = (i) => (i === N - 1 ? HOLD * 2.2 : HOLD * (1 - .25 * (N > 2 ? i / (N - 2) : 0)));
  const CUT = 300, LOOP_GAP = 1400;
  let i = -1, timers = [], visible = false;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const beat = () => {
    px.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)', offset: .3 }, { opacity: 1, offset: .6 }, { opacity: 0, transform: 'scale(.6)' }],
      { duration: 220, easing: 'linear' });
  };
  const cut = () => {
    if (cur) { cur.line.classList.remove('is-on', 'is-by'); cur.words.forEach((w) => w.classList.remove('is-in')); cur = null; }
  };
  const show = (k) => {
    clear(); cut();
    i = k; cur = lines[k];
    cur.line.classList.add('is-on');
    const step = stepOf(cur.words.length);
    cur.words.forEach((w, n) => later(() => w.classList.add('is-in'), n * step));
    const landed = (cur.words.length - 1) * step + 170;
    later(() => cur.line.classList.add('is-by'), landed + 180);
    later(next, landed + 180 + holdOf(k));
  };
  const next = () => {
    clear(); cut(); beat();
    const k = (i + 1) % N;
    later(() => show(k), k === 0 ? LOOP_GAP : CUT);
  };
  const start = () => { clear(); if (i < 0) { beat(); later(() => show(0), CUT); } else later(() => show(i), CUT); };
  const stop = () => { clear(); cut(); };
  sec.addEventListener('click', () => { if (visible) next(); });   /* a tap cuts to the next one */

  const io = new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting && e.intersectionRatio >= .5 && !document.hidden;
    if (visible && !was) start(); else if (!visible && was) stop();
  }, { threshold: [.5] });
  document.addEventListener('visibilitychange', () => { if (document.hidden && visible) { visible = false; stop(); } });

  /* ------------------------------------------------------------ go */
  const ready = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
  ready.then(() => { fit(); io.observe(sec); });
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fit, 160); }, { passive: true });
})();
