/**
 * Literal colours for the few places that cannot read a CSS variable.
 *
 * SVG presentation attributes (`stroke="…"`, `fill="…"`) do not resolve
 * `var()`, so charts and rings need real values. Everything else in the app
 * should use a Tailwind token class and let `globals.css` decide — this file
 * mirrors that stylesheet and must be edited alongside it.
 */
export const palette = {
  bg: '#fffaf0',
  surface: '#ffffff',
  surfaceAlt: '#fff5e6',
  border: '#e8ddd4',
  borderDashed: '#d8c9bb',

  text: '#2c1810',
  textMuted: '#6b5344',
  textFaint: '#8b7361',

  accent: '#ff6b35',
  accentHover: '#e2521e',
  accentPressed: '#ff8a5f',
  accentInk: '#ffffff',
  accentTint: '#fff0e8',
  accentTint2: '#ffe3d5',
  accentTintInk: '#9c3a12',

  /** Pine green. Deliberately far darker than the accent so the pair stays
      separable under red-blind vision, where a lighter green would not. */
  success: '#276749',
  successStrong: '#2f7a56',
  successTint: '#e6f0ea',
  successInk: '#1f5539',

  warn: '#b5790f',
  bad: '#c0392b',
} as const;
