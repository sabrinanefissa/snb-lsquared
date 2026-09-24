/* phone2 2.3 Who we are: "Five words, one refresh"
   Spec: scratchpad/mobile-plan-blind.md, section 2.3.
   Five stacked panels, each one app-h: word / photo / line. Each photo is
   revealed by an orange scanline scrubbed by how far it has entered the
   screen, finished by 40% in; the word resolves from a blocky pixel-style
   layer to the crisp one (opacity only) once its scanline finishes. Words,
   lines and photos are read from the existing .strip elements (content.js
   "why ..."), which are then hidden. The last panel's scanline keeps going
   past its photo and becomes the Industries progress line. */
(() => {
  'use strict';
  const P2 = window.P2, sec = document.getElementById('strips');
  if (!P2 || !sec) return;
  const RM = P2.RM, clamp = P2.clamp;
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const bgUrl = (s) => { const m = /url\((['"]?)(.*?)\1\)/.exec(s || ''); return m ? m[2] : ''; };
  /* .strip__say holds two content.js phrases joined by edit.js with a <br>
     between them (put() in js/edit.js). Read as one running line: a <br>
     becomes a space, not nothing, so "27001." and "Enterprise-grade" (or
     "you." and "Keeping") don't run together with no gap. */
  const sayText = (b) => {
    const say = b.querySelector('.strip__say');
    if (!say) return '';
    let out = '';
    say.childNodes.forEach((n) => { out += n.nodeName === 'BR' ? ' ' : n.textContent; });
    return out.replace(/\s+/g, ' ').trim();
  };

  const titleText = ((sec.querySelector('.strips__title') || {}).textContent || 'Who we are.').trim();
  const items = [...sec.querySelectorAll('.strip')].map((b) => ({
    word: ((b.querySelector('.strip__word') || {}).textContent || '').trim(),
    line: sayText(b),
    photo: bgUrl((b.querySelector('.strip__ph') || {}).style.backgroundImage)
  }));
  if (!items.length) return;   /* nothing to build from: r76 keeps showing */
  const DEF_AR = [390 / 219, 1, 390 / 333, 1, 1];

  /* ---------------------------------------------------------------- DOM */
  const box = el('div', 'p2w');
  const panels = items.map((it, i) => {
    const panel = el('div', 'p2w__panel');
    if (i === 0) {
      const t = el('h2', 'p2-title p2w__title'); t.textContent = titleText;
      panel.appendChild(t);
    }
    const word = el('div', 'p2w__word');
    const blocky = el('span', 'p2w__blocky'); blocky.textContent = it.word; blocky.setAttribute('aria-hidden', 'true');
    const crisp = el('span', 'p2w__crisp'); crisp.textContent = it.word;
    word.append(blocky, crisp);
    const photo = el('div', 'p2w__photo'); photo.setAttribute('aria-hidden', 'true');
    photo.style.aspectRatio = String(DEF_AR[i] || 1);
    if (it.photo) photo.style.backgroundImage = 'url("' + it.photo + '")';
    const rule = el('i', 'p2w__rule'); rule.setAttribute('aria-hidden', 'true');
    const line = el('p', 'p2w__line'); line.textContent = it.line;
    /* rule and line are wrapped together so space-evenly on the panel treats
       them as one "foot" group under the photo, instead of spacing the rule
       away from its own copy as a separate flex child */
    const foot = el('div', 'p2w__foot'); foot.append(rule, line);
    panel.append(word, photo, foot);
    box.appendChild(panel);
    return { panel, photo, word, rule, k: -1, scan: null };
  });
  sec.appendChild(box);
  P2.sec('strips');

  /* real aspect ratio once each photo is known, so nothing is ever cropped */
  panels.forEach((p, i) => {
    const url = items[i].photo; if (!url) return;
    const img = new Image();
    img.onload = () => { if (img.naturalWidth && img.naturalHeight) p.photo.style.aspectRatio = img.naturalWidth + '/' + img.naturalHeight; };
    img.src = url;
  });

  /* ---------------------------------------------------------------- reveal: a scanline per photo, scrubbed by how far it has entered the screen */
  panels.forEach((p) => { p.scan = P2.scanline(p.photo, { scrub: true }); });
  const kOf = (photoEl) => {
    const r = photoEl.getBoundingClientRect(), h = Math.max(1, r.height);
    const vis = clamp(innerHeight - r.top, 0, h);
    return clamp((vis / h) / .4, 0, 1);
  };

  /* every panel leaves its rule lit at rest once the scanline finishes; the
     last panel's rule (the "Scale" word) is the one that keeps going and
     hands the line off to Industries, instead of a separate temp line that
     fades away after the handoff. */
  let handed = false, live = false, raf = 0;
  const handoffLine = () => {
    if (handed) return; handed = true;
    const last = panels[panels.length - 1];
    last.rule.classList.add('is-live');
    const r = last.rule.getBoundingClientRect();
    const rect = { left: r.left, top: r.top, width: r.width, height: r.height };
    P2.signal.handoff('who', { shape: 'line', rect });
  };

  const step = () => {
    raf = 0;
    let anyLeft = false;
    panels.forEach((p, i) => {
      const k = kOf(p.photo);
      if (k !== p.k) {
        p.k = k; p.scan.set(k);
        if (k >= 1) {
          p.word.classList.add('is-done'); p.rule.classList.add('is-on');
          if (i === panels.length - 1) handoffLine();
        }
      }
      if (k < 1) anyLeft = true;
    });
    if (live && anyLeft) raf = requestAnimationFrame(step);
  };
  const kick = () => { if (live && !raf) raf = requestAnimationFrame(step); };

  if (RM) {
    panels.forEach((p) => { p.scan.set(1); p.word.classList.add('is-done'); p.rule.classList.add('is-on'); });
    handoffLine();
  } else {
    new IntersectionObserver(([e]) => { live = e.isIntersecting; if (live) kick(); }, { rootMargin: '15% 0px' }).observe(sec);
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', kick, { passive: true });
    kick();
  }

  /* ---------------------------------------------------------------- the pixels from the statement land on the first photo */
  let got = null;
  P2.signal.station('who', { receive(state) { got = state || null; } });
  P2.onView(panels[0].panel, .3, () => {
    if (RM || !got) return;
    const r = panels[0].photo.getBoundingClientRect();
    for (let i = 0; i < 7; i++) {
      const d = el('i', 'p2w__dust'); document.body.appendChild(d);
      const x = r.left + r.width * (.15 + Math.random() * .7);
      d.style.left = x + 'px'; d.style.top = (r.top - 30) + 'px';
      d.animate([
        { opacity: 0, transform: 'translateY(0)' },
        { opacity: 1, offset: .25, transform: 'translateY(10px)' },
        { opacity: 0, transform: 'translateY(' + (r.height * .6).toFixed(0) + 'px)' }
      ], { duration: 700 + Math.random() * 300, delay: i * 60, easing: 'ease-in' }).finished.then(() => d.remove()).catch(() => d.remove());
    }
  });
})();
