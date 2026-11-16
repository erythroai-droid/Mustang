'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Preloader from '@/components/Preloader';
import Cursor from '@/components/Cursor';
import AiChat from '@/components/AiChat';
import StudioBar from '@/components/StudioBar';
import Metrics from '@/components/Metrics';
import ScrollTop from '@/components/ScrollTop';
import Hero from '@/components/Hero';
import { Detail, Drive, Finish, Footer, Marquee, Outro, Reserve, Specs, useLateRefresh } from '@/components/Sections';
import { initMagnet, registerZone, ScrollTrigger, SmoothScroll, useScrollReady, useStaticMode } from '@/lib/scroll';

export default function Page() {
  const [pct, setPct] = useState(0);
  const staticMode = useStaticMode();
  // restored scroll position far from the hero, or the static page (no frame sequence): don't hold the page behind the preloader
  useEffect(() => { if (window.scrollY > 300 || staticMode) setPct(100); }, [staticMode]);
  // hero headline waits behind the preloader and plays once it lifts
  useEffect(() => { document.documentElement.classList.toggle('loading', pct < 100); }, [pct]);
  return (
    <>
      <Preloader pct={pct} />
      <Metrics />
      <Header />
      <ScrollTop />
      <Cursor />
      <AiChat />
      <StudioBar />
      <SmoothScroll><Content onLoadProgress={(v) => setPct((p) => Math.max(p, v))} /></SmoothScroll>
    </>
  );
}

/** Every screen-high block, top to bottom. Each one is a free-scroll zone for the magnet (see initMagnet in lib/scroll.tsx). */
const BLOCKS = ['#top', '#spec', '#drive', '#detail', '#finish', '#outro', '#reserve'];

function Content({ onLoadProgress }: { onLoadProgress: (v: number) => void }) {
  useLateRefresh();
  const ready = useScrollReady();

  // magnet: inside a block (a scrubbed sequence, a pin, a block taller than the screen) the page scrolls freely;
  // stop between two blocks and the page is pulled, in the direction of travel, until the next block's top meets the top of the screen
  // (or, at the very end, the footer meets the bottom of the screen)
  useEffect(() => {
    if (!ready) return;
    const cleanups = BLOCKS.map((sel) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) return () => {};
      const st = ScrollTrigger.create({ trigger: el, start: 'top top', invalidateOnRefresh: true });
      // a block pinned with spacing (detail, outro) scrolls for as long as its spacer is tall
      const box = () => (el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el);
      const unreg = registerZone({ a: () => st.start, b: () => st.start + Math.max(0, box().offsetHeight - window.innerHeight) });
      return () => { st.kill(); unreg(); };
    });
    const end = registerZone({ a: () => ScrollTrigger.maxScroll(window), b: () => ScrollTrigger.maxScroll(window) });
    const magnet = initMagnet();
    return () => { magnet(); end(); cleanups.forEach((c) => c()); };
  }, [ready]);

  return (
    <main>
      {/* 01 the sheet comes off as you scroll (frame sequence from video v1) */}
      <Hero onLoadProgress={onLoadProgress} />
      {/* 02 numbers */}
      <Specs />
      {/* 03 drift video pinned under the cards */}
      <Drive />
      {/* 04 horizontal detail gallery */}
      <Detail />
      {/* 05 stripe package selector */}
      <Finish />
      {/* 06 night video + UNBREAKABLE */}
      <Outro />
      {/* 07 allocation + CTA (opens the contact form in Header) */}
      <Reserve />
      <Marquee />
      <Footer />
    </main>
  );
}
