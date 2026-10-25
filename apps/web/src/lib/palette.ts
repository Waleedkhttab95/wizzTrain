/**
 * Literal colours for the few places that cannot read a CSS variable.
 *
 * SVG presentation attributes (`stroke="…"`, `fill="…"`) do not resolve
 * `var()`, so charts and rings need real values. Everything else should use
 * a Tailwind token class and let `globals.css` decide — this file mirrors
 * that stylesheet and must be edited alongside it.
 *
 * Values marked "brand" are taken verbatim from the Let's Ops identity file.
 */
export const palette = {
  /** brand — Midnight Navy */
  bg: '#00004f',
  surface: '#0a0a5e',
  surfaceAlt: '#13136b',
  border: '#2a2a85',
  borderDashed: '#3a3a96',

  /** brand — Ice Tint */
  text: '#e4f5f9',
  textMuted: '#9cb3cc',
  textFaint: '#7b92b0',

  /** brand — Vibrant Magenta, the primary action */
  accent: '#ed2096',
  accentHover: '#ff3ba9',
  accentPressed: '#ff6ec0',
  accentInk: '#ffffff',
  accentTint: '#2a0a33',
  accentTint2: '#3d0f49',
  accentTintInk: '#ff8fcd',

  /** brand — Cyber Cyan, standing in for a success colour the identity
      does not name. Chosen over a green because it keeps its distance from
      the magenta under red-blind vision. */
  success: '#17d3ff',
  successStrong: '#5ce0ff',
  successTint: '#052b3d',
  successInk: '#8ae9ff',

  /** brand — Amber Gold */
  warn: '#ffbe4a',

  /** brand — Electric Blue. Only ever a ground or a gradient stop: it
      scores 1.5:1 against the navy and cannot be read as a foreground. */
  blue: '#0000b8',

  /** The one colour from outside the identity. Nothing in the palette says
      "error" without colliding with the magenta. */
  bad: '#ff6b6b',
} as const;
