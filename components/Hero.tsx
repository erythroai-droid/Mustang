'use client';
import { useEffect, useRef, useState } from 'react';
import { ScrollTrigger, useScrollReady, useStaticMode } from '@/lib/scroll';
import { useI18n } from '@/lib/i18n';
import { ALLOCATION, BRAND, FRAMES, framePath, img, MODEL, pad, REVEAL_SECONDS, srcSet } from '@/lib/site';

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
    let cssW = 0, cssH = 0, frame = 0, drawn = -1, loaded = 0, lastSec = -1;

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

// Phones / reduced motion: the revealed car as a still, same copy, no canvas.
function StaticHero() {
  return (
    <section id="top" className="hero-static">
      <img src={img('profile', 1280)} srcSet={srcSet('profile')} sizes="100vw" alt="MUSTANG 6663 RT" width={1280} height={714} />
      <div className="hero-shade" />
      <div className="hero-ui"><Copy time={`00:00:0${REVEAL_SECONDS - 1}`} /></div>
    </section>
  );
}

export default function Hero(props: Props) {
  const staticMode = useStaticMode();
  return staticMode ? <StaticHero /> : <AnimatedHero {...props} />;
}
