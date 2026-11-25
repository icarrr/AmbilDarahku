import { Easing, interpolate } from 'remotion';

export type Device = 'desktop' | 'mobile';

/** Layout measured inside the iframe at scroll 0 (CSS px of the page viewport). */
export type Layout = {
  vw: number;
  vh: number;
  max: number; // max scrollY
  targets: Record<string, { x: number; y: number }>; // element centers
  sections: Record<string, number>; // section tops (document y)
};

type Pt = { t: number; x: number; y: number };
type Sc = { t: number; y: number };

export type Timeline = {
  duration: number; // seconds
  cursor: Pt[]; // desktop arrow path (seconds)
  clicks: { t: number; x: number; y: number }[];
  scroll: Sc[];
  popup: { show: number; hide: number };
  lightbox: { open: number; close: number };
  hovers: { target: string; from: number; to: number }[];
  swipes: { from: number; to: number; up: boolean }[]; // mobile swipe gestures (up = finger moves up, page scrolls down)
};

export const VIEWPORT: Record<Device, { w: number; h: number }> = {
  desktop: { w: 1440, h: 900 },
  mobile: { w: 390, h: 844 },
};

export const DURATION: Record<Device, number> = { desktop: 28.5, mobile: 28 };

const ease = Easing.bezier(0.45, 0, 0.25, 1);

/** Piecewise eased interpolation over keyframes sorted by t. */
export function track<T extends { t: number }>(keys: T[], t: number, get: (k: T) => number): number {
  if (t <= keys[0].t) return get(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const a = keys[i - 1], b = keys[i];
      return interpolate(t, [a.t, b.t], [get(a), get(b)], { easing: ease });
    }
  }
  return get(keys[keys.length - 1]);
}

export function buildTimeline(device: Device, L: Layout): Timeline {
  const T = L.targets;
  const sec = (name: string) => Math.min(L.sections[name] ?? 0, L.max);
  const at = (t: number, name: string): Pt => ({ t, ...T[name] });
  const xy = (t: number, x: number, y: number): Pt => ({ t, x, y });

  if (device === 'desktop') {
    const rest = { x: L.vw * 0.86, y: L.vh * 0.55 };
    const cursor: Pt[] = [
      xy(0, L.vw * 0.62, L.vh * 0.78),
      xy(1.6, L.vw * 0.62, L.vh * 0.78),
      at(2.6, 'waClose'),
      at(3.0, 'waClose'),
      at(4.2, 'heroCta'),
      at(5.2, 'heroCta'),
      at(6.4, 'heroLogo'),
      at(6.8, 'heroLogo'),
      at(7.9, 'lbClose'),
      at(8.6, 'lbClose'),
      xy(10.0, rest.x, rest.y),
      xy(14.2, rest.x, rest.y),
      xy(15.0, L.vw * 0.5, L.vh * 0.62), // drift over the "Cara Kerja" steps
      xy(15.6, L.vw * 0.5, L.vh * 0.62),
      xy(16.6, rest.x, rest.y),
      xy(22.6, rest.x, rest.y),
      at(23.6, 'waFloat'),
      at(25.0, 'waFloat'),
      xy(26.6, L.vw * 0.62, L.vh * 0.7),
    ];
    const scroll: Sc[] = [
      { t: 0, y: 0 },
      { t: 10.0, y: 0 },
      { t: 11.2, y: sec('barang') },
      { t: 12.8, y: sec('barang') },
      { t: 14.0, y: sec('caraKerja') },
      { t: 15.6, y: sec('caraKerja') },
      { t: 16.8, y: sec('keunggulan') },
      { t: 18.4, y: sec('keunggulan') },
      { t: 19.6, y: sec('cta') },
      { t: 21.2, y: sec('cta') },
      { t: 22.4, y: L.max },
      { t: 25.2, y: L.max },
      { t: 26.8, y: 0 },
    ];
    return {
      duration: DURATION.desktop,
      cursor,
      clicks: [
        { t: 2.8, ...T.waClose },
        { t: 6.6, ...T.heroLogo },
        { t: 8.4, ...T.lbClose },
      ],
      scroll,
      popup: { show: 1.0, hide: 2.8 },
      lightbox: { open: 6.6, close: 8.4 },
      hovers: [
        { target: 'heroCta', from: 4.1, to: 5.4 },
        { target: 'lbClose', from: 7.8, to: 8.5 },
        { target: 'waFloat', from: 23.5, to: 25.2 },
      ],
      swipes: [],
    };
  }

  // mobile: taps only (touch dot appears around each tap), swipe-scroll in ~75%-screen steps
  const start = 6.8, end = 24.8;
  const step = L.vh * 0.75;
  const n = Math.max(1, Math.ceil(L.max / step));
  const slot = (end - start) / n;
  const scroll: Sc[] = [{ t: 0, y: 0 }, { t: start, y: 0 }];
  const swipes: Timeline["swipes"] = [];
  for (let i = 1; i <= n; i++) {
    const t0 = start + (i - 1) * slot;
    const y = Math.min(i * step, L.max);
    scroll.push({ t: t0 + 0.8, y }, { t: t0 + slot, y });
    swipes.push({ from: t0 - 0.1, to: t0 + 0.75, up: true });
  }
  scroll.push({ t: 25.2, y: L.max }, { t: 26.6, y: 0 });
  swipes.push({ from: 25.1, to: 25.9, up: false });
  return {
    duration: DURATION.mobile,
    cursor: [],
    clicks: [
      { t: 2.6, ...T.waClose },
      { t: 4.2, ...T.heroLogo },
      { t: 6.0, ...T.lbClose },
    ],
    scroll,
    popup: { show: 1.0, hide: 2.6 },
    lightbox: { open: 4.2, close: 6.0 },
    hovers: [],
    swipes,
  };
}
