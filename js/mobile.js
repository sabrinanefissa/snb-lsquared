/* Phone-only interaction layer. Gated once at load; nothing here runs above
   760px, and nothing here changes desktop behavior or markup. */
(() => {
  'use strict';
  if (!matchMedia('(max-width:760px)').matches) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const EASE = 'cubic-bezier(.23,1,.32,1)';

  /* when a section comes into view its hint plays slowly, once, and HOLDS
     in the moved position until the visitor touches that section; the
     returned function is what the touch calls to put things back */
  const hint = (el, play, undo) => {
    if (!el || RM.matches) return () => {};
    let used = false, played = false, timer = 0;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !used && !played) { played = true; io.disconnect(); timer = setTimeout(play, 500); }
    }, { threshold: .6 });
    io.observe(el);
    return () => { if (used) return; used = true; clearTimeout(timer); io.disconnect(); if (played) undo(); };
  };

  /* -------------------------------------------------------------- publish
     A tap on a toggle both selects AND publishes: page.js's own click
     handler runs first and sets the scene's selection, then this fires the
     hidden Publish button, which is the only thing that ever calls reveal().
     The status line is moved onto its own photo, bottom corner. */
  {
    const go = $('#pub-go');
    if (go) {
      let stop = () => {};
      $$('#publish .seg button').forEach((btn) => {
        btn.addEventListener('click', () => { stop(); go.click(); });
      });
      $$('.pub__scene').forEach((sc) => {
        const shot = $('.pub__shot', sc), status = $('.pub__status', sc);
        if (shot && status) shot.appendChild(status);
      });

      /* the hint: the next menu wipes slowly half way across each screen
         and stays there until a toggle is tapped */
      const others = () => $$('.pub__scene').map((sc) => {
        const shot = $('.pub__shot', sc);
        return shot && $$('.pub__ph', shot).find((p) => !p.classList.contains('is-on'));
      }).filter(Boolean);
      stop = hint($('#publish'), () => {
        others().forEach((other, i) => setTimeout(() => {
          other.classList.add('is-coming');
          other.style.transition = 'none';
          other.style.clipPath = 'inset(0 100% 0 0)';
          void other.offsetWidth;
          other.style.transition = 'clip-path 1600ms ' + EASE;
          other.style.clipPath = 'inset(0 46% 0 0)';
        }, i * 300));
      }, () => {
        $$('#publish .pub__ph.is-coming').forEach((other) => {
          other.style.transition = ''; other.style.clipPath = '';
          other.classList.remove('is-coming');
        });
      });
    }
  }

  /* -------------------------------------------------------------- industries
     the stage takes the real ratio of the photo that is showing; the hint
     drags the photo a good way sideways and lets it settle back */
  {
    const stage = $('#ind-stage');
    if (stage) {
      const syncKW = (ph) => {
        const v = ph.style.getPropertyValue('--kw');
        if (v) stage.style.setProperty('--kw', v);
      };
      $$('.ind__ph', stage).forEach((ph) => {
        new MutationObserver(() => {
          if (ph.closest('.ind__slide').classList.contains('is-on')) syncKW(ph);
        }).observe(ph, { attributes: true, attributeFilter: ['style'] });
      });
      const onPh = $('.ind__slide.is-on .ind__ph', stage);
      if (onPh) syncKW(onPh);

      const stop = hint(stage, () => {
        const on = $('.ind__slide.is-on', stage);
        if (!on) return;
        on.style.transition = 'transform 1400ms ' + EASE;
        on.style.transform = 'translateX(-24%)';
      }, () => {
        const on = $('.ind__slide.is-on', stage);
        if (!on) return;
        on.style.transition = 'transform 420ms ' + EASE;
        on.style.transform = 'translateX(0)';
        setTimeout(() => { on.style.transition = ''; }, 440);
      });
      stage.addEventListener('pointerdown', stop, { once: true });
    }
  }

  /* -------------------------------------------------------------- dead screen
     the handle slides slowly towards the middle and stays there until the
     visitor drags it; page.js takes over from wherever it is */
  {
    const frame = $('.rely__frame');
    if (frame) {
      let raf = 0;
      /* page.js has an old one-off nudge of its own; a synthetic press on the
         handle marks it as already used, so only this one runs on a phone */
      const stack = $('.rely__stack', frame);
      if (stack) {
        const r = stack.getBoundingClientRect();
        stack.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + r.width * .76 }));
      }
      const stop = hint(frame, () => {
        const from = parseFloat(frame.style.getPropertyValue('--p')) || 76, to = 42;
        const t0 = performance.now(), dur = 2200;
        cancelAnimationFrame(raf);
        const step = (now) => {
          const k = Math.min(1, (now - t0) / dur);
          const e = 1 - Math.pow(1 - k, 3);
          frame.style.setProperty('--p', (from + (to - from) * e).toFixed(2) + '%');
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      }, () => cancelAnimationFrame(raf));
      frame.addEventListener('pointerdown', stop, { once: true });
    }
  }
})();
