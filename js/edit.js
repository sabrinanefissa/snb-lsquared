/* r60: the page reads content.js (the one file Sabrina edits on GitHub) and
   puts its words, photos and layout settings onto the page before any other
   script runs. If content.js is missing or broken, the page simply keeps the
   words written in index.html, so an editing mistake can never blank the site. */
(function () {
  var root = document.documentElement;
  try {
    var raw = window.LSQ_CONTENT;
    if (typeof raw !== 'string') return;
    var C = {};
    raw.split(/\r?\n/).forEach(function (line) {
      var t = line.trim();
      if (!t || t.charAt(0) === '#' || t.slice(0, 2) === '==') return;
      var i = t.indexOf(':');
      if (i < 1) return;
      C[t.slice(0, i).trim().toLowerCase().replace(/\s+/g, ' ')] = t.slice(i + 1).trim();
    });
    window.LSQ = C;

    var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
    var has = function (k) { return Object.prototype.hasOwnProperty.call(C, k) && C[k] !== ''; };
    var pick = function (sel, i) { var els = $$(sel); return i == null ? els : (els[i] ? [els[i]] : []); };
    /* photos are named by their file in the assets folder; ?e=1 makes sure a
       browser never shows an older copy it kept from before this system */
    var file = function (v) { return 'assets/' + v.replace(/^\/+/, '').replace(/^assets\//, '') + (v.indexOf('?') < 0 ? '?e=1' : ''); };
    /* a | in the text is a line break */
    var put = function (el, v) {
      el.textContent = '';
      v.split('|').forEach(function (p, n) {
        if (n) el.appendChild(document.createElement('br'));
        el.appendChild(document.createTextNode(p.trim()));
      });
    };
    var text = function (k, sel, i) { if (has(k)) pick(sel, i).forEach(function (el) { put(el, C[k]); }); };
    var bg = function (k, sel, i) { if (has(k)) pick(sel, i).forEach(function (el) { el.style.backgroundImage = 'url(' + file(C[k]) + ')'; }); };
    var phone = function (k, sel, i) { if (has(k)) pick(sel, i).forEach(function (el) { el.setAttribute('data-phone', file(C[k])); }); };

    /* page */
    if (has('page title')) document.title = C['page title'];
    if (has('page description')) { var md = document.querySelector('meta[name=description]'); if (md) md.content = C['page description']; }

    /* menu */
    for (var m = 1; m <= 4; m++) { text('menu ' + m, '.topbar__nav a', m - 1); text('menu ' + m, '.foot__nav a', m - 1); }
    text('top button', '.topbar .btn');

    /* hero, statement */
    text('hero title', '.bigA, .bigB');
    text('statement', '.statement__h');

    /* why lsquared */
    text('why title', '.strips__title');
    for (var w = 1; w <= 5; w++) {
      text('why ' + w + ' word', '.strip__word', w - 1);
      text('why ' + w + ' line', '.strip__say', w - 1);
      bg('why ' + w + ' photo', '.strip > .strip__ph', w - 1);
    }

    /* industries: as many as are listed, in the order listed */
    text('industries title', '.ind__title');
    text('industries link', '.ind__cta');
    var list = [];
    for (var n = 1; has('industry ' + n + ' name'); n++) {
      list.push({
        name: C['industry ' + n + ' name'],
        photo: has('industry ' + n + ' photo') ? file(C['industry ' + n + ' photo']) : '',
        phone: has('industry ' + n + ' phone photo') ? file(C['industry ' + n + ' phone photo']) : ''
      });
    }
    if (list.length && list.every(function (x) { return x.photo; })) {
      window.LSQ_IND = list;
      var nm = document.getElementById('ind-name'); if (nm) nm.textContent = list[0].name;
    }

    /* ceo quote */
    text('ceo quote', '.fall__line');
    text('ceo name', '.fall__by');

    /* publishing */
    text('publishing title', '.pub__title');
    text('publishing option 1', '.seg button[data-menu=breakfast]');
    text('publishing option 2', '.seg button[data-menu=lunch]');
    text('publishing button', '#pub-go');
    text('publishing status before', '.pub__state');
    [['screen 1', '#pub-1'], ['screen 2', '#pub-2']].forEach(function (s) {
      bg('publishing ' + s[0] + ' empty photo', s[1] + ' .pub__ph[data-menu=none]');
      bg('publishing ' + s[0] + ' option 1 photo', s[1] + ' .pub__ph[data-menu=breakfast]');
      bg('publishing ' + s[0] + ' option 2 photo', s[1] + ' .pub__ph[data-menu=lunch]');
    });

    /* dead screen */
    text('dead screen title', '.rely__h');
    text('dead screen line', '.rely__sub');
    bg('dead screen off photo', '#rely-off'); phone('dead screen off phone photo', '#rely-off');
    bg('dead screen on photo', '#rely-on'); phone('dead screen on phone photo', '#rely-on');

    /* trusted by */
    text('trusted title', '.clients__title');
    if (has('trusted title')) { var cl = document.getElementById('clients'); if (cl) cl.setAttribute('aria-label', C['trusted title']); }
    text('testimonial', '.quote__text');
    if (has('testimonial logo')) pick('.quote__logo').forEach(function (el) { el.removeAttribute('width'); el.removeAttribute('height'); el.src = file(C['testimonial logo']); });

    /* figures: "big words | small words" */
    var beats = $$('.beats__line'), said = [];
    beats.forEach(function (line, b) {
      var k = 'figure ' + (b + 1);
      if (has(k)) {
        var parts = C[k].split('|'), fig = line.querySelector('.beats__fig'), word = line.querySelector('.beats__word');
        if (fig) fig.textContent = parts[0].trim();
        if (word) word.textContent = parts.slice(1).join(' ').trim();
      }
      said.push([].map.call(line.children, function (c) { return c.textContent.trim(); }).join(' '));
    });
    var sr = document.querySelector('.beats .sr-only'); if (sr && beats.length) sr.textContent = said.join(' ');

    /* contact */
    text('contact title', '.demo__h');
    text('contact email label', 'label[for=f-email]');
    if (has('contact email example')) pick('#f-email').forEach(function (el) { el.placeholder = C['contact email example']; });
    text('contact screens label', 'label[for=f-screens]');
    if (has('contact screens choices')) pick('#f-screens').forEach(function (sel) {
      sel.textContent = '';
      C['contact screens choices'].split(',').forEach(function (o) { var op = document.createElement('option'); op.textContent = o.trim(); sel.appendChild(op); });
    });
    text('contact button', '.form .btn');
    if (has('contact photo')) pick('.demo__img').forEach(function (el) { el.src = file(C['contact photo']); });
    phone('contact phone photo', '.demo__img');

    /* layout: 100% is the size it is now. Laptop and phone are separate. */
    var K = [['title size', 'title'], ['space under titles', 'gap'], ['space above and below sections', 'pad'],
             ['statement size', 'statement'], ['ceo quote size', 'quote'], ['why lsquared height', 'strips'],
             ['industries photo size', 'ind'], ['publishing photos size', 'pub'], ['dead screen photo size', 'rely']];
    var pct = function (v) {
      var x = parseFloat(String(v).replace('%', ''));
      if (!isFinite(x)) return null;
      if (String(v).indexOf('%') >= 0 || x > 3) x = x / 100;
      return Math.min(3, Math.max(.3, x));
    };
    var block = function (dev) {
      var out = [];
      K.forEach(function (k) { var key = dev + ' ' + k[0]; if (has(key)) { var x = pct(C[key]); if (x !== null) out.push('--k-' + k[1] + ':' + x); } });
      return out.join(';');
    };
    var css = '@media (min-width:761px){:root{' + block('laptop') + '}}@media (max-width:760px){:root{' + block('phone') + '}}';
    [['statement', 'statement'], ['why lsquared', 'strips'], ['industries', 'industries'], ['ceo quote', 'independent'],
     ['publishing', 'publish'], ['dead screen', 'reliability'], ['trusted by', 'clients'], ['figures', 'numbers'], ['contact', 'demo']
    ].forEach(function (s) { if (has('show ' + s[0]) && /^no/i.test(C['show ' + s[0]])) css += '#' + s[1] + '{display:none!important}'; });
    var st = document.createElement('style'); st.id = 'lsq-layout'; st.textContent = css; document.head.appendChild(st);
  } catch (e) {
    if (window.console) console.warn('content.js could not be applied', e);
  } finally {
    root.classList.add('lsq-ready');
  }
})();
