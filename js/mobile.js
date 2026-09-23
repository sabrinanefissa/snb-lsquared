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

  /* -------------------------------------------------------------- phone photos
     Portrait versions made for the phone replace the wide desktop photos.
     Desktop markup and files are untouched; only the URL changes here. */
  const PHONE = {
    'ind-restaurants.webp': ['assets/m/ind-restaurants.webp?v=m1', '.8'],
    'ind-retail.webp': ['assets/m/ind-retail.webp?v=m1', '.8'],
    'ind-hospitality.webp': ['assets/m/ind-hospitality.webp?v=m1', '.7584'],
    'mfg-on.webp': ['assets/m/mfg-on.webp?v=m1', '.7759'],
    'retail-off.webp': ['assets/m/retail-off.webp?v=m1'],
    'retail-on.webp': ['assets/m/retail-on.webp?v=m1'],
    'demo-wall.webp': ['assets/m/demo-wall.webp?v=m2']
  };
  const phoneFor = (url) => {
    if (!url || url.indexOf('assets/m/') >= 0) return null;
    const k = Object.keys(PHONE).find((n) => url.indexOf(n) >= 0);
    return k ? PHONE[k] : null;
  };
  const swapBg = (el) => {
    const m = /url\(["']?([^"')]+)/.exec(el.style.backgroundImage || '');
    const hit = m && phoneFor(m[1]);
    if (!hit) return;
    el.style.backgroundImage = 'url(' + hit[0] + ')';
    if (hit[1]) el.style.setProperty('--kw', hit[1]);
  };
  $$('.rely__ph').forEach(swapBg);
  const wall = $('.demo__img');
  if (wall) { const hit = phoneFor(wall.getAttribute('src')); if (hit) { wall.src = hit[0]; wall.width = 852; wall.height = 1846; } }
  /* the wall photo covers the whole screen; the layer that holds the headline,
     the fields and the link is sized to the photo as displayed, so the screen
     positions (measured on the photo) stay true whatever the phone's shape */
  {
    const stage = $('.demo__stage'), screen = $('.demo__screen'), h = $('.demo__h');
    if (stage && screen) {
      const fit = () => {
        const W = stage.clientWidth, H = stage.clientHeight, R = 852 / 1846;
        const k = Math.max(W / 852, H / 1846), iw = 852 * k, ih = 1846 * k;
        screen.style.left = ((W - iw) / 2) + 'px'; screen.style.top = ((H - ih) / 2) + 'px';
        screen.style.width = iw + 'px'; screen.style.height = ih + 'px';
      };
      fit(); addEventListener('resize', fit, { passive: true });
      if (wall) wall.addEventListener('load', fit);
    }
  }
  $$('.ind__ph').forEach((ph) => {
    swapBg(ph);
    new MutationObserver(() => swapBg(ph)).observe(ph, { attributes: true, attributeFilter: ['style'] });
  });

  /* -------------------------------------------------------------- trusted by
     two slow rows of logos, moving opposite ways, instead of the orbit */
  {
    const row = $('.clients__row'), orbit = $('#clients .orbit');
    if (row && orbit) {
      const L = ['ups-store', 'cold-stone-creamery', 'hatch', 'mcmaster-university', 'international-centre', 'cisco', 'best-buy-business', 'lenovo', 'sfm'];
      const mk = (list, cls) => {
        const r = document.createElement('div'); r.className = 'mq__row ' + cls;
        for (let k = 0; k < 2; k++) list.forEach((n) => {
          const i = document.createElement('img'); i.src = 'assets/logos/' + n + '-hq.png?v=r55'; i.alt = ''; i.decoding = 'async'; i.className = 'mq__logo mq__logo--' + n; r.appendChild(i);
        });
        return r;
      };
      const mq = document.createElement('div'); mq.className = 'mq'; mq.setAttribute('aria-hidden', 'true');
      mq.appendChild(mk(L.slice(0, 5), 'mq__row--a')); mq.appendChild(mk(L.slice(5), 'mq__row--b'));
      orbit.insertAdjacentElement('afterend', mq);
    }
  }

  /* -------------------------------------------------------------- phone nav
     no bar: a floating hamburger top left and Book a demo top right, shown by
     page.js on a scroll up; the hamburger opens a full screen menu */
  {
    const bar = $('#topbar'), inner = $('.topbar__in'), nav = $('.topbar__nav');
    if (bar && inner && nav) {
      const burger = document.createElement('button');
      burger.type = 'button'; burger.className = 'mnav__burger'; burger.setAttribute('aria-label', 'Menu'); burger.setAttribute('aria-expanded', 'false');
      burger.innerHTML = '<i></i><i></i><i></i>';
      inner.insertAdjacentElement('afterbegin', burger);
      const menu = document.createElement('div'); menu.className = 'mnav'; menu.id = 'mnav';
      const list = document.createElement('nav'); list.className = 'mnav__list'; list.setAttribute('aria-label', 'Main');
      $$('a', nav).forEach((a) => { list.appendChild(a.cloneNode(true)); });
      const demo = document.createElement('a'); demo.className = 'btn mnav__demo'; demo.href = '#demo'; demo.textContent = 'Book a demo';
      menu.appendChild(list); menu.appendChild(demo);
      document.body.appendChild(menu);
      const set = (open) => { menu.classList.toggle('is-open', open); burger.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open ? 'true' : 'false'); document.documentElement.classList.toggle('mnav-open', open); };
      burger.addEventListener('click', () => set(!menu.classList.contains('is-open')));
      menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    }
  }

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
          const sc = other.closest('.pub__scene');
          const btn = sc && $$('.seg button', sc).find((x) => x.dataset.menu === other.dataset.menu);
          if (btn) btn.classList.add('is-demo');
        }, i * 300));
      }, () => {
        $$('#publish .seg button.is-demo').forEach((x) => x.classList.remove('is-demo'));
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

      const ORDER = [['Restaurants', 'ind-restaurants.webp'], ['Retail', 'ind-retail.webp'], ['Hospitality', 'ind-hospitality.webp'], ['Manufacturing', 'mfg-on.webp']];
      const stop = hint(stage, () => {
        const on = $('.ind__slide.is-on', stage), back = $('.ind__slide:not(.is-on)', stage);
        if (!on || !back) return;
        /* the next industry is set up behind the current photo, so sliding
           the current one aside reveals it, the same as a real swipe would */
        const cur = ORDER.findIndex((o) => o[0] === ($('#ind-name') || {}).textContent);
        const nxt = ORDER[(cur + 1) % ORDER.length], hit = PHONE[nxt[1]];
        const bph = $('.ind__ph', back);
        if (hit && bph) {
          bph.style.backgroundImage = 'url(' + hit[0] + ')';
          if (hit[1]) bph.style.setProperty('--kw', hit[1]);
          const nm = $('.ind__capname', back); if (nm) nm.textContent = nxt[0];
        }
        back.style.transition = 'none'; back.style.transform = 'translateX(0)';
        stage.classList.add('is-peeking');
        on.style.transition = 'transform 1400ms ' + EASE;
        on.style.transform = 'translateX(-34%)';
        /* the name rides inside the photo, so it is moved back by the same
           distance at the same pace: on screen only the photo travels */
        const cap = $('.ind__cap', on);
        if (cap) { cap.style.transition = 'transform 1400ms ' + EASE; cap.style.transform = 'translateX(' + (on.offsetWidth * .34) + 'px)'; }
      }, () => {
        stage.classList.remove('is-peeking');
        const cap = $('.ind__slide.is-on .ind__cap', stage);
        if (cap) { cap.style.transition = 'transform 420ms ' + EASE; cap.style.transform = ''; }
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
