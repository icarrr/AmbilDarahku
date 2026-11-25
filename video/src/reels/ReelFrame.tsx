import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ACCENT_GRAD, BG, BRAND } from '../brand';
import { BrandCard, FONT_SANS, FONT_SERIF } from '../theme';
import { OUTRO_SEC, sec } from './durations';

export const HANDLE = '@ambildarahku';
export const OUTRO_CTA = 'Daftar jadi pendonor — link di bio';

/**
 * Instagram overlays its own UI on Reels: the top ~250px (header) and the bottom ~350px
 * (caption, audio, buttons), plus a right-hand column of icons. Content lives inside SAFE.
 */
export const SAFE = { top: 300, bottom: 1520, left: 90, right: 150 } as const;

/** 0→1 spring starting `delay` seconds into the current sequence. */
export const useIn = (delay = 0, frames = 20) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - Math.round(delay * fps), fps, config: { damping: 200 }, durationInFrames: frames });
};

export const rise = (p: number, d = 40): React.CSSProperties => ({ opacity: p, transform: `translateY(${(1 - p) * d}px)` });

export const headline: React.CSSProperties = {
  fontFamily: FONT_SERIF, fontWeight: 700, color: '#fff', lineHeight: 1.12, letterSpacing: '-0.01em',
};
export const body: React.CSSProperties = { fontFamily: FONT_SANS, fontWeight: 500, color: '#f5e9e9', lineHeight: 1.35 };
export const gradText: React.CSSProperties = {
  background: ACCENT_GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
};

/** Pill label, e.g. MITOS / FAKTA. Uses drawn glyphs, not emoji, so renders match on every machine. */
export const Badge: React.FC<{ kind: 'no' | 'yes' | 'plain'; text: string; style?: React.CSSProperties }> = ({ kind, text, style }) => {
  const bg = kind === 'no' ? '#3f3f46' : kind === 'yes' ? BRAND.colors.accent : 'rgba(255,255,255,.12)';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 18, padding: '14px 32px 14px 18px', borderRadius: 999, background: bg,
      fontFamily: FONT_SANS, fontWeight: 600, fontSize: 40, letterSpacing: '0.12em', color: '#fff', ...style,
    }}>
      {kind !== 'plain' && <Mark kind={kind} size={52} />}
      {text}
    </div>
  );
};

/** Circle with a check or a cross. */
export const Mark: React.FC<{ kind: 'no' | 'yes'; size?: number; color?: string }> = ({ kind, size = 56, color }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
    <circle cx="28" cy="28" r="28" fill={color ?? (kind === 'yes' ? '#fff' : '#ef4444')} />
    {kind === 'yes'
      ? <path d="M15 29 l9 9 l17 -19" stroke={BRAND.colors.accent} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      : <path d="M18 18 L38 38 M38 18 L18 38" stroke="#fff" strokeWidth="6" strokeLinecap="round" />}
  </svg>
);

const Header: React.FC = () => {
  const a = useIn(0.1);
  return (
    <div style={{ position: 'absolute', top: 190, left: SAFE.left, display: 'flex', alignItems: 'center', gap: 20, ...rise(a, 16) }}>
      <Img src={staticFile(BRAND.logo)} style={{ width: 72, height: 72, borderRadius: '50%', border: `2px solid ${BRAND.colors.accent}` }} />
      <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 34, color: '#fff' }}>{HANDLE}</div>
    </div>
  );
};

/**
 * Shared shell for every text Reel: brand background, header, soft music, content inside the
 * IG safe zone for `contentSec`, then the brand outro card with the CTA.
 */
export const ReelFrame: React.FC<{ contentSec: number; children: React.ReactNode }> = ({ contentSec, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const contentFrames = sec(contentSec);
  const fadeOut = interpolate(frame, [contentFrames - 8, contentFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Audio src={staticFile('audio/music.wav')} loop
        volume={(f) => 0.22 * interpolate(f, [durationInFrames - 30, durationInFrames - 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
      <Sequence durationInFrames={contentFrames}>
        <AbsoluteFill style={{ opacity: fadeOut }}>
          <Header />
          <div style={{
            position: 'absolute', top: SAFE.top, bottom: 1920 - SAFE.bottom, left: SAFE.left, right: SAFE.right,
            display: 'flex', flexDirection: 'column', justifyContent: 'safe center',
          }}>
            {children}
          </div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={contentFrames} durationInFrames={sec(OUTRO_SEC)}>
        <BrandCard tagline={BRAND.tagline} cta={OUTRO_CTA} />
      </Sequence>
    </AbsoluteFill>
  );
};
