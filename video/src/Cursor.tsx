import React from 'react';
import { interpolate } from 'remotion';
import type { Timeline } from './timeline';
import { track } from './timeline';

const GOLD = '#e6c878';

/** Expanding gold ring for each click within the last 0.6s. */
const Ripples: React.FC<{ tl: Timeline; t: number; map: (x: number, y: number) => [number, number] }> = ({ tl, t, map }) =>
  <>
    {tl.clicks.map((c, i) => {
      const dt = t - c.t;
      if (dt < 0 || dt > 0.6) return null;
      const [x, y] = map(c.x, c.y);
      const r = interpolate(dt, [0, 0.6], [8, 46]);
      return (
        <div key={i} style={{
          position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%',
          border: `3px solid ${GOLD}`, opacity: interpolate(dt, [0, 0.6], [1, 0]),
          boxShadow: `0 0 18px ${GOLD}aa`, pointerEvents: 'none',
        }} />
      );
    })}
  </>;

const press = (tl: Timeline, t: number) => {
  let s = 1;
  for (const c of tl.clicks) s = Math.min(s, interpolate(t, [c.t - 0.08, c.t, c.t + 0.14], [1, 0.78, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return s;
};

/** Desktop: macOS-style arrow following tl.cursor. */
export const ArrowCursor: React.FC<{ tl: Timeline; t: number; map: (x: number, y: number) => [number, number] }> = ({ tl, t, map }) => {
  const [x, y] = map(track(tl.cursor, t, (k) => k.x), track(tl.cursor, t, (k) => k.y));
  const s = press(tl, t);
  return (
    <>
      <Ripples tl={tl} t={t} map={map} />
      <svg width={34} height={34} viewBox="0 0 24 24" style={{
        position: 'absolute', left: x - 5, top: y - 3, transform: `scale(${s})`, transformOrigin: '5px 3px',
        filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.45))', pointerEvents: 'none',
      }}>
        <path d="M5 3l14 8.2-6.3 1.3 3.7 7.3-2.8 1.4-3.7-7.4L5 18.3z" fill="#fff" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </>
  );
};

/** Mobile: touch dot that appears around each tap and during swipes. */
export const TouchCursor: React.FC<{ tl: Timeline; t: number; map: (x: number, y: number) => [number, number]; vw: number; vh: number }> = ({ tl, t, map, vw, vh }) => {
  let dot: { x: number; y: number; o: number; s: number } | null = null;
  for (const c of tl.clicks) {
    if (t >= c.t - 0.4 && t <= c.t + 0.35) {
      const o = interpolate(t, [c.t - 0.4, c.t - 0.25, c.t + 0.15, c.t + 0.35], [0, 1, 1, 0]);
      dot = { x: c.x, y: c.y, o, s: press(tl, t) };
    }
  }
  for (const w of tl.swipes) {
    if (t >= w.from && t <= w.to) {
      const p = interpolate(t, [w.from, w.to], [0, 1]);
      const [y0, y1] = w.up ? [vh * 0.72, vh * 0.32] : [vh * 0.32, vh * 0.72];
      dot = { x: vw * 0.62, y: y0 + (y1 - y0) * p, o: interpolate(p, [0, 0.15, 0.8, 1], [0, 1, 1, 0]), s: 1 };
    }
  }
  return (
    <>
      <Ripples tl={tl} t={t} map={map} />
      {dot && (() => {
        const [x, y] = map(dot.x, dot.y);
        const r = 26 * dot.s;
        return <div style={{
          position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%',
          background: 'rgba(255,255,255,.45)', border: '2px solid rgba(255,255,255,.9)',
          boxShadow: '0 4px 14px rgba(0,0,0,.35)', opacity: dot.o, pointerEvents: 'none',
        }} />;
      })()}
    </>
  );
};
