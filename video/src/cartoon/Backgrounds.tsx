import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT_SERIF } from '../theme';
import { BRAND } from '../brand';

const INK = '#1c1c1c';
const sw = { stroke: INK, strokeWidth: 6, strokeLinejoin: 'round' as const };

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

const Cloud: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 40 q0 -34 34 -34 q14 -30 50 -22 q30 -14 50 16 q34 0 34 40z" fill="#fff" {...sw} strokeWidth={5} />
  </g>
);

const Plant: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g transform={`translate(${x} ${y})`}>
    {[-30, 0, 30].map((a, i) => (
      <path key={i} transform={`rotate(${a + Math.sin(t * 1.5 + i) * 3})`} d="M0 0 q-30 -90 0 -170 q30 80 0 170z" fill="#5b8c51" {...sw} strokeWidth={5} />
    ))}
    <path d="M-50 0 h100 l-14 90 h-72z" fill="#c9a54a" {...sw} />
  </g>
);

/** Living room: window with drifting cloud, wall clock, sofa, plant. */
export const Room: React.FC<{ dim?: number }> = ({ dim = 0 }) => {
  const t = useT();
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <rect width={1920} height={1080} fill="#f3ead6" />
        {Array.from({ length: 13 }).map((_, i) => <rect key={i} x={i * 160} y={0} width={70} height={860} fill="#efe3c9" />)}
        <rect y={860} width={1920} height={220} fill="#d9b98a" />
        {Array.from({ length: 8 }).map((_, i) => <line key={i} x1={i * 260 + 60} y1={860} x2={i * 260 - 40} y2={1080} stroke="#c9a370" strokeWidth={6} />)}
        <line x1={0} y1={860} x2={1920} y2={860} stroke={INK} strokeWidth={6} />
        {/* window */}
        <g transform="translate(1260 150)">
          <rect width={460} height={380} rx={16} fill="#bfe3f2" {...sw} />
          <clipPath id="win"><rect width={460} height={380} rx={16} /></clipPath>
          <g clipPath="url(#win)">
            <circle cx={360} cy={90} r={46} fill="#ffd56b" />
            <Cloud x={((t * 30) % 640) - 180} y={80} />
            <Cloud x={((t * 18 + 300) % 640) - 180} y={220} s={0.7} />
          </g>
          <line x1={230} y1={0} x2={230} y2={380} stroke={INK} strokeWidth={8} />
          <line x1={0} y1={190} x2={460} y2={190} stroke={INK} strokeWidth={8} />
          <rect x={-24} y={380} width={508} height={26} rx={8} fill="#fff" {...sw} />
        </g>
        {/* clock */}
        <g transform="translate(300 230)">
          <circle r={70} fill="#fff" {...sw} />
          <line x1={0} y1={0} x2={0} y2={-46} stroke={INK} strokeWidth={6} strokeLinecap="round" transform={`rotate(${t * 60})`} />
          <line x1={0} y1={0} x2={30} y2={0} stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`rotate(${t * 5})`} />
          <circle r={8} fill="#c9a54a" />
        </g>
        {/* sofa */}
        <g transform="translate(1180 640)">
          <rect x={0} y={0} width={620} height={150} rx={40} fill="#2f2f2f" {...sw} />
          <rect x={-30} y={90} width={680} height={130} rx={36} fill="#3a3a3a" {...sw} />
          <rect x={60} y={30} width={150} height={110} rx={24} fill="#c9a54a" {...sw} transform="rotate(-8 135 85)" />
          <rect x={420} y={30} width={150} height={110} rx={24} fill="#e6c878" {...sw} transform="rotate(7 495 85)" />
          <rect x={10} y={220} width={26} height={30} fill={INK} />
          <rect x={584} y={220} width={26} height={30} fill={INK} />
        </g>
        <Plant x={130} y={770} t={t} />
      </svg>
      {dim > 0 && <AbsoluteFill style={{ background: `rgba(28,28,28,${dim})` }} />}
    </AbsoluteFill>
  );
};

/** Desk corner: shelf, lamp, mug with steam, desk top. */
export const Desk: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <rect width={1920} height={1080} fill="#ece2cb" />
        {Array.from({ length: 30 }).map((_, i) => <circle key={i} cx={(i * 211) % 1920} cy={60 + ((i * 137) % 640)} r={6} fill="#e0d3b5" />)}
        {/* shelf */}
        <g transform="translate(120 170)">
          <rect width={420} height={22} fill="#8a5a3b" {...sw} />
          {[0, 50, 92, 140].map((x, i) => (
            <rect key={i} x={20 + x} y={-120 + i * 8} width={40} height={120 - i * 8} fill={['#c9a54a', '#2f3a4a', '#e07a5f', '#5b8c51'][i]} {...sw} strokeWidth={5} />
          ))}
          <g transform="translate(300 -10)">
            <path d="M-40 0 h80 l-10 -70 h-60z" fill="#fff" {...sw} strokeWidth={5} />
          </g>
        </g>
        {/* lamp */}
        <g transform="translate(1720 760)">
          <rect x={-60} y={-14} width={120} height={20} rx={8} fill={INK} />
          <path d="M0 -14 L-60 -250 L40 -330" fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
          <path d="M10 -380 l100 40 l-30 70 l-100 -40z" fill="#c9a54a" {...sw} />
          <path d="M30 -300 L-60 -60 L180 -60 z" fill="#ffe9a8" opacity={0.25 + 0.05 * Math.sin(t * 4)} />
        </g>
        {/* desk */}
        <rect x={0} y={760} width={1920} height={40} fill="#8a5a3b" {...sw} />
        <rect x={0} y={800} width={1920} height={280} fill="#6e4630" />
        {/* mug */}
        <g transform="translate(1560 690)">
          <rect x={-40} y={0} width={80} height={70} rx={12} fill="#fff" {...sw} />
          <path d="M40 18 q34 0 34 22 q0 22 -34 22" fill="none" stroke={INK} strokeWidth={6} />
          {[-14, 10].map((x, i) => (
            <path key={i} d={`M${x} -10 q-12 -20 0 -40 q12 -20 0 -40`} fill="none" stroke="#bbb" strokeWidth={5} strokeLinecap="round"
              opacity={0.4 + 0.4 * Math.sin(t * 3 + i)} transform={`translate(0 ${-((t * 20 + i * 15) % 20)})`} />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Sunny street in front of the shop. */
export const Street: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9fd8f0" /><stop offset="1" stopColor="#e9f6fb" />
          </linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#sky)" />
        <g transform={`translate(1640 170) rotate(${t * 20})`}>
          {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={-6} y={-150} width={12} height={40} rx={6} fill="#ffcf4d" transform={`rotate(${i * 30})`} />)}
          <circle r={90} fill="#ffd56b" {...sw} />
        </g>
        <Cloud x={((t * 25) % 2200) - 200} y={120} s={1.2} />
        <Cloud x={((t * 15 + 900) % 2200) - 200} y={240} s={0.8} />
        {/* shop */}
        <g transform="translate(260 260)">
          <rect width={900} height={600} fill="#262626" {...sw} />
          <rect x={-30} y={-20} width={960} height={110} rx={12} fill="#1c1c1c" {...sw} />
          <text x={450} y={52} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={600} fontSize={58} fill={BRAND.colors.accentLight}>{BRAND.name}</text>
          {Array.from({ length: 10 }).map((_, i) => (
            <path key={i} d={`M${i * 96 - 30} 90 h96 v60 q-48 36 -96 0z`} fill={i % 2 ? '#c9a54a' : '#f7f4ec'} {...sw} strokeWidth={5} />
          ))}
          <rect x={80} y={220} width={330} height={260} rx={10} fill="#bfe3f2" {...sw} />
          <circle cx={245} cy={350} r={60} fill="#c9a54a" {...sw} strokeWidth={5} />
          <rect x={540} y={220} width={240} height={380} rx={10} fill="#3a3a3a" {...sw} />
          <circle cx={750} cy={420} r={10} fill="#e6c878" />
        </g>
        {/* tree */}
        <g transform="translate(1500 860)">
          <rect x={-24} y={-260} width={48} height={260} fill="#8a5a3b" {...sw} />
          <circle cx={0} cy={-320} r={130} fill="#5b8c51" {...sw} />
          <circle cx={-90} cy={-250} r={80} fill="#6aa05e" {...sw} />
          <circle cx={90} cy={-240} r={84} fill="#6aa05e" {...sw} />
        </g>
        <rect y={860} width={1920} height={220} fill="#cfc7b6" />
        <line x1={0} y1={860} x2={1920} y2={860} stroke={INK} strokeWidth={6} />
        {Array.from({ length: 10 }).map((_, i) => <line key={i} x1={i * 200} y1={860} x2={i * 200 - 60} y2={1080} stroke="#b9b09c" strokeWidth={6} />)}
      </svg>
    </AbsoluteFill>
  );
};
