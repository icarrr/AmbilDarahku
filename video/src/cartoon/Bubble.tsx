import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT_SANS } from '../theme';
import { Sfx } from './Sfx';

const INK = '#1c1c1c';

/**
 * Speech (or thought) bubble. (x, y) is where the tail points (the speaker's mouth);
 * the bubble sits above it, shifted toward `side`.
 */
export const Bubble: React.FC<{
  x: number; y: number; from: number; to: number; text: string;
  side?: 'left' | 'right'; thought?: boolean; width?: number; sound?: boolean;
}> = (props) => (
  <>
    {props.sound !== false && <Sfx at={props.from} name="pop" volume={0.7} />}
    <BubbleBody {...props} />
  </>
);

const BubbleBody: React.FC<React.ComponentProps<typeof Bubble>> = ({ x, y, from, to, text, side = 'right', thought, width = 520 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < from || t > to + 0.3) return null;
  const pop = spring({ frame: frame - from * fps, fps, config: { damping: 11, mass: 0.6 } });
  const out = interpolate(t, [to, to + 0.3], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s = Math.min(pop, 1.15) * out;
  const chars = Math.floor(interpolate(t, [from + 0.1, from + 0.1 + text.length * 0.035], [0, text.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  const bx = side === 'right' ? x - 60 : x - width + 60;
  const by = y - 150;
  const origin = side === 'right' ? '60px 100%' : `${width - 60}px 100%`;

  return (
    <div style={{ position: 'absolute', left: bx, top: by, width, transform: `scale(${s})`, transformOrigin: origin, opacity: out }}>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width,
        background: '#fffaf0', border: `6px solid ${INK}`, borderRadius: thought ? 60 : 34,
        padding: '22px 30px', fontFamily: FONT_SANS, fontWeight: 600, fontSize: 38, lineHeight: 1.25, color: INK,
        boxShadow: '8px 10px 0 rgba(0,0,0,.18)',
      }}>
        <span>{text.slice(0, chars)}</span>
        <span style={{ visibility: 'hidden' }}>{text.slice(chars)}</span>
      </div>
      {thought ? (
        <>
          {[[0, 34, 26], [-26, 76, 16], [-44, 108, 10]].map(([dx, dy, r], i) => (
            <div key={i} style={{
              position: 'absolute', left: (side === 'right' ? 60 : width - 60) + (side === 'right' ? dx : -dx) - r, top: `calc(100% + ${dy - r}px)`,
              width: r * 2, height: r * 2, borderRadius: '50%', background: '#fffaf0', border: `5px solid ${INK}`,
            }} />
          ))}
        </>
      ) : (
        <svg width={70} height={60} style={{ position: 'absolute', top: 'calc(100% - 8px)', left: side === 'right' ? 40 : width - 110, overflow: 'visible' }}>
          <path d={side === 'right' ? 'M4 2 L20 56 L52 2' : 'M18 2 L50 56 L66 2'} fill="#fffaf0" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <rect x={side === 'right' ? 8 : 22} y={-6} width={40} height={10} fill="#fffaf0" />
        </svg>
      )}
    </div>
  );
};
