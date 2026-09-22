/* Phone-only interaction layer (r41). Gated once at load; nothing here runs
   above 760px, and nothing here changes desktop behavior or markup. */
(() => {
  'use strict';
  if (!matchMedia('(max-width:760px)').matches) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

  /* -------------------------------------------------------------- publish
     A tap on a toggle both selects AND publishes: page.js's own click
     handler runs first and sets the scene's selection, then this fires the
     hidden Publish button, which is the only thing that ever calls reveal().
     The status line is moved onto its own photo, bottom corner. */
  {
    const go = $('#pub-go');
    if (go) {
      $$('#publish .seg button').forEach((btn) => {
        btn.addEventListener('click', () => go.click());
      });
      $$('.pub__scene').forEach((sc) => {
        const shot = $('.pub__shot', sc), status = $('.pub__status', sc);
        if (shot && status) shot.appendChild(status);
      });

      /* one soft preview of the wipe on each scene, so the toggle reads as
         live rather than decorative, before anyone has touched it */
      if (!RM.matches) {
        const io = new IntersectionObserver(([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          setTimeout(() => {
            $$('.pub__scene').forEach((sc) => {
              const shot = $('.pub__shot', sc);
              const other = $$('.pub__ph', shot).find((p) => !p.classList.contains('is-on'));
              if (!shot || !other) return;
              other.classList.add('is-coming');
              void shot.offsetWidth;
              shot.classList.add('is-wiping');
              setTimeout(() => {
                shot.classList.remove('is-wiping');
                other.classList.remove('is-coming');
              }, 520);
            });
          }, 550);
        }, { threshold: .5 });
        io.observe($('#publish'));
      }
    }
  }

  /* -------------------------------------------------------------- industries
     the stage takes the real ratio of the photo that is showing, and a
     short peek nudges the current photo sideways once, so the swipe reads
     as swipeable now that the arrows are gone. */
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

      if (!RM.matches) {
        let peeked = false;
        const io = new IntersectionObserver(([e]) => {
          if (!e.isIntersecting || peeked) return;
          peeked = true; io.disconnect();
          setTimeout(() => {
            const on = $('.ind__slide.is-on', stage);
            if (!on) return;
            on.style.transition = 'transform 480ms cubic-bezier(.23,1,.32,1)';
            on.style.transform = 'translateX(-16%)';
            setTimeout(() => { on.style.transform = 'translateX(0)'; }, 480);
            setTimeout(() => { on.style.transition = ''; }, 1000);
          }, 550);
        }, { threshold: .5 });
        io.observe(stage);
      }
    }
  }
})();
