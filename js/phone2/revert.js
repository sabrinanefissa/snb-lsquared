/* phone2/revert.js (r96): the small p2-only additions that sit on top of the
   r76 markup Sabrina sent back to the old design (see css/phone2-revert.css
   for why these sections keep the r76 DOM). Nothing here moves, removes or
   renames any r76 node; it only adds decoration. Returns at once when this
   is not the redesigned phone page. See js/phone2/README.md. */
(() => {
  'use strict';
  if (!window.P2) return;
  const P2 = window.P2;

  /* ---------------------------------------------------------- 9. contact
     The r76 wall is one photo; js/mobile.js already sizes .demo__screen to
     match the photo exactly as displayed (cover-fit), and the three screen
     bands are the same percentages of .demo__screen that .demo__h and
     .form already use (top 12.9-29.7%, middle 31.3-58.8%, bottom
     60.2-76.9%; see css/mobile.css "contact: the new tall three-screen
     wall"). Three scrims are added as the FIRST children of .demo__screen
     (so they paint behind .demo__h and .form, which come later in the DOM
     and are never touched), dark by default; when the section arrives they
     lift top to bottom, about 0.4s apart, then the button gets a soft
     orange glow last. The form is never dimmed, disabled or reflowed. */
  {
    const demo = document.getElementById('demo');
    const screen = demo && demo.querySelector('.demo__screen');
    const btn = demo && demo.querySelector('.form .btn');
    if (demo && screen) {
      const bands = [
        { top: 12.9, height: 16.8 },
        { top: 31.3, height: 27.5 },
        { top: 60.2, height: 16.7 },
      ];
      const scrims = bands.map((b) => {
        const d = document.createElement('div');
        d.className = 'p2-cscrim';
        d.style.top = b.top + '%';
        d.style.height = b.height + '%';
        d.setAttribute('aria-hidden', 'true');
        screen.insertBefore(d, screen.firstChild);   /* behind .demo__h and .form, which stay untouched */
        return d;
      });

      let done = false, timers = [];
      const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
      const revealAll = () => {
        if (done) return; done = true; clearTimers();
        scrims.forEach((s) => s.classList.add('is-off'));
        if (btn) btn.classList.add('p2-cglow');
      };
      const revealSequence = () => {
        if (done) return; done = true;
        scrims.forEach((s, k) => { timers.push(setTimeout(() => s.classList.add('is-off'), k * 400)); });
        timers.push(setTimeout(() => { if (btn) btn.classList.add('p2-cglow'); }, scrims.length * 400 + 200));
      };

      if (P2.RM) { revealAll(); }
      else {
        /* any real interaction inside the section lights it at once, so the
           form is never sitting behind an unfinished animation */
        demo.addEventListener('click', revealAll, { once: true });   /* r97: a scroll drag is not a tap */
        demo.addEventListener('focusin', revealAll, { once: true });
        P2.onView(demo, .35, revealSequence);
      }
    }
  }
})();
