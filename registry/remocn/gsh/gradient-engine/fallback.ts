import { getKind } from "./kinds";
import type { GradientParams } from "./types";

function grainLayer(amount: number): string {
  const opacity = (0.06 + amount * 0.16).toFixed(3);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 ${opacity}'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / 180px 180px repeat`;
}

/**
 * A CSS `background` value that resembles the gradient: layered radial and
 * linear gradients built from the same colours, so pages never show a blank
 * box. var(--x) colours are kept as-is and follow the theme natively.
 */
export function staticFallbackCss(p: GradientParams): string {
  const layers = getKind(p.kind).fallbackLayers(p.colors, p.background);
  if (p.grain >= 0.2) {
    layers.unshift(grainLayer(p.grain));
  }
  return [...layers, p.background].join(", ");
}
