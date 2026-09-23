/* L Squared homepage v7 - page behaviour.
   Strip mechanic ported from homepage-v6/js/page.js (section 4a).
   Everything else is written for v7. No libraries, no globals. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)');

  const warm = (src) => { const i = new Image(); i.decoding = 'async'; i.src = src; return i; };

  /* ------------------------------------------------------------ 0. top bar
     Hidden by default. It never sits over the hero photo, it never covers a
     heading after an anchor jump, and it puts itself away when it is idle. */
  {
    const bar = $('#topbar');
    const hero = $('#hero');
    let last = scrollY, ticking = false, heroOn = true, idle = 0, jumped = 0;

    const inside = () => bar.matches(':hover') || bar.contains(document.activeElement);
    const hide = () => bar.classList.remove('is-here');
    const show = () => {
      if (heroOn) return;                       // never over the hero
      bar.classList.add('is-here');
      clearTimeout(idle);
      idle = setTimeout(() => { if (!inside()) hide(); }, 2500);
    };

    new IntersectionObserver(([e]) => {
      heroOn = e.isIntersecting;
      if (heroOn) { clearTimeout(idle); hide(); }
    }, { threshold: 0 }).observe(hero);

    const run = () => {
      ticking = false;
      const y = scrollY;
      const up = y < last - 6, down = y > last + 6;
      last = y;
      if (performance.now() - jumped < 900) return;   // an anchor jump keeps it away
      if (down) { clearTimeout(idle); hide(); }
      else if (up) show();
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });

    /* any in-page anchor click parks the bar so the destination heading is clear */
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      jumped = performance.now();
      clearTimeout(idle); hide();
    }, true);

    bar.addEventListener('pointerenter', () => clearTimeout(idle));
    bar.addEventListener('pointerleave', () => { if (!heroOn) show(); });
    bar.addEventListener('focusin', () => { clearTimeout(idle); if (!heroOn) bar.classList.add('is-here'); });
    bar.addEventListener('focusout', () => { if (!inside()) show(); });
  }

  /* ------------------------------------------------------------ 1. one reveal per element */
  {
    const targets = $$('[data-wipe]');
    if (RM.matches) targets.forEach((el) => el.classList.add('is-in'));
    else targets.forEach((el) => {
      /* the target is clipped to zero width until it reveals, so an observer
         pointed at it would never intersect. Watch its container instead. */
      const host = el.parentElement || el;
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        el.classList.add('is-in');
        io.disconnect();
      }, { threshold: .25 });
      io.observe(host);
    });
  }

  /* ------------------------------------------------------------ 2. five strips */
  {
    const row = $('[data-strips]');
    if (row) {
      const items = $$('.strip', row);
      let cur = items.findIndex((el) => el.classList.contains('is-open'));
      if (cur < 0) cur = 0;

      /* the Scale strip: the map gains flags every time the strip opens */
      const map = $('.strip--map', row);
      const layers = map ? $$('.strip__ph', map) : [];
      let mapT = [];
      const stopMap = () => { mapT.forEach(clearTimeout); mapT = []; };
      const showMap = (n) => layers.forEach((l, i) => l.classList.toggle('is-on', i === n));
      function runMap() {
        stopMap(); showMap(0);
        if (RM.matches) { showMap(layers.length - 1); return; }
        for (let i = 1; i < layers.length; i++) mapT.push(setTimeout(() => showMap(i), 340 + i * 430));
      }

      /* r4: each strip carries its own sentence on its photo, so opening one
         is purely a state change on the row. There is no shared say box. */
      function open(i) {
        if (i === cur) return;
        cur = i;
        row.setAttribute('data-open', String(i));
        items.forEach((el, k) => {
          el.classList.toggle('is-open', k === i);
          el.setAttribute('aria-expanded', k === i ? 'true' : 'false');
        });
        if (map && items[i] === map) runMap(); else { stopMap(); showMap(0); }
      }

      items.forEach((b, i) => {
        b.addEventListener('click', () => open(i));
        b.addEventListener('focus', () => open(i));
        if (FINE.matches) b.addEventListener('pointerenter', () => open(i));
        b.addEventListener('keydown', (e) => {
          const last = items.length - 1;
          let n = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = i === last ? 0 : i + 1;
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = i === 0 ? last : i - 1;
          else if (e.key === 'Home') n = 0;
          else if (e.key === 'End') n = last;
          if (n === null) return;
          e.preventDefault(); items[n].focus(); open(n);
        });
      });
    }
  }

  /* ------------------------------------------------------------ 3. industries */
  {
    /* [name, photo, caption, background-position, --kw]
       --kw is the photo ratio divided by the fraction of its height that has
       to stay visible, so a bottom only crop never reaches the screens. */
    const IND = [
      ['Restaurants', 'assets/ind-restaurants.webp?v=r57', 'Breakfast menu at six. Lunch menu at eleven.', 'center top', '3.000', '3.000'],
      ['Retail', 'assets/ind-retail.webp?v=r56', 'Friday’s sale is on the wall before the doors open.', 'center top', '3.000', '3.000'],
      ['Hospitality', 'assets/ind-hospitality.webp?v=r50', 'Guests know where to go the moment they walk in.', 'center top', '2.990', '2.990'],
      ['Manufacturing', 'assets/mfg-on.webp?v=r50', 'Today’s targets, where the whole floor can see them.', 'center top', '3.000', '3.000']
    ];
    /* r60: the list in content.js wins: its names, photos and phone photos,
       in its order. Each photo's shape is measured, so any shape works. */
    if (window.LSQ_IND) IND.splice(0, IND.length, ...window.LSQ_IND.map((x) => [x.name, x.photo, '', 'center top', '3.000', '3.000', x.phone]));
    window.LSQ_INDLIST = IND.map((d) => ({ name: d[0], photo: d[1], phone: d[6] || '' }));
    const RATIO = {};
    const ratioOf = (url, cb) => {
      if (RATIO[url]) return cb(RATIO[url]);
      const im = new Image();
      im.onload = () => { if (im.naturalHeight) { RATIO[url] = (im.naturalWidth / im.naturalHeight).toFixed(4); cb(RATIO[url]); } };
      im.src = url;
    };
    const PHONE_W = matchMedia('(max-width:760px)').matches;
    /* r30: the photographs are the carousel. They slide sideways, always in the direction of travel, and loop.
       Each photo carries its industry name and its line on its own bottom edge. */
    const name = $('#ind-name'), stage = $('#ind-stage'), prev = $('#ind-prev'), next = $('#ind-next');
    const A = $('#ind-a'), B = $('#ind-b');
    if (stage && prev && next && A && B) {
      IND.forEach((d) => warm(d[1]));
      let front = A, back = B, cur = -1, busy = false;
      /* r59: on a computer the photos fade into each other, a click on the
         photo shows the next industry, and a row of dots under it says which
         one of the four is showing. The phone keeps its sideways slide. */
      const FADE = !matchMedia('(max-width:760px)').matches;
      let dots = [];
      /* r62: the phone gets the same dots; its current dot fills up while the
         photo waits, then the next one slides in */
      if (FADE) stage.classList.add('ind--fade');
      {
        const row = document.createElement('div');
        row.className = 'ind__dots';
        row.setAttribute('aria-label', 'Industries');
        dots = IND.map((d, i) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'ind__dot';
          b.setAttribute('aria-label', d[0]);
          b.addEventListener('click', () => go(i, i > cur ? 1 : -1));
          row.appendChild(b); return b;
        });
        stage.after(row);
      }
      const fill = (slide, d) => {
        const ph = $('.ind__ph', slide);
        if (d[6]) ph.dataset.phone = d[6]; else delete ph.dataset.phone;
        ph.dataset.src = d[1];
        ph.style.backgroundImage = 'url(' + d[1] + ')';
        ph.style.backgroundPosition = d[3];
        const r = RATIO[d[1]] || d[4];
        ph.style.setProperty('--kw', r);
        ph.style.setProperty('--ar', r);
        /* the phone sets its own shape from its own photo (js/mobile.js) */
        if (!PHONE_W) ratioOf(d[1], (x) => { if (ph.dataset.src === d[1]) { ph.style.setProperty('--kw', x); ph.style.setProperty('--ar', x); } });
        $('.ind__capname', slide).textContent = d[0];
      };
      function go(n, dir) {
        n = (n + IND.length) % IND.length;
        if (n === cur || busy) return;
        const first = cur === -1;
        cur = n;
        fill(back, IND[n]);
        if (name) name.textContent = IND[n][0];
        dots.forEach((b, i) => { b.classList.toggle('is-on', i === n); if (i === n) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
        if (FADE) {
          /* the new photo fades in over the old one, which stays whole behind it */
          const old = front;
          if (!first && !RM.matches) {
            busy = true;
            old.classList.add('is-under');
            setTimeout(() => { old.classList.remove('is-under'); busy = false; }, 820);
          }
          back.classList.add('is-on'); old.classList.remove('is-on');
          front = back; back = old;
          return;
        }
        if (first || RM.matches) {
          back.style.transition = 'none'; front.style.transition = 'none';
          back.style.transform = 'translateX(0)'; front.style.transform = 'translateX(100%)';
        } else {
          busy = true;
          back.style.transition = 'none'; back.style.transform = 'translateX(' + (dir * 100) + '%)';
          void back.offsetWidth;
          back.style.transition = ''; front.style.transition = '';
          back.style.transform = 'translateX(0)'; front.style.transform = 'translateX(' + (-dir * 100) + '%)';
          setTimeout(() => { busy = false; }, 640);
        }
        back.classList.add('is-on'); front.classList.remove('is-on');
        const t = front; front = back; back = t;
      }
      prev.addEventListener('click', () => go(cur - 1, -1));
      next.addEventListener('click', () => go(cur + 1, 1));
      stage.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, -1); }
      });
      /* a sideways swipe on the photo does the same on touch */
      let sx = null, sy = 0;
      stage.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
      stage.addEventListener('pointercancel', () => { sx = null; });
      stage.addEventListener('pointerup', (e) => {
        if (sx === null) return;
        const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
        if (Math.abs(dx) > 44) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        else if (e.button === 0 && Math.abs(dy) < 12) go(cur + 1, 1);   /* a tap or click on the photo: next industry */
      });
      go(0, 1);
      /* r61: on a computer the industries move on by themselves, in a loop,
         while the section is on screen. Any click restarts the wait, so a
         photo someone picked always gets its full time. The seconds are set
         in content.js. */
      if (!RM.matches) {
        const secs = parseFloat((window.LSQ || {})['industries seconds per photo']);
        const EVERY = (isFinite(secs) && secs >= 2 ? secs : 5) * 1000;
        if (dots[0]) dots[0].parentNode.style.setProperty('--every', EVERY + 'ms');
        let timer = 0, inView = false;
        const arm = () => {
          clearTimeout(timer); timer = 0;
          if (inView && !document.hidden) timer = setTimeout(() => { go(cur + 1, 1); arm(); }, EVERY);
          /* the current dot fills over the same time (the phone shows it) */
          dots.forEach((b) => b.classList.remove('is-fill'));
          const d = dots[cur];
          if (d && timer) { void d.offsetWidth; d.classList.add('is-fill'); }
        };
        new IntersectionObserver(([e]) => { inView = e.isIntersecting; arm(); }, { threshold: .5 }).observe(stage);
        document.addEventListener('visibilitychange', arm);
        stage.addEventListener('pointerup', arm);
        dots.forEach((b) => b.addEventListener('click', arm));
      }
    }
  }

  /* ------------------------------------------------------------ 4. change the menu live
     Each scene owns two pieces of state: what it is showing (live) and what its
     toggle is set to (selected). A toggle only ever moves because the visitor
     moved it. Publish pushes every scene where the two differ. Scenes never
     affect each other, and nothing is staged on the visitor's behalf. */
  {
    const go = $('#pub-go');
    const scenes = $$('.pub__scene');
    if (go && scenes.length) {
      /* r60: the words come from content.js: the option's own name plus a word */
      const T = window.LSQ || {};
      const optName = (menu) => { const b = $('#publish .seg button[data-menu="' + menu + '"]'); return b ? b.textContent.trim() : menu; };
      const LIVE = { breakfast: optName('breakfast') + ' ' + (T['publishing live word'] || 'live'), lunch: optName('lunch') + ' ' + (T['publishing live word'] || 'live') };
      const READY = { breakfast: optName('breakfast') + ' ' + (T['publishing ready word'] || 'ready'), lunch: optName('lunch') + ' ' + (T['publishing ready word'] || 'ready') };
      const NONE = T['publishing status before'] || 'Nothing published';
      let busy = false;

      const state = scenes.map((el) => ({
        el,
        shot: $('.pub__shot', el),
        seg: $$('.seg button', el),
        status: $('.pub__status', el),
        label: $('.pub__state', el),
        live: 'none',        /* the screen is dark until something is published */
        selected: null       /* nothing is chosen on the visitor's behalf */
      }));

      /* every state of every scene is decoded before it can be needed */
      scenes.forEach((el) => $$('.pub__ph', el).forEach((ph) => {
        const m = /url\(["']?([^"')]+)/.exec(ph.style.backgroundImage);
        if (m) warm(m[1]);
      }));

      const pending = () => state.filter((sc) => sc.selected && sc.selected !== sc.live);
      const syncGo = () => go.setAttribute('aria-disabled', (busy || !pending().length) ? 'true' : 'false');

      function paint(sc) {
        sc.seg.forEach((o, i) => {
          const on = o.dataset.menu === sc.selected;
          o.classList.toggle('is-on', on);
          o.setAttribute('aria-checked', on ? 'true' : 'false');
          /* with nothing chosen the group keeps one tab stop on its first option */
          o.tabIndex = sc.selected ? (on ? 0 : -1) : (i === 0 ? 0 : -1);
        });
        const waiting = !!sc.selected && sc.selected !== sc.live;
        const dark = sc.live === 'none';
        sc.label.textContent = waiting ? READY[sc.selected] : (dark ? NONE : LIVE[sc.live]);
        sc.status.classList.toggle('is-ready', waiting);
        sc.status.classList.toggle('is-none', !waiting && dark);
      }

      state.forEach((sc) => {
        const select = (menu) => { sc.selected = menu; paint(sc); syncGo(); };
        sc.seg.forEach((btn, i) => {
          btn.addEventListener('click', () => select(btn.dataset.menu));
          btn.addEventListener('keydown', (e) => {
            let n = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % sc.seg.length;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + sc.seg.length) % sc.seg.length;
            if (n === null) return;
            e.preventDefault();
            sc.seg[n].focus();
            select(sc.seg[n].dataset.menu);
          });
        });
        paint(sc);
      });

      function reveal(sc) {
        const menu = sc.selected;
        const phs = $$('.pub__ph', sc.shot);
        const from = phs.find((x) => x.classList.contains('is-on'));
        const to = phs.find((x) => x.dataset.menu === menu);
        const settle = () => {
          phs.forEach((x) => x.classList.toggle('is-on', x === to));
          if (to) to.classList.remove('is-coming');
          sc.shot.classList.remove('is-wiping');
          sc.live = menu;
          paint(sc);
          sc.el.classList.remove('is-blinking');
          void sc.el.offsetWidth;
          sc.el.classList.add('is-blinking');
        };
        if (!to || to === from || RM.matches) { settle(); return; }
        to.classList.add('is-coming');
        void sc.shot.offsetWidth;
        sc.shot.classList.add('is-wiping');
        setTimeout(settle, matchMedia('(max-width:760px)').matches ? 1560 : 660);   /* r51: slower on a phone */
      }

      go.addEventListener('click', () => {
        const due = pending();
        if (busy || !due.length) return;
        busy = true; syncGo();
        due.forEach((sc, i) => setTimeout(() => reveal(sc), i * 180));
        setTimeout(() => { busy = false; syncGo(); }, 180 * due.length + 780);
      });

      syncGo();

      /* r58: show the order. On PC, when the section is first reached, each
         scene previews Breakfast, then Lunch (the toggle lights and the screen
         wipes half way), then Publish glows. The moment a visitor picks a
         menu themselves, Publish glows again so the next step is obvious.
         Phones publish on the tap itself, so this is PC only; mobile.js has
         the phone's own preview. */
      const PHONE = matchMedia('(max-width:760px)').matches;
      const pulseGo = () => { go.classList.remove('is-pulsing'); void go.offsetWidth; go.classList.add('is-pulsing'); };
      go.addEventListener('click', () => go.classList.remove('is-pulsing'));
      let demoTimers = [], demoOn = false;
      const clearDemo = () => {
        demoTimers.forEach(clearTimeout); demoTimers = [];
        if (!demoOn) return; demoOn = false;
        $$('#publish .seg button.is-demo').forEach((o) => o.classList.remove('is-demo'));
        $$('#publish .pub__ph.is-demo').forEach((ph) => { ph.classList.remove('is-demo', 'is-coming'); ph.style.clipPath = ''; ph.style.transition = ''; });
      };
      state.forEach((sc) => sc.seg.forEach((btn) => btn.addEventListener('click', () => {
        clearDemo();
        if (!PHONE && !RM.matches) setTimeout(pulseGo, 120);
      })));
      const peek = (sc, menu, open) => {
        const ph = $$('.pub__ph', sc.shot).find((x) => x.dataset.menu === menu);
        const b = sc.seg.find((x) => x.dataset.menu === menu);
        if (b) b.classList.toggle('is-demo', open);
        if (!ph) return;
        if (open) {
          ph.classList.add('is-demo', 'is-coming');
          ph.style.transition = 'none'; ph.style.clipPath = 'inset(0 100% 0 0)';
          void ph.offsetWidth;
          ph.style.transition = 'clip-path 1100ms var(--ease)'; ph.style.clipPath = 'inset(0 50% 0 0)';
        } else {
          ph.style.transition = 'clip-path 700ms var(--ease)'; ph.style.clipPath = 'inset(0 100% 0 0)';
          demoTimers.push(setTimeout(() => { ph.classList.remove('is-demo', 'is-coming'); ph.style.clipPath = ''; ph.style.transition = ''; }, 720));
        }
      };
      if (!RM.matches && !PHONE) {
        const io = new IntersectionObserver(([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          if (state.some((sc) => sc.selected)) return;       /* they already started */
          demoOn = true;
          const T = (ms, fn) => demoTimers.push(setTimeout(fn, ms));
          state.forEach((sc, i) => {
            const d = 500 + i * 250;
            T(d, () => peek(sc, 'breakfast', true));
            T(d + 1500, () => { peek(sc, 'breakfast', false); peek(sc, 'lunch', true); });
            T(d + 3000, () => peek(sc, 'lunch', false));
          });
          T(3500, () => { go.setAttribute('data-demo', ''); pulseGo(); });
          T(5200, () => { go.removeAttribute('data-demo'); demoOn = false; });
        }, { threshold: .5 });
        io.observe($('#publish'));
      } else if (!RM.matches) {
        const io = new IntersectionObserver(([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          setTimeout(() => state.forEach((sc) => {
            sc.seg.forEach((o) => { if (o.dataset.menu !== sc.selected) o.classList.add('is-hinted'); });
          }), 400);
        }, { threshold: .4 });
        io.observe($('#publish'));
      }
    }
  }

  /* ------------------------------------------------------------ 5. the drag bar */
  {
    const frame = $('.rely__frame');
    const stack = $('.rely__stack');
    const handle = $('#rely-handle');
    const onPh = $('#rely-on'), offPh = $('#rely-off');
    if (frame && handle) {
      let p = 76, nudged = false, tween = 0;
      const apply = (v) => {
        p = clamp(v, 0, 100);
        frame.style.setProperty('--p', p.toFixed(2) + '%');
        const r = Math.round(p);
        handle.setAttribute('aria-valuenow', String(r));
        handle.setAttribute('aria-valuetext', r + ' percent working screens');
      };
      apply(p);

      const fromEvent = (e) => {
        const r = stack.getBoundingClientRect();
        apply(((e.clientX - r.left) / Math.max(1, r.width)) * 100);
      };
      let dragging = false;
      handle.addEventListener('pointerdown', (e) => {
        dragging = true; nudged = true; cancelAnimationFrame(tween);
        handle.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      handle.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
      const end = (e) => {
        if (!dragging) return;
        dragging = false;
        try { handle.releasePointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
      };
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
      stack.addEventListener('pointerdown', (e) => {
        if (e.target === handle || handle.contains(e.target)) return;
        nudged = true; cancelAnimationFrame(tween); fromEvent(e);
      });

      handle.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n = p + 4;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n = p - 4;
        else if (e.key === 'PageUp') n = p + 12;
        else if (e.key === 'PageDown') n = p - 12;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = 100;
        if (n === null) return;
        e.preventDefault(); nudged = true; cancelAnimationFrame(tween); apply(n);
      });

      /* one nudge, once, so the handle is understood without a label */
      function nudge() {
        if (nudged || RM.matches) return;
        nudged = true;
        const from = p, to = 46, t0 = performance.now(), dur = 1250;
        const step = (now) => {
          const k = clamp((now - t0) / dur, 0, 1);
          const out = k < .5 ? k / .5 : 1 - (k - .5) / .5;   // there, then back
          apply(from + (to - from) * (1 - Math.pow(1 - out, 3)));
          if (k < 1) tween = requestAnimationFrame(step); else apply(from);
        };
        tween = requestAnimationFrame(step);
      }
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { setTimeout(nudge, 620); io.disconnect(); }
      }), { threshold: .45 });
      io.observe(frame);

    }
  }

  /* ------------------------------------------------------------ 6. the figures
     One at a time, crossfading, exactly the feel of the hero count beats.
     Tap or click the band to skip to the next one, with no hint. The full
     content is carried once by a visually hidden paragraph next to it. */
  {
    const stage = $('#beats');
    if (stage) {
      const lines = $$('.beats__line', stage);
      let i = 0, timer = 0, visible = false;
      /* the outgoing beat is fully gone before the next one arrives, so two
         figures are never on screen together */
      let handoff = 0;
      const show = (n, immediate) => {
        clearTimeout(handoff);
        const next = (n + lines.length) % lines.length;
        if (immediate || RM.matches) {
          i = next;
          lines.forEach((el, k) => el.classList.toggle('is-on', k === i));
          return;
        }
        lines.forEach((el) => el.classList.remove('is-on'));
        handoff = setTimeout(() => { i = next; lines[i].classList.add('is-on'); }, 360);
      };
      const stop = () => { clearTimeout(timer); timer = 0; };
      const queue = () => { stop(); timer = setTimeout(() => { show(i + 1); queue(); }, 2400); };
      const run = () => { if (!visible || document.hidden || RM.matches) { stop(); return; } queue(); };

      if (RM.matches) lines.forEach((el) => el.classList.add('is-on'));
      else {
        show(0, true);
        const band = $('#numbers');
        band.addEventListener('click', (e) => {
          if (e.target.closest('a,button')) return;
          show(i + 1); run();
        });
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }, { threshold: .25 }).observe(band);
        document.addEventListener('visibilitychange', run);
      }
    }
  }

  /* ------------------------------------------------------------ 6b. trusted by: the wall fills up
     r69: the section is a wall of client logos, edge to edge, and it builds
     itself in front of you. It starts slow: one logo comes towards you in
     the middle, then the two beside it, then 4, then 8, then the rest, each
     wave sooner than the last, until the ENTIRE wall is full. Then the three
     middle screens power down and become one wide dark screen that says
     "Room for one more.", holds, fades slowly, and narrows to one empty
     screen: the card, "Take your place.", with a glow that breathes. The two
     logos beside it come towards you again as the screen narrows. Nothing
     dims, no words float over logos. Laptop and phone, one list from
     content.js (logos repeat, never beside, above or in line with the same
     one, until there are enough to fill it). Plays once per visit. */
  {
    const DEF = [['The UPS Store', 'ups-store'], ['Cold Stone Creamery', 'cold-stone-creamery'], ['Hatch', 'hatch'],
      ['McMaster University', 'mcmaster-university'], ['International Centre', 'international-centre'], ['Cisco', 'cisco'],
      ['Best Buy Business', 'best-buy-business'], ['Lenovo', 'lenovo'], ['SFM', 'sfm']]
      .map(([name, k]) => ({ name, src: 'assets/logos/' + k + '-hq.png?v=r55' }));
    const LOGOS = (window.LSQ_LOGOS && window.LSQ_LOGOS.length) ? window.LSQ_LOGOS : DEF;
    const T = window.LSQ || {};
    window.LSQ_LOGOLIST = LOGOS;
    const orbit = $('#clients .orbit'), sec = $('#clients');
    if (orbit && sec && LOGOS.length) {
      const PHONE = matchMedia('(max-width:760px)').matches;
      const wall = document.createElement('div');
      wall.className = 'lwall'; wall.setAttribute('aria-hidden', 'true');
      const names = document.createElement('ul');
      names.className = 'sr-only'; names.setAttribute('aria-label', 'Clients');
      LOGOS.forEach((l) => { if (!l.name) return; const li = document.createElement('li'); li.textContent = l.name; names.appendChild(li); });
      orbit.replaceWith(wall); wall.after(names);   /* the old orbit never starts */

      /* the room: one wide screen over the three middle tiles; it holds the
         line, then narrows into the card. The card is the one part a
         keyboard or screen reader needs, so it lives outside the hidden wall */
      const room = document.createElement('div'); room.className = 'lw-room';
      const say = document.createElement('p'); say.className = 'lw-room__say';
      say.textContent = T['trusted by invite line'] || 'Room for one more.';
      const card = document.createElement('a'); card.className = 'lw-card'; card.href = '#demo'; card.tabIndex = -1;
      card.addEventListener('click', () => sec.classList.add('is-seen'));   /* r72: the glow pulses until the card is clicked */
      const cardT = document.createElement('span'); cardT.className = 'lw-card__t';
      cardT.textContent = T['trusted by card text'] || 'Take your place.';
      card.appendChild(cardT); card.setAttribute('aria-label', cardT.textContent + ' Book a demo');
      room.append(say, card);
      wall.after(room);

      let played = false, tiles = [], mid = [], W0 = 0;
      const appH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-h')) || innerHeight;
      const build = () => {
        wall.textContent = '';
        const W = wall.clientWidth; W0 = innerWidth;
        const tw = PHONE ? Math.round(W * .40) : Math.round(Math.min(215, W * .14));
        const th = Math.round(tw / 2.1), g = PHONE ? 10 : 12;
        const cs = getComputedStyle(sec), title = $('.clients__title', sec);
        const used = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + (title ? title.offsetHeight + parseFloat(getComputedStyle(title).marginBottom) : 0);
        const avail = (PHONE ? appH() : innerHeight) - used;
        let rows = Math.floor((avail + g) / (th + g)); if (rows % 2 === 0) rows--;
        rows = PHONE ? Math.max(5, Math.min(7, rows)) : 3;   /* the phone wall fills its screen: no dead space above or below */
        let cols = Math.ceil((W + g) / (tw + g)); if (cols % 2 === 0) cols++; cols += 2;   /* past both edges */
        const H = rows * (th + g) - g, r0 = (rows - 1) / 2, c0 = (cols - 1) / 2, N = LOGOS.length;
        wall.style.height = H + 'px';
        sec.style.setProperty('--tw', tw + 'px'); sec.style.setProperty('--th', th + 'px'); sec.style.setProperty('--g', g + 'px');
        const list = [], grid = [], count = LOGOS.map(() => 0);
        const at = (r, c) => (r < 0 || c < 0 || c >= cols) ? undefined : grid[r * cols + c];
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const x = W / 2 + (c - c0) * (tw + g) - tw / 2, y = H / 2 + (r - r0) * (th + g) - th / 2;
          if (x + tw < 0 || x > W) continue;
          /* logos are dealt out evenly: never the same one twice in a row or a
             column, never touching on the diagonal, so repeats (until there
             are enough logos) do not line up */
          const row = [], col = [];
          for (let k = 0; k < c; k++) row.push(at(r, k));
          for (let k = 0; k < r; k++) col.push(at(k, c));
          const diag = [at(r - 1, c - 1), at(r - 1, c + 1)];
          const tiers = [row.concat(col, diag), row.concat(col), row, []];
          let best = -1;
          for (const ban of tiers) {
            for (let j = 0; j < N; j++) {
              const q = (j + r * 4 + c * 7) % N;
              if (ban.includes(q)) continue;
              if (best < 0 || count[q] < count[best]) best = q;
            }
            if (best >= 0) break;
          }
          grid[r * cols + c] = best; count[best]++;
          const l = LOGOS[best];
          const t = document.createElement('div'); t.className = 'lw';
          t.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + tw + 'px;height:' + th + 'px';
          const p = document.createElement('div'); p.className = 'lw__panel';
          const im = document.createElement('img'); im.src = l.src; im.alt = ''; im.decoding = 'async';
          p.appendChild(im); t.appendChild(p); wall.appendChild(t);
          /* rings out from the middle tile; inside a ring the two beside the
             middle come first, then above and below, then the corners */
          const dc = c - c0, dr = r - r0;
          list.push([Math.max(Math.abs(dc), Math.abs(dr)) * 10 + Math.hypot(dc, dr * 1.4), t, dc, dr, x, y]);
        }
        list.sort((p, q) => p[0] - q[0]);
        tiles = list.map((p) => p[1]);
        mid = list.filter((p) => p[3] === 0 && Math.abs(p[2]) <= 1).sort((p, q) => p[2] - q[2]);   /* left, middle, right */
        const c = mid[1] || mid[0];
        room.style.left = (wall.offsetLeft + c[4] + tw / 2) + 'px';
        room.style.top = (wall.offsetTop + c[5]) + 'px';
        /* r72: the card's orange glow lives in the wall and is blended as light,
           so it shines on the dark around the card and never stains a logo */
        const glow = document.createElement('i'); glow.className = 'lw-glow';
        glow.style.cssText = 'left:' + (c[4] + tw / 2) + 'px;top:' + (c[5] + th / 2) + 'px;width:' + (tw * 2.6) + 'px;height:' + (th * 3.6) + 'px';
        wall.appendChild(glow);
        mid = mid.map((p) => p[1]);
        /* r72: the logos arrive in a random order, never the same twice. The
           first one is always a whole screen, never one cut by the edge. */
        const Wn = wall.clientWidth, order = list.slice();
        for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; }
        const fi = order.findIndex((p) => p[4] >= 0 && p[4] + tw <= Wn);
        if (fi > 0) order.unshift(order.splice(fi, 1)[0]);
        tiles = order.map((p) => p[1]);
        if (played || RM.matches) finish();
      };
      const finish = () => {
        /* the end state, at once: full wall, middle screen off, card present */
        tiles.forEach((t) => { t.style.transition = 'none'; t.classList.add('is-in'); });
        mid.forEach((t, i) => { if (i === 1 || mid.length === 1) t.classList.add('is-off'); });
        room.style.transition = 'none'; say.style.transition = 'none';
        sec.classList.add('is-full', 'is-room', 'is-card'); card.tabIndex = 0;
      };
      const again = (t, dur) => {
        /* a logo that comes towards you a second time */
        t.style.transition = 'none'; t.classList.remove('is-in', 'is-off'); t.classList.add('is-again');
        void t.offsetWidth;
        t.style.transition = ''; t.style.transitionDuration = dur + 'ms'; t.classList.add('is-in');
      };
      const play = () => {
        played = true;
        /* r71: one logo at a time, every one coming towards you. The first
           waits longest; each next one arrives sooner than the last (the gap
           shrinks by a fifth each time) until they pour in. */
        let gap = 650, at = 0, full = 0;
        tiles.forEach((t, k) => {
          const dur = Math.max(720, 1150 - k * 45);
          full = Math.max(full, at + dur);
          const when = at;
          setTimeout(() => { t.style.transitionDuration = dur + 'ms'; t.classList.add('is-in'); }, when);
          at += gap; gap = Math.max(110, gap * .86);   /* r72: speeds up gently, then keeps a steady pace */
        });
        const FULL = full;
        const OFF = FULL + 300, ROOM = OFF + 200, SAY = ROOM + 300, GONE = SAY + 1500 + 600, CARD = GONE + 450;   /* r71: the hero's slow dissolve: 1.5s in, a short hold, 1.5s out, the card rising as the words leave */
        setTimeout(() => { sec.classList.add('is-full'); mid.forEach((t) => t.classList.add('is-off')); }, OFF);   /* the three middle screens power down */
        setTimeout(() => sec.classList.add('is-room'), ROOM);            /* one wide screen over them */
        setTimeout(() => sec.classList.add('is-say'), SAY);              /* Room for one more. */
        setTimeout(() => sec.classList.remove('is-say'), GONE);          /* ...fades slowly */
        setTimeout(() => {                                               /* the screen narrows into the card, the two beside it come back */
          sec.classList.add('is-card'); card.tabIndex = 0;
          if (mid.length === 3) { again(mid[0], 720); again(mid[2], 720); }
        }, CARD);
      };
      build();
      if (!RM.matches) {
        sec.classList.add('is-armed');
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !played) { io.disconnect(); play(); } }, { threshold: .35 });
        io.observe(wall);
      }
      let rt = 0;
      addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(innerWidth - W0) > 40) build(); }, 200); });
    }
  }

  /* ------------------------------------------------------------ 7. the form */
  {
    const form = $('#demo-form');
    const note = $('#form-note');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = $('#f-email');
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
        if (!ok) {
          note.textContent = (window.LSQ || {})['contact error message'] || 'Enter a work email address.';
          note.classList.add('is-error');
          email.setAttribute('aria-invalid', 'true');
          email.focus();
          return;
        }
        email.removeAttribute('aria-invalid');
        note.classList.remove('is-error');
        note.textContent = (window.LSQ || {})['contact sent message'] || 'Request sent.';
      });
    }
  }
})();
