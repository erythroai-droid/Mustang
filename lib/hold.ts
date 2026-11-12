'use client';
import { RefObject, useEffect } from 'react';
import { HOLD, ScrollTrigger, useScrollReady, useStaticMode } from './scroll';

/** Hold length in px: HOLD is in screens x100. */
export const holdPx = () => (window.innerHeight * HOLD) / 100;

/**
 * The pause between blocks: once the block fills the screen (its last screen, for a block taller than the screen),
 * it stays put for HOLD of a screen of scrolling before the next one comes up. The magnet (page.tsx) then treats
 * the whole pause as the block's own zone, so stopping anywhere in it is fine and stopping past it pulls to the next block.
 * Call from the block's component so pins are created top to bottom (ScrollTrigger needs that order).
 */
export function useHold(ref: RefObject<HTMLElement | null>) {
  const ready = useScrollReady();
  const staticMode = useStaticMode();
  useEffect(() => {
    if (!ready || staticMode) return;
    const el = ref.current!;
    const st = ScrollTrigger.create({
      trigger: el,
      start: () => (el.offsetHeight > window.innerHeight + 2 ? 'bottom bottom' : 'top top'),
      end: () => `+=${holdPx()}`,
      pin: true, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
    });
    return () => st.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, staticMode]);
}
