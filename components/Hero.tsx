'use client';
import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, saveData, ScrollTrigger, useScrollReady, useStaticMode } from '@/lib/scroll';
import { useI18n } from '@/lib/i18n';
import { ALLOCATION, BRAND, FRAMES, FRAMES_M, framePath, framePathM, MODEL, pad, REVEAL_SECONDS, VIDEO_M } from '@/lib/site';

type Props = { onLoadProgress?: (pct: number) => void };

const BG = '#050505';
/** Pinned scroll, in shares of the track: the sheet lifts, then the outline brand fades in dead centre, then it fills with white. */
const LIFT_SHARE = 0.5;
const SHOW = [0.45, 0.55] as const;
const FILL = [0.55, 0.78] as const;                      // the rest (~0.9 screen) holds the filled word before Specs comes up
const span = (p: number, [a, b]: readonly [number, number]) => Math.max(0, Math.min(1, (p - a) / (b - a)));
const tier = () => (window.innerWidth <= 900 ? 768 : window.innerWidth <= 1600 ? 1280 : 1920);

function Copy({ time }: { time: string }) {
  const { t } = useI18n();
  return (
    <>
      <div className="hero-stat hero-stat-a">
        <b dir="ltr">{t('st1v')}</b><span>{t('st1l')}</span>
      </div>
      <div className="hero-stat hero-stat-b">
        <b dir="ltr">001<i>/{pad(ALLOCATION.total).padStart(3, '0')}</i></b><span>{t('st2l')}</span>
      </div>
      <div className="hero-copy">
        <p className="kicker"><i className="dot" />{t('hero_k')} <span dir="ltr">{time}</span></p>
        <h1 className="hero-h">
          <span className="ln">{t('hero_h1')}</span>
          <span className="ln"><em>{t('hero_i')}</em> {t('hero_h2')}</span>
        </h1>
        <p className="hero-p">{t('hero_p')}</p>
      </div>
      <ul className="hero-words">
        <li>{t('w1')}</li><li>{t('w2')}</li><li>{t('w3')}</li>
      </ul>
    </>
  );
}

function AnimatedHero({ onLoadProgress }: Props) {
  const ready = useScrollReady();
  const { t } = useI18n();
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [sec, setSec] = useState(0);

  useEffect(() => {
    if (!ready) return;
    const canvas = cv.current!, trackEl = track.current!, stageEl = stage.current!, ctx = canvas.getContext('2d')!;
    const size = tier();
    const imgs: (HTMLImageElement | null)[] = new Array(FRAMES).fill(null);
    let cssW = 0, cssH = 0, frame = 0, drawn = -1, loaded = 0, lastSec = -1, painted = false;

    const ok = (i: number) => !!imgs[i] && imgs[i]!.naturalWidth > 0;
    const nearest = (i: number) => {
      for (let d = 0; d < FRAMES; d++) {
        if (i - d >= 0 && ok(i - d)) return i - d;
        if (i + d < FRAMES && ok(i + d)) return i + d;
      }
      return -1;
    };
    const draw = (i: number) => {
      const j = nearest(Math.max(0, Math.min(FRAMES - 1, i)));
      if (j < 0) return;
      const im = imgs[j]!;
      const s = Math.max(cssW / im.naturalWidth, cssH / im.naturalHeight);   // cover
      const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, cssW, cssH);
      ctx.drawImage(im, (cssW - dw) / 2, (cssH - dh) * 0.6, dw, dh);       // keep the floor reflection in frame
      drawn = j === i ? i : -1;                                              // retry until the exact frame has arrived
      if (!painted) { painted = true; window.dispatchEvent(new CustomEvent('film-first-frame', { detail: Math.round(performance.now()) })); }
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = canvas.clientWidth; cssH = canvas.clientHeight;
      canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingQuality = 'high';
      drawn = -1;
    };

    for (let i = 0; i < FRAMES; i++) {
      const im = new Image();
      im.decoding = 'async';
      const fin = () => { loaded++; onLoadProgress?.(Math.round((loaded / FRAMES) * 100)); };
      im.onload = () => { imgs[i] = im; if (i === 0) drawn = -1; fin(); };
      im.onerror = fin;                                                      // a broken frame must not block the page
      im.src = framePath(size, i);
    }

    const pin = ScrollTrigger.create({ trigger: trackEl, start: 'top top', end: 'bottom bottom', pin: stageEl, pinSpacing: false });
    const scrub = ScrollTrigger.create({
      trigger: trackEl, start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        const lift = Math.min(1, p / LIFT_SHARE);
        frame = lift * (FRAMES - 1);
        stageEl.style.setProperty('--p', p.toFixed(3));
        stageEl.style.setProperty('--lift', lift.toFixed(3));
        stageEl.style.setProperty('--show', span(p, SHOW).toFixed(3));
        stageEl.style.setProperty('--fill', span(p, FILL).toFixed(3));
        const s = Math.min(REVEAL_SECONDS - 1, Math.floor(lift * REVEAL_SECONDS));
        if (s !== lastSec) { lastSec = s; setSec(s); }
      },
    });

    let raf = 0;
    const tick = () => { const i = Math.round(frame); if (i !== drawn) draw(i); raf = requestAnimationFrame(tick); };
    resize(); tick();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); pin.kill(); scrub.kill(); window.removeEventListener('resize', resize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <section ref={track} id="top" className="hero-track">
      <div ref={stage} className="hero-stage">
        <canvas ref={cv} className="hero-canvas" />
        <div className="hero-shade" />
        <div className="hero-ui"><Copy time={`00:00:0${sec}`} /></div>
        <div className="hero-end" aria-hidden>
          <span className="hero-brand" dir="ltr">{BRAND}</span><span className="hero-model" dir="ltr">{MODEL}</span>
        </div>
        <div className="hero-scroll"><i />{t('scroll')}</div>
      </div>
    </section>
  );
}

/** Phones: load order of the frame pack — the first frame, then a coarse pass (every 4th), then the gaps, so a fast scroll always has something near. */
const ORDER_M = (() => {
  const seen = new Set<number>(), out: number[] = [];
  const add = (i: number) => { if (i < FRAMES_M && !seen.has(i)) { seen.add(i); out.push(i); } };
  add(0);
  for (const step of [4, 2, 1]) for (let i = 0; i < FRAMES_M; i += step) add(i);
  add(FRAMES_M - 1);
  return out;
})();
/**
 * Phones/tablets (EMBER pattern): the sheet lift follows the scroll. The section is ~3 screens tall, its stage sticks to
 * the top and the 4:3 frame pack is scrubbed by how far the section has scrolled — the same shares as the desktop pin:
 * the sheet comes off, then the outline brand comes up dead centre and fills with white. No autoplay intro: the first
 * screen holds the car fully under the sheet until the visitor scrolls (the client's call).
 * Native scroll + one rAF loop, no ScrollTrigger (static mode has no smoother).
 */
function ScrubHero() {
  const { t } = useI18n();
  const sec = useRef<HTMLElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [s5, setS5] = useState(0);

  useEffect(() => {
    const secEl = sec.current!, canvas = cv.current!, ctx = canvas.getContext('2d')!;
    const imgs: (HTMLImageElement | null)[] = new Array(FRAMES_M).fill(null);
    let cssW = 0, cssH = 0, cur = 0, drawn = -1, raf = 0, last = 0, painted = false, lastSec = -1, first = true;

    const ok = (i: number) => !!imgs[i] && imgs[i]!.naturalWidth > 0;
    const nearest = (i: number) => {
      for (let d = 0; d < FRAMES_M; d++) {
        if (i - d >= 0 && ok(i - d)) return i - d;
        if (i + d < FRAMES_M && ok(i + d)) return i + d;
      }
      return -1;
    };
    const paint = (im: HTMLImageElement, a: number) => {
      const s = Math.max(cssW / im.naturalWidth, cssH / im.naturalHeight);   // cover
      const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
      ctx.globalAlpha = a;
      ctx.drawImage(im, (cssW - dw) / 2, (cssH - dh) / 2, dw, dh);
    };
    // the fractional frame: the lower frame, the next one blended over it — smooth even with every 2nd frame of the clip
    const draw = (f: number) => {
      const lo = Math.floor(f), hi = Math.min(FRAMES_M - 1, lo + 1), k = f - lo;
      const a = ok(lo) ? lo : nearest(lo);
      if (a < 0) return;
      ctx.globalAlpha = 1; ctx.fillStyle = BG; ctx.fillRect(0, 0, cssW, cssH);
      paint(imgs[a]!, 1);
      if (a === lo && k > 0.02 && ok(hi)) paint(imgs[hi]!, k);
      ctx.globalAlpha = 1;
      if (!painted) { painted = true; window.dispatchEvent(new CustomEvent('film-first-frame', { detail: Math.round(performance.now()) })); }
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = canvas.clientWidth; cssH = canvas.clientHeight;
      canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingQuality = 'high';
      drawn = -1;
    };

    ORDER_M.forEach((i) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => { imgs[i] = im; drawn = -1; };
      im.src = framePathM(i);
    });

    const progress = () => {
      const r = secEl.getBoundingClientRect(), run = secEl.offsetHeight - window.innerHeight;
      return run > 0 ? Math.max(0, Math.min(1, -r.top / run)) : 0;
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now(), dt = last ? Math.min(250, now - last) : 16;
      last = now;
      const p = progress();
      if (p > 1.05 || secEl.getBoundingClientRect().bottom < 0) return;          // scrolled past: nothing to draw
      const lift = Math.min(1, p / LIFT_SHARE);
      const target = lift * (FRAMES_M - 1);
      // time-based easing (~90 ms): the same feel at 30, 60 or 120 Hz; the first frame lands at once
      cur = first ? target : cur + (target - cur) * (1 - Math.exp(-dt / 90));
      first = false;
      if (Math.abs(target - cur) < 0.01) cur = target;
      secEl.style.setProperty('--p', p.toFixed(3));
      secEl.style.setProperty('--show', span(p, SHOW).toFixed(3));
      secEl.style.setProperty('--fill', span(p, FILL).toFixed(3));
      const key = Math.round(cur * 100);
      if (key !== drawn) { draw(cur); if (painted) drawn = key; }
      const s = Math.min(REVEAL_SECONDS - 1, Math.floor((cur / (FRAMES_M - 1)) * REVEAL_SECONDS));
      if (s !== lastSec) { lastSec = s; setS5(s); }
    };
    resize(); tick();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <section ref={sec} id="top" className="hero-static hero-scrub">
      <div className="hs-stage">
        <div className="hs-media">
          {/* first paint before hydration (preloaded in layout.tsx); the canvas covers it once frames draw */}
          <img src={framePathM(0)} alt="MUSTANG 6663 RT" width={720} height={540} fetchPriority="high" />
          <canvas ref={cv} className="hs-canvas" aria-hidden />
        </div>
        <div className="hero-shade" />
        <div className="hero-end" aria-hidden>
          <span className="hero-brand" dir="ltr">{BRAND}</span><span className="hero-model" dir="ltr">{MODEL}</span>
        </div>
        <div className="hero-ui"><Copy time={`00:00:0${s5}`} /></div>
        <div className="hero-scroll"><i />{t('scroll')}</div>
      </div>
    </section>
  );
}

/** Reduced motion / Data Saver: the clip's last frame with the brand already filled. */
function StillHero() {
  return (
    <section id="top" className="hero-static" style={{ ['--show' as string]: 1, ['--fill' as string]: 1 }}>
      <div className="hs-media">
        <img src={VIDEO_M.revealEnd} alt="MUSTANG 6663 RT" width={720} height={540} />
      </div>
      <div className="hero-shade" />
      <div className="hero-end" aria-hidden>
        <span className="hero-brand" dir="ltr">{BRAND}</span><span className="hero-model" dir="ltr">{MODEL}</span>
      </div>
      <div className="hero-ui"><Copy time={`00:00:0${REVEAL_SECONDS - 1}`} /></div>
    </section>
  );
}

function StaticHero() {
  const [still] = useState(() => prefersReducedMotion() || saveData());
  return still ? <StillHero /> : <ScrubHero />;
}

export default function Hero(props: Props) {
  const staticMode = useStaticMode();
  return staticMode ? <StaticHero /> : <AnimatedHero {...props} />;
}
