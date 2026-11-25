/**
 * SITE — how the real page is driven. Selectors match the static snapshot of
 * https://ambildarahku.vercel.app/ (scripts/snapshot.mjs). The landing <main> holds 7 sections:
 * 1 hero, 2 stats, 3 "Bagaimana Kami Membantu?", 4 lencana, 5 partner, 6 events, 7 CTA.
 * Every entry is optional: a selector that matches nothing is skipped (no crash).
 */
const S = (n: number) => `main section:nth-of-type(${n})`;

export const SITE = {
  /** Entry page under public/ (scripts/sync.sh copies snapshot/ into public/site/). */
  entry: 'site/index.html',

  /** Named click/hover targets (centres measured at scroll 0). */
  targets: {
    heroCta: `${S(1)} a[data-href="/search"]`, // "Cari Donor" button in the hero
    heroRegister: `${S(1)} a[data-href="/register"]`, // "Daftar Sebagai Donor"
    navCari: 'nav.fixed a[data-href="/search"]', // bottom nav "Cari"
  } as Record<string, string>,

  /** Named scroll stops (document y of each element's top). */
  sections: {
    stats: S(2),
    bantu: S(3),
    lencana: S(4),
    events: S(6),
    cta: S(7),
  } as Record<string, string>,

  popup: '',
  lightbox: '',
  suppressKeys: {} as Record<string, string>,

  /** The site's :hover looks, applied inline while a hover window is active. */
  hoverStyles: {
    heroCta: { transform: 'scale(0.97)', filter: 'brightness(0.92)' },
  } as Record<string, Partial<CSSStyleDeclaration>>,

  /** Hide the toast region; keep everything else exactly as the live site renders it. */
  extraCss: 'section[aria-label^="Notifications"]{display:none!important}',
};
