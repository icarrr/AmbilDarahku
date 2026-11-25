import React, { useCallback } from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LivePage } from './LivePage';
import { buildTimeline, Device, Layout, VIEWPORT } from './timeline';
import { BG, Caption } from './theme';
import { BRAND } from './brand';

/** Geometry of the device on the 1920x1080 canvas. */
function geometry(device: Device) {
  const { w, h } = VIEWPORT[device];
  if (device === 'desktop') {
    const s = 1.12, bar = 40;
    const W = w * s, H = h * s + bar;
    return { s, left: (1920 - W) / 2, top: (1080 - H) / 2, W, H, inX: 0, inY: bar, bar };
  }
  const s = 1.13, bez = 16;
  const W = w * s + bez * 2, H = h * s + bez * 2;
  return { s, left: 1920 * 0.6 - W / 2, top: (1080 - H) / 2, W, H, inX: bez, inY: bez, bar: bez };
}

/** Showcase scene: the real page in a browser window or phone mockup, with cursor. */
export const SiteScene: React.FC<{ device: Device }> = ({ device }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vp = VIEWPORT[device];
  const g = geometry(device);
  const script = useCallback((L: Layout) => buildTimeline(device, L), [device]);
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 });

  return (
    <AbsoluteFill style={{ background: BG }}>
      {device === 'mobile' && <Caption x={170} title="Mobile" sub={`${vp.w} × ${vp.h} · tap & swipe`} />}
      <div style={{
        position: 'absolute', left: g.left, top: g.top, width: g.W, height: g.H,
        borderRadius: device === 'desktop' ? 14 : 62,
        background: device === 'desktop' ? '#2a2a2a' : '#0b0b0b',
        boxShadow: '0 0 0 2px rgba(201,165,74,.35), 0 40px 90px rgba(0,0,0,.6)',
        transform: `translateY(${(1 - enter) * 40}px)`, opacity: enter,
      }}>
        {device === 'desktop' && (
          <div style={{ height: g.bar, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
            {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 13, height: 13, borderRadius: '50%', background: c }} />)}
            <div style={{
              marginLeft: 18, flex: '0 0 520px', height: 24, borderRadius: 8, background: '#1c1c1c', color: '#aaa',
              fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui',
            }}>{BRAND.urlLabel}</div>
          </div>
        )}
        <LivePage device={device} x={g.inX} y={g.inY} scale={g.s} script={script} radius={device === 'mobile' ? 46 : 0} />
        {device === 'mobile' && (
          <div style={{ position: 'absolute', left: '50%', top: 26, transform: 'translateX(-50%)', width: 118, height: 32, borderRadius: 18, background: '#0b0b0b' }} />
        )}
      </div>
    </AbsoluteFill>
  );
};
