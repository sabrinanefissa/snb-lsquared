/* phone2 section 9, Figures: "The ticker wall".
   Spec: scratchpad/mobile-plan-blind.md, section 2.9. Nine single-line
   tickers fill the screen (no columns, no counters); each one drifts
   sideways tied to scroll, alternating direction, so the wall reads like a
   bank of signage tickers as the thumb scrolls. The pixel field behind them
   (js/pixfield.js, generic, already tap-to-place on any phone touch) and the
   figure lines themselves (content.js "figure 1".."figure N", written by
   js/edit.js into the real .beats__fig / .beats__word nodes) are left alone;
   this file only restyles and re-times the existing .beats__line elements,
   it does not rebuild them, so every content.js edit keeps working.
   Fix 13: the section is locked to one app-h (css), every line is measured
   and sized to fit its longest sibling in a single row (no wrap, no orphan
   row), the sideways drift is capped at +/-6% of the stage width so it
   reads centred rather than ragged, and the pixel field is hidden behind
   this section only (css) because it read as a rendering glitch over the
   type. One ticker (the one with a "+", normally 50,000+) carries the
   orange signal colour permanently, so the thread does not go dark here,
   and it pulses once when the section relays a handoff.
   Signal: this section only relays. Trusted by hands off to it (by default,
   only once "Take your place." is tapped); it passes the same state straight
   to Contact. */
(() => {
  'use strict';
  const P2 = window.P2, sec = document.getElementById('numbers');
  if (!P2 || !sec) return;
  const RM = P2.RM;
  const stage = sec.querySelector('.beats__stage');
  const lines = stage ? [...stage.querySelectorAll('.beats__line')] : [];
  if (!stage || !lines.length) return;   /* leave the r76 markup showing rather than build on nothing */

  P2.sec('numbers');
  sec.classList.add('p2f');

  /* fix 13: a small orange touch so the signal is visible here. Picked by a
     "+" in the text (the screens-managed figure) rather than a fixed index,
     so a content.js reorder or edit still lands on a sensible line. */
  const orangeLine = lines.find((l) => /\+/.test(l.textContent)) || lines[0];
  const orangeFig = orangeLine && orangeLine.querySelector('.beats__fig');
  if (orangeFig) orangeFig.classList.add('p2f-orange');

  /* fix 13: one row per ticker. Measure the longest line and size every
     line off it, so nothing wraps to a second row and every row still
     reads as a single ticker sliding, not a floating paragraph. */
  /* measure the real rows (the canvas guess under-measured some lines): set a
     trial size, read each row's own width, then scale so the widest row fits
     with room for its sideways drift */
  const fitFontSize = () => {
    const cs = getComputedStyle(stage);
    const avail = stage.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
    if (!avail) return;
    const drift = P2.clamp(stage.clientWidth * 0.035, 8, 14);
    const room = avail - 2 * drift;
    const TRY = 40;
    sec.style.setProperty('--p2f-size', TRY + 'px');
    /* each row gets the size that makes it fill the width (a wall of type,
       every line edge to edge), capped so short lines don't balloon */
    lines.forEach((line) => {
      line.style.removeProperty('--p2f-size');
      const w = [...line.children].reduce((a, c) => a + c.getBoundingClientRect().width, 0)
        + Math.max(0, line.children.length - 1) * (parseFloat(getComputedStyle(line).columnGap) || 0);
      if (!w) return;
      line.style.setProperty('--p2f-size', P2.clamp(TRY * room / w, 16, 46).toFixed(1) + 'px');
    });
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFontSize);
  fitFontSize();
  addEventListener('resize', fitFontSize, { passive: true });

  if (RM) { lines.forEach((l) => { l.style.transform = 'none'; }); }
  else {
    /* each line has its own direction and speed (0.4 to 0.7x scroll), so the
       wall does not move as one flat block */
    const speeds = lines.map((_, i) => 0.4 + ((i * 37) % 30) / 100);   /* 0.40..0.69 */
    const dirs = lines.map((_, i) => (i % 2 === 0 ? -1 : 1));
    /* fix 13: offsets capped at +/-6% of the stage width (was a flat
       90-170px), so every row still reads centred while it slides */
    const ampOf = () => P2.clamp(stage.clientWidth * 0.035, 8, 14);
    let on = false, raf = 0;
    const tick = () => {
      raf = 0;
      const r = stage.getBoundingClientRect();
      const mid = (r.top + r.height / 2) - innerHeight / 2;   /* 0 when the wall is centred in view */
      const amp = ampOf();
      lines.forEach((line, i) => {
        const x = P2.clamp(-mid * speeds[i] * dirs[i] * 0.16, -amp, amp);
        line.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
      });
    };
    const kick = () => { if (on && !raf) raf = requestAnimationFrame(tick); };
    new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) kick(); }, { rootMargin: '15% 0px' }).observe(sec);
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', kick, { passive: true });
    tick();
  }

  /* the signal is decoration only here: receive whatever Trusted by hands on
     (normally nothing, until "Take your place." is tapped), pulse the
     orange ticker once so the handoff is visible in this section, and pass
     the same state straight to Contact. */
  P2.signal.station('figures', {
    receive(state, from) {
      if (!RM && orangeFig) {
        orangeFig.classList.add('is-pulse');
        setTimeout(() => orangeFig.classList.remove('is-pulse'), 700);
      }
      P2.signal.handoff('figures', state);
    }
  });
})();
