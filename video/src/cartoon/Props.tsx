import React from 'react';
import { Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { LivePage, Script } from '../LivePage';
import { FONT_SANS } from '../theme';
import { VIEWPORT } from '../timeline';
import { Sfx } from './Sfx';
import { BRAND } from '../brand';

const INK = '#1c1c1c';

/** Chunky cartoon phone holding the real mobile page. (x, y) = top-left of the body. */
export const CartoonPhone: React.FC<{ x: number; y: number; scale: number; script: Script; hands?: boolean }> = ({ x, y, scale, script, hands }) => {
  const vp = VIEWPORT.mobile;
  const bez = 18;
  const W = vp.w * scale + bez * 2, H = vp.h * scale + bez * 2;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: W, height: H }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 56, background: '#1f1f1f', border: `7px solid ${INK}`, boxShadow: '14px 16px 0 rgba(0,0,0,.18)' }} />
      <LivePage device="mobile" x={bez} y={bez} scale={scale} script={script} radius={40} sfx />
      <div style={{ position: 'absolute', left: '50%', top: bez + 10, transform: 'translateX(-50%)', width: 110, height: 28, borderRadius: 16, background: '#111' }} />
      {hands && (
        <>
          <Thumb style={{ left: -46, top: H * 0.58 }} />
          <Thumb style={{ right: -46, top: H * 0.5 }} flip />
        </>
      )}
    </div>
  );
};

const Thumb: React.FC<{ style: React.CSSProperties; flip?: boolean }> = ({ style, flip }) => (
  <svg width={110} height={200} viewBox="0 0 110 200" style={{ position: 'absolute', ...style, transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d="M10 200 V60 q0 -40 40 -40 q40 0 40 40 v30 q0 20 -20 20 h-20 v90z" fill="#c68b59" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
  </svg>
);

/** Cartoon laptop holding the real desktop page. (x, y) = top-left of the lid. */
export const CartoonLaptop: React.FC<{ x: number; y: number; scale: number; script: Script }> = ({ x, y, scale, script }) => {
  const vp = VIEWPORT.desktop;
  const bez = 22;
  const W = vp.w * scale + bez * 2, H = vp.h * scale + bez * 2;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: W, height: H + 50 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, borderRadius: 26, background: '#2a2a2a', border: `7px solid ${INK}` }} />
      <LivePage device="desktop" x={bez} y={bez} scale={scale} script={script} radius={6} sfx />
      <svg width={W + 160} height={60} style={{ position: 'absolute', left: -80, top: H - 6, overflow: 'visible' }}>
        <path d={`M80 0 H${W + 80} L${W + 156} 40 q0 14 -14 14 H18 q-14 0 -14 -14z`} fill="#bdbdbd" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <rect x={(W + 160) / 2 - 80} y={6} width={160} height={12} rx={6} fill="#8d8d8d" />
      </svg>
    </div>
  );
};

/** Little moth fluttering out of the empty wallet. */
export const Moth: React.FC<{ x: number; y: number; from: number }> = ({ x, y, from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - from;
  if (t < 0 || t > 3) return null;
  const px = x + t * 120 + Math.sin(t * 6) * 30;
  const py = y - t * 160;
  const flap = Math.abs(Math.sin(t * 30));
  return (
    <svg width={80} height={60} viewBox="-40 -30 80 60" style={{ position: 'absolute', left: px - 40, top: py - 30, opacity: interpolate(t, [0, 0.2, 2.6, 3], [0, 1, 1, 0]) }}>
      <ellipse rx={30} ry={22 * flap + 4} cx={-16} fill="#d8d0c0" stroke={INK} strokeWidth={4} />
      <ellipse rx={30} ry={22 * flap + 4} cx={16} fill="#d8d0c0" stroke={INK} strokeWidth={4} />
      <ellipse rx={7} ry={16} fill="#8a7f6c" stroke={INK} strokeWidth={4} />
    </svg>
  );
};

/** Falling coins + confetti from `from` seconds. */
export const CoinRain: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - from;
  if (t < 0) return null;
  return (
    <>
      {Array.from({ length: 34 }).map((_, i) => {
        const delay = random(`d${i}`) * 2.2;
        const tt = t - delay;
        if (tt < 0) return null;
        const x = random(`x${i}`) * 1920;
        const y = -80 + tt * (380 + random(`v${i}`) * 260);
        if (y > 1150) return null;
        const coin = i % 3 !== 0;
        const rot = tt * (200 + random(`r${i}`) * 300);
        return coin ? (
          <svg key={i} width={70} height={70} viewBox="-35 -35 70 70" style={{ position: 'absolute', left: x - 35, top: y - 35 }}>
            <g transform={`scale(${Math.cos((rot * Math.PI) / 180)} 1)`}>
              <circle r={28} fill="#e6c878" stroke={INK} strokeWidth={5} />
              <circle r={18} fill="none" stroke="#a8842f" strokeWidth={4} />
              <text y={7} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={18} fill="#7a5d1c">Rp</text>
            </g>
          </svg>
        ) : (
          <div key={i} style={{
            position: 'absolute', left: x, top: y, width: 18, height: 30, borderRadius: 4,
            background: ['#c9a54a', '#25d366', '#e07a5f', '#2f3a4a'][i % 4], transform: `rotate(${rot}deg)`, border: `3px solid ${INK}`,
          }} />
        );
      })}
    </>
  );
};

/** Cartoon WhatsApp chat card (illustration, not the real wa.me page). */
export const ChatCard: React.FC<{ x: number; y: number; from: number; msgs: { t: number; me: boolean; text: string }[]; typing?: [number, number]; title?: string; width?: number }> = ({ x, y, from, msgs, typing, title = BRAND.name, width = 620 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const sounds = (
    <>
      <Sfx at={from} name="pop" volume={0.6} />
      {msgs.map((m, i) => <Sfx key={i} at={m.t} name="ping" volume={0.8} />)}
    </>
  );
  if (t < from) return sounds;
  const pop = spring({ frame: frame - from * fps, fps, config: { damping: 12 } });
  return (
    <>
    {sounds}
    <div style={{
      position: 'absolute', left: x, top: y, width, borderRadius: 34, overflow: 'hidden',
      border: `7px solid ${INK}`, background: '#ece5dd', boxShadow: '14px 16px 0 rgba(0,0,0,.18)',
      transform: `scale(${pop})`, transformOrigin: '0% 50%', fontFamily: FONT_SANS,
    }}>
      <div style={{ background: '#075e54', color: '#fff', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 18 }}>
        <Img src={staticFile(BRAND.logo)} style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', background: '#fff' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 30 }}>{title}</div>
          <div style={{ fontSize: 20, opacity: 0.85 }}>online</div>
        </div>
      </div>
      <div style={{ padding: 26, minHeight: 330, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {msgs.filter((m) => t >= m.t).map((m, i) => {
          const s = spring({ frame: frame - m.t * fps, fps, config: { damping: 12 } });
          return (
            <div key={i} style={{
              alignSelf: m.me ? 'flex-end' : 'flex-start', maxWidth: '82%',
              background: m.me ? '#dcf8c6' : '#fff', border: `5px solid ${INK}`, borderRadius: 22,
              padding: '14px 20px', fontSize: 30, fontWeight: 600, color: INK,
              transform: `scale(${s})`, transformOrigin: m.me ? '100% 100%' : '0% 100%',
            }}>{m.text}</div>
          );
        })}
        {typing && t >= typing[0] && t < typing[1] && (
          <div style={{ alignSelf: 'flex-start', background: '#fff', border: `5px solid ${INK}`, borderRadius: 22, padding: '16px 22px', display: 'flex', gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: '#888', transform: `translateY(${Math.sin(t * 10 - i) * 5}px)` }} />
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
};
