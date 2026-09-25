/* Dark screen on a laptop (r117): the phone's automatic loop instead of the
   drag handle. The screens start off; a pixelated orange bar sweeps left to
   right turning them on; they stay on 3s; the bar sweeps back turning them
   off; they stay off 3s; again. The first sweep starts well under a second
   after the section arrives. A click on the photo skips to the next step.
   Runs only on a laptop (761px and wider); the phone keeps js/phone2/
   reliability.js (new design) or the drag (old design). Transform and
   opacity only; frames only while on screen. Reduced motion: the screens
   on, still. The photos come from content.js as before (#rely-off, #rely-on). */
(() => {
  'use strict';
  if (!matchMedia('(min-width:761px)').matches) return;
  const sec = document.getElementById('reliability');
  const frame = sec && sec.querySelector('.rely__frame'), stack = sec && sec.querySelector('.rely__stack');
  const handle = sec && sec.querySelector('#rely-handle');
  if (!frame || !stack) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  if (handle) handle.remove();
  frame.classList.add('rely--loop');

  /* the pixel bar: a full-height bar of small squares, redrawn every frame */
  const bar = document.createElement('canvas'); bar.className = 'rely__bar'; bar.setAttribute('aria-hidden', 'true');
  stack.appendChild(bar);
  const ctx = bar.getContext('2d');
  const CELL = 7, BAR_W = 40;
  let H = 0, D = 1;
  const buildCanvas = () => {
    H = frame.clientHeight; D = Math.min(2, window.devicePixelRatio || 1);
    bar.width = Math.round(BAR_W * D); bar.height = Math.round(H * D); bar.style.height = H + 'px';
  };
  const drawBar = () => {
    if (!H) return;
    ctx.setTransform(D, 0, 0, D, 0, 0); ctx.clearRect(0, 0, BAR_W, H);
    ctx.fillStyle = '#FF9900';
    for (let ry = 0; ry < Math.ceil(H / CELL); ry++) for (let rx = 0; rx < Math.ceil(BAR_W / CELL); rx++) {
      if (Math.random() < .16) continue;
      ctx.globalAlpha = .55 + Math.random() * .45;
      ctx.fillRect(rx * CELL, ry * CELL, CELL - 1, CELL - 1);
    }
    ctx.globalAlpha = 1;
  };

  /* p: how much of the frame is lit, 0..100, left to right; the bar rides the lit edge */
  let p = 0, raf = 0, holdT = 0, visible = false, started = false;
  const setP = (v) => {
    p = v;
    frame.style.setProperty('--p', v.toFixed(2) + '%');
    bar.style.transform = 'translateX(' + (v / 100 * frame.clientWidth - BAR_W / 2).toFixed(1) + 'px)';
    bar.style.opacity = String(clamp(Math.min(v, 100 - v) / 6, 0, 1));
  };
  const SWEEP_MS = 1200, ON_HOLD_MS = 3000, OFF_HOLD_MS = 3000, FIRST_MS = 600;
  const easeIO = (k) => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const stop = () => { cancelAnimationFrame(raf); clearTimeout(holdT); raf = 0; holdT = 0; };
  const sweep = (to, done) => {
    const from = p, dur = SWEEP_MS * Math.abs(to - from) / 100;
    if (dur < 16) { setP(to); done(); return; }
    const t0 = performance.now();
    const step = (now) => {
      if (!visible) { raf = 0; return; }
      const k = clamp((now - t0) / dur, 0, 1);
      setP(from + (to - from) * easeIO(k)); drawBar();
      if (k >= 1) { raf = 0; done(); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  const offHold = (ms) => { stop(); holdT = setTimeout(turnOn, ms == null ? OFF_HOLD_MS : ms); };
  const turnOn = () => { stop(); sweep(100, onHold); };
  const onHold = () => { stop(); holdT = setTimeout(turnOff, ON_HOLD_MS); };
  const turnOff = () => { stop(); sweep(0, () => offHold()); };
  const resume = () => {
    stop();
    if (RM) { setP(100); return; }
    if (p <= 0) offHold(started ? 900 : FIRST_MS);
    else if (p >= 100) onHold();
    else turnOn();
  };
  /* a click skips to the next step */
  stack.addEventListener('click', () => { if (RM || !visible) return; stop(); if (p >= 100) turnOff(); else turnOn(); });

  buildCanvas(); setP(RM ? 100 : 0);
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { buildCanvas(); setP(p); if (raf) drawBar(); }, 200); }, { passive: true });
  const io = new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting && !document.hidden;
    if (visible && !was) { if (!started) buildCanvas(); resume(); started = true; }
    else if (!visible && was) stop();
  }, { threshold: .4 });
  io.observe(frame);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { visible = false; stop(); return; }
    const r = frame.getBoundingClientRect();
    if (Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) >= Math.min(r.height, innerHeight) * .4) { visible = true; resume(); }
  });
})();
