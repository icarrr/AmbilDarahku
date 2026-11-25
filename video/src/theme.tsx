import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadGeist } from '@remotion/google-fonts/Geist';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

export const FONT_SERIF = loadGeist('normal', { weights: ['700'], subsets: ['latin'] }).fontFamily;
export const FONT_SANS = loadInter('normal', { weights: ['500', '600'], subsets: ['latin'] }).fontFamily;

import { ACCENT_GRAD, BG, BRAND } from './brand';

export { BG };
const GOLD_GRAD = ACCENT_GRAD;

const goldText: React.CSSProperties = {
  fontFamily: FONT_SERIF, fontWeight: 700, background: GOLD_GRAD,
  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', lineHeight: 1.1,
};
const eyebrow: React.CSSProperties = {
  fontFamily: FONT_SANS, fontWeight: 600, color: BRAND.colors.accent, letterSpacing: '0.3em', textTransform: 'uppercase',
};

const useIn = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 24 });
};

const rise = (p: number, d = 30): React.CSSProperties => ({ opacity: p, transform: `translateY(${(1 - p) * d}px)` });

export const BrandCard: React.FC<{ tagline: string; cta?: string }> = ({ tagline, cta }) => {
  const a = useIn(0), b = useIn(8), c = useIn(16), d = useIn(26);
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG, alignItems: 'center', justifyContent: 'center' }}>
      <Img src={staticFile(BRAND.logo)} style={{
        width: 250, height: 250, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${BRAND.colors.accent}`,
        boxShadow: `0 0 ${40 + 10 * Math.sin(frame / 10)}px rgba(201,165,74,.35)`, marginBottom: 44,
        opacity: a, transform: `scale(${interpolate(a, [0, 1], [0.85, 1])})`,
      }} />
      <div style={{ ...goldText, fontSize: 108, ...rise(b) }}>{BRAND.name}</div>
      <div style={{ ...eyebrow, fontSize: 30, marginTop: 22, ...rise(c, 20) }}>{tagline}</div>
      {cta && (
        <div style={{
          marginTop: 44, padding: '18px 40px', borderRadius: 999, background: '#25d366', color: '#fff',
          fontFamily: FONT_SANS, fontWeight: 600, fontSize: 32, boxShadow: '0 10px 30px rgba(37,211,102,.35)', ...rise(d, 20),
        }}>{cta}</div>
      )}
    </AbsoluteFill>
  );
};

export const LabelCard: React.FC<{ title: string; sub: string }> = ({ title, sub }) => {
  const a = useIn(0), b = useIn(6);
  return (
    <AbsoluteFill style={{ background: BG, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...eyebrow, fontSize: 30, ...rise(a, 20) }}>Tampilan</div>
      <div style={{ ...goldText, fontSize: 150, marginTop: 8, ...rise(b) }}>{title}</div>
      <div style={{ fontFamily: FONT_SANS, color: '#9a9a9a', fontSize: 26, marginTop: 14, ...rise(b, 10) }}>{sub}</div>
    </AbsoluteFill>
  );
};

/** Side caption next to the phone in the mobile scene. */
export const Caption: React.FC<{ x: number; title: string; sub: string }> = ({ x, title, sub }) => {
  const a = useIn(6);
  return (
    <div style={{ position: 'absolute', left: x, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...rise(a, 20) }}>
      <div style={{ ...eyebrow, fontSize: 24 }}>Tampilan</div>
      <div style={{ ...goldText, fontSize: 120, marginTop: 6 }}>{title}</div>
      <div style={{ fontFamily: FONT_SANS, color: '#9a9a9a', fontSize: 24, marginTop: 12 }}>{sub}</div>
    </div>
  );
};
