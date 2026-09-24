# phone2: the redesigned phone page (r77)

Spec: `mobile-plan-blind.md` (Fable's plan, in the session scratchpad). Sabrina approved the full design, hero and orange line included.

## The switch
- `content.js`, PHONE layout area: `phone design: new` (or `old` for the phone page as it was on 24 Sept, r76).
- `js/edit.js` adds class `p2` to `<html>` early (one line), so the old scripts can step aside; `core.js` checks the same rule again.
- Every phone2 style starts with `.p2`. Every phone2 script returns at once when `window.P2` is missing.
- With `old`, the page is r76 exactly: same `body *` count, same pixels (checked on phone and PC).

## Files
| File | What |
|---|---|
| `css/phone2.css` | tokens (`--p2-title`, `--p2-orange` #FF9900, ...), `.p2-sec`, `.p2-title`, scanline, ghost finger, signal element |
| `js/phone2/core.js` | the switch and `window.P2` |
| `js/phone2/hero.js` + `css/phone2-hero.css` | section 1, "Power on" (built) |
| `js/phone2/trusted.js` + `css/phone2-trusted.css` | Trusted by, "Coming to you" (built) |
| `js/phone2/{statement,who,industries,ceo,publish,reliability,figures,contact}.js` + `css/phone2-<same>.css` | Phase 2 stubs, already linked in index.html (never edit index.html) |

All are linked in `<head>` (CSS with `media="(max-width: 760px)"`, JS with `defer`). Bump `?v=` on the lines of any file you change. Never add body markup: all phone DOM is made by JS (PC counts `body *`).

## Rules (Sabrina)
Everything centred. Archivo only (it has no infinity glyph: hero.js draws one in SVG). One title size: `var(--p2-title)` or class `p2-title`. No em or en dashes in copy or comments shown to users. Photos never cropped (bottom crop allowed only in publish and industries). No dead space above or below photos or between sections: measure it. No floating text: every line sits in a lockup or container. One dark tonal world, gradual shifts. Orange glow is #FF9900, soft, no hard edge. Plain language. Motion with transform, opacity, clip-path or canvas only; rAF only while on screen (IntersectionObserver); passive listeners; a reduced motion path for everything. Heights use `var(--app-h)`, never vh/svh/dvh. Every content.js label, photo and dial must keep working (read `window.LSQ`, or read the text edit.js already put into the old markup).

## Old phone code
The r76 phone layer (`css/mobile.css`, `js/mobile.js`) and the shared scripts still run. Override under `.p2`. Where an old behaviour fights yours, add a one line guard in the old code: `if (document.documentElement.classList.contains('p2')) return;` (edit.js sets the class before page.js and the others run). Phase 1 guards: `js/hero.js` (whole old hero), `js/page.js` section 6b (old logo wall; the orbit is removed).

## window.P2
- `P2.RM` true when reduced motion is on. `P2.clamp(v,a,b)`. `P2.appH()` the phone screen height in px.
- `P2.sec(id)` adds `.p2-sec` (min-height app-h, flex column, centred, space-evenly) to a section.
- `P2.onView(el, ratio, fn)` fn once, the first time `el` is `ratio` in view. Returns a cancel function.
- `P2.progress(el, fn)` for a tall wrapper with a sticky child: `fn(p, rect)` with p 0..1 over the pinned scroll, only while on screen. Returns `{get, kick, force}`.
- `P2.scanline(el, {dur, delay, onDone})` timed: a 2px #FF9900 line sweeps down while `el` is revealed (clip-path). Returns a Promise. Instant under reduced motion.
- `P2.scanline(el, {scrub: true})` returns `{set(k), remove(), line}` for scroll-scrubbed reveals (Who we are).
- `P2.ghost(target, {x, y, delay, onTap, autoTap})` the translucent finger: appears on target (x, y as 0..1 of it), taps once and HOLDS. Returns `{moveTo(el | {x, y}, dur), tap(), cancel(), done}`. Any real press in the section cancels it for good. Does nothing under reduced motion.
- `P2.EASE_OUT`, `P2.EASE_IO` the two curves (also `--p2-ease`, `--p2-ease-io` in CSS).

## The orange signal (handoff contract)
One orange signal travels down the page; each section receives it from the section above and hands it to the section below.
- Register: `P2.signal.station('name', { receive(state, from) { ... } })`. Names: `hero statement who industries ceo publish reliability trusted figures contact` (`P2.SEC` maps them to section ids).
- Hand on: `P2.signal.handoff('name', state)`. The receiver is the NEXT visible section in page order (content.js can reorder or hide sections, so the order is read from the page). If that station is not registered yet, the state waits: `station()` delivers it on registration, or read `P2.signal.pending('name')`.
- `state`: `{shape: 'edge' | 'line' | 'dot' | 'pixels' | 'light', rect: {left, top, width, height}}` in viewport px at the moment of handoff, plus anything else you need.
- `P2.signal.fly(fromRect, toRect, {shape, dur, fromOpacity, toOpacity, keep})` moves the ONE shared orange element (`.p2-sig`, fixed) between two rects, transform and opacity only. Use it when both ends are on screen.
- Decoration only: every section must work if it never receives the signal (deep link, reduced motion, reordered).
- `P2.signal.log` lists every handoff (for tests). `document` also gets a `p2:signal` event.

Chain in the plan: hero edge (hands `edge`) > statement pixels (`pixels`) > who we are scanlines, the last one keeps going (`line`) > industries progress line, rotates vertical (`line`) > ceo line, pixels collect into a dot (`dot`) > publish dot and scanline (`line`) > reliability, light bleeds (`light`) > trusted by open cell (built: it flies the signal into the open cell when the wall is full) > tapping "Take your place." hands `dot` on > figures passes it on > contact: BOOK A DEMO spreads orange over the wall.
