/**
 * Portrait (1080x1920) scene kit for the social-media story: room, hospital front,
 * falling hearts/drops and the end card. Same flat style as Backgrounds.tsx.
 */
import React from 'react';
import { AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT_SANS, FONT_SERIF } from '../theme';
import { BG, BRAND } from '../brand';

const INK = '#1c1c1c';
const W = 1080, H = 1920;
const sw = { stroke: INK, strokeWidth: 6, strokeLinejoin: 'round' as const };
const RED = BRAND.colors.accent;

const useT = () => useCurrentFrame() / useVideoConfig().fps;

const Cloud: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 40 q0 -34 34 -34 q14 -30 50 -22 q30 -14 50 16 q34 0 34 40z" fill="#fff" {...sw} strokeWidth={5} />
  </g>
);

const Drop: React.FC<{ x: number; y: number; s?: number; fill?: string }> = ({ x, y, s = 1, fill = RED }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -50 C0 -50 -32 -6 -32 16 C-32 34 -18 48 0 48 C18 48 32 34 32 16 C32 -6 0 -50 0 -50Z" fill={fill} {...sw} strokeWidth={5} />
);

/** Living room, portrait: window, clock, poster, plant, floor. */
export const RoomV: React.FC<{ dim?: number; table?: boolean }> = ({ dim = 0, table = true }) => {
  const t = useT();
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect width={W} height={H} fill="#f6ece0" />
        {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={i * 150} y={0} width={66} height={1520} fill="#f1e3d2" />)}
        <rect y={1520} width={W} height={400} fill="#d9b98a" />
        {Array.from({ length: 6 }).map((_, i) => <line key={i} x1={i * 220 + 60} y1={1520} x2={i * 220 - 60} y2={H} stroke="#c9a370" strokeWidth={6} />)}
        <line x1={0} y1={1520} x2={W} y2={1520} stroke={INK} strokeWidth={6} />
        {/* window */}
        <g transform="translate(560 220)">
          <rect width={420} height={420} rx={16} fill="#bfe3f2" {...sw} />
          <clipPath id="winv"><rect width={420} height={420} rx={16} /></clipPath>
          <g clipPath="url(#winv)">
            <circle cx={320} cy={100} r={46} fill="#ffd56b" />
            <Cloud x={((t * 30) % 620) - 180} y={90} />
            <Cloud x={((t * 18 + 300) % 620) - 180} y={250} s={0.7} />
          </g>
          <line x1={210} y1={0} x2={210} y2={420} stroke={INK} strokeWidth={8} />
          <line x1={0} y1={210} x2={420} y2={210} stroke={INK} strokeWidth={8} />
          <rect x={-24} y={420} width={468} height={26} rx={8} fill="#fff" {...sw} />
        </g>
        {/* clock */}
        <g transform="translate(250 330)">
          <circle r={90} fill="#fff" {...sw} />
          <line x1={0} y1={0} x2={0} y2={-60} stroke={INK} strokeWidth={6} strokeLinecap="round" transform={`rotate(${t * 60})`} />
          <line x1={0} y1={0} x2={40} y2={0} stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`rotate(${t * 5})`} />
          <circle r={9} fill={RED} />
        </g>
        {/* framed blood-drop poster */}
        <g transform="translate(140 640)">
          <rect width={220} height={280} rx={10} fill="#fff" {...sw} />
          <Drop x={110} y={130} s={1.4} />
          <rect x={50} y={220} width={120} height={14} rx={7} fill="#f3c4c4" />
        </g>
        {/* side table + plant */}
        {table && <g transform="translate(860 1520)">
          <rect x={-90} y={-170} width={180} height={24} rx={6} fill="#8a5a3b" {...sw} />
          <rect x={-70} y={-146} width={18} height={146} fill="#8a5a3b" {...sw} strokeWidth={5} />
          <rect x={52} y={-146} width={18} height={146} fill="#8a5a3b" {...sw} strokeWidth={5} />
          <g transform="translate(0 -170)">
            {[-30, 0, 30].map((a, i) => (
              <path key={i} transform={`rotate(${a + Math.sin(t * 1.5 + i) * 3})`} d="M0 -50 q-26 -80 0 -150 q26 70 0 150z" fill="#5b8c51" {...sw} strokeWidth={5} />
            ))}
            <path d="M-44 -60 h88 l-12 60 h-64z" fill={RED} {...sw} />
          </g>
        </g>}
      </svg>
      {dim > 0 && <AbsoluteFill style={{ background: `rgba(28,28,28,${dim})` }} />}
    </AbsoluteFill>
  );
};

/** Sunny hospital front, portrait. */
export const HospitalV: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="skyv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9fd8f0" /><stop offset="1" stopColor="#e9f6fb" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#skyv)" />
        <g transform={`translate(900 190) rotate(${t * 20})`}>
          {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={-6} y={-130} width={12} height={36} rx={6} fill="#ffcf4d" transform={`rotate(${i * 30})`} />)}
          <circle r={80} fill="#ffd56b" {...sw} />
        </g>
        <Cloud x={((t * 25) % 1400) - 200} y={150} s={1.1} />
        <Cloud x={((t * 15 + 600) % 1400) - 200} y={300} s={0.8} />
        {/* hospital */}
        <g transform="translate(110 430)">
          <rect width={860} height={1090} fill="#fdfdfd" {...sw} />
          <rect x={-24} y={-20} width={908} height={120} rx={12} fill={RED} {...sw} />
          <text x={430} y={60} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={62} letterSpacing={6} fill="#fff">RUMAH SAKIT</text>
          {/* cross */}
          <g transform="translate(430 230)">
            <circle r={84} fill="#fff" {...sw} />
            <rect x={-20} y={-58} width={40} height={116} rx={6} fill={RED} />
            <rect x={-58} y={-20} width={116} height={40} rx={6} fill={RED} />
          </g>
          {[0, 1, 2].map((row) => [0, 1, 2, 3].map((col) => (
            <rect key={`${row}-${col}`} x={60 + col * 200} y={380 + row * 170} width={140} height={110} rx={8} fill="#bfe3f2" {...sw} strokeWidth={5} />
          )))}
          <rect x={300} y={890} width={260} height={200} rx={8} fill="#cfe8f3" {...sw} />
          <line x1={430} y1={890} x2={430} y2={1090} stroke={INK} strokeWidth={6} />
        </g>
        <rect y={1520} width={W} height={400} fill="#cfc7b6" />
        <line x1={0} y1={1520} x2={W} y2={1520} stroke={INK} strokeWidth={6} />
        {Array.from({ length: 7 }).map((_, i) => <line key={i} x1={i * 180} y1={1520} x2={i * 180 - 60} y2={H} stroke="#b9b09c" strokeWidth={6} />)}
      </svg>
    </AbsoluteFill>
  );
};

/** Falling hearts and blood drops from `from` seconds (payoff). */
export const HeartRain: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - from;
  if (t < 0) return null;
  return (
    <>
      {Array.from({ length: 30 }).map((_, i) => {
        const tt = t - random(`d${i}`) * 2.2;
        if (tt < 0) return null;
        const x = random(`x${i}`) * W;
        const y = -80 + tt * (420 + random(`v${i}`) * 300);
        if (y > H + 80) return null;
        const rot = Math.sin(tt * 3 + i) * 25;
        const heart = i % 3 !== 0;
        return (
          <svg key={i} width={84} height={84} viewBox="-42 -42 84 84" style={{ position: 'absolute', left: x - 42, top: y - 42, transform: `rotate(${rot}deg)` }}>
            {heart ? (
              <path d="M0 30 C-40 4 -34 -30 -12 -30 C-4 -30 0 -22 0 -18 C0 -22 4 -30 12 -30 C34 -30 40 4 0 30Z"
                fill={i % 2 ? RED : '#fb7185'} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            ) : (
              <Drop x={0} y={0} s={0.7} />
            )}
          </svg>
        );
      })}
    </>
  );
};

const useIn = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 24 });
};
const rise = (p: number, d = 30): React.CSSProperties => ({ opacity: p, transform: `translateY(${(1 - p) * d}px)` });

/** Portrait end card: logo, name, eyebrow, tagline, CTA pill, URL. */
export const EndCardV: React.FC = () => {
  const a = useIn(0), b = useIn(8), c = useIn(16), d = useIn(26), e = useIn(34);
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 60 }}>
      <Img src={staticFile(BRAND.logo)} style={{
        width: 260, height: 260, borderRadius: 56, marginBottom: 56,
        boxShadow: `0 0 ${50 + 14 * Math.sin(frame / 10)}px rgba(220,38,38,.55)`,
        opacity: a, transform: `scale(${interpolate(a, [0, 1], [0.85, 1])})`,
      }} />
      <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 128, color: '#fff', lineHeight: 1.05, ...rise(b) }}>
        Ambil<span style={{ color: BRAND.colors.accentLight }}>Darahku</span>
      </div>
      <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 32, letterSpacing: '0.12em', color: BRAND.colors.accentLight, marginTop: 26, ...rise(c, 20) }}>
        {BRAND.eyebrow}
      </div>
      <div style={{ fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 64, color: '#fff', marginTop: 70, lineHeight: 1.15, maxWidth: 880, ...rise(c, 20) }}>
        {BRAND.tagline}
      </div>
      {BRAND.cta && (
        <div style={{
          marginTop: 70, padding: '26px 56px', borderRadius: 999, background: BRAND.colors.accent, color: '#fff',
          fontFamily: FONT_SANS, fontWeight: 600, fontSize: 40, boxShadow: '0 12px 36px rgba(220,38,38,.45)', ...rise(d, 20),
        }}>{BRAND.cta}</div>
      )}
      <div style={{ fontFamily: FONT_SANS, fontWeight: 500, fontSize: 34, color: '#d6d3d1', marginTop: 40, ...rise(e, 16) }}>{BRAND.urlLabel}</div>
    </AbsoluteFill>
  );
};
