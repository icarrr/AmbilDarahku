import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND } from '../brand';

/**
 * Original flat cartoon Gen-Z customer (streetwear: oversized hoodie, baggy cargos,
 * chunky sneakers, two-block hair with dyed tips, wireless earbuds). Origin = between the feet.
 */

export type Pose = 'stand' | 'think' | 'holdPhone' | 'wallet' | 'type' | 'point' | 'cheer';
export type Mood = 'worried' | 'curious' | 'happy';
export type Key<T> = { t: number; v: T };

// [raiseL, bendL, raiseR, bendR]: raise = arm swings outward from hanging, bend = forearm folds inward.
const POSES: Record<Pose, [number, number, number, number]> = {
  stand: [10, 8, 10, 8],
  think: [10, 8, 22, 150],
  holdPhone: [14, 70, 22, 115],
  wallet: [18, 100, 18, 100],
  type: [16, 85, 16, 85],
  point: [10, 8, 95, 8],
  cheer: [150, -15, 150, -15],
};

const INK = '#1c1c1c';

/** Outfit + body colours. Defaults = Gen-Z streetwear in the brand accent. Override any key per character. */
export type Look = {
  skin: string; skinDark: string; hair: string; tips: string;
  top: string; topDark: string; bottom: string; bottomDark: string; sole: string;
};
export const DEFAULT_LOOK: Look = {
  skin: '#c68b59',
  skinDark: '#a8703f',
  hair: '#22170f',
  tips: BRAND.colors.accentLight, // dyed hair tips
  top: BRAND.colors.accent, // oversized hoodie
  topDark: BRAND.colors.accentDeep,
  bottom: '#3d4436', // baggy cargos
  bottomDark: '#2f352a',
  sole: '#f4f1ea', // chunky sneaker sole
};

function at<T>(keys: Key<T>[], t: number): { cur: T; prev: T; since: number } {
  let i = 0;
  for (let k = 0; k < keys.length; k++) if (keys[k].t <= t) i = k;
  return { cur: keys[i].v, prev: keys[Math.max(0, i - 1)].v, since: t - keys[i].t };
}

const Arm: React.FC<{ L: Look; side: 1 | -1; raise: number; bend: number; hand?: React.ReactNode }> = ({ L, side, raise, bend, hand }) => {
  // side 1 = screen-left arm (positive rotation swings it outward/left), -1 = screen-right.
  const sx = -84 * side;
  return (
    <g transform={`translate(${sx} -418) rotate(${raise * side})`}>
      {/* baggy hoodie sleeve */}
      <rect x={-23} y={-10} width={46} height={104} rx={22} fill={L.top} stroke={INK} strokeWidth={6} />
      <g transform={`translate(0 86) rotate(${-bend * side})`}>
        <rect x={-21} y={-8} width={42} height={70} rx={20} fill={L.top} stroke={INK} strokeWidth={6} />
        {/* ribbed cuff */}
        <rect x={-18} y={58} width={36} height={14} rx={6} fill={L.topDark} stroke={INK} strokeWidth={5} />
        <circle cx={0} cy={88} r={19} fill={L.skin} stroke={INK} strokeWidth={6} />
        {hand && <g transform="translate(0 88)">{hand}</g>}
      </g>
    </g>
  );
};

/** Phone in a lilac case with stickers. */
export const SmallPhone: React.FC = () => (
  <g transform="rotate(180) translate(-24 -32)">
    <rect width={48} height={82} rx={10} fill="#b9a3e3" stroke={INK} strokeWidth={4} />
    <circle cx={14} cy={18} r={7} fill="#ffd56b" stroke={INK} strokeWidth={2} />
    <path d="M30 52 l4 8 8 1 -6 6 2 8 -8 -4 -7 4 1 -8 -6 -6 8 -1z" fill="#ff8fb1" stroke={INK} strokeWidth={2} />
    <rect x={8} y={34} width={18} height={8} rx={4} fill="#7fd1ae" stroke={INK} strokeWidth={2} />
  </g>
);

export const Wallet: React.FC<{ open: number; L?: Look }> = ({ open, L = DEFAULT_LOOK }) => (
  <g transform="translate(-55 -60)">
    <rect x={0} y={20} width={110} height={70} rx={10} fill="#2f2f2f" stroke={INK} strokeWidth={6} />
    <g transform={`translate(0 20) rotate(${-open * 35}) translate(0 -20)`}>
      <rect x={0} y={0} width={110} height={34} rx={10} fill="#454545" stroke={INK} strokeWidth={6} />
      <circle cx={88} cy={17} r={7} fill={L.tips} stroke={INK} strokeWidth={3} />
    </g>
    <rect x={20} y={46} width={70} height={10} rx={5} fill="#1c1c1c" />
  </g>
);

const Sneaker: React.FC<{ L: Look; flip?: boolean }> = ({ L, flip }) => (
  <g transform={flip ? 'scale(-1 1)' : undefined}>
    {/* chunky sole */}
    <path d="M-48 -6 h96 q12 0 12 12 v6 q0 8 -8 8 h-104 q-8 0 -8 -8 v-6 q0 -12 12 -12z" fill={L.sole} stroke={INK} strokeWidth={6} />
    <path d="M-44 -6 q0 -40 34 -42 l26 0 q34 6 40 42z" fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-18 -26 q20 10 50 4" fill="none" stroke={L.top} strokeWidth={7} strokeLinecap="round" />
    <path d="M-14 -44 l8 10 M0 -46 l6 10" stroke={INK} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const Leg: React.FC<{ L: Look; x: number }> = ({ L, x }) => (
  <g transform={`translate(${x} 0)`}>
    {/* baggy cargo leg, wider at the knee, gathered at the ankle */}
    <path d="M-30 -254 h60 l6 150 q2 50 -10 70 h-52 q-12 -20 -10 -70z" fill={L.bottom} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <rect x={x < 0 ? -40 : 8} y={-176} width={30} height={44} rx={6} fill={L.bottomDark} stroke={INK} strokeWidth={5} />
    <line x1={x < 0 ? -40 : 8} y1={-164} x2={x < 0 ? -10 : 38} y2={-164} stroke={INK} strokeWidth={4} />
    <path d="M-26 -38 q26 10 52 0" fill="none" stroke={INK} strokeWidth={4} />
  </g>
);

export const Character: React.FC<{
  x: number; floor: number; scale?: number; flip?: boolean;
  poses: Key<Pose>[]; moods: Key<Mood>[]; talk?: [number, number][];
  jump?: [number, number]; leftHand?: React.ReactNode; rightHand?: React.ReactNode; sweat?: boolean;
  look?: Partial<Look>;
}> = ({ x, floor, scale = 1, flip, poses, moods, talk = [], jump, leftHand, rightHand, sweat, look }) => {
  const L: Look = { ...DEFAULT_LOOK, ...look };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const p = at(poses, t);
  const k = spring({ frame: p.since * fps, fps, config: { damping: 13, mass: 0.7 } });
  const ang = POSES[p.cur].map((v, i) => interpolate(k, [0, 1], [POSES[p.prev][i], v]));

  const mood = at(moods, t).cur;
  const bob = Math.sin(t * 3.2) * 4;
  const hop = jump && t >= jump[0] && t <= jump[1] ? -Math.abs(Math.sin((t - jump[0]) * 7)) * 60 : 0;
  const blinkPhase = (t + 0.7) % 3.1;
  const eyeY = blinkPhase < 0.12 ? 0.1 : 1;
  const talking = talk.some(([a, b]) => t >= a && t <= b);
  const mouthOpen = talking ? 0.35 + 0.65 * Math.abs(Math.sin(t * 14)) : 0;
  const sway = Math.sin(t * 2.4) * 3; // hair fringe sway

  const brow = mood === 'worried' ? 14 : mood === 'curious' ? -8 : -4;
  const W = 440, H = 780;

  return (
    <svg
      width={W * scale} height={H * scale} viewBox={`-220 -740 ${W} ${H}`}
      style={{ position: 'absolute', left: x - (W / 2) * scale, top: floor - 740 * scale, overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <ellipse cx={0} cy={18} rx={130} ry={18} fill="rgba(0,0,0,.18)" />
      <g transform={`translate(0 ${bob + hop})`}>
        <Leg L={L} x={-34} />
        <Leg L={L} x={34} />
        <g transform="translate(-40 0)"><Sneaker L={L} flip /></g>
        <g transform="translate(40 0)"><Sneaker L={L} /></g>

        <Arm L={L} side={1} raise={ang[0]} bend={ang[1]} hand={leftHand} />

        {/* hood bunched behind the neck */}
        <path d="M-70 -458 q70 -50 140 0 q-10 26 -70 30 q-60 -4 -70 -30z" fill={L.topDark} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* oversized hoodie body with dropped shoulders */}
        <path d="M-100 -440 q100 -34 200 0 q10 90 6 196 q0 14 -14 14 h-184 q-14 0 -14 -14 q-4 -106 6 -196z" fill={L.top} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* ribbed hem */}
        <rect x={-92} y={-252} width={184} height={22} rx={8} fill={L.topDark} stroke={INK} strokeWidth={5} />
        {/* kangaroo pocket */}
        <path d="M-56 -330 h112 l18 70 h-148z" fill={L.topDark} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* drawstrings */}
        <path d="M-18 -444 q-4 40 -8 64" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
        <path d="M18 -444 q4 40 8 64" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
        <circle cx={-26} cy={-378} r={5} fill="#fff" stroke={INK} strokeWidth={2} />
        <circle cx={26} cy={-378} r={5} fill="#fff" stroke={INK} strokeWidth={2} />
        {/* small chest graphic */}
        <path d="M44 -400 l10 -16 l10 16 l-10 16z" fill={INK} />

        {/* neck + head */}
        <rect x={-20} y={-486} width={40} height={40} fill={L.skinDark} />
        <g transform={`translate(0 -566) rotate(${mood === 'curious' ? -6 : mood === 'worried' ? 4 : Math.sin(t * 2) * 3})`}>
          <circle cx={-88} cy={8} r={18} fill={L.skin} stroke={INK} strokeWidth={6} />
          <circle cx={88} cy={8} r={18} fill={L.skin} stroke={INK} strokeWidth={6} />
          {/* wireless earbuds */}
          <g fill="#fff" stroke={INK} strokeWidth={3}>
            <ellipse cx={-92} cy={6} rx={8} ry={9} />
            <rect x={-96} y={10} width={7} height={20} rx={3} />
            <ellipse cx={92} cy={6} rx={8} ry={9} />
            <rect x={89} y={10} width={7} height={20} rx={3} />
          </g>
          <circle r={88} fill={L.skin} stroke={INK} strokeWidth={6} />
          {/* two-block: short faded sides */}
          <path d="M-86 -14 q-4 -50 20 -70 l0 50 q-12 6 -20 20z" fill="#4a3a2e" opacity={0.85} />
          <path d="M86 -14 q4 -50 -20 -70 l0 50 q12 6 20 20z" fill="#4a3a2e" opacity={0.85} />
          {/* textured top + curtain fringe with dyed tips */}
          <g transform={`rotate(${sway * 0.4})`}>
            <path d={`M-74 -40 q-14 -70 40 -86 q34 -16 70 -2 q50 14 44 84
              q-14 -12 -24 -10 q-2 ${26 + sway} -24 ${34 + sway} q-4 -26 -22 -34
              q-10 ${22 + sway} -34 ${30 + sway} q2 -24 -12 -32
              q-14 18 -38 ${18 + sway / 2}z`}
              fill={L.hair} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d="M-58 -82 q10 -16 26 -22" stroke={L.tips} strokeWidth={9} strokeLinecap="round" fill="none" />
            <path d="M-30 -112 q16 -8 30 -4" stroke={L.tips} strokeWidth={9} strokeLinecap="round" fill="none" />
            <path d="M18 -110 q18 0 26 10" stroke={L.tips} strokeWidth={9} strokeLinecap="round" fill="none" />
          </g>
          {/* eyes */}
          {[-32, 32].map((ex) => (
            <g key={ex} transform={`translate(${ex} 10) scale(1 ${eyeY})`}>
              <ellipse rx={14} ry={17} fill="#fff" stroke={INK} strokeWidth={4} />
              <circle cx={mood === 'curious' ? 4 : 0} cy={2} r={8} fill={INK} />
              <circle cx={mood === 'curious' ? 7 : 3} cy={-2} r={3} fill="#fff" />
            </g>
          ))}
          {/* brows */}
          <path d={`M-48 ${-16 - brow / 2} L-18 ${-16 + brow / 2}`} stroke={L.hair} strokeWidth={8} strokeLinecap="round" />
          <path d={`M48 ${-16 - brow / 2} L18 ${-16 + brow / 2}`} stroke={L.hair} strokeWidth={8} strokeLinecap="round" />
          {/* cheeks */}
          <circle cx={-52} cy={40} r={12} fill="#e07a5f" opacity={mood === 'happy' ? 0.55 : 0.25} />
          <circle cx={52} cy={40} r={12} fill="#e07a5f" opacity={mood === 'happy' ? 0.55 : 0.25} />
          {/* mouth */}
          {mouthOpen > 0
            ? <ellipse cx={0} cy={52} rx={16} ry={4 + 12 * mouthOpen} fill="#5a1f1f" stroke={INK} strokeWidth={4} />
            : mood === 'worried'
              ? <path d="M-18 58 q18 -14 36 0" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
              : mood === 'happy'
                ? <path d="M-24 44 q24 30 48 0z" fill="#5a1f1f" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
                : <path d="M-12 52 q12 8 24 0" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
          {sweat && (
            <path d={`M72 ${-40 + ((t * 40) % 30)} q10 18 0 26 q-10 -8 0 -26z`} fill="#8fd3f4" stroke={INK} strokeWidth={3} />
          )}
        </g>
        <Arm L={L} side={-1} raise={ang[2]} bend={ang[3]} hand={rightHand} />
      </g>
    </svg>
  );
};
