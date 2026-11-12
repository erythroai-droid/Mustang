'use client';
import { createContext, ReactNode, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

/** Pause (in screens, 100 = one screen) at the end of a block before the next one comes up (useHold in lib/hold.ts). */
export const HOLD = 100;

/** Phones/tablets and people who asked for reduced motion get a static page: no smooth scroll, pins or scrubbing, only still images. Keep in sync with the inline script in layout.tsx. */
export const STATIC_QUERY = '(max-width: 900px), (prefers-reduced-motion: reduce)';
const subscribeStatic = (cb: () => void) => { const mq = window.matchMedia(STATIC_QUERY); mq.addEventListener('change', cb); return () => mq.removeEventListener('change', cb); };
export const useStaticMode = () => useSyncExternalStore(subscribeStatic, () => window.matchMedia(STATIC_QUERY).matches, () => false);

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Children create their ScrollTriggers only after the smoother exists (GSAP requires that order).
const Ready = createContext(false);
export const useScrollReady = () => useContext(Ready);

/** Wrap the page content (not fixed UI like the header or modals). */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const staticMode = useStaticMode();

  useEffect(() => {
    const isStatic = window.matchMedia(STATIC_QUERY).matches;
    document.documentElement.classList.toggle('static', isStatic);
    if (isStatic) { setReady(false); return; }            // static page: nothing below is created
    // one source of truth for "a screen": the same number the ScrollTriggers use (innerHeight). Updated on width change or a big height change,
    // not on the small changes of the phone's address bar, which would make everything jump.
    // --vh only ever grows while the width stays the same, so a screen-high block can never be shorter than the visible area
    // (that left a strip of the block underneath showing) when the phone's address bar hides and the visible height grows.
    let w = window.innerWidth, vhPx = 0;
    const setVh = () => {
      if (window.innerWidth !== w) { w = window.innerWidth; vhPx = 0; }
      vhPx = Math.max(vhPx, window.innerHeight);
      document.documentElement.style.setProperty('--vh', `${vhPx}px`);
    };
    setVh();
    const onResize = () => setVh();
    window.addEventListener('resize', onResize);
    ScrollTrigger.addEventListener('refreshInit', setVh);   // re-measure on every refresh, resize events are not reliable on phones
    ScrollTrigger.config({ ignoreMobileResize: true });
    const sm = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: prefersReducedMotion() ? 0 : 1.15,   // seconds the content takes to catch up with the native scroll
      effects: false,
    });
    setReady(true);
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => { window.removeEventListener('load', refresh); window.removeEventListener('resize', onResize); ScrollTrigger.removeEventListener('refreshInit', setVh); sm.kill(); };
  }, [staticMode]);

  return (
    <Ready.Provider value={ready}>
      <div id="smooth-wrapper"><div id="smooth-content">{children}</div></div>
    </Ready.Provider>
  );
}

/** Pause/resume scrolling (modals). */
export function lockScroll(lock: boolean) {
  ScrollSmoother.get()?.paused(lock);
  document.body.style.overflow = lock ? 'hidden' : '';
}

/** Re-measure all triggers (after the language, and with it the text height, changes). */
export function refreshScroll() { ScrollTrigger.refresh(); }

/** Glide to the section that contains `hash` (menu and search links). */
export function goToSection(hash: string) {
  const sm = ScrollSmoother.get();
  if (!sm) {                                              // static page: native smooth scroll
    if (hash === '#top') window.scrollTo({ top: 0, behavior: 'smooth' });
    else document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (hash === '#top') { glideTo(0); return; }
  const el = document.querySelector<HTMLElement>(hash);
  const slide = el?.closest<HTMLElement>('[data-slide]') ?? el?.querySelector<HTMLElement>('[data-slide]') ?? el;
  if (!slide) return;
  const ref = slide.dataset.slide === 'tb' ? slide.closest<HTMLElement>('.grp') ?? slide : slide;   // a pinned block is measured through its group
  glideTo(sm.offset(ref, 'top top'));
}

// sm.scrollTo(y, true) moves the native scroll at once and leaves the content to catch up within the smoothing time, so over many screens
// (footer -> top) the page just jumps. Tween the native scroll instead; the smoother still softens it. Any user input hands control back.
let glide: gsap.core.Tween | null = null;
function glideTo(y: number) {
  glide?.kill();
  const from = window.scrollY, dist = Math.abs(y - from);
  if (dist < 2) return;
  const pos = { y: from };
  const stop = () => glide?.kill();
  const input = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;
  const done = () => input.forEach((e) => window.removeEventListener(e, stop));
  input.forEach((e) => window.addEventListener(e, stop, { passive: true }));
  glide = gsap.to(pos, {
    y,
    duration: prefersReducedMotion() ? 0.01 : Math.min(2.6, 0.9 + (dist / window.innerHeight) * 0.08),   // longer for longer trips, capped
    ease: 'power3.inOut',
    onUpdate: () => window.scrollTo(0, pos.y),
    onComplete: done,
    onInterrupt: done,
  });
}

export { gsap, ScrollTrigger, ScrollSmoother };


// ---------- "magnet": after scrolling stops between two blocks, pull the page to the block in the direction of travel ----------
// Every block registers its free-scroll zone [a, b] in scroll pixels (a scrubbed sequence, a pinned text block with its pause, a tall section).
// Inside a zone the page scrolls freely; outside any zone (while one block covers the other) the scroll snaps to the nearest zone edge ahead.
type Zone = { a: () => number; b: () => number };
const zones = new Set<Zone>();
const EPS = 3;

export function registerZone(z: Zone) { zones.add(z); return () => { zones.delete(z); }; }

/** Where the page should rest, in scroll pixels: `y` itself inside a zone, otherwise the nearest zone edge in the direction of travel. */
function snapTarget(y: number, dir: number) {
  const max = ScrollTrigger.maxScroll(window);
  if (max <= 0) return y;
  const zs = [...zones].map((z) => [z.a(), Math.max(z.a(), z.b())] as [number, number]).sort((p, q) => p[0] - q[0]);
  if (zs.some(([a, b]) => y >= a - EPS && y <= b + EPS)) return y;         // inside a block's own zone: free scroll
  const pts = [...new Set(zs.flatMap(([a, b]) => [a, b]).map((v) => Math.min(max, Math.round(v))))].sort((p, q) => p - q);
  if (!pts.length) return y;
  if (dir > 0) return pts.find((p) => p > y + EPS) ?? pts[pts.length - 1];
  if (dir < 0) return [...pts].reverse().find((p) => p < y - EPS) ?? pts[0];
  return pts.reduce((best, p) => (Math.abs(p - y) < Math.abs(best - y) ? p : best), pts[0]);
}

// ScrollTrigger's own `snap` never fired under ScrollSmoother here, so the magnet listens for scrollEnd and tweens the native scroll itself
// (the smoother still softens it). Any user input during the pull hands control back.
/** After the wheel brings a block in, input is swallowed for at least this long, and until the wheel/trackpad momentum has died down. */
const GATE_MS = 900;
const GATE_QUIET_MS = 220;
const GATE_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space', ' ', 'Home', 'End']);

export function initMagnet() {
  if (prefersReducedMotion()) return () => {};
  let lastY = window.scrollY, dir = 0, pull: gsap.core.Tween | null = null;
  // gate: one wheel flick moves at most one block. Going down, the scroll is stopped where the next block's top meets the top of the screen;
  // going up, where the previous block last filled the screen. Then input is held back for a moment so the momentum can't carry past it.
  let gateUntil = 0, lastInput = 0;
  const gated = () => { const now = performance.now(); return now < gateUntil || (gateUntil > 0 && now - lastInput < GATE_QUIET_MS); };
  const gateAt = (from: number, to: number) => {
    const zs = [...zones].map((z) => [Math.round(z.a()), Math.round(Math.max(z.a(), z.b()))] as const);
    if (to > from) { const ps = zs.map(([a]) => a).filter((p) => from < p - 1 && to >= p); return ps.length ? Math.min(...ps) : null; }
    const ps = zs.map(([, b]) => b).filter((p) => from > p + 1 && to <= p); return ps.length ? Math.max(...ps) : null;
  };
  const free = () => !pull?.isActive() && !glide?.isActive() && document.body.style.overflow !== 'hidden';
  const shut = () => { gateUntil = performance.now() + GATE_MS; lastInput = performance.now(); };
  let lastWheel = 0;
  // keys, scrollbar, touch: correct after the fact. The wheel is handled before it scrolls (below): correcting a wheel scroll
  // afterwards fights the browser's own smooth-wheel animation, which then throws the page back.
  const onScroll = () => {
    let y = window.scrollY;
    if (free() && performance.now() - lastWheel > 400) {
      const g = gateAt(lastY, y);
      if (g !== null) { window.scrollTo(0, g); y = g; shut(); }
    }
    if (y !== lastY) dir = Math.sign(y - lastY);
    lastY = y;
  };
  const block = (e: Event) => {
    if (e.type === 'keydown' && (!GATE_KEYS.has((e as KeyboardEvent).key) || (e.target as HTMLElement)?.closest?.('input, textarea, select, [contenteditable]'))) return;
    if ((e.target as HTMLElement)?.closest?.('.ai, .modal')) return;   // scrolling inside the chat or a dialog is not page scrolling
    if (e.type === 'wheel') lastWheel = performance.now();
    if (gated()) {
      lastInput = performance.now();                     // momentum still coming: keep the gate shut
      e.preventDefault();
      return;
    }
    gateUntil = 0;
    if (e.type !== 'wheel' || !free()) return;
    const w = e as WheelEvent;
    const dy = w.deltaY * (w.deltaMode === 1 ? 40 : w.deltaMode === 2 ? window.innerHeight : 1);
    const y = window.scrollY, to = Math.max(0, Math.min(ScrollTrigger.maxScroll(window), y + dy));
    const g = gateAt(y, to);
    if (g === null) return;
    e.preventDefault();                                  // this tick would cross a block edge: stop exactly on it instead
    window.scrollTo(0, g);
    lastY = g;
    shut();
  };
  const blockOpts = { passive: false } as const;
  (['wheel', 'touchmove', 'keydown'] as const).forEach((e) => window.addEventListener(e, block, blockOpts));
  const input = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;
  const stop = () => { if (!gated()) pull?.kill(); };
  const onEnd = () => {
    if (!free()) return;
    const y = window.scrollY, t = snapTarget(y, dir);    const dist = Math.abs(t - y);
    if (dist < 2) return;
    const pos = { y };
    pull = gsap.to(pos, {
      y: t, delay: 0.08, ease: 'power2.inOut',
      duration: Math.min(0.9, Math.max(0.35, (dist / window.innerHeight) * 0.9)),
      onUpdate: () => window.scrollTo(0, pos.y),
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  input.forEach((e) => window.addEventListener(e, stop, { passive: true }));
  ScrollTrigger.addEventListener('scrollEnd', onEnd);
  return () => {
    pull?.kill();
    (['wheel', 'touchmove', 'keydown'] as const).forEach((e) => window.removeEventListener(e, block));
    window.removeEventListener('scroll', onScroll);
    input.forEach((e) => window.removeEventListener(e, stop));
    ScrollTrigger.removeEventListener('scrollEnd', onEnd);
  };
}
