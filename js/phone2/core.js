/* phone2 core. The redesigned phone page (r77).
   Runs only on a phone (760px and narrower) and only while content.js says
   "phone design: new" (or says nothing). With "phone design: old" this file
   returns at once, adds nothing, and the phone page is exactly r76.
   Every phone2 style starts with .p2, so without the class nothing changes.
   See js/phone2/README.md for the helpers and the orange signal contract. */
(() => {
  'use strict';
  const root = document.documentElement;
  const T = window.LSQ || {};
  if (!matchMedia('(max-width:760px)').matches || /^old/i.test(T['phone design'] || '')) return;
  root.classList.add('p2');   /* edit.js already adds it early so the old scripts can step aside; this keeps it true if content.js was missing */

  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const appH = () => parseFloat(getComputedStyle(root).getPropertyValue('--app-h')) || innerHeight;
  const EASE_OUT = 'cubic-bezier(.23,1,.32,1)';
  const EASE_IO = 'cubic-bezier(.77,0,.175,1)';

  /* once: fn runs the first time el is at least `ratio` in view */
  const onView = (el, ratio, fn) => {
    if (!el) return () => {};
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting && e.intersectionRatio >= ratio - 0.001) { io.disconnect(); fn(e); return; }
    }, { threshold: [ratio] });
    io.observe(el);
    return () => io.disconnect();
  };

  /* scroll progress 0..1 of a tall wrapper whose child is sticky for one
     screen: 0 when its top reaches the top of the screen, 1 when its bottom
     reaches the bottom. Frames are only asked for while it is on screen. */
  const progress = (el, fn) => {
    let on = false, raf = 0, last = -1;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect(), span = r.height - appH();
      const p = span > 0 ? clamp(-r.top / span, 0, 1) : (r.top <= 0 ? 1 : 0);
      if (p !== last) { last = p; fn(p, r); }
    };
    const kick = () => { if (on && !raf) raf = requestAnimationFrame(tick); };
    new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) kick(); }, { rootMargin: '25% 0px' }).observe(el);
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', kick, { passive: true });
    tick();
    return { get: () => last, kick, force: () => { last = -1; tick(); } };
  };

  /* a 2px #FF9900 line sweeps down the target while the target is revealed
     behind it. Timed: P2.scanline(el, {dur, delay, onDone}) returns a Promise.
     Scrubbed: P2.scanline(el, {scrub:true}) returns {set(k)} for k 0..1. */
  const scanline = (target, o = {}) => {
    const host = target.offsetParent || target.parentElement;
    const line = document.createElement('i');
    line.className = 'p2-scan'; line.setAttribute('aria-hidden', 'true');
    const place = () => {
      line.style.left = target.offsetLeft + 'px'; line.style.top = target.offsetTop + 'px';
      line.style.width = target.offsetWidth + 'px';
    };
    host.appendChild(line); place();
    const clip = (k) => 'inset(0 0 ' + ((1 - k) * 100).toFixed(2) + '% 0)';
    if (o.scrub) {
      return {
        line,
        set(k) {
          k = clamp(k, 0, 1); place();
          target.style.clipPath = k >= 1 ? '' : clip(k);
          line.style.opacity = (k > 0 && k < 1) ? '1' : '0';
          line.style.transform = 'translateY(' + (k * target.offsetHeight).toFixed(1) + 'px)';
        },
        remove() { line.remove(); target.style.clipPath = ''; }
      };
    }
    const dur = o.dur || 900, delay = o.delay || 0;
    if (RM) { line.remove(); target.style.clipPath = ''; if (o.onDone) o.onDone(); return Promise.resolve(); }
    const h = target.offsetHeight;
    target.style.clipPath = clip(0);
    const a = target.animate([{ clipPath: clip(0) }, { clipPath: clip(1) }], { duration: dur, delay, easing: 'linear', fill: 'both' });
    line.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 1, offset: .92, transform: 'translateY(' + (h * .92) + 'px)' }, { opacity: 0, transform: 'translateY(' + h + 'px)' }],
      { duration: dur, delay, easing: 'linear', fill: 'both' });
    return a.finished.then(() => {
      target.style.clipPath = ''; a.cancel(); line.remove();
      if (o.onDone) o.onDone();
    }).catch(() => {});
  };

  /* the ghost finger: a soft translucent dot that shows a gesture once and
     then HOLDS pressed until the visitor touches the section. Any real
     press anywhere in the section cancels it for good.
     P2.ghost(target, {x, y, delay, onTap}) returns {moveTo(el|{x,y}, dur), tap(), cancel(), done}. */
  const ghost = (target, o = {}) => {
    const sec = o.section || target.closest('section') || target.parentElement;
    const dead = { moveTo() { return Promise.resolve(); }, tap() { return Promise.resolve(); }, cancel() {}, done: true };
    if (RM || !sec) return dead;
    if (getComputedStyle(sec).position === 'static') sec.style.position = 'relative';
    const dot = document.createElement('i'); dot.className = 'p2-ghost'; dot.setAttribute('aria-hidden', 'true');
    let x = 0, y = 0, killed = false, timer = 0;
    const at = (el, fx = .5, fy = .5) => {
      const s = sec.getBoundingClientRect(), r = el.getBoundingClientRect();
      return [r.left - s.left + r.width * fx, r.top - s.top + r.height * fy];
    };
    const put = () => { dot.style.transform = 'translate(' + x + 'px,' + y + 'px)'; };
    const ctl = {
      done: false,
      moveTo(el, dur = 700) {
        if (killed) return Promise.resolve();
        const p = el.nodeType ? at(el, .5, .5) : at(target, el.x, el.y);
        const from = 'translate(' + x + 'px,' + y + 'px)'; x = p[0]; y = p[1];
        const a = dot.animate([{ transform: from }, { transform: 'translate(' + x + 'px,' + y + 'px)' }], { duration: dur, easing: EASE_IO, fill: 'forwards' });
        return a.finished.then(put).catch(() => {});
      },
      tap() {
        if (killed) return Promise.resolve();
        dot.classList.add('is-down');
        if (o.onTap) setTimeout(() => { if (!killed) o.onTap(); }, 140);
        return new Promise((r) => setTimeout(r, 180));
      },
      cancel() {
        if (killed) return; killed = true; ctl.done = true; clearTimeout(timer);
        dot.classList.remove('is-on'); setTimeout(() => dot.remove(), 300);
        sec.removeEventListener('pointerdown', real, true);
      }
    };
    const real = (e) => { if (e.isTrusted) ctl.cancel(); };
    sec.addEventListener('pointerdown', real, true);
    timer = setTimeout(() => {
      if (killed) return;
      const p = at(target, o.x == null ? .5 : o.x, o.y == null ? .5 : o.y); x = p[0]; y = p[1];
      sec.appendChild(dot); put();
      requestAnimationFrame(() => { dot.classList.add('is-on'); });
      if (o.autoTap !== false) setTimeout(() => ctl.tap(), 420);
    }, o.delay || 0);
    return ctl;
  };

  /* ------------------------------------------------------------ the orange signal
     One orange thing travels down the page and hands each section to the
     next. Each section registers a station. When a section is finished
     with the signal it calls handoff(); the NEXT section in page order
     (content.js can reorder sections, so the order is read from the page)
     gets receive(state, from). A station that has not been built yet just
     keeps the state waiting in pending(). The signal is decoration only:
     every section must also work if it never receives it. */
  /* r92: only the sections that are still phone2 have a station. Statement,
     who we are, industries, ceo, publishing, figures and contact went back
     to r76, so the thread no longer runs through them. The hero and Trusted
     by no longer hand anything on either; the helpers stay for reliability. */
  const SEC = { hero: 'hero', reliability: 'reliability', trusted: 'clients' };
  const signal = (() => {
    const st = {}, pend = {}, log = [], flights = [];
    let owner = 'hero', el = null;
    const one = () => {
      if (!el) { el = document.createElement('i'); el.className = 'p2-sig'; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el); }
      return el;
    };
    const shown = (s) => s && s.getClientRects().length > 0;
    const order = () => Object.keys(SEC).map((k) => [k, document.getElementById(SEC[k])])
      .filter((p) => shown(p[1]))
      .sort((a, b) => (a[1].compareDocumentPosition(b[1]) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1)
      .map((p) => p[0]);
    return {
      /* name: one of the keys above; api.receive(state, fromName) */
      station(name, api) {
        st[name] = api || {};
        if (pend[name] && st[name].receive) { const s = pend[name]; delete pend[name]; owner = name; st[name].receive(s.state, s.from); }
      },
      next(name) { const o = order(); const i = o.indexOf(name); return i >= 0 ? o[i + 1] || null : null; },
      prev(name) { const o = order(); const i = o.indexOf(name); return i > 0 ? o[i - 1] : null; },
      order,
      owner: () => owner,
      /* state: {shape: 'edge'|'line'|'dot'|'pixels'|'light', rect: DOMRect-like in viewport px, ...anything} */
      handoff(from, state) {
        const to = this.next(from);
        log.push([from, to, state && state.shape]);
        document.dispatchEvent(new CustomEvent('p2:signal', { detail: { from, to, state } }));
        if (!to) { owner = null; return null; }
        owner = to;
        if (st[to] && st[to].receive) st[to].receive(state || {}, from);
        else pend[to] = { state: state || {}, from };
        return to;
      },
      pending(name) { const s = pend[name]; delete pend[name]; return s || null; },
      log,
      flights,   /* [flown, shape] per fly() call, for tests */
      /* the one shared orange element, for the moments the signal travels
         between two sections that are both on screen. From one viewport rect
         to another, transform and opacity only. Returns a Promise. */
      fly(from, to, o = {}) {
        /* only when both ends are on screen: a flight from or to somewhere
           off screen would be a streak across the page, so it is skipped */
        const onScreen = (r) => r && r.width >= 0 && r.height >= 0 && r.left < innerWidth && r.left + r.width > 0 && r.top < appH() && r.top + r.height > 0;
        if (RM || !onScreen(from) || !onScreen(to)) { flights.push([false, o.shape || 'dot']); return Promise.resolve(); }
        flights.push([true, o.shape || 'dot']);
        const e = one(), dur = o.dur || 700;
        e.className = 'p2-sig p2-sig--' + (o.shape || 'dot');
        e.style.width = to.width + 'px'; e.style.height = to.height + 'px';
        const sx = from.width / Math.max(1, to.width), sy = from.height / Math.max(1, to.height);
        const a = e.animate([
          { opacity: o.fromOpacity == null ? 1 : o.fromOpacity, transform: 'translate(' + from.left + 'px,' + from.top + 'px) scale(' + sx + ',' + sy + ')' },
          { opacity: o.toOpacity == null ? 1 : o.toOpacity, transform: 'translate(' + to.left + 'px,' + to.top + 'px) scale(1,1)' }
        ], { duration: dur, easing: o.easing || EASE_IO, fill: 'forwards' });
        return a.finished.then(() => { if (!o.keep) e.animate([{ opacity: o.toOpacity == null ? 1 : o.toOpacity }, { opacity: 0 }], { duration: 260, fill: 'forwards' }); }).catch(() => {});
      }
    };
  })();

  window.P2 = { RM, clamp, appH, onView, progress, scanline, ghost, signal, SEC, EASE_OUT, EASE_IO,
    /* a section that is built adds p2-sec to its section element to take the shared rules in phone2.css */
    sec: (id) => { const s = document.getElementById(id); if (s) s.classList.add('p2-sec'); return s; } };
})();
