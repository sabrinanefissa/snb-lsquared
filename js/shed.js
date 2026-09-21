/* Scroll driven shed transition.
   The same cell model as fall.js (which carries the v6 / v4 lineage): a cell is
   never drawn before it lets go, it accelerates downward, and it fades as it
   travels. This one is a transition, not a section: a short transparent canvas
   straddling a section boundary, cells in the upper ground's colour shedding
   from its edge into the next section. Mounted on every [data-shed]. */
(() => {
  'use strict';
  const nodes = [...document.querySelectorAll('[data-shed]')];
  if (!nodes.length) return;

  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const hash = (i, k) => { const x = Math.sin(i * 91.7 + k * 217.3) * 43758.5453; return x - Math.floor(x); };

  const REL0 = .02, RELS = .58, FALL = .42;

  class Shed {
    constructor(cv) {
      this.cv = cv;
      this.c = cv.getContext('2d');
      /* a ground variant can repaint a transition from CSS */
      var cs = getComputedStyle(cv);
      var rgb = cs.getPropertyValue('--shed-rgb').trim();
      var alpha = parseFloat(cs.getPropertyValue('--shed-alpha'));
      this.rgb = rgb || (cv.dataset.shed || '124,194,236').trim();
      this.peak = isNaN(alpha) ? parseFloat(cv.dataset.shedAlpha || '.55') : alpha;
      /* the last band of the canvas is never drawn into, so a transition can
         overlap the next section without ever landing on its heading */
      this.safe = parseFloat(cv.dataset.shedSafe || '28');
      this.cell = parseFloat(cv.dataset.shedCell) || 0;
      this.live = false; this.raf = 0;
      this.build();
    }
    build() {
      const r = this.cv.getBoundingClientRect();
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      this.w = Math.max(1, r.width); this.h = Math.max(1, r.height); this.d = d;
      this.cv.width = Math.round(this.w * d); this.cv.height = Math.round(this.h * d);
      this.c.setTransform(d, 0, 0, d, 0, 0);
      this.s = this.cell || (this.w < 760 ? 7 : 10);
      this.n = clamp(Math.round(this.w / (this.s * 3.4)), 14, 110);
      this.x = new Float32Array(this.n);
      this.y = new Float32Array(this.n);
      this.rel = new Float32Array(this.n);
      for (let i = 0; i < this.n; i++) {
        this.x[i] = Math.round(hash(i, 1) * (this.w - this.s));
        this.y[i] = -this.s + hash(i, 2) * this.h * .18;
        this.rel[i] = REL0 + RELS * hash(i, 3);
      }
    }
    progress() {
      const r = this.cv.getBoundingClientRect();
      return clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
    }
    paint(p) {
      const c = this.c, s = this.s, h = this.h;
      c.clearRect(0, 0, this.w, h);
      for (let i = 0; i < this.n; i++) {
        const dt = p - this.rel[i];
        if (dt <= 0) continue;                 // it has not let go yet
        const k = Math.min(1, dt / FALL);
        const stop = h - this.safe;
        const y = this.y[i] + (h + s - this.y[i]) * (k * k);
        if (y > stop) continue;                // never drawn in the reserved band
        const fade = 1 - clamp(y / Math.max(1, stop), 0, 1);
        c.fillStyle = 'rgba(' + this.rgb + ',' + (this.peak * (.25 + .75 * fade)).toFixed(3) + ')';
        c.fillRect(this.x[i], y, s, s);
      }
    }
    frame() {
      this.raf = 0;
      this.paint(this.progress());
      if (this.live) this.raf = requestAnimationFrame(() => this.frame());
    }
    start() { if (!this.raf) this.raf = requestAnimationFrame(() => this.frame()); }
    halt() { if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; } }
  }

  const all = nodes.map((cv) => new Shed(cv));

  if (RM.matches) {
    /* one tidy static frame: a few cells just below the edge, nothing moving */
    all.forEach((f) => f.paint(.34));
  } else {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const f = e.target.__shed;
      if (!f) return;
      f.live = e.isIntersecting && !document.hidden;
      if (f.live) f.start(); else f.halt();
    }), { rootMargin: '120px' });
    all.forEach((f) => { f.cv.__shed = f; io.observe(f.cv); });
    document.addEventListener('visibilitychange', () => all.forEach((f) => {
      if (document.hidden) f.halt();
      else if (f.live) f.start();
    }));
  }

  let t = 0;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => all.forEach((f) => { f.build(); f.paint(RM.matches ? .34 : f.progress()); }), 160);
  }, { passive: true });
})();
