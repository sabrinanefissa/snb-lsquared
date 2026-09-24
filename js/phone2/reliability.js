/* phone2 2.7 Reliability: "Drag the light back on"
   Spec: scratchpad/mobile-plan-blind.md, section 2.7. Title lockup / a 4:5
   photo shown whole (no crop here, unlike Industries and Publishing) /
   drag left-to-right to bring the screens on, with a glowing handle that
   follows the finger and a one-time hint that eases to 42% and holds.
   Pairs: only Retail has a real phone 4:5 pair in assets/m today. Two more
   optional phone-only pairs (Hotel, Hospital) were added to content.js
   under == DEAD SCREEN == and are read from window.LSQ_RELY_PAIRS (built
   by js/edit.js). Fix 11: the dot row always shows all three industries so
   the band under the photo is never empty; Retail is always on and
   tappable, Hotel and Hospital show dimmed and are not tappable (aria
   disabled) until their content.js photos exist, then they light up and
   work the same way.
   Signal: receives {shape:'line'} from Publishing (decoration only) and
   hands off {shape:'light'} once the reveal first passes 90% while dragging,
   OR once the visitor scrolls the section away with no drag at all (the
   section's bottom passing the middle of the viewport, or the self-hint
   easing to 42% and settling), whichever happens first. One handoff only,
   guarded by `signalSent`. */
(() => {
  'use strict';
  const P2 = window.P2;
  const sec = document.getElementById('reliability');
  if (!P2 || !sec) return;
  const RM = P2.RM;
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const clamp = P2.clamp;

  const srcOf = (o) => {
    if (!o) return '';
    const dp = o.getAttribute('data-phone');
    if (dp) return dp;
    const m = /url\(["']?([^"')]+)/.exec(o.style.backgroundImage || '');
    return m ? m[1] : '';
  };
  const offEl = sec.querySelector('#rely-off'), onEl = sec.querySelector('#rely-on');
  if (!offEl || !onEl) return;
  const pairs = [{ name: 'Retail', off: srcOf(offEl), on: srcOf(onEl), p: 8 }];
  (window.LSQ_RELY_PAIRS || []).forEach((x) => pairs.push({ name: x.name, off: x.off, on: x.on, p: 8 }));
  /* fix 11: one dot per industry (Restaurants, Retail, Enterprise, Manufacturing); a slot is
     "ready" once its pair exists in `pairs` above. */
  const SLOTS = ['Restaurants', 'Retail', 'Enterprise', 'Manufacturing'];   /* Sabrina 24 Sept: the four industries */
  const pairIndexOf = (name) => pairs.findIndex((pr) => pr.name === name);

  /* ---------------------------------------------------------------- dom */
  const oldH = sec.querySelector('.rely__h'), oldSub = sec.querySelector('.rely__sub');
  const wrap = el('div', 'p2r');
  const title = el('h2', 'p2-title p2r__title');
  title.appendChild(document.createTextNode((oldH && oldH.textContent.trim()) || 'Everyone notices a dark screen.'));
  const sub = el('span', 'p2r__sub'); sub.textContent = (oldSub && oldSub.textContent.trim()) || 'We keep yours on.';
  title.appendChild(document.createElement('br')); title.appendChild(sub);

  const frame = el('div', 'p2r__frame');
  const off = el('img', 'p2r__ph p2r__ph--off'); off.alt = ''; off.decoding = 'async';
  const on = el('img', 'p2r__ph p2r__ph--on'); on.alt = ''; on.decoding = 'async';
  const glow = el('div', 'p2r__glow'); glow.setAttribute('aria-hidden', 'true');
  const handle = el('div', 'p2r__handle'); handle.setAttribute('role', 'slider'); handle.tabIndex = 0;
  handle.setAttribute('aria-label', 'Drag to compare dead screens with working screens');
  handle.setAttribute('aria-valuemin', '0'); handle.setAttribute('aria-valuemax', '100');
  const grip = el('span', 'p2r__grip'); grip.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 6; i++) grip.appendChild(document.createElement('i'));
  handle.appendChild(grip);
  frame.append(off, on, glow, handle);

  /* fix 11: always build all three dots so the band under the photo is
     never empty; only ready slots are tappable. */
  const dots = el('div', 'p2r__dots'); dots.setAttribute('role', 'tablist'); dots.setAttribute('aria-label', 'Industry');
  const dotBtns = SLOTS.map((name) => {
    const ready = pairIndexOf(name) > -1;
    const b = el('button', 'p2r__dot' + (ready ? '' : ' is-soon'));
    b.type = 'button'; b.setAttribute('aria-label', ready ? name : name + ', coming soon');
    if (ready) {
      b.addEventListener('click', () => switchTo(pairIndexOf(name)));
    } else {
      b.disabled = true; b.setAttribute('aria-disabled', 'true'); b.tabIndex = -1;
    }
    dots.appendChild(b);
    return b;
  });

  const hint = el('p', 'p2r__hint'); hint.textContent = 'Drag'; hint.setAttribute('aria-hidden', 'true');
  wrap.append(title, frame, hint, dots);
  sec.prepend(wrap);
  P2.sec('reliability');

  /* ---------------------------------------------------------------- state */
  let idx = 0, nudged = false, tween = 0, bledLight = false, signalSent = false;

  /* the one handoff, however it is reached: drag past 90%, the self-hint
     settling, or the section scrolling away untouched. */
  const handoffOnce = () => {
    if (signalSent) return;
    signalSent = true;
    const r = frame.getBoundingClientRect();
    P2.signal.handoff('reliability', { shape: 'light', rect: { left: r.left, top: r.top, width: r.width, height: r.height } });
  };

  const apply = (p) => {
    p = clamp(p, 0, 100);
    pairs[idx].p = p;
    frame.style.setProperty('--p', p.toFixed(2) + '%');
    handle.setAttribute('aria-valuenow', String(Math.round(p)));
    handle.setAttribute('aria-valuetext', Math.round(p) + ' percent working screens');
    if (p >= 90 && !bledLight) {
      bledLight = true;
      sec.classList.add('is-lit');
    }
    if (p >= 90) handoffOnce();
  };

  const load = (i) => {
    idx = i; off.src = pairs[i].off; on.src = pairs[i].on;
    bledLight = pairs[i].p >= 90;
    apply(pairs[i].p);
    const name = pairs[i].name;
    dotBtns.forEach((b, k) => b.classList.toggle('is-on', SLOTS[k] === name));
  };
  load(0);

  function switchTo(i) {
    if (i === idx || !pairs[i]) return;
    cancelAnimationFrame(tween);
    wrap.classList.add('is-swap');
    setTimeout(() => { load(i); wrap.classList.remove('is-swap'); }, RM ? 0 : 260);
  }

  /* ---------------------------------------------------------------- drag */
  const fromEvent = (e) => {
    const r = frame.getBoundingClientRect();
    apply(((e.clientX - r.left) / Math.max(1, r.width)) * 100);
  };
  let dragging = false;
  handle.addEventListener('pointerdown', (e) => { dragging = true; nudged = true; cancelAnimationFrame(tween); handle.setPointerCapture(e.pointerId); e.preventDefault(); });
  handle.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
  const endDrag = (e) => { if (!dragging) return; dragging = false; try { handle.releasePointerCapture(e.pointerId); } catch (err) {} };
  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);
  frame.addEventListener('pointerdown', (e) => {
    if (e.target === handle || handle.contains(e.target)) return;
    nudged = true; cancelAnimationFrame(tween); fromEvent(e);
  });
  handle.addEventListener('keydown', (e) => {
    let n = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n = pairs[idx].p + 4;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n = pairs[idx].p - 4;
    else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = 100;
    if (n === null) return;
    e.preventDefault(); nudged = true; cancelAnimationFrame(tween); apply(n);
  });

  /* her liked hint: the handle slides on its own to 42% (2s) and holds */
  const nudge = () => {
    if (nudged || RM) return;
    nudged = true;
    const from = pairs[idx].p, to = 42, t0 = performance.now(), dur = 2000;
    const step = (now) => {
      const k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      apply(from + (to - from) * e);
      if (k >= 1) handoffOnce();
      else tween = requestAnimationFrame(step);
    };
    tween = requestAnimationFrame(step);
  };
  P2.onView(frame, .45, () => setTimeout(nudge, 500));

  /* scrolled past with no drag at all: the section's bottom passes the
     middle of the viewport. Checked on scroll/resize, guarded by signalSent
     so it never fires twice or fights the drag path above. */
  const checkScrollPast = () => {
    if (signalSent) { removeEventListener('scroll', checkScrollPast); removeEventListener('resize', checkScrollPast); return; }
    const r = sec.getBoundingClientRect();
    if (r.bottom < innerHeight / 2) handoffOnce();
  };
  addEventListener('scroll', checkScrollPast, { passive: true });
  addEventListener('resize', checkScrollPast, { passive: true });
  checkScrollPast();

  /* -------------------------------------------------------------- signal */
  P2.signal.station('reliability', { receive() { /* decoration only: the incoming line has nowhere lit to land yet */ } });
})();
