import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Apple touch icon — same twin-stripe mark as icon.svg */
export default function AppleIcon() {
  const stripe = { width: 30, height: 112, borderRadius: 5, background: '#c9a24e' } as const;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#050505', borderRadius: 40 }}>
        <div style={stripe} />
        <div style={stripe} />
      </div>
    ),
    size,
  );
}
