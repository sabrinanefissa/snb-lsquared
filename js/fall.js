/* Section 3: the pixels shed out of the blue and land as ONE centred line.
   The Grid sizing model, the scroll-progress driver and the release / accelerate
   fall are the real code from homepage-v6/js/page.js (cell geometry originally
   from homepage-v4/js/main.js). What changed for v7: the destination is a single
   centred row about the width of the sentence, not a full width floor; a cell is
   never drawn before it lets go; nothing is drawn over the sentence; and the
   colours come from this section's own gradient rather than the page ground. */
(() => {
  'use strict';
  const sec = document.getElementById('independent');
  const cv = document.getElementById('fall-canvas');
  if (!sec || !cv) return;

  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const hash = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const pinned = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
  };

  const line = sec.querySelector('[data-words]');

  /* ---- geometry ---------------------------------------------------- */
  const REL0 = .04, RELS = .50, FALL = .26;
  let W = 0, H = 0, D = 1, S = 12, N = 0, X0 = 0, LY = 0;
  let sx = null, sy = null, rel = null;
  let guard = null;                       // the sentence box, padded

  function build() {
    const r = cv.getBoundingClientRect();
    D = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * D); cv.height = Math.round(H * D);
    const c = cv.getContext('2d');
    c.setTransform(D, 0, 0, D, 0, 0);

    /* r6: the field uses the page, not the sentence. Cells let go across about
       90% of the width and land as one centred line about 75% wide. */
    S = Math.round(clamp(W * .012, 10, 22));
    const lr = line ? line.getBoundingClientRect() : null;
    const LW = clamp(W * .75, 240, W - 40);
    N = Math.max(8, Math.round(LW / S));
    X0 = Math.round((W - N * S) / 2);
    /* the line always sits a clear gap above the sentence, whatever the
       sentence wraps to, so the two never touch */
    const top = lr ? (lr.top - r.top) : H * .38;
    LY = Math.round(clamp(top - 48 - S, H * .1, H * .6));

    sx = new Float32Array(N); sy = new Float32Array(N); rel = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      sx[i] = (.05 + hash(i, 1) * .9) * W;
      sy[i] = (-.08 + hash(i, 2) * .34) * H;
      rel[i] = REL0 + RELS * hash(i, 3);
    }

    /* never paint a pixel across the sentence */
    if (lr) {
      guard = { l: lr.left - r.left - 24, t: lr.top - r.top - 24, rr: lr.right - r.left + 24, b: lr.bottom - r.top + 24 };
    } else guard = null;
  }

  function paint(p) {
    const c = cv.getContext('2d');
    c.clearRect(0, 0, W, H);
    const t = clamp((p - .06) / .42, 0, 1);
    /* on the blue ground the pixels are ink: light while they are falling,
       solid once they have landed and built the line */
    const air = 'rgba(6,18,30,' + (.3 + .34 * t).toFixed(3) + ')';
    const q = S + .6;                     // landed cells tile with no seam

    for (let i = 0; i < N; i++) {
      const dt = p - rel[i];
      if (dt <= 0) continue;              // it has not let go yet: draw nothing
      const tx = X0 + i * S;
      if (dt >= FALL) { c.fillStyle = '#06121E'; c.fillRect(tx, LY, q, q); continue; }
      const k = dt / FALL;
      const y = sy[i] + (LY - sy[i]) * (k * k);
      const x = sx[i] + (tx - sx[i]) * (1 - Math.pow(1 - k, 3));
      if (guard && x + S > guard.l && x < guard.rr && y + S > guard.t && y < guard.b) continue;
      c.fillStyle = air;
      c.fillRect(x, y, S, S);
    }
  }

  /* ---- the sentence: word by word, dim colour to full, once it is dark ---- */
  let words = [];
  if (line) {
    const parts = line.textContent.trim().split(/\s+/);
    line.textContent = '';
    parts.forEach((w, i) => {
      const el = document.createElement('i');
      el.textContent = w + (i < parts.length - 1 ? ' ' : '');
      line.appendChild(el);
    });
    words = [...line.querySelectorAll('i')];
  }
  function lightWords(p) {
    const k = Math.round(clamp((p - .42) / .43, 0, 1) * words.length);
    for (let i = 0; i < words.length; i++) words[i].classList.toggle('is-on', i < k);
  }

  let raf = 0, live = false;
  const frame = () => {
    raf = 0;
    const p = pinned(sec);
    paint(p); lightWords(p);
    if (live) raf = requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !RM.matches) { if (!live) { live = true; if (!raf) raf = requestAnimationFrame(frame); } }
    else { live = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  }, { rootMargin: '200px' });

  function resize() {
    build();
    const p = RM.matches ? 1 : pinned(sec);
    paint(p); lightWords(RM.matches ? 1 : p);
  }
  resize();
  if (RM.matches) words.forEach((w) => w.classList.add('is-on'));
  else io.observe(sec);

  let wt = 0;
  addEventListener('resize', () => { clearTimeout(wt); wt = setTimeout(resize, 160); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
    else if (live && !raf) raf = requestAnimationFrame(frame);
  });
})();
