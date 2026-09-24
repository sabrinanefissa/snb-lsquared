/* phone2 2.5 CEO quote: "Pixels along the line"
   Spec: scratchpad/mobile-plan-blind.md, section 2.5.
   Pinned for about 2.5 app-h. A 2px orange line runs down the centre of the
   screen; orange pixels cluster and fall around a "front" tied to scroll
   progress (canvas). The quote is grey at rest and turns white word by word
   as the front passes (same timing idea as the old fall.js word reveal,
   recoloured for a dark ground per Sabrina's wording flag: grey to white,
   not grey to dark). The name lights last. At the end the fallen pixels
   collect into one orange dot, handed off as the publish dot of the next
   section. Words come from the existing .fall__line / .fall__by (content.js
   "ceo quote" / "ceo name"), read once then the old markup is hidden. */
(() => {
  'use strict';
  const P2 = window.P2, sec = document.getElementById('independent');
  if (!P2 || !sec) return;
  const RM = P2.RM, clamp = P2.clamp;
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

  const quoteText = (((sec.querySelector('.fall__line') || {}).textContent) || 'Twenty years leading teams in software, IT and engineering. Growing businesses is what drives me. The goal is a company that is truly built to last.').trim();
  const byText = (((sec.querySelector('.fall__by') || {}).textContent) || 'Gaj Ratnavel, CEO').trim();

  /* ---------------------------------------------------------------- DOM */
  const stage = el('div', 'p2q__stage');
  const line = el('i', 'p2q__line'); line.setAttribute('aria-hidden', 'true');
  const cv = el('canvas', 'p2q__cv'); cv.setAttribute('aria-hidden', 'true');
  const quote = el('p', 'p2q__quote');
  quoteText.split(/\s+/).forEach((w, i, arr) => {
    const s = document.createElement('i'); s.textContent = w + (i < arr.length - 1 ? ' ' : '');
    quote.appendChild(s);
  });
  const by = el('p', 'p2q__by'); by.textContent = byText;
  const dot = el('i', 'p2q__dot'); dot.setAttribute('aria-hidden', 'true');
  stage.append(line, cv, quote, by, dot);
  sec.prepend(stage);
  P2.sec('independent');

  /* ---------------------------------------------------------------- geometry */
  const N = 28;
  let W = 0, H = 0, D = 1, seeds = [];
  const ctx = cv.getContext('2d');
  const build = () => {
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    D = Math.min(1.5, window.devicePixelRatio || 1);
    cv.width = Math.round(80 * D); cv.height = Math.round(H * D);
    cv.style.height = H + 'px';
    if (!seeds.length) for (let i = 0; i < N; i++) seeds.push([Math.random(), Math.random() - .5]);
  };

  const drawFall = (p) => {
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.clearRect(0, 0, 80, H);
    if (RM || !H) return;
    const front = clamp(p, 0, 1) * H, band = Math.max(60, H * .12);
    for (let i = 0; i < N; i++) {
      const seed = seeds[i][0], jitter = seeds[i][1];
      const off = (((p * 34 + seed * 9) % 1) - .5) * band;
      const y = front + off;
      if (y < -6 || y > H + 6) continue;
      const a = Math.max(0, 1 - Math.abs(off) / (band / 2));
      const x = 40 + jitter * 22, s = 3 + seed * 2;
      ctx.globalAlpha = a * .95;
      ctx.fillStyle = '#FF9900'; ctx.shadowColor = 'rgba(255,153,0,.85)'; ctx.shadowBlur = 6;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  };

  const words = [...quote.querySelectorAll('i')];
  let byLit = false, handed = false;
  const render = (p) => {
    drawFall(p);
    const k = Math.round(clamp((p - .1) / .78, 0, 1) * words.length);
    for (let i = 0; i < words.length; i++) words[i].classList.toggle('is-on', i < k);
    if (p >= .92) { if (!byLit) { byLit = true; by.classList.add('is-on'); } }
    else if (byLit) { byLit = false; by.classList.remove('is-on'); }
    if (!handed && p >= .995) {
      handed = true;
      dot.classList.add('is-on');
      const dr = dot.getBoundingClientRect();
      P2.signal.handoff('ceo', { shape: 'dot', rect: { left: dr.left, top: dr.top, width: dr.width, height: dr.height } });
    } else if (handed && p < .95) {
      handed = false; dot.classList.remove('is-on');
    }
  };

  /* ---------------------------------------------------------------- receive from Industries: a brief arrival pulse at the top of the line */
  P2.signal.station('ceo', {
    receive(state) {
      if (RM || !state || !state.rect) return;
      /* deferred: fly only once the stage (the actual landing spot) is in view */
      P2.onView(stage, .35, () => {
        const r = stage.getBoundingClientRect();
        P2.signal.fly(state.rect, { left: r.left + r.width / 2 - 1, top: r.top + 36, width: 2, height: 2 }, { shape: 'line', dur: 480, toOpacity: 0 });
      });
    }
  });

  /* ---------------------------------------------------------------- go */
  const pg = P2.progress(sec, render);
  const start = () => { build(); pg.force(); };
  start();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { build(); pg.force(); }, 200); }, { passive: true });
})();
