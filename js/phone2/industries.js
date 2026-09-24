/* phone2 2.4 Industries: "One screen, four channels"
   Spec: scratchpad/mobile-plan-blind.md, section 2.4. One view: title (two
   lines) / a 4:5 photo edge to edge, bottom crop allowed / a 2px orange
   progress line under it / the four names in one row (current white, the
   rest at 50%) / "Explore all industries" 4px under the names.
   Data: window.LSQ_INDLIST, built by js/page.js from content.js (name,
   desktop photo, optional phone photo). The phone photo wins; when a slide
   has none the desktop photo is used at full width, so the same "bottom
   crop allowed" rule that already covers a too-tall photo also covers a
   slide with no phone photo of its own (Sabrina's note for Enterprise).
   Timing: content.js "industries seconds per photo" (window.LSQ), the same
   number the desktop carousel already uses; not the spec's flat 3.5s.
   Signal: receives {shape:'line'} from Who we are (decoration: a short fly
   onto the progress line if both are on screen) and hands off {shape:'line',
   angle:90} to the CEO section as the section leaves. */
(() => {
  'use strict';
  const P2 = window.P2;
  const sec = document.getElementById('industries');
  if (!P2 || !sec) return;
  const RM = P2.RM;
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

  /* ---------------------------------------------------------------- data */
  const DEF = [
    { name: 'Restaurants', photo: 'assets/ind-restaurants.webp?v=r57', phone: 'assets/m/ind-restaurants.webp?v=m1' },
    { name: 'Retail', photo: 'assets/ind-retail.webp?v=r56', phone: 'assets/m/ind-retail.webp?v=m1' },
    { name: 'Hospitality', photo: 'assets/ind-hospitality.webp?v=r50', phone: 'assets/m/ind-hospitality.webp?v=m1' },
    { name: 'Manufacturing', photo: 'assets/mfg-on.webp?v=r50', phone: 'assets/m/mfg-on.webp?v=m1' }
  ];
  const LIST = (window.LSQ_INDLIST && window.LSQ_INDLIST.length) ? window.LSQ_INDLIST : DEF;
  if (!LIST.length) return;
  const srcOf = (d) => d.phone || d.photo;
  LIST.forEach((d) => { const im = new Image(); im.decoding = 'async'; im.src = srcOf(d); });

  /* ---------------------------------------------------------------- dom */
  const oldTitle = sec.querySelector('#ind-title, .ind__title');
  const oldLink = sec.querySelector('.ind__cta');
  const wrap = el('div', 'p2i'); wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-roledescription', 'carousel');
  const title = el('h2', 'p2-title p2i__title');
  const titleTxt = (oldTitle && oldTitle.textContent.trim()) || 'Different industries. One standard.';
  {
    const dot = titleTxt.indexOf('. ');
    if (dot > 0 && dot < titleTxt.length - 2) {
      title.appendChild(document.createTextNode(titleTxt.slice(0, dot + 1)));
      title.appendChild(document.createElement('br'));
      title.appendChild(document.createTextNode(titleTxt.slice(dot + 2)));
    } else title.textContent = titleTxt;
  }
  const live = el('p', 'sr-only'); live.setAttribute('aria-live', 'polite');
  const stage = el('div', 'p2i__stage');
  const front = el('img', 'p2i__front'); front.alt = ''; front.decoding = 'async';
  const back = el('img', 'p2i__back'); back.alt = ''; back.decoding = 'async'; back.setAttribute('aria-hidden', 'true');
  stage.append(front, back);
  const bar = el('div', 'p2i__bar');
  const fill = el('i', 'p2i__fill'); fill.setAttribute('aria-hidden', 'true');
  bar.appendChild(fill);
  const names = el('div', 'p2i__names');
  const btns = LIST.map((d, i) => {
    const b = el('button', 'p2i__name'); b.type = 'button'; b.textContent = d.name; b.setAttribute('aria-label', d.name);
    b.addEventListener('click', () => { goTo(i, i > cur ? 1 : -1); arm(); });
    names.appendChild(b); return b;
  });
  const link = el('a', 'p2i__link');
  link.href = (oldLink && oldLink.getAttribute('href')) || 'industries.html';
  link.textContent = (oldLink && oldLink.textContent.trim()) || 'Explore all industries';
  wrap.append(title, live, stage, bar, names, link);
  sec.prepend(wrap);
  P2.sec('industries');

  /* ---------------------------------------------------------------- carousel */
  let cur = -1, busy = false, secs = 0;
  const EVERY = (() => {
    const s = parseFloat((window.LSQ || {})['industries seconds per photo']);
    return (isFinite(s) && s >= 2 ? s : 5) * 1000;
  })();
  bar.style.setProperty('--every', EVERY + 'ms');

  const runFill = () => {
    fill.style.transition = 'none'; fill.style.transform = 'scaleX(0)';
    void fill.offsetWidth;
    if (RM) return;
    fill.style.transition = 'transform ' + EVERY + 'ms linear';
    fill.style.transform = 'scaleX(1)';
  };

  const paint = (n) => {
    btns.forEach((b, i) => b.classList.toggle('is-on', i === n));
    live.textContent = LIST[n].name;
  };

  function goTo(n, dir) {
    n = (n + LIST.length) % LIST.length;
    if (n === cur || busy) return;
    const first = cur === -1;
    cur = n; paint(n);
    if (first || RM) {
      front.src = srcOf(LIST[n]);
      back.style.transform = 'translateX(100%)';
      runFill();
      return;
    }
    busy = true;
    back.src = srcOf(LIST[n]);
    back.style.transition = 'none';
    back.style.transform = 'translateX(' + (dir * 100) + '%)';
    void back.offsetWidth;
    back.style.transition = ''; front.style.transition = '';
    back.style.transform = 'translateX(0)';
    front.style.transform = 'translateX(' + (-dir * 100) + '%)';
    setTimeout(() => {
      front.src = back.src;
      front.style.transition = 'none'; front.style.transform = 'none';
      back.style.transition = 'none'; back.style.transform = 'translateX(100%)';
      void front.offsetWidth;
      front.style.transition = ''; back.style.transition = '';
      busy = false;
    }, 520);
    runFill();
  }

  /* auto-advance, on-screen only, never under reduced motion */
  let timer = 0, inView = false;
  function arm() {
    clearTimeout(timer); timer = 0;
    if (inView && !document.hidden && !RM) timer = setTimeout(() => { goTo(cur + 1, 1); arm(); }, EVERY);
  }
  if (!RM) {
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; arm(); }, { threshold: .5 }).observe(stage);
    document.addEventListener('visibilitychange', arm);
  }

  /* swipe: the finger drags the front photo; the likely next/prev image
     loads into the back layer once the drag direction is clear */
  let sx = 0, sy = 0, dragging = false, dir0 = 0, peeked = false;
  const endPeek = () => {
    if (!peeked) return; peeked = false;
    front.style.transition = ''; back.style.transition = '';
    front.style.transform = 'none'; back.style.transform = 'translateX(100%)';
  };
  stage.addEventListener('pointerdown', (e) => {
    if (busy) return;
    endPeek();
    sx = e.clientX; sy = e.clientY; dragging = true; dir0 = 0;
    front.style.transition = 'none';
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 14) { dragging = false; front.style.transform = 'none'; return; }
    if (!dir0 && Math.abs(dx) > 8) { dir0 = dx < 0 ? 1 : -1; back.src = srcOf(LIST[(cur + dir0 + LIST.length) % LIST.length]); back.style.transition = 'none'; back.style.transform = 'translateX(' + (dir0 * 100) + '%)'; }
    front.style.transform = 'translateX(' + dx + 'px)';
    if (dir0) back.style.transform = 'translateX(calc(' + (dir0 * 100) + '% + ' + dx + 'px))';
  });
  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - sx;
    front.style.transition = '';
    if (Math.abs(dx) > 44 && dir0) { goTo(cur + dir0, dir0); arm(); }
    else { front.style.transform = 'none'; if (dir0) { back.style.transition = ''; back.style.transform = 'translateX(100%)'; } }
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', () => { dragging = false; front.style.transform = 'none'; });

  /* her liked peek: on first entry the current photo slides 34% left and
     shows the next set behind it, and holds until touched */
  P2.onView(stage, .5, () => {
    if (RM || peeked) return;
    setTimeout(() => {
      if (dragging || busy) return;
      const n = (cur + 1) % LIST.length;
      back.src = srcOf(LIST[n]);
      back.style.transition = 'none'; back.style.transform = 'translateX(100%)';
      void back.offsetWidth;
      peeked = true;
      front.style.transition = 'transform 700ms ' + P2.EASE_OUT;
      back.style.transition = 'transform 700ms ' + P2.EASE_OUT;
      front.style.transform = 'translateX(-34%)';
      back.style.transform = 'translateX(66%)';
    }, 500);
  });

  /* -------------------------------------------------------------- signal */
  let gotFrom = null;
  P2.signal.station('industries', {
    receive(state) {
      gotFrom = state || {};
      if (RM || !gotFrom.rect) return;
      /* deferred: fly only once the bar itself (the actual landing spot) is in view */
      P2.onView(bar, .35, () => {
        const r = bar.getBoundingClientRect();
        if (r.width) P2.signal.fly(gotFrom.rect, { left: r.left, top: r.top, width: r.width, height: r.height }, { shape: 'line', dur: 420, toOpacity: 0 });
      });
    }
  });
  let shown = false, handed = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) shown = true;
    else if (shown && !handed && e.boundingClientRect.top < 0) {
      handed = true;
      const r = bar.getBoundingClientRect();
      P2.signal.handoff('industries', { shape: 'line', angle: 90, rect: { left: r.left, top: r.top, width: r.width, height: r.height } });
    }
  }, { threshold: 0 }).observe(sec);

  goTo(0, 1);
  arm();
})();
