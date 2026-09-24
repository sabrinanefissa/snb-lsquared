/* phone2 2.6 Publishing: "Your thumb publishes"
   Spec: scratchpad/mobile-plan-blind.md, section 2.6. Title lockup / a
   Breakfast|Lunch control with an orange dot as the active marker / two
   16:9 photos stacked edge to edge (counter, then drive thru), bottom crop
   allowed. Starts on the blank pair. Tapping an option slides the dot,
   then a scanline (P2.scanline) reveals the counter photo, then the drive
   thru photo 300ms later; "Live on 2 screens" (new line, flagged in the
   brief) shows once both are live.
   Photos: read from the r76 markup (#pub-1 / #pub-2 .pub__ph[data-menu]),
   which content.js already fills in through js/edit.js's bg()/phone(). Six
   new "... phone photo" lines were added under == PUBLISHING == in
   content.js and wired with phone() in js/edit.js so a phone-specific shot
   can be set per option; with none set the desktop photo is used, so
   "defaults to the current photos" holds either way.
   Fix 12: the status line under the photos is never blank. It reads
   "publishing status waiting" (content.js, new line) from the moment the
   section builds, and switches to "publishing status live" once both
   scanlines have finished.
   Signal: receives {shape:'dot'} from the CEO section (decoration: flies
   onto the idle dot position) and hands off {shape:'line'} once both
   screens are live, as the scanline leaves the bottom of the section. */
(() => {
  'use strict';
  const P2 = window.P2;
  const sec = document.getElementById('publish');
  if (!P2 || !sec) return;
  const RM = P2.RM;
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const T = window.LSQ || {};

  const srcOf = (o) => {
    if (!o) return '';
    const dp = o.getAttribute('data-phone');
    if (dp) return dp;
    const m = /url\(["']?([^"')]+)/.exec(o.style.backgroundImage || '');
    return m ? m[1] : '';
  };
  const scene = (root) => ({
    none: srcOf(root.querySelector('.pub__ph[data-menu=none]')),
    breakfast: srcOf(root.querySelector('.pub__ph[data-menu=breakfast]')),
    lunch: srcOf(root.querySelector('.pub__ph[data-menu=lunch]'))
  });
  const oldPub1 = sec.querySelector('#pub-1'), oldPub2 = sec.querySelector('#pub-2');
  if (!oldPub1 || !oldPub2) return;
  const shots = [scene(oldPub1), scene(oldPub2)];

  /* ---------------------------------------------------------------- dom */
  const oldTitleEl = sec.querySelector('.pub__title');
  const oldSub = oldTitleEl && oldTitleEl.querySelector('.sec-sub');
  const titleMain = oldTitleEl ? oldTitleEl.cloneNode(true) : null;
  if (titleMain) { const s = titleMain.querySelector('.sec-sub'); if (s) s.remove(); }
  const titleTxt = (titleMain && titleMain.textContent.trim()) || 'Published in one click.';
  const subTxt = (oldSub && oldSub.textContent.trim()) || "It's that easy.";
  const opt1 = (sec.querySelector('.seg button[data-menu=breakfast]') || {}).textContent || T['publishing option 1'] || 'Breakfast';
  const opt2 = (sec.querySelector('.seg button[data-menu=lunch]') || {}).textContent || T['publishing option 2'] || 'Lunch';

  const wrap = el('div', 'p2p');
  const title = el('h2', 'p2-title p2p__title');
  title.appendChild(document.createTextNode(titleTxt.trim()));
  title.appendChild(document.createElement('br'));
  const sub = el('span', 'p2p__sub'); sub.textContent = subTxt.trim();
  title.appendChild(sub);

  const seg = el('div', 'p2p__seg'); seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', 'Publish the menu to the screens');
  const dot = el('i', 'p2p__dot'); dot.setAttribute('aria-hidden', 'true');
  const makeOpt = (label, menu, on) => {
    const b = el('button', 'p2p__opt'); b.type = 'button'; b.role = 'radio';
    b.setAttribute('aria-checked', on ? 'true' : 'false'); b.dataset.menu = menu; b.textContent = label.trim();
    return b;
  };
  const b1 = makeOpt(opt1, 'breakfast', false), b2 = makeOpt(opt2, 'lunch', false);
  seg.append(b1, b2, dot);

  const photos = el('div', 'p2p__photos');
  const mk = (idx) => {
    const shot = el('div', 'p2p__shot');
    const img = el('img', 'p2p__img'); img.alt = ''; img.decoding = 'async'; img.src = shots[idx].none;
    shot.appendChild(img);
    return { shot, img };
  };
  const sc1 = mk(0), sc2 = mk(1);
  photos.append(sc1.shot, sc2.shot);
  const status = el('p', 'p2p__status'); status.setAttribute('aria-live', 'polite');
  status.textContent = T['publishing status waiting'] || '2 screens waiting.';

  wrap.append(title, seg, photos, status);
  sec.prepend(wrap);
  P2.sec('publish');

  /* ---------------------------------------------------------------- dot */
  const placeDot = (btn, animate) => {
    const s = seg.getBoundingClientRect(), r = btn.getBoundingClientRect();
    const x = r.left - s.left, y = r.top - s.top;
    dot.style.width = r.width + 'px'; dot.style.height = r.height + 'px';
    if (!animate || RM) {
      dot.style.transition = 'none';
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      void dot.offsetWidth;
      dot.style.transition = '';
    } else {
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    }
  };
  placeDot(b1, false);
  addEventListener('resize', () => placeDot(current === 'lunch' ? b2 : b1, false), { passive: true });

  /* ---------------------------------------------------------------- sequence */
  let current = null, busy = false, ran = false;
  const setChecked = (menu) => {
    b1.setAttribute('aria-checked', menu === 'breakfast' ? 'true' : 'false');
    b2.setAttribute('aria-checked', menu === 'lunch' ? 'true' : 'false');
    b1.classList.toggle('is-on', menu === 'breakfast');
    b2.classList.toggle('is-on', menu === 'lunch');
  };

  function choose(menu) {
    if (busy || menu === current) return;
    busy = true; ran = true; current = menu;
    setChecked(menu);
    placeDot(menu === 'lunch' ? b2 : b1, true);
    const runShot = (sc, src, dur) => new Promise((res) => {
      sc.img.src = src;
      P2.scanline(sc.shot, { dur }).then(res);
    });
    const startDelay = RM ? 0 : 300;
    setTimeout(() => {
      runShot(sc1, shots[0][menu], 1200).then(() => {
        setTimeout(() => {
          runShot(sc2, shots[1][menu], 900).then(() => {
            status.textContent = T['publishing status live'] || 'Live on 2 screens';
            busy = false;
            const r = sc2.shot.getBoundingClientRect();
            P2.signal.handoff('publish', { shape: 'line', rect: { left: r.left, top: r.bottom - 2, width: r.width, height: 2 } });
          });
        }, RM ? 0 : 300);
      });
    }, startDelay);
  }

  b1.addEventListener('click', () => choose('breakfast'));
  b2.addEventListener('click', () => choose('lunch'));

  /* -------------------------------------------------------------- ghost */
  P2.onView(sec, .6, () => {
    setTimeout(() => {
      if (ran) return;
      P2.ghost(b2, { x: .5, y: .5, delay: 0, onTap: () => choose('lunch') });
    }, 1500);
  });

  /* -------------------------------------------------------------- signal */
  P2.signal.station('publish', {
    receive(state) {
      if (RM || ran || !state || !state.rect) return;
      /* deferred: fly only once the dot (the actual landing spot) is in view */
      P2.onView(dot, .35, () => {
        if (ran) return;
        const r = dot.getBoundingClientRect();
        if (r.width) P2.signal.fly(state.rect, { left: r.left, top: r.top, width: r.width, height: r.height }, { shape: 'dot', dur: 420 });
      });
    }
  });
})();
