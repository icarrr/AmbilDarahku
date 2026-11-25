/**
 * BRAND — the one file to edit per project (together with site.ts and the COPY block in Story.tsx).
 * Everything visible that names or colours the business reads from here.
 */
export const BRAND = {
  /** Full business / product name: end card, sign, chat header. */
  name: 'AmbilDarahku',
  /** Short name the character uses. */
  short: 'AmbilDarahku',
  /** Small caps line (the site's hero eyebrow). */
  eyebrow: '#SatuTetesSejutaHarapan',
  /** Line under the name on the end card (site hero headline). */
  tagline: 'Temukan Donor Darah Lebih Cepat',
  /** Pill on the end card (site CTA). Set to '' to hide it. */
  cta: 'Daftar Gratis Sekarang',
  /** URL shown on the end card. */
  urlLabel: 'ambildarahku.vercel.app',
  /** Logo path relative to public/ (sync.sh copies the snapshot into public/site/). */
  logo: 'site/favicon.svg',
  colors: {
    dark: '#1c1917', // end-card background
    dark2: '#4a1414', // radial-gradient highlight
    accent: '#dc2626', // red-600, site primary (also the character's hoodie)
    accentLight: '#f87171',
    accentDeep: '#b91c1c',
    cream: '#fef2f2',
  },
};

export const ACCENT_GRAD = `linear-gradient(135deg, ${BRAND.colors.accentLight} 0%, ${BRAND.colors.accent} 50%, ${BRAND.colors.accentDeep} 100%)`;
export const BG = `radial-gradient(ellipse at center, ${BRAND.colors.dark2} 0%, ${BRAND.colors.dark} 70%)`;
