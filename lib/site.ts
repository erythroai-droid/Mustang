// Site config in one place: brand, hero frame sequence, media paths and the data behind each section.
// Copy lives in i18n/*.txt; this file holds only numbers, media and i18n keys.

export const BRAND = 'MUSTANG';
export const MODEL = '6663 RT';

/** Hero "sheet lift": frames extracted from public/video/v1.mp4 (npm run frames -- public/video/v1.mp4 --every 1). */
export const FRAMES = 121;
export const FRAME_DIR = '/frames/assembly';
/** Seconds of the source clip, for the timecode in the hero kicker. */
export const REVEAL_SECONDS = 5;

export const framePath = (size: number, i: number) => {
  const idx = Math.max(0, Math.min(FRAMES - 1, Math.round(i)));
  return `${FRAME_DIR}/${size}/frame_${String(idx + 1).padStart(4, '0')}.webp`;
};

/**
 * Phones: the same sheet lift as a light 4:3 frame pack, scrubbed by the scroll (EMBER pattern). Every 2nd frame of
 * public/video/v1-m.mp4 at 720x540, WebP q62, ~11 KB each (~660 KB in all, streamed in behind the first frame):
 *   ffmpeg -i public/video/v1-m.mp4 -vf "select='not(mod(n,2))',setpts=N/TB" -fps_mode passthrough -c:v libwebp -quality 62 public/frames/mobile/frame_%04d.webp
 */
export const FRAMES_M = 61;
export const framePathM = (i: number) => `/frames/mobile/frame_${String(Math.max(0, Math.min(FRAMES_M - 1, Math.round(i))) + 1).padStart(4, '0')}.webp`;

/** Optimized photos from scripts/images.mjs. */
export const img = (name: string, w: 1280 | 2400 = 2400) => `/img/${name}-${w}.webp`;
export const srcSet = (name: string) => `${img(name, 1280)} 1280w, ${img(name, 2400)} 2400w`;

export const VIDEO = {
  reveal: '/video/v1.mp4',   // sheet comes off
  drive: '/video/v2.mp4',    // drift on the salt flat
  outro: '/video/v3.mp4',    // drives off into the night
};
/**
 * Phones (static mode): light cuts made with ffmpeg-static from the masters above, no audio, faststart.
 * reveal: 4:3 centre crop (the whole car stays in frame), 720x540, ~250 KB; drive/outro: 9:16 centre crop, 432x768, ~270/~90 KB.
 */
export const VIDEO_M = {
  reveal: '/video/v1-m.mp4',
  revealPoster: '/video/v1-m-poster.webp',   // first frame: the car still under the sheet
  revealEnd: '/video/v1-m-end.webp',         // last frame: reduced motion / Data Saver
  drive: '/video/v2-m.mp4',
  drivePoster: '/video/v2-m-poster.webp',
  outro: '/video/v3-m.mp4',
  outroPoster: '/video/v3-m-poster.webp',
};

/** 02 — numbers. Count-up targets; labels are i18n keys sp{n}u / sp{n}l / sp{n}d. */
export const SPECS = [
  { n: 1, to: 780, decimals: 0 },
  { n: 2, to: 3.4, decimals: 1 },
  { n: 3, to: 298, decimals: 0 },
  { n: 4, to: 850, decimals: 0 },
] as const;

/** 03 — drive cards over the video. i18n dr{n}k / dr{n}v / dr{n}p. */
export const DRIVE_CARDS = [1, 2, 3] as const;

/** 04 — detail gallery: one photo, cropped tight on a part. pos = object-position, zoom = scale. i18n dt{n}h / dt{n}p. */
export const DETAILS = [
  { n: 1, photo: 'profile', pos: '30% 72%', zoom: 2.6 },   // rear wheel
  { n: 2, photo: 'rear', pos: '30% 58%', zoom: 1.6 },      // tail lights + stripes
  { n: 3, photo: 'profile', pos: '56% 70%', zoom: 2.1 },   // side stripe "6663 RT"
  { n: 4, photo: 'night', pos: '50% 60%', zoom: 1 },       // signature at night
] as const;

/** 05 — stripe package. The photo is the same car; the stripe colour is re-graded with a CSS filter. i18n fn{n}n / fn{n}p / fn{n}m / fn{n}c / fn{n}t. */
export const FINISHES = [
  { n: 1, code: 'GLD', swatch: 'linear-gradient(135deg,#1a1a1a 50%,#c9a24e 50%)', filter: 'none' },
  { n: 2, code: 'RED', swatch: 'linear-gradient(135deg,#1a1a1a 50%,#c8321e 50%)', filter: 'hue-rotate(-38deg) saturate(2.2)' },
  { n: 3, code: 'SLV', swatch: 'linear-gradient(135deg,#1a1a1a 50%,#b9bcc2 50%)', filter: 'saturate(0) brightness(1.08)' },
  { n: 4, code: 'BLK', swatch: 'linear-gradient(135deg,#1a1a1a 50%,#3a3a3a 50%)', filter: 'saturate(0) brightness(.62) contrast(1.15)' },
] as const;

/** 07 — allocation. */
export const ALLOCATION = { total: 66, left: 41 };

export const CONTACT = { email: 'garage@mustang-6663rt.example', phone: '+7 900 000-66-63' };

export const pad = (n: number) => String(n).padStart(2, '0');
