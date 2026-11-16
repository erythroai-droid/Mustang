import type { Metadata, Viewport } from 'next';
// Self-host via fontsource — next/font/google flaky on Vercel (extensionless /l/font?kit= URLs)
// Display: Anton (latin) + Oswald (cyrillic fallback, picked up through unicode-range).
import '@fontsource/anton/latin-400.css';
import '@fontsource/oswald/cyrillic-600.css';
import '@fontsource/oswald/latin-600.css';
// Accent italic: Instrument Serif (latin) + Cormorant Garamond (cyrillic).
import '@fontsource/instrument-serif/latin-400-italic.css';
import '@fontsource/cormorant-garamond/cyrillic-500-italic.css';
// Text: Inter.
import '@fontsource/inter/latin-300.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/cyrillic-300.css';
import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/cyrillic-500.css';
import '@fontsource/inter/cyrillic-600.css';
// Hebrew body text (Arabic: True Arabic, declared in globals.css)
import '@fontsource/heebo/hebrew-300.css';
import '@fontsource/heebo/hebrew-400.css';
import '@fontsource/heebo/hebrew-500.css';
import '@fontsource/heebo/hebrew-600.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';
import { MetaPixel } from '@/components/MetaPixel';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

export const metadata: Metadata = {
  metadataBase: new URL('https://mustang.erythro.ai'),
  title: 'MUSTANG 6663 RT — hand-built fastback',
  alternates: { canonical: '/' },
  description:
    'MUSTANG 6663 RT: a hand-built matte black fastback with gold-leaf stripes. Sixty-six cars, then the tooling burns.',
  openGraph: {
    title: 'MUSTANG 6663 RT — hand-built fastback',
    description:
      'MUSTANG 6663 RT: a hand-built matte black fastback with gold-leaf stripes. Sixty-six cars, then the tooling burns.',
    url: '/',
    siteName: 'MUSTANG 6663 RT',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MUSTANG 6663 RT — hand-built fastback',
    description:
      'MUSTANG 6663 RT: a hand-built matte black fastback with gold-leaf stripes. Sixty-six cars, then the tooling burns.',
  },
};
export const viewport: Viewport = { themeColor: '#050505', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* decide the static (no-animation) layout before first paint, so phones never flash the animated one */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.toggle('static',matchMedia('(max-width: 900px), (prefers-reduced-motion: reduce)').matches)" }} />
        {/* first paint: the first hero frame on desktop, the first frame of the mobile pack on phones */}
        <link rel="preload" as="image" href="/frames/assembly/1280/frame_0001.webp" media="(min-width: 901px)" />
        <link rel="preload" as="image" href="/frames/mobile/frame_0001.webp" media="(max-width: 900px)" />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
        <SpeedInsights />
        <Analytics />
        {/* ad tracking (same IDs as ORA 60A, override per client with NEXT_PUBLIC_META_PIXEL_ID / NEXT_PUBLIC_GA_ID, 0 = off) */}
        <MetaPixel />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
