'use client';
import { useI18n } from '@/lib/i18n';
import { BRAND } from '@/lib/site';

// Big percentage counter over black, filled by the hero frame load; a hairline below tracks the same value.
export default function Preloader({ pct }: { pct: number }) {
  const { t } = useI18n();
  return (
    <div className={`pre ${pct >= 100 ? 'done' : ''}`} aria-hidden={pct >= 100} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="pre-in">
        <div className="pre-top">
          <span className="logo" dir="ltr">{BRAND}</span>
          <small>{t('pre_model')}</small>
        </div>
        <b className="pre-num" dir="ltr">{pct}<i>%</i></b>
        <span className="pre-line"><span style={{ transform: `scaleX(${pct / 100})` }} /></span>
        <small>{t('loading')}</small>
      </div>
    </div>
  );
}
