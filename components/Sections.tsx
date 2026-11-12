'use client';
import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';
import CountUp from './CountUp';
import VideoBg from './VideoBg';
import { OPEN_CONTACT } from './Header';
import { useI18n } from '@/lib/i18n';
import { holdPx, useHold } from '@/lib/hold';
import { gsap, goToSection, prefersReducedMotion, ScrollTrigger, useScrollReady, useStaticMode } from '@/lib/scroll';
import { ALLOCATION, BRAND, CONTACT, DETAILS, DRIVE_CARDS, FINISHES, img, MODEL, pad, SPECS, srcSet, VIDEO } from '@/lib/site';

/** "Numbers we / never rounded." — two display lines, the middle word in italic serif. */
function Title({ k, a, i, b }: { k: string; a: string; i: string; b: string }) {
  const { t } = useI18n();
  return (
    <div className="sec-head">
      <Reveal><p className="kicker"><i className="dot" />{t(k)}</p></Reveal>
      <Reveal delay={120}>
        <h2 className="display">
          <span className="ln">{t(a)}</span>
          <span className="ln"><em>{t(i)}</em> {t(b)}</span>
        </h2>
      </Reveal>
    </div>
  );
}

/** Late refresh: fonts and images change heights after the first measure. */
export function useLateRefresh() {
  const ready = useScrollReady();
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => ScrollTrigger.refresh(), 900);
    return () => clearTimeout(id);
  }, [ready]);
}

// ---------- 02 numbers ----------
export function Specs() {
  const { t, lang } = useI18n();
  const sec = useRef<HTMLElement>(null);
  useHold(sec);
  return (
    <section ref={sec} id="spec" className="specs">
      <div className="wrap">
        <div className="specs-top">
          <Title k="sp_k" a="sp_h1" i="sp_i" b="sp_h2" />
          <Reveal delay={200} className="specs-lead"><p>{t('sp_p')}</p></Reveal>
        </div>
        <ul className="specs-grid">
          {SPECS.map((s, i) => (
            <li key={s.n}>
              <Reveal delay={i * 90}>
                <small dir="ltr">{pad(s.n)}</small>
                <b className="big-num">
                  <CountUp to={s.to} decimals={s.decimals} decimalSep={lang === 'ru' ? ',' : '.'} />
                  {s.n === 2 && <sup>{t('sp2u')}</sup>}
                </b>
                <span className="spec-l">{t(`sp${s.n}l`)}</span>
                <p>{t(`sp${s.n}d`)}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------- 03 drive: pinned video, giant brand word, cards ride over it ----------
export function Drive() {
  const { t } = useI18n();
  const ready = useScrollReady();
  const staticMode = useStaticMode();
  const sec = useRef<HTMLElement>(null);
  const media = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || staticMode) return;
    const el = sec.current!, m = media.current!;
    const pin = ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom bottom', pin: m, pinSpacing: false });
    const st = ScrollTrigger.create({
      trigger: el, start: 'top bottom', end: 'bottom bottom',
      onUpdate: (s) => m.style.setProperty('--p', s.progress.toFixed(3)),
    });
    return () => { pin.kill(); st.kill(); };
  }, [ready, staticMode]);
  useHold(sec);                                         // after the media pin: the last screen (cards) holds

  return (
    <section ref={sec} id="drive" className="drive">
      <div ref={media} className="drive-media">
        <img className="drive-poster" src={img('drift', 1280)} srcSet={srcSet('drift')} sizes="100vw" alt="" loading="lazy" />
        <VideoBg src={VIDEO.drive} />
        <div className="drive-word" aria-hidden dir="ltr">{BRAND}</div>
      </div>
      <div className="drive-content">
        <div className="drive-first">
          <Reveal><p className="kicker">{t('dr_tag')}</p></Reveal>
          <h2 className="sr-only">{BRAND} {MODEL}</h2>
        </div>
        <div className="drive-cards wrap">
          {DRIVE_CARDS.map((n, i) => (
            <Reveal key={n} delay={i * 110} className="glass">
              <small>{t(`dr${n}k`)}</small>
              <b className="mid-num" dir="ltr">{t(`dr${n}v`)}</b>
              <p>{t(`dr${n}p`)}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- 04 detail: horizontal gallery while pinned ----------
export function Detail() {
  const { t } = useI18n();
  const ready = useScrollReady();
  const staticMode = useStaticMode();
  const sec = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ready || staticMode) return;
    const el = sec.current!, r = rail.current!;
    const dist = () => Math.max(0, r.scrollWidth - window.innerWidth);
    // the rail slides over `dist` px of scroll, then the last card holds for holdPx() before the next block comes up
    const setX = gsap.quickTo(r, 'x', { duration: prefersReducedMotion() ? 0 : 0.6, ease: 'power3.out' });
    const st = ScrollTrigger.create({
      trigger: el, start: 'top top', end: () => `+=${dist() + holdPx()}`, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (s) => {
        const d = dist(), k = d ? Math.min(1, ((s.end - s.start) * s.progress) / d) : 1;
        setX(-d * k);
        if (bar.current) bar.current.style.transform = `scaleX(${k})`;
      },
    });
    return () => { st.kill(); gsap.killTweensOf(r); gsap.set(r, { clearProps: 'transform' }); };
  }, [ready, staticMode]);

  return (
    <section ref={sec} id="detail" className="detail">
      <div className="wrap"><Title k="dt_k" a="dt_h1" i="dt_i" b="dt_h2" /></div>
      <div ref={rail} className="detail-rail">
        {DETAILS.map((d) => (
          <article key={d.n} className="detail-card">
            <i className="detail-n" dir="ltr">{pad(d.n)}</i>
            <div className="detail-img">
              <img src={img(d.photo, 1280)} srcSet={srcSet(d.photo)} sizes="(max-width: 900px) 90vw, 60vw" alt={t(`dt${d.n}h`)} loading="lazy"
                style={{ objectPosition: d.pos, transform: `scale(${d.zoom})`, transformOrigin: d.pos }} />
            </div>
            <h3>{t(`dt${d.n}h`)}</h3>
            <p>{t(`dt${d.n}p`)}</p>
          </article>
        ))}
      </div>
      <div className="wrap"><span className="detail-bar"><span ref={bar} /></span></div>
    </section>
  );
}

// ---------- 05 stripe package ----------
export function Finish() {
  const { t } = useI18n();
  const [on, setOn] = useState(0);
  const f = FINISHES[on];
  const sec = useRef<HTMLElement>(null);
  useHold(sec);
  return (
    <section ref={sec} id="finish" className="finish">
      <div className="wrap finish-grid">
        <div className="finish-l">
          <Title k="fn_k" a="fn_h1" i="fn_i" b="fn_h2" />
          <Reveal delay={160}><p className="lead">{t('fn_p')}</p></Reveal>
          <Reveal delay={240}>
            <div className="swatches" role="radiogroup" aria-label={t('nav_finish')}>
              {FINISHES.map((x, i) => (
                <button key={x.n} role="radio" aria-checked={i === on} className={i === on ? 'on' : ''} onClick={() => setOn(i)}>
                  <i style={{ background: x.swatch }} />{t(`fn${x.n}n`)}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal from="clip" className="finish-r">
          <div className="finish-img">
            <img src={img('profile', 1280)} srcSet={srcSet('profile')} sizes="(max-width: 900px) 100vw, 55vw" alt={`${BRAND} ${MODEL} — ${t(`fn${f.n}n`)}`}
              style={{ filter: f.filter }} loading="lazy" />
            <span className="finish-code" dir="ltr">MST-{MODEL.replace(' ', '')} / {f.code}</span>
          </div>
          <div className="finish-info" key={f.n}>
            <h3>{t(`fn${f.n}n`)}</h3>
            <p>{t(`fn${f.n}p`)}</p>
            <dl>
              <div><dt>{t('fn_m_l')}</dt><dd>{t(`fn${f.n}m`)}</dd></div>
              <div><dt>{t('fn_c_l')}</dt><dd>{t(`fn${f.n}c`)}</dd></div>
              <div><dt>{t('fn_t_l')}</dt><dd>{t(`fn${f.n}t`)}</dd></div>
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---------- 06 unbreakable: the night video holds the screen (pinned); the copy is written in by the scroll ----------
/** Pinned scroll after the block fills the screen, in screens: the first part writes the copy in, the rest just plays the video. */
const OUTRO_PIN = 1.6;

export function Outro() {
  const { t, lang } = useI18n();
  const ready = useScrollReady();
  const staticMode = useStaticMode();
  const sec = useRef<HTMLElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const text = t('ou_h');

  // the pin is created once, in page order with the other pins; re-creating it on a language change put it after the later blocks' pins
  // and threw their positions off (the video screen went black). The copy animation below is rebuilt per language instead.
  useEffect(() => {
    if (!ready || staticMode || prefersReducedMotion()) return;
    const st = ScrollTrigger.create({
      trigger: sec.current!, start: 'top top', end: () => `+=${window.innerHeight * OUTRO_PIN}`, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (s) => {
        const tl = tlRef.current;
        if (!tl) return;
        if (s.progress > 0.12 && tl.reversed() !== false) tl.timeScale(1).play();          // a bit of scroll into the pinned video starts it
        else if (s.progress < 0.02 && s.direction < 0 && tl.progress() > 0) tl.timeScale(2).reverse();
      },
      onLeaveBack: () => tlRef.current?.timeScale(2).reverse(),
    });
    stRef.current = st;
    return () => { st.kill(); stRef.current = null; };
  }, [ready, staticMode]);

  // the scroll only starts the copy; once started it plays to the end on its own (not scrubbed), and rewinds if you scroll back above the block
  useEffect(() => {
    if (!ready || staticMode || prefersReducedMotion()) return;
    const q = gsap.utils.selector(sec.current!);
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    tl.fromTo(q('.kicker'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6 }, 0)
      .fromTo(q('.outro-h span'), { yPercent: 80, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.07 }, 0.15)
      .fromTo(q('.outro-p'), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, '>-0.4');
    const shown = (stRef.current?.progress ?? 0) > 0.12;
    if (shown) tl.progress(1);                           // switched language while the copy is on screen: show the new copy at once
    else tl.reversed(true);                              // "not started" state, so the first play() fires
    tlRef.current = tl;
    return () => { tl.kill(); tlRef.current = null; gsap.set(q('.kicker, .outro-h span, .outro-p'), { clearProps: 'all' }); };
  }, [ready, staticMode, text, lang]);

  return (
    <section ref={sec} id="outro" className="outro">
      <img className="outro-poster" src={img('night', 1280)} srcSet={srcSet('night')} sizes="100vw" alt="" loading="lazy" />
      <VideoBg src={VIDEO.outro} />
      <div className="outro-in">
        <p className="kicker red">{t('ou_k')}</p>
        <h2 className="outro-h" aria-label={text}>
          {/* letter by letter; Arabic word by word (split letters lose their joined forms) */}
          {/* a space as its own inline-block collapses to nothing: give it a no-break space */}
          {(lang === 'ar' ? text.split(/(\s+)/).filter(Boolean) : [...text]).map((c, i) => <span key={i} aria-hidden>{/^\s+$/.test(c) ? ' ' : c}</span>)}
        </h2>
        <p className="outro-p">{t('ou_p1')}<br />{t('ou_p2')}</p>
      </div>
    </section>
  );
}

// ---------- 07 allocation / reserve ----------
export function Reserve() {
  const { t } = useI18n();
  const sec = useRef<HTMLElement>(null);
  useHold(sec);
  return (
    <section ref={sec} id="reserve" className="reserve">
      <div className="wrap">
        <Title k="rs_k" a="rs_h1" i="rs_i" b="rs_h2" />
        <Reveal delay={160}><p className="lead">{t('rs_p')}</p></Reveal>
        <Reveal delay={240}>
          <button className="btn-big" onClick={() => window.dispatchEvent(new Event(OPEN_CONTACT))}>
            {t('rs_btn')} <span className="arr">→</span>
          </button>
        </Reveal>
        <dl className="reserve-stats">
          <div><dt>{t('rs_left_l')}</dt><dd>{ALLOCATION.left} {t('rs_of')} {ALLOCATION.total}</dd></div>
          <div><dt>{t('rs_dep_l')}</dt><dd>{t('rs_dep')}</dd></div>
          <div><dt>{t('rs_build_l')}</dt><dd>{t('rs_build')}</dd></div>
        </dl>
      </div>
    </section>
  );
}

export function Marquee() {
  const { t } = useI18n();
  const items = [t('w1'), t('w2'), t('w3'), `${BRAND} ${MODEL}`];
  const row = items.map((w, i) => <span key={i}>{w}<i>◆</i></span>);
  return (
    <div className="marquee" aria-hidden>
      <div className="marquee-track">{row}{row}</div>
    </div>
  );
}

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const go = (h: string) => (e: React.MouseEvent) => { e.preventDefault(); goToSection(h); };
  return (
    <footer className="ftr">
      <div className="wrap ftr-grid">
        <div>
          <div className="logo big" dir="ltr">{BRAND}</div>
          <p className="ftr-p">{t('ft_addr')}</p>
        </div>
        <div>
          <small>{t('ft_model')}</small>
          <a href="#spec" onClick={go('#spec')}>{t('nav_spec')}</a>
          <a href="#drive" onClick={go('#drive')}>{t('nav_drive')}</a>
          <a href="#finish" onClick={go('#finish')}>{t('nav_finish')}</a>
        </div>
        <div>
          <small>{t('ft_contact')}</small>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          <a href={`tel:${CONTACT.phone.replace(/[^+\d]/g, '')}`} dir="ltr">{CONTACT.phone}</a>
        </div>
        <div>
          <small>{t('ft_legal')}</small>
          <p className="ftr-p">{t('ft_legal_p')}</p>
          <p className="ftr-p">© {year} {BRAND} {MODEL}. {t('ft_rights')}</p>
        </div>
      </div>
    </footer>
  );
}
