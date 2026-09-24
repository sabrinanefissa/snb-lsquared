/* phone2 2.2 Statement: "Place your logo"
   Spec: scratchpad/mobile-plan-blind.md, section 2.2.
   Blue ground. Two lines of type fill the width with a dim 12px pixel field
   between them. A tap ripples out (300ms) then settles (500ms) into the
   L Squared mark at the tap point; holding and dragging carries the mark
   across the field, the base field glowing under it and cooling behind it
   (a decaying energy grid, the same idea as the desktop pixel field, written
   fresh here since the interaction model differs). Tapping again elsewhere
   moves it. After the first placement the second line brightens to white.
   A ghost hint taps the centre once, and holds, if nothing happens in 2s
   once the section is 60% in view.
   Receives {shape:'edge'} from the hero (decoration only). Hands off
   {shape:'pixels'} to Who we are as the section scrolls out, with the field
   drifting down and fading. Words come from the existing .statement__h
   (content.js "statement"), read once then the old markup is hidden. */
(() => {
  'use strict';
  const P2 = window.P2, sec = document.getElementById('statement');
  if (!P2 || !sec) return;
  const RM = P2.RM, clamp = P2.clamp;
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

  /* ---------------------------------------------------------------- words */
  const src = sec.querySelector('.statement__h');
  const lines = (() => {
    const out = [];
    if (src) {
      let cur = '';
      src.childNodes.forEach((n) => {
        if (n.nodeName === 'BR') { out.push(cur.trim()); cur = ''; }
        else cur += n.textContent;
      });
      out.push(cur.trim());
    }
    const clean = out.filter(Boolean);
    return clean.length >= 2 ? clean : ['We own the platform.', 'You own the network.'];
  })();

  /* ---------------------------------------------------------------- DOM */
  const cv = el('canvas', 'p2s__cv'); cv.setAttribute('aria-hidden', 'true');
  const l1 = el('p', 'p2s__l1'); l1.textContent = lines[0];
  const mask = el('canvas', 'p2s__mask'); mask.setAttribute('aria-hidden', 'true');
  const l2 = el('p', 'p2s__l2'); l2.textContent = lines[1];
  const ripple = el('i', 'p2s__ripple'); ripple.setAttribute('aria-hidden', 'true');
  sec.append(cv, l1, mask, l2, ripple);
  P2.sec('statement');

  /* ---------------------------------------------------------------- the field: a dim blue 12px grid, clear of the two lines */
  let W = 0, H = 0, D = 1, S = 12, cols = 0, rows = 0, ox = 0, oy = 0, energy = null;
  const band = { top: 0, bottom: 0 };
  const ctx = cv.getContext('2d');
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };

  const layout = () => {
    const r = sec.getBoundingClientRect();
    W = r.width; H = r.height;
    D = Math.min(1.5, window.devicePixelRatio || 1);
    cv.width = Math.round(W * D); cv.height = Math.round(H * D);
    ctx.setTransform(D, 0, 0, D, 0, 0);
    S = W < 360 ? 11 : 12;
    cols = Math.ceil(W / S) + 1; rows = Math.ceil(H / S) + 1;
    ox = (W - (cols - 1) * S) / 2 - S / 2; oy = (H - (rows - 1) * S) / 2 - S / 2;
    energy = new Float32Array(cols * rows);
    const b1 = l1.getBoundingClientRect(), b2 = l2.getBoundingClientRect();
    band.top = b1.bottom - r.top + 14; band.bottom = b2.top - r.top - 14;
    if (band.bottom < band.top) { const m = (band.top + band.bottom) / 2; band.top = m - 10; band.bottom = m + 10; }
    layoutMask();
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const q = S - 3;
    for (let j = 0; j < rows; j++) {
      const y = oy + j * S;
      if (y < band.top - S || y > band.bottom + S) continue;
      for (let i = 0; i < cols; i++) {
        const x = ox + i * S, n = j * cols + i, e = energy ? energy[n] : 0;
        ctx.globalAlpha = .14 + e * .72;
        ctx.fillStyle = e > .03 ? '#CFE9FB' : '#3E77A8';
        rr(ctx, x, y, q, q, 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  /* ---------------------------------------------------------------- the mark: sampled from the real logo file, drawn as pixel cells.
     The source file is a full lockup (square mark + wordmark) at 1926x289.
     Sampling the whole thing at low cell counts crushes the wordmark to a
     couple of rows, so only the wordmark region is cropped out first (the
     "L SQUARED" letterforms, measured against the real file's alpha bounds)
     and sampled at ~6px cells so the letters read at ~7+ cells tall. */
  const CROP = { x: 384, y: 33, w: 1542, h: 222 };
  let maskCols = 0, maskRows = 0, maskOn = null, boxW = 0, boxH = 0, imgReady = false;
  const img = new Image();
  img.onload = () => { imgReady = true; layoutMask(); if (placed) { paintMask(1); place(px, py); mask.style.opacity = '1'; } };
  img.src = 'assets/lsquared-logo.png?e=1';
  const layoutMask = () => {
    if (!imgReady || !W) return;
    boxW = clamp(W * .82, 140, W - 48);
    boxH = boxW * (CROP.h / CROP.w);
    if (boxH > (band.bottom - band.top) * .78) { boxH = (band.bottom - band.top) * .78; boxW = boxH * (CROP.w / CROP.h); }
    maskCols = Math.max(12, Math.round(boxW / 6));
    maskRows = Math.max(4, Math.round(maskCols * (CROP.h / CROP.w)));
    const off = document.createElement('canvas'); off.width = maskCols; off.height = maskRows;
    const og = off.getContext('2d');
    og.drawImage(img, CROP.x, CROP.y, CROP.w, CROP.h, 0, 0, maskCols, maskRows);
    const d = og.getImageData(0, 0, maskCols, maskRows).data;
    maskOn = new Uint8Array(maskCols * maskRows);
    for (let k = 0; k < maskCols * maskRows; k++) maskOn[k] = d[k * 4 + 3] > 100 ? 1 : 0;
    mask.width = Math.round(boxW * D); mask.height = Math.round(boxH * D);
    mask.style.width = boxW + 'px'; mask.style.height = boxH + 'px';
  };
  const mg = mask.getContext('2d');
  /* the mark lights orange first, then cools to white: t is 0 (just placed,
     hot orange) to 1 (settled, white). Dragging holds t at 0 so the carried
     mark reads as the drifting pixels staying orange. */
  const ORANGE = [255, 153, 0], WHITE = [255, 246, 228];
  const warmColor = (t) => {
    const r = Math.round(ORANGE[0] + (WHITE[0] - ORANGE[0]) * t);
    const g = Math.round(ORANGE[1] + (WHITE[1] - ORANGE[1]) * t);
    const b = Math.round(ORANGE[2] + (WHITE[2] - ORANGE[2]) * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  };
  const paintMask = (t = 1) => {
    if (!maskOn) return;
    mg.setTransform(D, 0, 0, D, 0, 0);
    mg.clearRect(0, 0, boxW, boxH);
    const cw = boxW / maskCols, ch = boxH / maskRows;
    mg.shadowColor = t >= 1 ? 'rgba(255,255,255,.9)' : 'rgba(255,153,0,' + (0.9 - t * 0.15).toFixed(2) + ')';
    mg.shadowBlur = cw * .9;
    mg.fillStyle = warmColor(t);
    for (let j = 0; j < maskRows; j++) for (let i = 0; i < maskCols; i++) {
      if (!maskOn[j * maskCols + i]) continue;
      mg.fillRect(i * cw + .5, j * ch + .5, cw - 1, ch - 1);
    }
    mg.shadowBlur = 0;
  };
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  let warmRaf = 0;
  const warmToWhite = () => {
    cancelAnimationFrame(warmRaf);
    if (RM) { paintMask(1); return; }
    paintMask(0);
    const t0 = performance.now();
    const tick = (now) => {
      const t = clamp((now - t0) / 600, 0, 1);
      paintMask(easeOut(t));
      if (t < 1) warmRaf = requestAnimationFrame(tick);
    };
    warmRaf = requestAnimationFrame(tick);
  };

  /* ---------------------------------------------------------------- placement */
  let placed = false, px = 0, py = 0, dragging = false, raf = 0;
  const clampPlace = (x, y) => {
    const hw = (boxW || 60) / 2, hh = (boxH || 40) / 2;
    const midY = (band.top + band.bottom) / 2;
    const top = Math.max(band.top + hh, hh + 4), bot = Math.min(band.bottom - hh, H - hh - 4);
    return [clamp(x, hw + 10, W - hw - 10), bot > top ? clamp(y, top, bot) : midY];
  };
  const place = (x, y) => {
    [px, py] = clampPlace(x, y);
    mask.style.transform = 'translate(' + (px - boxW / 2).toFixed(1) + 'px,' + (py - boxH / 2).toFixed(1) + 'px)';
    if (RM || !energy) return;
    const hw = (boxW || 60) / 2, hh = (boxH || 40) / 2;
    const i0 = Math.max(0, Math.floor((px - hw - ox) / S)), i1 = Math.min(cols - 1, Math.ceil((px + hw - ox) / S));
    const j0 = Math.max(0, Math.floor((py - hh - oy) / S)), j1 = Math.min(rows - 1, Math.ceil((py + hh - oy) / S));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) energy[j * cols + i] = 1;
    kick();
  };
  const loop = () => {
    raf = 0;
    let any = false;
    for (let n = 0; n < energy.length; n++) { if (energy[n] > .003) { energy[n] *= .9; any = true; } else energy[n] = 0; }
    draw();
    if (any || dragging) raf = requestAnimationFrame(loop);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  const doRipple = (x, y) => {
    if (RM) return;
    ripple.style.left = x + 'px'; ripple.style.top = y + 'px';
    ripple.getAnimations().forEach((a) => a.cancel());
    ripple.animate([{ opacity: .85, transform: 'translate(-50%,-50%) scale(.15)' }, { opacity: 0, transform: 'translate(-50%,-50%) scale(2.4)' }], { duration: 300, easing: P2.EASE_OUT });
  };
  let warmTO = 0;
  const settle = (x, y) => {
    place(x, y);
    if (!placed) { placed = true; l2.classList.add('is-bright'); }
    mask.getAnimations().forEach((a) => a.cancel());
    clearTimeout(warmTO);
    if (RM) { paintMask(1); mask.style.opacity = '1'; return; }
    paintMask(0);
    mask.style.opacity = '0';
    mask.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 300, easing: P2.EASE_OUT, fill: 'forwards' })
      .finished.then(() => { mask.style.opacity = '1'; }).catch(() => {});
    /* the colour warm-up starts as the mask starts fading in (delay 300),
       not the moment of the tap, so the orange is visible during the reveal
       instead of hidden behind zero opacity for its first half. */
    warmTO = setTimeout(warmToWhite, 300);
  };
  const tapAt = (x, y) => { doRipple(x, y); settle(x, y); };

  /* ---------------------------------------------------------------- pointer: tap places, hold and drag carries it */
  let downX = 0, downY = 0, moved = false;
  sec.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    downX = e.clientX; downY = e.clientY; moved = false; dragging = true;
    const r = sec.getBoundingClientRect();
    place(e.clientX - r.left, e.clientY - r.top);
  });
  sec.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) moved = true;
    if (!moved) return;
    const r = sec.getBoundingClientRect();
    place(e.clientX - r.left, e.clientY - r.top);
    if (!placed) { placed = true; l2.classList.add('is-bright'); }
    clearTimeout(warmTO); cancelAnimationFrame(warmRaf); paintMask(0); mask.style.opacity = '1';
  }, { passive: true });
  const endDrag = (e) => {
    if (!dragging) return; dragging = false;
    if (!moved) { const r = sec.getBoundingClientRect(); tapAt(e.clientX - r.left, e.clientY - r.top); }
    else { warmToWhite(); }
  };
  ['pointerup', 'pointercancel'].forEach((n) => sec.addEventListener(n, endDrag, { passive: true }));

  /* ---------------------------------------------------------------- ghost hint */
  P2.onView(sec, .6, () => {
    if (placed) return;
    P2.ghost(sec, { x: .5, y: .5, delay: 2000, onTap: () => tapAt(W / 2, (band.top + band.bottom) / 2) });
  });

  /* ---------------------------------------------------------------- receive from hero: a soft arrival flash */
  P2.signal.station('statement', {
    receive(state) {
      if (RM || !state || !state.rect) return;
      /* deferred: fly only once the section is actually in view, so the
         visitor sees the orange arrive instead of it landing off screen */
      P2.onView(sec, .35, () => {
        if (!W) return;
        const r = sec.getBoundingClientRect();
        P2.signal.fly(state.rect, { left: r.left, top: r.top - 4, width: W, height: 4 }, { shape: 'edge', dur: 500, toOpacity: 0 });
      });
    }
  });

  /* ---------------------------------------------------------------- hand off as the section scrolls out: the field drifts down and fades */
  let handed = false;
  new IntersectionObserver(([e]) => {
    if (handed || e.isIntersecting || e.boundingClientRect.top >= 0) return;
    handed = true;
    if (placed && !RM) {
      const t = mask.style.transform;
      mask.animate([{ transform: t, opacity: 1 }, { transform: t + ' translateY(70px)', opacity: 0 }], { duration: 520, easing: P2.EASE_IO, fill: 'forwards' });
    }
    const r = sec.getBoundingClientRect();
    P2.signal.handoff('statement', { shape: 'pixels', rect: { left: r.left + W * .3, top: r.bottom - 30, width: W * .4, height: 30 } });
  }, { threshold: 0 }).observe(sec);

  /* ---------------------------------------------------------------- go */
  const start = () => {
    layout(); draw();
    let rt = 0;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); draw(); if (placed) { place(px, py); paintMask(1); } }, 200); }, { passive: true });
  };
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve()).then(start);
})();
