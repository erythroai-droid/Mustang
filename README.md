# MUSTANG 6663 RT

Scaffolded from [`erythroai-droid/templates/product-scroll-landing`](https://github.com/erythroai-droid/templates), sections re-laid to the Vanta preset layout (dark car landing).

| Section | Component | Media |
|---|---|---|
| 01 Hero, sheet lift scrubbed by scroll | `components/Hero.tsx` | frames from `public/video/v1.mp4` → `public/frames/assembly` |
| 02 Numbers | `Specs` in `components/Sections.tsx` | — |
| 03 Drive, pinned video + cards | `Drive` | `public/video/v2.mp4`, poster `img/drift` |
| 04 Detail, horizontal gallery | `Detail` | crops of `img/profile`, `img/rear`, `img/night` |
| 05 Stripe package selector | `Finish` | `img/profile` re-graded per option (CSS filter) |
| 06 Unbreakable | `Outro` | `public/video/v3.mp4`, poster `img/night` |
| 07 Reserve + marquee + footer | `Reserve`, `Marquee`, `Footer` | — |

Media pipeline:

```bash
npm run images                                                                  # Assets/img -> public/img/*.webp (map in scripts/images.mjs)
FFMPEG=node_modules/ffmpeg-static/ffmpeg.exe npm run frames -- public/video/v1.mp4 --every 1   # hero frames
```

Copy: edit `i18n/ru.txt` (the source), translate EN/HE/AR through the Translater worker, never by hand, then build the dictionary:

```bash
C:\agents\Translater\.venv\Scripts\python.exe scripts/translate.py           # all keys -> i18n/en.txt, he.txt, ar.txt
C:\agents\Translater\.venv\Scripts\python.exe scripts/translate.py hero_h1   # only the keys you changed
npm run i18n
```

HE/AR switch the page to RTL; Hebrew uses Heebo, Arabic True Arabic (`app/fonts`), both scoped by unicode-range so Latin stays Anton/Inter.
Numbers, details, finishes, allocation and contacts: `lib/site.ts`.

---

## Template notes (product-scroll-landing)

Next.js 15 + React 19 + GSAP scroll-assembled product landing (pattern from [ORA 60A](https://ora60a.erythro.ai)).

## Quick start

```bash
npm install
npm run new-site -- acme-x1 "ACME" "X1" https://acme-x1.erythro.ai
npm run dev     # http://localhost:3200
npm run build && npm start
```

## Customize

| Step | Where |
|---|---|
| Brand / model / frame timing | [`lib/site.ts`](lib/site.ts) |
| Apply slug to package + domain files | `npm run new-site -- <slug> "<Brand>" "<Model>" [url]` |
| Copy (EN/RU/HE/AR) | `i18n/*.txt` → `npm run i18n` |
| Extract frames from video | `npm run frames -- path/to/video.mov` then set `STUB_MEDIA=false` |
| Palette | `app/globals.css` CSS variables |
| Agent files | `public/robots.txt`, `public/llms.txt`, `app/sitemap.ts` |

Full client checklist: [`SITE.md`](SITE.md).

## Stack notes (do not regress)

- Fonts: `@fontsource/inter` + `@fontsource/heebo` + local Arabic — **not** `next/font/google` (Next 15.5 flake).
- Sections with video bg keep opaque `--panel` under `.has-vbg` so missing mp4 cannot punch a hole.
- `.gitignore` uses `/Video/` (repo-root only), never bare `Video/` on Windows.
- Ship `/robots.txt`, `/llms.txt`, `/sitemap.xml` and `@vercel/speed-insights`.

## Deploy

1. Push this folder as its own GitHub repo (or monorepo subdirectory with Vercel Root Directory).
2. Import on Vercel → Framework Next.js → Production Branch `main`.
3. Cloudflare DNS: `CNAME <slug> → <project>.vercel-dns-016.com` (DNS only / grey cloud).
4. Smoke: `/`, `/robots.txt`, `/llms.txt`, `/sitemap.xml`, Speed Insights after first visit.
