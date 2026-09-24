/* phone2 2.7 Reliability: "Everyone notices a dark screen" (r92, back to the
   OLD layout, new automatic behaviour).
   Sabrina 24 Sept: go back to the old layout (title lockup over a 4:5
   off/on photo pair) but make the reveal an AUTOMATIC loop, not a drag. The
   divider is the whole line pixelated (like the CEO quote's orange line
   breaking into pixels, css/phone2-ceo.css, but here the entire divider is
   pixelated, not just falling dust) and it sweeps across on its own.
   r98 (Sabrina: "not a perfect loop, its harsh cut to go from screen on to
   screen off. the bar should slide the other way in opposite direction to
   turn them off"): the loop is now
     OFF hold 3s > bar sweeps left to right turning the screens ON >
     ON hold 3s > bar sweeps back right to left turning them OFF > repeat,
   the two sweeps are mirror images (same time, same curve), and nothing
   ever swaps photos while any screen is lit. With Retail only today the
   pair never changes; more pairs (window.LSQ_RELY_PAIRS, fed by content.js)
   join the cycle automatically and change only while fully OFF, as a
   crossfade of the off photos. Swipe left/right on the photo goes to the
   next/previous pair (crossfade, never a cut). Leaving and coming back
   resumes where it was (before, coming back snapped a lit frame to dark in
   view). Dots stay under the frame, one per industry, matching fix 11 from
   r89 (Retail always on, others light up once ready).
   Reduced motion: the ON photo, still; a swipe swaps pairs instantly.

   The top of this file also holds the r98 page steadiness fix (see below):
   it runs on the whole phone page, not only this section. */
(() => {
  'use strict';
  const P2 = window.P2;
  if (!P2) return;

  /* ================================================================ page steadiness (r98)
     Sabrina: "the weird jump glitch is back on the interactive publish
     section and dark screen section". Measured: sections are sized
     max(var(--app-h), 100lvh) (r94). In Chrome and the Google app on an
     iPhone the page lives in an embedded window whose height (and so 100lvh)
     changes when the toolbar slides in or out. Every full-screen section
     above the one being read then changes height at once and the page
     lurches: loaded at 390x780 and grown to 390x844 while on Publishing,
     Publishing's top moved 0 -> 388px (Dark screen 0 -> 452px), the further
     down the page the bigger the jump, which is why it shows on these two.
     Fix, two parts:
     1. --app-h only ever GROWS (to the largest screen height seen at this
        width), so once the toolbar has hidden one time nothing resizes
        again, and a toolbar coming back never shrinks anything.
     2. The one resize that is left (the first time the screen grows) is
        cancelled out: the section under the top of the screen is held at
        exactly the same place, in the same frame, before anything paints.
     Native scroll anchoring is off on the phone page (css), so the browser
     does not correct the same shift a second time. */
  (() => {
    const root = document.documentElement;
    const readAppH = () => parseFloat(root.style.getPropertyValue('--app-h')) || innerHeight;
    let appH = Math.max(readAppH(), innerHeight), w0 = innerWidth;
    let snap = [];
    const topSecs = () => [...document.querySelectorAll('section[id]')].filter((s) => !s.parentElement.closest('section'));
    const take = () => {
      const y = scrollY;
      snap = topSecs().map((s) => [s, s.getBoundingClientRect().top + y]);
    };
    const hold = () => {
      if (!snap.length) return;
      const y = scrollY;
      let a = snap[0];
      for (const e of snap) { if (e[1] <= y + 1) a = e; else break; }
      const now = a[0].getBoundingClientRect().top + y;
      const d = now - a[1];
      if (Math.abs(d) > .5) scrollTo({ top: y + d, left: 0, behavior: 'instant' });
    };
    addEventListener('resize', () => {
      if (Math.abs(innerWidth - w0) > 40) {   /* a real width change (rotation): index.html re-measures */
        w0 = innerWidth; appH = readAppH();
      } else if (innerHeight > appH + .5) {
        appH = innerHeight;
        root.style.setProperty('--app-h', appH + 'px');
      }
      hold();
      take();
    }, { passive: true });
    let st = 0;
    addEventListener('scroll', () => { if (!st) st = requestAnimationFrame(() => { st = 0; take(); }); }, { passive: true });
    addEventListener('load', take);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(take);
    take();
    P2.steady = { take, hold };
  })();

  /* ================================================================ the section */
  const sec = document.getElementById('reliability');
  if (!sec) return;
  const RM = P2.RM;
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

  const srcOf = (o) => {
    if (!o) return '';
    const dp = o.getAttribute('data-phone');
    if (dp) return dp;
    const m = /url\(["']?([^"')]+)/.exec(o.style.backgroundImage || '');
    return m ? m[1] : '';
  };
  const offEl = sec.querySelector('#rely-off'), onEl = sec.querySelector('#rely-on');
  if (!offEl || !onEl) return;
  const pairs = [{ name: 'Retail', off: srcOf(offEl), on: srcOf(onEl) }];
  (window.LSQ_RELY_PAIRS || []).forEach((x) => pairs.push({ name: x.name, off: x.off, on: x.on }));
  const SLOTS = ['Restaurants', 'Retail', 'Enterprise', 'Manufacturing'];
  const pairIndexOf = (name) => pairs.findIndex((pr) => pr.name === name);

  /* every photo is fetched and decoded before it can be needed, so a swap
     never shows a half-loaded frame */
  const ready = {};
  const warm = (src) => {
    if (!src) return Promise.resolve();
    if (!ready[src]) {
      const im = new Image(); im.decoding = 'async'; im.src = src;
      ready[src] = (im.decode ? im.decode() : Promise.resolve()).catch(() => {});
    }
    return ready[src];
  };
  pairs.forEach((pr) => { warm(pr.off); warm(pr.on); });

  /* ---------------------------------------------------------------- dom
     Old-layout lockup: title over a 4:5 frame, no handle/grip, a pixel
     divider bar in its place. The frame's size comes from its aspect ratio
     only, so no photo, load or swap can ever change it. */
  const oldH = sec.querySelector('.rely__h'), oldSub = sec.querySelector('.rely__sub');
  const wrap = el('div', 'p2r');
  const title = el('h2', 'p2r__title');
  /* r94: fit the title on exactly 2 lines on the phone ("Everyone notices" /
     "a dark screen."), a phone-only line break; content.js and the PC copy
     are untouched. If the copy is ever edited away from that sentence, this
     falls back to the natural wrap. */
  const titleText = (oldH && oldH.textContent.trim()) || 'Everyone notices a dark screen.';
  const BREAK = /\s+(a dark screen\.?)\s*$/i;
  const m = BREAK.exec(titleText);
  if (m) {
    title.appendChild(document.createTextNode(titleText.slice(0, m.index).trim()));
    title.appendChild(el('br'));
    title.appendChild(document.createTextNode(titleText.slice(m.index).trim()));
  } else {
    title.appendChild(document.createTextNode(titleText));
  }
  const sub = el('p', 'p2r__sub'); sub.textContent = (oldSub && oldSub.textContent.trim()) || 'Yours stay on.';

  const frame = el('div', 'p2r__frame');
  const off = el('img', 'p2r__ph p2r__ph--off'); off.alt = ''; off.decoding = 'async';
  const on = el('img', 'p2r__ph p2r__ph--on'); on.alt = ''; on.decoding = 'async';
  /* r98: the next pair's OFF photo fades in over the current one (pairs
     only ever change while every screen is off) */
  const nextOff = el('img', 'p2r__ph p2r__ph--next'); nextOff.alt = ''; nextOff.decoding = 'async';
  const bar = el('canvas', 'p2r__bar'); bar.setAttribute('aria-hidden', 'true');
  frame.append(off, on, nextOff, bar);

  const live = el('p', 'p2r__live'); live.className = 'sr-only'; live.setAttribute('aria-live', 'polite');
  const dots = el('div', 'p2r__dots'); dots.setAttribute('role', 'tablist'); dots.setAttribute('aria-label', 'Industry');
  const dotBtns = SLOTS.map((name) => {
    const ok = pairIndexOf(name) > -1;
    const b = el('button', 'p2r__dot' + (ok ? '' : ' is-soon'));
    b.type = 'button'; b.setAttribute('aria-label', ok ? name : name + ', coming soon');
    if (ok) b.addEventListener('click', () => manualGoto(pairIndexOf(name)));
    else { b.disabled = true; b.setAttribute('aria-disabled', 'true'); b.tabIndex = -1; }
    dots.appendChild(b);
    return b;
  });

  wrap.append(title, sub, frame, live, dots);
  sec.prepend(wrap);
  P2.sec('reliability');

  /* ---------------------------------------------------------------- pixel divider
     A full-height bar made of small squares, randomised every frame for a
     pixelated look (same idea as the CEO line's falling pixels, but here
     the whole bar is pixels, sweeping instead of falling). */
  let H = 0, D = 1;
  const ctx = bar.getContext('2d');
  const CELL = 6, BAR_W = 34;
  const buildCanvas = () => {
    const r = frame.getBoundingClientRect();
    H = r.height;
    D = Math.min(2, window.devicePixelRatio || 1);
    bar.width = Math.round(BAR_W * D); bar.height = Math.round(H * D);
    bar.style.height = H + 'px';
  };
  const drawBar = () => {
    if (!H) return;
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.clearRect(0, 0, BAR_W, H);
    const rows = Math.ceil(H / CELL), cols = Math.ceil(BAR_W / CELL);
    ctx.fillStyle = '#FF9900';
    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        if (Math.random() < .16) continue;   /* pixelated gaps */
        ctx.globalAlpha = .55 + Math.random() * .45;
        ctx.fillRect(rx * CELL, ry * CELL, CELL - 1, CELL - 1);
      }
    }
    ctx.globalAlpha = 1;
  };

  /* ---------------------------------------------------------------- state
     p = how much of the frame is lit, 0..100, left to right. The bar sits
     on the lit edge. Its opacity eases in over the first 6% of the frame
     and out over the last 6%, so it never pops on or off. */
  let idx = 0, p = 0, raf = 0, holdT = 0, visible = false, busy = false;
  let signalSent = false;

  const setP = (v) => {
    p = v;
    frame.style.setProperty('--p', v.toFixed(2) + '%');
    bar.style.transform = 'translateX(calc(' + (v / 100 * frame.clientWidth - BAR_W / 2).toFixed(1) + 'px))';
    bar.style.opacity = String(P2.clamp(Math.min(v, 100 - v) / 6, 0, 1));
  };

  const handoffOnce = () => {
    if (signalSent) return;
    signalSent = true;
    const r = frame.getBoundingClientRect();
    P2.signal.handoff('reliability', { shape: 'light', rect: { left: r.left, top: r.top, width: r.width, height: r.height } });
  };

  const label = (i) => {
    live.textContent = pairs[i].name + ': dead screens turning on.';
    dotBtns.forEach((b, k) => b.classList.toggle('is-on', SLOTS[k] === pairs[i].name));
  };
  const load = (i) => { idx = i; off.src = pairs[i].off; on.src = pairs[i].on; label(i); };

  const stop = () => { cancelAnimationFrame(raf); clearTimeout(holdT); raf = 0; holdT = 0; };

  /* r98: both sweeps are the same length and the same symmetric curve
     (ease in and out), so turning off is the exact mirror of turning on */
  /* r102: the screens stay off 3s and on 3s, exactly the same both ways.
     The first sweep starts well under a second after the section arrives
     (it used to wait a full off-hold first), and the curve is a gentler
     ease in and out, so the photo visibly changes from the first frames
     instead of sitting still at each end of the sweep. */
  const SWEEP_MS = 1200, ON_HOLD_MS = 3000, OFF_HOLD_MS = 3000, FIRST_MS = 600, FADE_MS = 520;
  const easeIO = (k) => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

  const sweep = (to, done) => {
    const from = p, dur = SWEEP_MS * Math.abs(to - from) / 100;
    if (dur < 16) { setP(to); done(); return; }
    const t0 = performance.now();
    const step = (now) => {
      if (!visible) { raf = 0; return; }
      const k = P2.clamp((now - t0) / dur, 0, 1);
      setP(from + (to - from) * easeIO(k));
      drawBar();
      if (k >= 1) { raf = 0; done(); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  /* the loop, as named steps; resume() picks the right step from p */
  const offHold = (ms) => { stop(); holdT = setTimeout(turnOn, ms == null ? OFF_HOLD_MS : ms); };
  const turnOn = () => { stop(); sweep(100, () => { handoffOnce(); onHold(); }); };
  const onHold = () => { stop(); holdT = setTimeout(turnOff, ON_HOLD_MS); };
  const turnOff = () => {
    stop();
    sweep(0, () => {
      /* fully OFF: the only moment the pair may change */
      if (pairs.length > 1) crossTo((idx + 1) % pairs.length, () => offHold());
      else offHold();
    });
  };

  /* while every screen is off: the next pair's off photo fades in over
     the current one, then quietly becomes the base layer */
  const crossTo = (i, done) => {
    busy = true;
    const pr = pairs[i];
    Promise.all([warm(pr.off), warm(pr.on)]).then(() => {
      nextOff.src = pr.off;
      label(i);
      const fin = () => {
        idx = i; off.src = pr.off; on.src = pr.on;
        const settle = () => { nextOff.style.opacity = '0'; busy = false; done(); };
        (off.decode ? off.decode() : Promise.resolve()).catch(() => {}).then(settle);
      };
      if (RM || !nextOff.animate) { fin(); return; }
      nextOff.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: 'ease', fill: 'forwards' }).finished.then(() => {
        nextOff.style.opacity = '1';
        nextOff.getAnimations().forEach((a) => a.cancel());
        fin();
      });
    });
  };

  let started = false;
  const resume = () => {
    stop();
    if (RM) { setP(100); handoffOnce(); return; }
    if (busy) return;
    if (p <= 0) offHold(started ? 900 : FIRST_MS);
    else if (p >= 100) onHold();
    else turnOn();   /* half way: finish lighting, then the loop carries on */
  };

  function manualGoto(i) {
    if (!pairs[i] || i === idx || busy) return;
    stop();
    if (RM) { load(i); setP(100); return; }
    /* lit or half lit: turn the screens off first (a quick mirror sweep),
       then crossfade to the new pair's off photo and light it */
    const go = () => crossTo(i, () => offHold(500));
    if (p > 0) sweep(0, go); else go();
  }

  /* ---------------------------------------------------------------- swipe */
  let sx = 0, sy = 0, tracking = false;
  frame.addEventListener('pointerdown', (e) => { tracking = true; sx = e.clientX; sy = e.clientY; });
  frame.addEventListener('pointerup', (e) => {
    if (!tracking) return; tracking = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 32 && Math.abs(dx) > Math.abs(dy)) {
      const dir = dx < 0 ? 1 : -1;
      manualGoto((idx + dir + pairs.length) % pairs.length);
    }
  });
  frame.addEventListener('pointercancel', () => { tracking = false; });

  /* ---------------------------------------------------------------- go */
  load(0);
  buildCanvas();
  setP(RM ? 100 : 0);
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { buildCanvas(); setP(p); if (raf) drawBar(); }, 200); }, { passive: true });

  const io = new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting && !document.hidden;
    if (visible && !was) { if (!started) buildCanvas(); resume(); started = true; }
    else if (!visible && was) stop();
  }, { threshold: .5 });
  io.observe(sec);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { visible = false; stop(); return; }
    const r = sec.getBoundingClientRect();
    const seen = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    if (seen >= Math.min(r.height, innerHeight) * .5) { visible = true; resume(); }
  });

  /* test hook (read only) */
  P2.rely = { get p() { return p; }, get idx() { return idx; }, pairs };

  /* -------------------------------------------------------------- signal */
  P2.signal.station('reliability', { receive() { /* decoration only */ } });
})();
