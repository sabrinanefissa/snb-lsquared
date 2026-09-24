/* phone2 section 10, Contact: "The middle screen is yours".
   Spec: scratchpad/mobile-plan-blind.md, section 2.10. m/demo-wall.webp shown
   whole, full width, one app-h; its screens light one by one from the bottom
   as the section arrives. Top screen: the title. Middle screen: the real
   #demo-form (moved, not copied, so its exact existing submit behaviour in
   js/page.js "7. the form" is untouched) with a custom four-option picker
   drawn over the real <select>. Bottom screen: the three existing
   content.js "contact fact" lines (the real .demo__stat nodes, moved).
   Tapping BOOK A DEMO, once the form's own check has passed, spreads the
   orange over the wall and the middle screen settles on the existing
   "contact sent message" text; this file never submits anything itself and
   never changes what the email check does.
   Signal: receives {shape:'dot', rect} from Trusted by (relayed through
   Figures) and lands it on the button; this is the last station. */
(() => {
  'use strict';
  const P2 = window.P2, sec = document.getElementById('demo');
  if (!P2 || !sec) return;
  const RM = P2.RM;
  const stageOld = sec.querySelector('.demo__stage');
  const img = sec.querySelector('.demo__img');
  const h = sec.querySelector('.demo__h');
  const form = sec.querySelector('#demo-form');
  const note = sec.querySelector('#form-note');
  const select = sec.querySelector('#f-screens');
  const screensLabel = sec.querySelector('label[for=f-screens]');
  const stats = [...sec.querySelectorAll('.demo__stat')].slice(0, 3);
  /* if any of this is missing, leave the r76 markup showing rather than build on gaps */
  if (!stageOld || !img || !h || !form || !select) return;

  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

  P2.sec('demo');
  sec.classList.add('p2c-sec');

  /* ---------------------------------------------------------- build the wall */
  const wrap = el('div', 'p2c');
  const photo = el('div', 'p2c__photo');
  const top = el('div', 'p2c__screen p2c__screen--top');
  const mid = el('div', 'p2c__screen p2c__screen--mid');
  const bot = el('div', 'p2c__screen p2c__screen--bot');
  const scrimTop = el('i', 'p2c__scrim'); scrimTop.setAttribute('aria-hidden', 'true');
  const scrimMid = el('i', 'p2c__scrim'); scrimMid.setAttribute('aria-hidden', 'true');
  const scrimBot = el('i', 'p2c__scrim'); scrimBot.setAttribute('aria-hidden', 'true');
  const glow = el('i', 'p2c__glow'); glow.setAttribute('aria-hidden', 'true');

  photo.append(img, glow, top, mid, bot);
  top.appendChild(scrimTop); mid.appendChild(scrimMid); bot.appendChild(scrimBot);
  wrap.appendChild(photo);
  sec.prepend(wrap);
  stageOld.remove();   /* the leftover empty stage/shot/screen shells and the unused "what happens next" side */

  /* top screen: the real title node content.js writes to ("contact title") */
  h.classList.add('p2c__h');
  top.appendChild(h);

  /* middle screen: the real form. A row of buttons mirrors the real <select>
     options (content.js "contact screens choices"), so a tap sets the real
     control; the select stays the accessible source of truth. */
  form.classList.add('p2c__form');
  const picker = el('div', 'p2c__picker');
  picker.setAttribute('role', 'group');
  if (screensLabel) { picker.setAttribute('aria-label', screensLabel.textContent.trim()); screensLabel.classList.add('sr-only'); }
  select.tabIndex = -1; select.setAttribute('aria-hidden', 'true'); select.classList.add('p2c__nativesel');
  const btns = [...select.options].map((o, i) => {
    const b = el('button', 'p2c__opt');
    b.type = 'button'; b.textContent = o.textContent.trim();
    b.setAttribute('aria-pressed', i === select.selectedIndex ? 'true' : 'false');
    b.addEventListener('click', () => {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      btns.forEach((x, k) => x.setAttribute('aria-pressed', k === i ? 'true' : 'false'));
    });
    return b;
  });
  btns.forEach((b) => picker.appendChild(b));
  const screensField = select.closest('.field');
  if (screensField) screensField.insertAdjacentElement('afterend', picker); else form.insertBefore(picker, form.firstChild);
  mid.appendChild(form);

  /* bottom screen: the three real .demo__stat nodes content.js's "contact
     fact 1/2/3" already write into */
  stats.forEach((s) => bot.appendChild(s));

  /* ---------------------------------------------------------- lit from the bottom, as it arrives */
  const scrimsBottomFirst = [scrimBot, scrimMid, scrimTop];
  const reveal = () => scrimsBottomFirst.forEach((s, i) => setTimeout(() => s.classList.add('is-off'), i * 120));
  if (RM) scrimsBottomFirst.forEach((s) => s.classList.add('is-off'));
  else P2.onView(wrap, .2, reveal);

  /* ---------------------------------------------------------- BOOK A DEMO: publish to the wall
     js/page.js "7. the form" owns the only submit handler that does anything
     real: it validates the work email, prevents the navigation, and writes
     either "contact error message" or "contact sent message" into #form-note.
     It is registered before this script runs, so by the time this listener's
     body runs (same, synchronous submit dispatch) that check has already
     happened; this only reads its result to decide whether to play the wall
     animation. It never validates, never submits, never touches #form-note
     itself. */
  const btn = form.querySelector('.btn');
  form.addEventListener('submit', () => {
    if (note && note.classList.contains('is-error')) return;
    mid.classList.add('is-sent');
    if (RM) return;
    const order = [scrimTop, scrimMid, scrimBot].map((s) => s.parentElement);
    order.forEach((s, i) => setTimeout(() => s.classList.add('is-pub'), i * 130));
    glow.classList.add('is-on');
  });

  P2.signal.station('contact', {
    receive(state) {
      if (RM || !state || !state.rect || !btn) return;
      /* deferred: fly only once the button (the actual landing spot) is in view */
      P2.onView(btn, .35, () => {
        const r = btn.getBoundingClientRect();
        P2.signal.fly(state.rect, { left: r.left + r.width / 2 - 3, top: r.top + r.height / 2 - 3, width: 6, height: 6 },
          { shape: 'dot', dur: 600, toOpacity: 0 });
      });
    }
    /* contact is the last station: no handoff onward */
  });
})();
