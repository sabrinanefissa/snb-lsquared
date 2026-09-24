/* phone2 extras (r96). Phone only (html.p2), nothing runs without window.P2.
   1. The orange pixel on the right edge: a hairline down the right edge of
      the screen with one glowing #FF9900 pixel that moves down as the page
      scrolls, and a faint tick where each section starts. Decoration only:
      pointer-events none, 5px from the edge, never over text. Hidden until
      the visitor first scrolls (the hero's first seconds).
   2. The blue statement (the r76 section, words and tap-to-place logo
      untouched): as it arrives its lines rise in one after another, 120ms
      apart, once; then a small "Tap to place your logo" hint, in its own
      pill near the bottom with a softly pulsing orange pixel, shows for about
      2s (or until the first tap) so people know the screen is interactive.
   Reduced motion: the pixel still follows the scroll (plain position
   updates, no easing), the lines are there from the start, the hint shows
   without the pulse. */
(() => {
  'use strict';
  const P2 = window.P2;
  if (!P2) return;
  const RM = P2.RM, root = document.documentElement;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  /* ------------------------------------------------------------ 1. the pixel on the right edge */
  (() => {
    const rail = el('div', 'p2x-rail'); rail.setAttribute('aria-hidden', 'true');
    const track = el('i', 'p2x-rail__track'), px = el('i', 'p2x-rail__px');
    rail.append(track, px);
    document.body.appendChild(rail);
    let H = 0, max = 1, raf = 0, shown = false;
    const ticks = () => {
      rail.querySelectorAll('.p2x-rail__tick').forEach((t) => t.remove());
      const secs = [...document.querySelectorAll('main > section')].filter((s) => s.getClientRects().length && s.offsetHeight > 40);
      secs.slice(1).forEach((s) => {
        const top = s.getBoundingClientRect().top + scrollY;
        const k = P2.clamp(top / max, 0, 1);
        const t = el('i', 'p2x-rail__tick'); t.style.transform = 'translateY(' + (k * H).toFixed(1) + 'px)';
        rail.insertBefore(t, px);
      });
    };
    const place = () => {
      raf = 0;
      const k = P2.clamp(scrollY / max, 0, 1);
      px.style.transform = 'translateY(' + (k * H).toFixed(1) + 'px)';
      if (!shown && scrollY > 24) { shown = true; rail.classList.add('is-on'); }
    };
    const measure = () => {
      H = track.offsetHeight;
      max = Math.max(1, root.scrollHeight - innerHeight);
      ticks(); place();
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(place); }, { passive: true });
    let rt = 0;
    const later = () => { clearTimeout(rt); rt = setTimeout(measure, 150); };
    addEventListener('resize', later, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(later).observe(document.body);
    addEventListener('load', measure);
    measure();
  })();

  /* ------------------------------------------------------------ 2. the statement */
  (() => {
    const sec = document.getElementById('statement');
    const h = sec && sec.querySelector('.statement__h');
    if (!h) return;
    /* each word in its own span (the text itself, and the <br>, stay as they are) */
    const words = [];
    [...h.childNodes].forEach((n) => {
      if (n.nodeType !== 3) return;
      const f = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(w)); return; }
        const s = el('span', 'p2x-w', w); words.push(s); f.appendChild(s);
      });
      n.replaceWith(f);
    });
    if (!words.length) return;
    /* the line each word sits on, as the browser wrapped it */
    const lines = () => {
      let i = -1, last = null;
      words.forEach((w) => { const t = w.offsetTop; if (last === null || Math.abs(t - last) > 4) { i++; last = t; } w.style.setProperty('--i', i); });
      return i + 1;
    };
    let n = lines();

    /* the hint: a pixel and one short line, in one pill near the bottom */
    const hint = el('div', 'p2x-hint'); hint.setAttribute('aria-hidden', 'true');
    hint.append(el('i', 'p2x-hint__px'), el('span', 'p2x-hint__t', 'Tap to place your logo'));
    sec.appendChild(hint);
    let hintT = 0, hintDone = false;
    const hideHint = () => { if (hintDone) return; hintDone = true; clearTimeout(hintT); hint.classList.remove('is-on'); setTimeout(() => hint.remove(), 600); };
    sec.addEventListener('click', hideHint);   /* r97: only a real tap, not the scroll */

    const go = () => {
      n = lines();
      sec.classList.add('p2x-in');
      const wait = RM ? 200 : (n - 1) * 120 + 650;
      hintT = setTimeout(() => {
        if (hintDone) return;
        hint.classList.add('is-on');
        hintT = setTimeout(hideHint, 2200);
      }, wait);
    };
    if (sec.getBoundingClientRect().bottom < 0) { sec.classList.add('p2x-in'); hideHint(); return; }   /* landed below it: nothing to announce */
    if (!RM) sec.classList.add('p2x-armed');
    P2.onView(sec, .45, go);
    let rt = 0;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { n = lines(); }, 150); }, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { n = lines(); });
  })();
})();
