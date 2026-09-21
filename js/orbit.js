/* ==========================================================================
   L Squared - Logo Orbit  (Round 2)
   Vanilla JS, no dependencies, no globals. Auto-mounts every
   <section class="orbit" data-theme="dark|light"> on the page.

   R2 changes
   1. The centre mark is a pixel mosaic on canvas: every solid square of the
      mark is a fine grid of cells that scatter away from the pointer with
      spring physics and reassemble when it leaves. At rest the cells tile
      edge to edge, so the assembled mark is pixel-identical to the real mark.
      The open middle square stays the portal; a logo passing through it
      bursts the nearby cells outward.
   2. Pool + slots. A fixed number of visible SLOTS orbit; POOL holds every
      logo. The instant a slot's logo spirals into the portal and vanishes,
      the next logo in the queue emerges from the portal in that same slot,
      so the portal reads as a swap. Order is shuffled per cycle with no
      immediate repeats, and every entry gets equal airtime.
   3. The pool is a plain array - drop more entries in and nothing else
      needs to change.
   ========================================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     POOL
     name      shown in the hover label and the screen-reader list
     industry  <!-- PENDING CLIENT CONFIRMATION --> every industry / partner
               string below is a draft. The six client entries were written
               by SNB. The five partner entries use the headings L Squared
               publishes above those logos on lsquared.com/about
               ("Go To Market Partner", "Hardware Partners",
               "Distribution Partners"). Confirm all of them with the client
               before this block ships to a public page.
     type      'client'  | 'partner'  - see QA-NOTES.md, Round 2. The five
               new logos are published under "Powerful Partnerships", NOT
               under a client list, so they are tagged partner.
               PENDING CLIENT CONFIRMATION.
     src       original artwork, kept unmodified in assets/
     tone      'dark'  artwork ink is predominantly dark  (needs inverting on
                       the near-black band)
               'light' artwork ink is predominantly light (needs inverting on
                       the cream band)
               Drives the monochrome filter only. Measured from the source
               files, not guessed.
     safe      themes where the ORIGINAL colour artwork is legible, so the
               hover state can reveal full colour. Where a theme is missing,
               the hover state brightens the monochrome treatment instead of
               revealing an illegible logo.
               PENDING: request reversed/duotone masters from the client for
               UPS Store (light band), McMaster / International Centre (dark
               band) and Best Buy Business / Geek Squad / Lenovo (dark band).
     ---------------------------------------------------------------------- */

  var POOL = [
    { name: 'The UPS Store',        industry: 'Retail',               type: 'client',  src: 'assets/logos/ups-store.png',            tone: 'light', safe: 'dark' },
    { name: 'Cold Stone Creamery',  industry: 'QSR',                  type: 'client',  src: 'assets/logos/cold-stone-creamery.png',  tone: 'light', safe: 'light dark' },
    { name: 'Hatch',                industry: 'Corporate',            type: 'client',  src: 'assets/logos/hatch.png',                tone: 'dark',  safe: 'light dark' },
    { name: 'McMaster University',  industry: 'Education',            type: 'client',  src: 'assets/logos/mcmaster-university.png',  tone: 'dark',  safe: 'light' },
    { name: 'International Centre', industry: 'Venues',               type: 'client',  src: 'assets/logos/international-centre.png', tone: 'dark',  safe: 'light' },
    /* r4: Purolator is the quoted customer in this band, so it is not also
       flown in the orbit next to its own quote. */
    { name: 'Cisco',                industry: 'Go-to-market partner',  type: 'partner', src: 'assets/logos/cisco.png',                tone: 'dark',  safe: 'light dark' },
    { name: 'Best Buy Business',    industry: 'Go-to-market partner',  type: 'partner', src: 'assets/logos/best-buy-business.png',    tone: 'dark',  safe: 'light' },
    /* r6: the Geek Squad oval renders as a washed out grey badge at this size
       and reads as a broken mark, so it is not flown in this band. */
    { name: 'Lenovo',               industry: 'Hardware partner',      type: 'partner', src: 'assets/logos/lenovo.png',               tone: 'dark',  safe: 'light' },
    { name: 'SFM',                  industry: 'Distribution partner',  type: 'partner', src: 'assets/logos/sfm.png',                  tone: 'dark',  safe: 'light dark' }
  ];

  /* ----------------------------------------------------------------------
     TUNING
     ---------------------------------------------------------------------- */

  var CFG = {
    cycle:        [22.0, 28.0],   // fallback bounds; the real cycle lives on the ring
    revolutions:  [1.0, -0.72],   // signed turns per cycle, per ring (ring 1 counter-rotates)
    emerge:       0.115,          // fraction of the cycle spent spiralling out
    retreat:      0.115,          // fraction spent spiralling back in
    bornScale:    0.14,           // never scale(0) - a logo has size before it is visible
    slowFactor:   0.00,           // v7: a held (hovered / focused) logo pauses the orbit
    slowLerp:     3.2,
    holdLerp:     7.0,
    pushRadius:   190,            // px, pointer repulsion reach (logos)
    pushForce:    620,
    spring:       { k: 150, d: 17 },
    activeScale:  1.62,
    dragToSpin:   0.0042,
    spinFriction: 2.6,
    markTilt:     11,             // degrees the mark leans toward a nearby pointer
    portalGate:   0.20,           // normalised radius that counts as "in the portal"

    /* --- mosaic --- */
    cellSpring:   { k: 260, d: 19 },  // stiffness / damping of a cell's return home
    cellReach:    1.05,               // scatter radius as a multiple of the mark size
    cellThrow:    0.92,               // peak displacement as a fraction of one mark square
    cellBurst:    560,                // px/s impulse at the portal when a logo passes
    cellGridLg:   6,                  // cells per side of a mark square, large marks
    cellGridSm:   4                   // …small marks (mobile)
  };

  /* 3x3 mark. Matches "New Lsquared Logo boxes.png":
     row 0: blue  grey  grey
     row 1: blue  OPEN  grey
     row 2: blue  blue  grey                                                */
  var MARK = [
    ['blue', 'grey', 'grey'],
    ['blue', 'open', 'grey'],
    ['blue', 'blue', 'grey']
  ];

  /* Visible slots by stage width. The pool keeps cycling through them. */
  /* v7: the band wants 7 to 8 marks in the air at once on a wide screen. */
  function slotsFor(w) { return w >= 980 ? 8 : w >= 620 ? 6 : 4; }

  /* ----------------------------------------------------------------------
     Helpers
     ---------------------------------------------------------------------- */

  var TAU = Math.PI * 2;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInCubic(t) { return t * t * t; }

  /* Deterministic scatter so the ring never looks mechanically even but is
     identical on every load. */
  function hash01(i, salt) {
    var x = Math.sin((i + 1) * 127.1 + salt * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function px(el, prop) {
    return parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0;
  }

  /* Warm the image cache once per page so a portal swap never pops. Loaded
     one after another, not in a burst: the visible slots must get the
     connection first, and a whole pool requested at once can saturate a
     small server. */
  var warmed = false;
  function warmImages() {
    if (warmed) return;
    warmed = true;
    var i = 0;
    (function next() {
      if (i >= POOL.length) return;
      var im = new Image();
      im.decoding = 'async';
      im.onload = im.onerror = next;
      im.src = POOL[i++].src;
    })();
  }

  /* ----------------------------------------------------------------------
     Mount
     ---------------------------------------------------------------------- */

  function mount(root) {
    if (root.dataset.orbitMounted === 'true') return;
    root.dataset.orbitMounted = 'true';
    setTimeout(warmImages, 400);   // visible slots load first

    var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    var fineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');

    /* ---- DOM ---------------------------------------------------------- */

    var stage = document.createElement('div');
    stage.className = 'orbit__stage';

    var field = document.createElement('div');
    field.className = 'orbit__field';

    var mark = document.createElement('div');
    mark.className = 'orbit__mark';
    mark.setAttribute('aria-hidden', 'true');

    // The mosaic canvas overspills the mark box so scattered cells are never
    // clipped. Geometry in CSS (.orbit__mosaic), scale factor mirrored here.
    var MOSAIC_OVERSPILL = 1.8;
    var canvas = document.createElement('canvas');
    canvas.className = 'orbit__mosaic';
    var ctx = canvas.getContext('2d');
    mark.appendChild(canvas);

    // The open middle square: not drawn, just a breathing rim.
    var portal = document.createElement('span');
    portal.className = 'orbit__cell orbit__portal';
    portal.style.left = '34.7%';
    portal.style.top = '34.7%';
    mark.appendChild(portal);

    /* Screen-reader list names EVERY entry in the pool, not only the logos
       currently on screen. */
    var srList = document.createElement('ul');
    srList.className = 'orbit__sr';
    srList.setAttribute('aria-label', 'Clients and partners');
    POOL.forEach(function (p) {
      var li = document.createElement('li');
      li.textContent = p.name + ', ' + p.industry;
      srList.appendChild(li);
    });

    /* ---- Slots -------------------------------------------------------- */

    var MAX_SLOTS = 8;
    var slots = [];

    for (var s = 0; s < MAX_SLOTS; s++) {
      // Wrapper carries position only. The real control is .orbit__art, so
      // no interactive element is ever nested inside another.
      var wrap = document.createElement('div');
      wrap.className = 'orbit__logo';

      var art = document.createElement('button');
      art.className = 'orbit__art';
      art.type = 'button';
      art.setAttribute('aria-pressed', 'false');

      var mono = document.createElement('img');
      mono.className = 'orbit__img orbit__img--mono';
      mono.alt = '';
      mono.setAttribute('aria-hidden', 'true');
      mono.draggable = false;
      mono.decoding = 'async';

      var color = document.createElement('img');
      color.className = 'orbit__img orbit__img--color';
      color.alt = '';
      color.setAttribute('aria-hidden', 'true');
      color.draggable = false;
      color.decoding = 'async';

      art.appendChild(mono);
      art.appendChild(color);

      var label = document.createElement('span');
      label.className = 'orbit__label';
      label.setAttribute('aria-hidden', 'true');
      var nameEl = document.createElement('span');
      nameEl.className = 'orbit__name';
      var indEl = document.createElement('span');
      indEl.className = 'orbit__industry';
      label.appendChild(nameEl);
      label.appendChild(indEl);

      wrap.appendChild(art);
      wrap.appendChild(label);
      // A slot is hidden until layout() activates it, so an unused slot is
      // never rendered and never lands in the tab order.
      wrap.style.display = 'none';
      field.appendChild(wrap);

      slots.push({
        el: wrap, art: art, mono: mono, color: color,
        nameEl: nameEl, indEl: indEl,
        i: s,
        id: -1,        // index into POOL, -1 = empty
        active: false,
        ring: 0,
        t: 0,          // own cycle clock, seconds
        cycle: 20,
        turns: 1,
        theta0: 0,
        hold: 0,       // 0 free .. 1 frozen
        target: 0,
        ox: 0, oy: 0,  // spring offset from pointer push
        vx: 0, vy: 0,
        press: 0,
        prevR: 0,
        z: 20,
        rJitter: 1
      });
    }

    stage.appendChild(field);
    stage.appendChild(mark);
    root.appendChild(stage);
    root.appendChild(srList);

    /* ---- Queue: equal airtime, shuffled, no immediate repeat ----------- */

    var queue = [], lastDealt = -1;

    function refill() {
      var order = [];
      for (var i = 0; i < POOL.length; i++) order.push(i);
      for (var j = order.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = order[j]; order[j] = order[k]; order[k] = tmp;
      }
      if (order.length > 1 && order[0] === lastDealt) order.push(order.shift());
      queue = order;
    }

    function inUse(id) {
      for (var i = 0; i < slots.length; i++) {
        if (slots[i].active && slots[i].id === id) return true;
      }
      return false;
    }

    function deal() {
      if (!queue.length) refill();
      for (var i = 0; i < queue.length; i++) {
        if (!inUse(queue[i])) {
          var id = queue.splice(i, 1)[0];
          lastDealt = id;
          return id;
        }
      }
      // Pool smaller than the slot count: fall through rather than stall.
      var head = queue.shift();
      lastDealt = head;
      return head;
    }

    function fill(slot) {
      var id = deal();
      var p = POOL[id];
      slot.id = id;
      slot.mono.src = p.src;
      slot.color.src = p.src;
      slot.art.setAttribute('aria-label', p.name + ', ' + p.industry);
      slot.nameEl.textContent = p.name;
      slot.indEl.textContent = p.industry;
      slot.el.dataset.key = p.src.replace(/^.*\//, '').replace(/\.[a-z]+$/i, '');
      slot.el.dataset.tone = p.tone;
      slot.el.dataset.safe = p.safe;
      slot.el.dataset.type = p.type;
    }

    /* ---- Layout ------------------------------------------------------- */

    var W = 0, H = 0, oneRing = false;
    var rings = [];
    var markCentre = { x: 0, y: 0 };
    var markHalf = 60;
    var activeCount = 0;

    function layout() {
      var rect = stage.getBoundingClientRect();
      W = rect.width; H = rect.height;
      oneRing = W < 620 || root.dataset.orbitRings === '1';

      var markSize = px(root, '--orbit-mark-size');
      var logoW = px(root, '--orbit-logo-w');
      var logoH = px(root, '--orbit-logo-h');

      // Keep the outermost logo fully inside the stage on every axis,
      // allowing for the largest depth scale a logo can reach (0.64 + 0.5).
      var DEPTH_MAX = 1.14;
      var maxRx = W / 2 - (logoW / 2) * DEPTH_MAX - 6;
      /* v7: the hover labels are hidden in this build, so the 34px reserve they
         needed is given back to the ellipse. A rounder ring keeps the logos off
         the centre mark instead of sliding through it in one flat band. */
      var labelRoom = getComputedStyle(root).getPropertyValue('--orbit-label-room');
      var maxRy = H / 2 - (logoH / 2) * DEPTH_MAX - (parseFloat(labelRoom) || 34);

      rings = oneRing
        /* r7b: a rounder single ring. The vertical radius is what holds a logo
           off the mark, so it takes as much of the stage as the stage allows. */
        ? [{ rx: Math.min(maxRx, W * 0.40), ry: Math.min(maxRy, H * 0.42), tilt: -0.10, cycle: 23 }]
        : [
            { rx: Math.min(maxRx, W * 0.425), ry: Math.min(maxRy, H * 0.30), tilt: -0.12, cycle: 22 },
            { rx: Math.min(maxRx, W * 0.255), ry: Math.min(maxRy, H * 0.44), tilt: 0.26, cycle: 28 }
          ];

      /* Slot count follows the stage width. Retiring a slot returns its logo
         to the front of the queue so nothing loses its turn. */
      var asked = parseInt(root.dataset.orbitSlots, 10);
      var want = Math.min(asked > 0 ? asked : slotsFor(W), MAX_SLOTS);
      /* r7b: a narrow stage has too little ring to hold a requested count with
         real clear space between the marks, so the count follows the ring. */
      if (W < 470) want = Math.min(want, 4);
      activeCount = want;
      slots.forEach(function (S, i) {
        var on = i < want;
        if (S.active && !on) {
          if (S.id >= 0) queue.unshift(S.id);
          S.active = false;
          S.id = -1;
          S.el.style.display = 'none';
          if (hovered === S) hovered = null;
          if (pinned === S) pinned = null;
          if (focused === S) focused = null;
        } else if (!S.active && on) {
          S.active = true;
          S.el.style.display = '';
          S.t = 0;
          fill(S);
        }
      });

      // Ring assignment + phase spread. Recomputed on resize so the mobile
      // single-ring layout stays evenly distributed.
      var perRing = [];
      for (var k = 0; k < rings.length; k++) perRing.push(0);
      var live = slots.filter(function (S) { return S.active; });
      live.forEach(function (S, i) {
        S.ring = rings.length === 1 ? 0 : i % rings.length;
        perRing[S.ring]++;
      });
      var seen = [];
      for (var k2 = 0; k2 < rings.length; k2++) seen.push(0);

      /* Everything on a ring shares the ring's cycle, and phases are spread
         evenly across it. Because theta is derived from that same phase,
         even spacing in the life cycle IS even spacing in angle - slots on a
         ring can never drift into each other. */
      live.forEach(function (S, i) {
        var n = perRing[S.ring];
        var idx = seen[S.ring]++;
        var phase = idx / n;
        S.cycle = rings[S.ring].cycle;
        S.turns = CFG.revolutions[S.ring % CFG.revolutions.length];
        S.theta0 = rings[S.ring].tilt * 2;
        S.rJitter = 0.94 + hash01(i, 11) * 0.12;
        if (S.t === 0) S.t = phase * S.cycle;
      });

      markCentre.x = W / 2;
      markCentre.y = H / 2;
      markHalf = markSize / 2;

      buildMosaic(markSize);
    }

    /* ---- Mosaic: the mark, built from cells --------------------------- */

    var cells = [];
    var mosaicW = 0, mosaicH = 0, dpr = 1;
    var inkBlue = '#56B0E4', inkGrey = '#CBCDCF';
    var cellThrow = 30, cellReach = 200;

    function buildMosaic(markSize) {
      var box = markSize * MOSAIC_OVERSPILL;
      mosaicW = mosaicH = box;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(box * dpr);
      canvas.height = Math.round(box * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var cs = getComputedStyle(root);
      inkBlue = (cs.getPropertyValue('--orbit-accent') || '#56B0E4').trim();
      inkGrey = (cs.getPropertyValue('--orbit-mark-grey') || '#CBCDCF').trim();

      var n = markSize < 130 ? CFG.cellGridSm : CFG.cellGridLg;
      var origin = (box - markSize) / 2;
      var big = markSize / 3;
      cellThrow = big * CFG.cellThrow;
      cellReach = markSize * CFG.cellReach;

      /* Square edges are rounded ONCE, then cell edges are rounded inside
         them, so at rest the cells tile with no seam and no overlap: the
         assembled mosaic is pixel-identical to the solid mark. */
      var edge = [];
      for (var q = 0; q <= 3; q++) edge.push(Math.round(origin + q * big));

      cells = [];
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
          var kind = MARK[r][c];
          if (kind === 'open') continue;              // the portal stays empty
          var x0 = edge[c], x1 = edge[c + 1];
          var y0 = edge[r], y1 = edge[r + 1];
          for (var j = 0; j < n; j++) {
            var cy0 = Math.round(y0 + (y1 - y0) * j / n);
            var cy1 = Math.round(y0 + (y1 - y0) * (j + 1) / n);
            for (var i = 0; i < n; i++) {
              var cx0 = Math.round(x0 + (x1 - x0) * i / n);
              var cx1 = Math.round(x0 + (x1 - x0) * (i + 1) / n);
              cells.push({
                x: cx0, y: cy0, w: cx1 - cx0, h: cy1 - cy0,
                cx: (cx0 + cx1) / 2, cy: (cy0 + cy1) / 2,
                blue: kind === 'blue',
                ox: 0, oy: 0, vx: 0, vy: 0
              });
            }
          }
        }
      }
      paintMosaic();
    }

    function paintMosaic() {
      ctx.clearRect(0, 0, mosaicW, mosaicH);
      for (var pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass === 0 ? inkBlue : inkGrey;
        var wantBlue = pass === 0;
        for (var i = 0; i < cells.length; i++) {
          var q = cells[i];
          if (q.blue !== wantBlue) continue;
          /* Offsets are rounded to whole pixels: a displaced cell is still a
             hard-edged pixel, and a cell on its way home never leaves a
             half-pixel seam against its neighbour. */
          /* v7: a gap is held back on every cell so the mark reads as a
             mosaic of pixels at rest, not three flat blocks. */
          var gp = q.w > 7 ? 2 : 1;
          if (q.ox === 0 && q.oy === 0) ctx.fillRect(q.x, q.y, q.w - gp, q.h - gp);
          else ctx.fillRect(q.x + Math.round(q.ox), q.y + Math.round(q.oy), q.w - gp, q.h - gp);
        }
      }
    }

    function restMosaic() {
      for (var i = 0; i < cells.length; i++) {
        var q = cells[i]; q.ox = q.oy = q.vx = q.vy = 0;
      }
      paintMosaic();
    }

    /* A logo dropping through the portal shoves the nearby cells outward. */
    function burstMosaic() {
      var mid = mosaicW / 2;
      var falloff = markHalf * 1.25;
      for (var i = 0; i < cells.length; i++) {
        var q = cells[i];
        var dx = q.cx - mid, dy = q.cy - mid;
        var d = Math.hypot(dx, dy) || 1;
        var g = Math.exp(-d / falloff);
        q.vx += (dx / d) * CFG.cellBurst * g;
        q.vy += (dy / d) * CFG.cellBurst * g;
      }
    }

    /* ---- Interaction state -------------------------------------------- */

    var markTilt = { x: 0, y: 0 };
    var pointer = { x: 0, y: 0, inside: false };
    var touchPress = false;         // coarse pointer held down: cells part too
    var hovered = null;
    var focused = null;
    var pinned = null;
    var speed = 1;
    var spin = 0;
    var spinVel = 0;
    var portalEnergy = 0;

    function held() { return pinned || focused || hovered; }

    function setActive() {
      var h = held();
      slots.forEach(function (S) {
        var on = S === h;
        S.target = on ? 1 : 0;
        if (S.el.classList.contains('is-active') !== on) {
          S.el.classList.toggle('is-active', on);
        }
        var isPinned = (S === pinned) ? 'true' : 'false';
        if (S.art.getAttribute('aria-pressed') !== isPinned) {
          S.art.setAttribute('aria-pressed', isPinned);
        }
      });
    }

    /* Pointer -------------------------------------------------------- */

    function stagePoint(e) {
      var r = stage.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    }

    stage.addEventListener('pointermove', function (e) {
      stagePoint(e);
      pointer.inside = true;
      if (drag.active) onDragMove(e);
    });

    stage.addEventListener('pointerleave', function () {
      pointer.inside = false;
      touchPress = false;
      hovered = null;
      setActive();
    });

    slots.forEach(function (S) {
      S.art.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse' || drag.moved) return;
        hovered = S;
        setActive();
      });
      S.art.addEventListener('pointerleave', function (e) {
        if (e.pointerType !== 'mouse') return;
        if (hovered === S) { hovered = null; setActive(); }
      });
      S.art.addEventListener('pointerdown', function () { S.press = 1; });
      S.art.addEventListener('focus', function () { focused = S; setActive(); });
      S.art.addEventListener('blur', function () {
        if (focused === S) { focused = null; setActive(); }
      });
      // Click / tap / Enter / Space all pin. Tap again, or tap the
      // background, to release. Suppressed when the gesture was a drag.
      S.art.addEventListener('click', function (e) {
        if (drag.moved) { e.preventDefault(); return; }
        pinned = (pinned === S) ? null : S;
        setActive();
      });
    });

    stage.addEventListener('click', function (e) {
      if (drag.moved) return;
      if (!e.target.closest('.orbit__art') && pinned) {
        pinned = null;
        setActive();
      }
    });

    /* Drag to spin --------------------------------------------------- */

    var drag = { active: false, id: null, x: 0, moved: false, lastX: 0, lastT: 0, vel: 0 };

    stage.addEventListener('pointerdown', function (e) {
      if (drag.active) return;                       // multi-touch protection
      drag.active = true;
      drag.id = e.pointerId;
      drag.x = e.clientX;
      drag.lastX = e.clientX;
      drag.lastT = performance.now();
      drag.moved = false;
      drag.vel = 0;
      spinVel = 0;
      stagePoint(e);
      pointer.inside = true;
      if (e.pointerType !== 'mouse') touchPress = true;   // finger parts the cells
      stage.setPointerCapture(e.pointerId);
    });

    function onDragMove(e) {
      if (e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.lastX;
      var now = performance.now();
      var dt = Math.max(now - drag.lastT, 1) / 1000;
      if (Math.abs(e.clientX - drag.x) > 6) {
        drag.moved = true;
        stage.classList.add('is-dragging');
      }
      if (drag.moved) {
        spin += dx * CFG.dragToSpin;
        drag.vel = (dx * CFG.dragToSpin) / dt;
      }
      drag.lastX = e.clientX;
      drag.lastT = now;
    }

    function endDrag(e) {
      if (!drag.active || (e && e.pointerId !== drag.id)) return;
      drag.active = false;
      touchPress = false;
      stage.classList.remove('is-dragging');
      if (drag.moved) {
        // Hand the gathered velocity to momentum; it decays back to normal.
        spinVel = clamp(drag.vel, -9, 9);
      }
      if (e) { try { stage.releasePointerCapture(e.pointerId); } catch (err) {} }
      // Let the click handler see drag.moved, then clear it.
      setTimeout(function () { drag.moved = false; }, 0);
    }

    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    /* ---- Static (reduced motion) mode --------------------------------- */

    function renderStatic() {
      root.dataset.static = 'true';
      layout();
      var ring = rings[0];
      var live = slots.filter(function (S) { return S.active; });
      live.forEach(function (S, i) {
        var a = (i / live.length) * TAU - Math.PI / 2;
        var x = Math.cos(a) * ring.rx;
        var y = Math.sin(a) * ring.ry;
        var ct = Math.cos(ring.tilt), st = Math.sin(ring.tilt);
        S.el.style.transform =
          'translate3d(' + (x * ct - y * st).toFixed(1) + 'px,' +
          (x * st + y * ct).toFixed(1) + 'px,0)';
        S.art.style.transform = '';
        S.art.style.opacity = '';
        S.el.style.zIndex = 80;
      });
      mark.style.transform = 'translateZ(0)';
      root.style.setProperty('--orbit-portal-energy', '0');
      restMosaic();   // solid, static mark
    }

    /* ---- Frame -------------------------------------------------------- */

    var running = false, last = 0, rafId = 0;
    var visible = true, tabVisible = !document.hidden;

    function step(now) {
      rafId = requestAnimationFrame(step);
      var dt = Math.min((now - last) / 1000, 0.05);  // clamp after a stall
      last = now;
      if (dt <= 0) return;

      /* global speed eases toward slow while anything is held. Because the
         clock is accumulated (never derived from absolute time) resuming is
         continuous - no jump. */
      var anyHeld = !!held();
      var targetSpeed = anyHeld ? CFG.slowFactor : 1;
      speed = lerp(speed, targetSpeed, 1 - Math.exp(-CFG.slowLerp * dt));

      /* spin momentum decays back to zero */
      if (spinVel !== 0) {
        spin += spinVel * dt;
        spinVel *= Math.exp(-CFG.spinFriction * dt);
        if (Math.abs(spinVel) < 0.002) spinVel = 0;
      }

      var markSize = markHalf * 2;
      var fine = fineMQ.matches;
      var pushOn = fine && pointer.inside && !drag.active;
      var swapped = false;

      for (var i = 0; i < slots.length; i++) {
        var L = slots[i];
        if (!L.active) continue;

        L.hold = lerp(L.hold, L.target, 1 - Math.exp(-CFG.holdLerp * dt));
        L.t += dt * speed * (1 - L.hold);

        /* THE SWAP. The cycle ends with the logo spiralled into the portal
           at zero opacity, and begins with the next one spiralling out of
           it. Handing the slot to the next queue entry exactly on the wrap
           makes the exit and the entry the same instant at the same point -
           the portal reads as a swap. A held (hovered / focused / pinned)
           slot can never reach the wrap, because its clock is frozen, and
           is guarded here as well. */
        if (L.t >= L.cycle) {
          L.t -= L.cycle * Math.floor(L.t / L.cycle);
          if (L !== hovered && L !== focused && L !== pinned) {
            if (L.id >= 0) { /* retired */ }
            fill(L);
            swapped = true;
          }
        }

        var p = (L.t % L.cycle) / L.cycle;
        var ring = rings[Math.min(L.ring, rings.length - 1)];

        /* radius envelope: spiral out, orbit, spiral in */
        var rad, sc, op;
        if (p < CFG.emerge) {
          var e = easeOutCubic(p / CFG.emerge);
          rad = e;
          sc = lerp(CFG.bornScale, 1, e);
          op = clamp(e * 1.6, 0, 1);
        } else if (p > 1 - CFG.retreat) {
          var q = (p - (1 - CFG.retreat)) / CFG.retreat;
          var e2 = easeInCubic(q);
          rad = 1 - e2;
          sc = lerp(1, CFG.bornScale, e2);
          op = clamp((1 - e2) * 1.6, 0, 1);
        } else {
          rad = 1; sc = 1; op = 1;
        }

        /* angle: continuous through the whole cycle, so emerging and
           retreating read as a spiral rather than a straight line */
        var theta = L.theta0 + TAU * L.turns * p + spin * (L.turns >= 0 ? 1 : -1);

        var ex = Math.cos(theta) * ring.rx * rad * L.rJitter;
        var ey = Math.sin(theta) * ring.ry * rad * L.rJitter;
        var ct = Math.cos(ring.tilt), st = Math.sin(ring.tilt);
        var bx = ex * ct - ey * st;
        var by = ex * st + ey * ct;

        /* depth: sin(theta) > 0 is the near half of the ring */
        var depth = (Math.sin(theta) + 1) / 2;
        var dScale = 0.64 + 0.5 * depth;
        var dOpacity = 0.40 + 0.60 * depth;

        /* portal event: fire when a logo crosses the portal threshold */
        if ((L.prevR > CFG.portalGate) !== (rad > CFG.portalGate)) {
          burstMosaic();
          portalEnergy = 1;
        }
        L.prevR = rad;

        /* pointer push - spring, so it has weight and can be interrupted */
        var fx = 0, fy = 0;
        if (pushOn && op > 0.05) {
          var lx = W / 2 + bx + L.ox;
          var ly = H / 2 + by + L.oy;
          var ddx = lx - pointer.x, ddy = ly - pointer.y;
          var d = Math.hypot(ddx, ddy);
          if (d < CFG.pushRadius && d > 0.01) {
            var falloff = 1 - d / CFG.pushRadius;
            // A held logo is pulled toward the pointer; the rest are pushed.
            var sign = (L.hold > 0.3) ? -0.35 : 1;
            var mag = CFG.pushForce * falloff * falloff * sign;
            fx = (ddx / d) * mag;
            fy = (ddy / d) * mag;
          }
        }
        L.vx += (fx - CFG.spring.k * L.ox - CFG.spring.d * L.vx) * dt;
        L.vy += (fy - CFG.spring.k * L.oy - CFG.spring.d * L.vy) * dt;
        L.ox += L.vx * dt;
        L.oy += L.vy * dt;
        if (Math.abs(L.ox) < 0.01 && Math.abs(L.vx) < 0.01) { L.ox = 0; L.vx = 0; }
        if (Math.abs(L.oy) < 0.01 && Math.abs(L.vy) < 0.01) { L.oy = 0; L.vy = 0; }

        /* press feedback, released fast */
        L.press = lerp(L.press, 0, 1 - Math.exp(-9 * dt));

        var finalScale = sc * dScale *
          lerp(1, CFG.activeScale, L.hold) *
          (1 - 0.03 * L.press);
        var finalOpacity = op * lerp(dOpacity, 1, L.hold);

        /* z-order: a held logo always wins; otherwise the near half of the
           ring passes in front of the mark and the far half behind it */
        /* While a logo is inside the portal gate it sits just above the mark,
           so the swap is readable through the open middle square instead of
           being hidden behind a solid one. */
        var z = L.hold > 0.35 ? 90
              : (rad < CFG.portalGate * 1.7 ? 60
              : (depth > 0.5 ? 80 : 20));
        if (z !== L.z) { L.el.style.zIndex = z; L.z = z; }

        L.el.style.transform =
          'translate3d(' + (bx + L.ox).toFixed(2) + 'px,' +
          (by + L.oy).toFixed(2) + 'px,0)';
        L.art.style.transform = 'scale(' + finalScale.toFixed(4) + ')';
        L.art.style.opacity = finalOpacity.toFixed(3);
      }
      if (swapped) setActive();

      /* ---- Mark: lean toward a nearby pointer ------------------------- */

      var dFromMark = pushOn
        ? Math.hypot(pointer.x - markCentre.x, pointer.y - markCentre.y)
        : 1e5;
      // Lean only when the pointer is actually near the mark, so the mosaic
      // stays perfectly square - and therefore crisp - at rest.
      var near = clamp(1 - dFromMark / (markSize * 1.9), 0, 1);
      var tiltX = 0, tiltY = 0;
      if (pushOn && near > 0) {
        var nx = clamp((pointer.x - markCentre.x) / (W / 2), -1, 1);
        var ny = clamp((pointer.y - markCentre.y) / (H / 2), -1, 1);
        tiltY = nx * CFG.markTilt * near;
        tiltX = -ny * CFG.markTilt * near;
      }
      markTilt.x = lerp(markTilt.x, tiltX, 1 - Math.exp(-6 * dt));
      markTilt.y = lerp(markTilt.y, tiltY, 1 - Math.exp(-6 * dt));
      if (Math.abs(markTilt.x) < 0.01 && Math.abs(markTilt.y) < 0.01) {
        markTilt.x = markTilt.y = 0;
        mark.style.transform = 'translateZ(0)';
      } else {
        mark.style.transform =
          'rotateX(' + markTilt.x.toFixed(2) + 'deg) rotateY(' + markTilt.y.toFixed(2) + 'deg)';
      }

      portalEnergy = lerp(portalEnergy, 0, 1 - Math.exp(-1.7 * dt));
      root.style.setProperty('--orbit-portal-energy', portalEnergy.toFixed(3));

      /* ---- Mosaic: cells part around the pointer, spring home --------- */

      var cellsLive = (pushOn || touchPress) && pointer.inside;
      var px0 = pointer.x - (markCentre.x - mosaicW / 2);
      var py0 = pointer.y - (markCentre.y - mosaicH / 2);
      var moving = false;

      for (var ci = 0; ci < cells.length; ci++) {
        var q2 = cells[ci];
        var cfx = 0, cfy = 0;
        if (cellsLive) {
          var qdx = (q2.cx + q2.ox) - px0;
          var qdy = (q2.cy + q2.oy) - py0;
          var qd = Math.hypot(qdx, qdy);
          if (qd < cellReach && qd > 0.01) {
            var kk = 1 - qd / cellReach;
            // Steady-state offset is cellThrow * kk^2 away from the pointer.
            var mg = CFG.cellSpring.k * cellThrow * kk * kk;
            cfx = (qdx / qd) * mg;
            cfy = (qdy / qd) * mg;
          }
        }
        q2.vx += (cfx - CFG.cellSpring.k * q2.ox - CFG.cellSpring.d * q2.vx) * dt;
        q2.vy += (cfy - CFG.cellSpring.k * q2.oy - CFG.cellSpring.d * q2.vy) * dt;
        q2.ox += q2.vx * dt;
        q2.oy += q2.vy * dt;
        // Snap to exact zero so the assembled mark is seam-perfect.
        if (Math.abs(q2.ox) < 0.35 && Math.abs(q2.vx) < 2) { q2.ox = 0; q2.vx = 0; }
        if (Math.abs(q2.oy) < 0.35 && Math.abs(q2.vy) < 2) { q2.oy = 0; q2.vy = 0; }
        if (q2.ox !== 0 || q2.oy !== 0) moving = true;
      }
      if (moving || mosaicDirty) {
        paintMosaic();
        mosaicDirty = moving;   // one final settled repaint, then idle
      }
    }

    var mosaicDirty = true;

    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      mosaicDirty = true;
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(rafId);
    }

    function sync() {
      if (reduceMQ.matches) { stop(); renderStatic(); return; }
      root.dataset.static = 'false';
      if (visible && tabVisible) start(); else stop();
    }

    /* ---- Lifecycle ---------------------------------------------------- */

    layout();

    var ro = new ResizeObserver(function () {
      layout();
      if (reduceMQ.matches) renderStatic();
      else mosaicDirty = true;
    });
    ro.observe(stage);

    var io = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      sync();
    }, { threshold: 0.01 });
    io.observe(root);

    document.addEventListener('visibilitychange', function () {
      tabVisible = !document.hidden;
      sync();
    });

    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', sync);

    // The theme can be switched at runtime; the mosaic ink comes from CSS.
    var mo = new MutationObserver(function () {
      var cs = getComputedStyle(root);
      inkBlue = (cs.getPropertyValue('--orbit-accent') || inkBlue).trim();
      inkGrey = (cs.getPropertyValue('--orbit-mark-grey') || inkGrey).trim();
      paintMosaic();
    });
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    sync();
  }

  function init() {
    var nodes = document.querySelectorAll('.orbit');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
