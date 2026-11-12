'use client';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import Flag from './Flag';
import { LANGS, useI18n } from '@/lib/i18n';
import { goToSection, refreshScroll } from '@/lib/scroll';
import { BRAND, MODEL } from '@/lib/site';

// numbers match the section kickers (02 — …, 05 — …)
const NAV = [
  ['—', 'nav_overview', '#top'],
  ['02', 'nav_spec', '#spec'],
  ['03', 'nav_drive', '#drive'],
  ['04', 'nav_detail', '#detail'],
  ['05', 'nav_finish', '#finish'],
  ['07', 'nav_reserve', '#reserve'],
] as const;
const INLINE = NAV.slice(1, 5);

/** Any button on the page can open the order form: window.dispatchEvent(new Event(OPEN_CONTACT)). */
export const OPEN_CONTACT = 'open-contact';

type Which = null | 'menu' | 'contact';

export default function Header() {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState<Which>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const langBox = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    const on = () => { setSent(false); setOpen('contact'); };
    window.addEventListener(OPEN_CONTACT, on);
    return () => window.removeEventListener(OPEN_CONTACT, on);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const off = (e: MouseEvent) => { if (!langBox.current?.contains(e.target as Node)) setLangOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setLangOpen(false); };
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, [langOpen]);

  useEffect(() => { const id = setTimeout(refreshScroll, 150); return () => clearTimeout(id); }, [lang]);   // text height changes with the language

  // hairline progress bar along the top edge
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, []);

  const go = (hash: string) => { close(); setTimeout(() => goToSection(hash), 120); };
  const submit = (e: FormEvent) => { e.preventDefault(); setSent(true); };
  const current = LANGS.find((l) => l.code === lang)!;

  return (
    <>
      <header className="hdr">
        <span className="hdr-bar" aria-hidden><span ref={bar} /></span>
        <div className="hdr-l">
          <a href="#top" className="logo" dir="ltr" onClick={(e) => { e.preventDefault(); goToSection('#top'); }}>
            <svg className="logo-mark" width="16" height="14" viewBox="0 0 16 14" aria-hidden><path d="M4 0h3v14H4zM9 0h3v14H9z" fill="currentColor" /></svg>
            {BRAND}<sup>{MODEL}</sup>
          </a>
          <button className="icon burger" aria-label={t('menu_open')} onClick={() => setOpen('menu')}>
            <svg width="18" height="10" viewBox="0 0 18 10"><path d="M0 1h18M0 9h18" stroke="currentColor" strokeWidth="1.2" /></svg>
          </button>
        </div>
        <div className="hdr-r">
          <nav className="hdr-nav" aria-label={t('menu_open')}>
            {INLINE.map(([, k, h]) => <a key={h} href={h} onClick={(e) => { e.preventDefault(); goToSection(h); }}>{t(k)}</a>)}
          </nav>
          <div className="lang-wrap" ref={langBox}>
            <button
              className="lang"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              aria-label={`${current.label} — ${t('lang')}`}
              onClick={() => setLangOpen((v) => !v)}
            >
              <Flag code={current.code} size={18} /> <span>{current.label}</span>
            </button>
            {langOpen && (
              <ul className="lang-menu" role="listbox">
                {LANGS.map((l) => (
                  <li key={l.code} role="option" aria-selected={l.code === lang}>
                    <button className={l.code === lang ? 'on' : ''} onClick={() => { setLang(l.code); setLangOpen(false); }}>
                      <Flag code={l.code} size={18} /><span lang={l.code}>{l.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button className="btn" onClick={() => { setSent(false); setOpen('contact'); }}>{t('reserve')}</button>
        </div>
      </header>

      <Modal open={open === 'menu'} onClose={close} label={t('menu_open')} variant="full">
        <nav className="menu">
          {NAV.map(([n, k, h]) => (
            <a key={h} href={h} onClick={(e) => { e.preventDefault(); go(h); }}><i dir="ltr">{n}</i><span>{t(k)}</span></a>
          ))}
          <p className="menu-foot">{t('menu_foot')}</p>
        </nav>
      </Modal>

      <Modal open={open === 'contact'} onClose={close} label={t('c_title')}>
        {sent ? (
          <div className="form-done">
            <small>{t('c_thanks')}</small>
            <h2>{t('c_done')}</h2>
            <p>{t('c_done_p')}</p>
            <button className="btn" onClick={close}>{t('close')}</button>
          </div>
        ) : (
          <form className="form" onSubmit={submit}>
            <small>{t('c_k')}</small>
            <h2>{t('c_title')}</h2>
            <label>{t('c_name')}<input required name="name" autoComplete="name" /></label>
            <label>{t('c_email')}<input required type="email" name="email" autoComplete="email" dir="ltr" /></label>
            <label>{t('c_msg')}<textarea name="msg" rows={4} defaultValue={t('c_msg_def')} /></label>
            <button className="btn solid" type="submit">{t('c_send')} <span className="arr">→</span></button>
          </form>
        )}
      </Modal>
    </>
  );
}
