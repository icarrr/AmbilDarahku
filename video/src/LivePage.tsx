import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ArrowCursor, TouchCursor } from './Cursor';
import { Sfx } from './cartoon/Sfx';
import { SITE } from './site';
import { Device, Layout, Timeline, track, VIEWPORT } from './timeline';

// Stop the page's own real-time timers (auto-popups etc.); Remotion drives them per frame instead.
try { for (const [k, v] of Object.entries(SITE.suppressKeys)) window.sessionStorage.setItem(k, v); } catch { /* ignore */ }

const FREEZE_CSS = `*,*::before,*::after{transition:none!important;animation:none!important}
html{scroll-behavior:auto!important;scrollbar-width:none}::-webkit-scrollbar{display:none}`;

export type Script = (L: Layout) => Timeline;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const finite = (p: { x: number; y: number }) => Number.isFinite(p.x) && Number.isFinite(p.y);

/** Drop clicks / cursor keys that point at targets the page doesn't have. */
function sanitize(tl: Timeline): Timeline {
  return { ...tl, clicks: tl.clicks.filter(finite), cursor: tl.cursor.filter(finite) };
}

/**
 * The real site in an iframe at its true viewport, scaled by `scale`, placed at (x, y)
 * inside its parent. `script` decides scroll, popup, lightbox, hovers and the cursor per frame.
 */
export const LivePage: React.FC<{
  device: Device; x: number; y: number; scale: number; script: Script; radius?: number; cursor?: boolean; sfx?: boolean;
}> = ({ device, x, y, scale, script, radius = 0, cursor = true, sfx = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ref = useRef<HTMLIFrameElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [handle] = useState(() => delayRender(`load site (${device})`, { timeoutInMilliseconds: 60000 }));
  const vp = VIEWPORT[device];

  const onLoad = useCallback(async () => {
    const win = ref.current!.contentWindow!;
    const doc = win.document;
    const q = (sel: string) => (sel ? (doc.querySelector(sel) as HTMLElement | null) : null);
    const st = doc.createElement('style');
    st.textContent = FREEZE_CSS + SITE.extraCss;
    doc.head.appendChild(st);
    await doc.fonts.ready;
    await Promise.all(Array.from(doc.images).map((im) => (im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; }))));
    win.scrollTo(0, 0);
    // measure fixed overlays in their open state
    const pop = q(SITE.popup), lb = q(SITE.lightbox);
    if (pop) pop.style.transform = 'none';
    if (lb) lb.style.visibility = 'visible';
    const targets: Layout['targets'] = {};
    for (const [k, sel] of Object.entries(SITE.targets)) {
      const el = q(sel);
      if (!el) { console.warn(`[LivePage] target "${k}" (${sel}) not found`); continue; }
      const r = el.getBoundingClientRect();
      targets[k] = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    if (pop) pop.style.transform = '';
    if (lb) lb.style.visibility = '';
    const sections: Layout['sections'] = {};
    for (const [k, sel] of Object.entries(SITE.sections)) {
      const el = q(sel);
      if (el) sections[k] = el.getBoundingClientRect().top;
      else console.warn(`[LivePage] section "${k}" (${sel}) not found`);
    }
    const max = doc.documentElement.scrollHeight - win.innerHeight;
    setLayout({ vw: win.innerWidth, vh: win.innerHeight, max, targets, sections });
    continueRender(handle);
  }, [handle]);

  const tl = useMemo(() => (layout ? sanitize(script(layout)) : null), [layout, script]);

  // Drive the page for this frame, then wait two of the iframe's paints before Remotion screenshots.
  useLayoutEffect(() => {
    if (!tl || !ref.current?.contentWindow) return;
    const win = ref.current.contentWindow;
    const doc = win.document;
    const q = (sel: string) => (sel ? (doc.querySelector(sel) as HTMLElement | null) : null);
    win.scrollTo(0, Math.round(track(tl.scroll, t, (k) => k.y) || 0));

    const pop = q(SITE.popup);
    if (pop) {
      const pIn = spring({ frame: frame - tl.popup.show * fps, fps, config: { damping: 14 } });
      const pOut = interpolate(t, [tl.popup.hide, tl.popup.hide + 0.25], [1, 0], clamp);
      const p = t < tl.popup.show ? 0 : Math.min(pIn, pOut);
      pop.style.opacity = String(p);
      pop.style.transform = `translateY(${(1 - p) * 14}px) scale(${0.95 + 0.05 * p})`;
      pop.style.pointerEvents = 'none';
    }

    const lb = q(SITE.lightbox);
    if (lb) {
      const lIn = interpolate(t, [tl.lightbox.open, tl.lightbox.open + 0.3], [0, 1], clamp);
      const lOut = interpolate(t, [tl.lightbox.close, tl.lightbox.close + 0.25], [1, 0], clamp);
      const l = Math.min(lIn, lOut);
      lb.style.opacity = String(l);
      lb.style.visibility = l > 0 ? 'visible' : 'hidden';
      const img = lb.querySelector('img') as HTMLElement | null;
      if (img) img.style.transform = `scale(${0.92 + 0.08 * l})`;
    }

    // Hover: inline styles from SITE.hoverStyles, or a gentle pulse for targets without one.
    for (const [name, sel] of Object.entries(SITE.targets)) {
      const el = q(sel);
      if (!el) continue;
      const h = tl.hovers.find((v) => v.target === name && t >= v.from && t <= v.to);
      const look = SITE.hoverStyles[name];
      if (look) {
        for (const [prop, val] of Object.entries(look)) (el.style as unknown as Record<string, string>)[prop] = h ? String(val) : '';
      } else {
        el.style.transform = h ? `scale(${1.08 + 0.04 * Math.sin((t - h.from) * 8)})` : '';
      }
    }

    const hd = delayRender('paint');
    win.requestAnimationFrame(() => win.requestAnimationFrame(() => continueRender(hd)));
  }, [tl, t, frame, fps]);

  const map = useCallback((px: number, py: number): [number, number] => [px * scale, py * scale], [scale]);

  return (
    <div style={{ position: 'absolute', left: x, top: y, width: vp.w * scale, height: vp.h * scale }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: radius, background: '#1c1c1c' }}>
        <iframe
          ref={ref}
          src={staticFile(SITE.entry)}
          onLoad={onLoad}
          style={{ width: vp.w, height: vp.h, border: 0, transform: `scale(${scale})`, transformOrigin: '0 0' }}
        />
      </div>
      {sfx && tl && (
        <>
          {tl.clicks.map((c, i) => <Sfx key={`c${i}`} at={c.t - 0.02} name={device === 'desktop' ? 'click' : 'tap'} volume={0.9} />)}
          {tl.swipes.map((s, i) => <Sfx key={`s${i}`} at={s.from + 0.1} name="whoosh" volume={0.35} />)}
        </>
      )}
      {cursor && tl && tl.cursor.length > 0 && device === 'desktop' && <ArrowCursor tl={tl} t={t} map={map} />}
      {cursor && tl && device === 'mobile' && <TouchCursor tl={tl} t={t} map={map} vw={layout!.vw} vh={layout!.vh} />}
    </div>
  );
};
