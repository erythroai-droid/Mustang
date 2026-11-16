'use client';
import { useEffect, useRef } from 'react';
import { prefersReducedMotion, saveData, useStaticMode } from '@/lib/scroll';

type Src = { src: string; type?: string };

/**
 * Full-bleed muted looping video behind a content section.
 * Plays only while the host is near the viewport; pauses off-screen.
 * Phones/tablets (static mode) play `mobileSrc` (a light portrait cut) when given, otherwise nothing; reduced motion and
 * Data Saver never get video.
 */
export default function VideoBg({ src, sources, mobileSrc, className = '' }: { src?: string; sources?: Src[]; mobileSrc?: string; className?: string }) {
  const staticMode = useStaticMode();
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const desktop = sources ?? (src ? [{ src }] : []);
  const list = staticMode ? (mobileSrc ? [{ src: mobileSrc }] : []) : desktop;
  const key = list.map((s) => s.src).join('|');

  useEffect(() => {
    const node = video.current;
    const host = wrap.current?.parentElement;
    if (!node || !host || !list.length) return;
    if (prefersReducedMotion() || (staticMode && saveData())) {
      node.removeAttribute('src');
      node.load();
      return;
    }

    let primed = false;
    const play = () => {
      if (!primed) { node.load(); primed = true; }
      node.play().catch(() => {});
    };
    const pause = () => { node.pause(); };

    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) play(); else pause(); },
      { rootMargin: '50% 0px', threshold: 0.02 },
    );
    io.observe(host);

    const onVis = () => { if (document.hidden) pause(); else if (host.getBoundingClientRect().bottom > 0 && host.getBoundingClientRect().top < window.innerHeight) play(); };
    document.addEventListener('visibilitychange', onVis);

    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis); pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticMode, key]);

  if (!list.length) return null;

  return (
    <div ref={wrap} className={`vbg ${staticMode ? 'vbg-m' : ''} ${className}`} aria-hidden>
      <video
        key={key}
        ref={video}
        className="vbg-video"
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
      >
        {list.map((s) => (
          <source key={s.src} src={s.src} type={s.type ?? (s.src.endsWith('.mov') ? 'video/quicktime' : 'video/mp4')} />
        ))}
      </video>
      <div className="vbg-veil" />
    </div>
  );
}
