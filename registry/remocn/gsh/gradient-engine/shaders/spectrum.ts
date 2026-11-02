import type { GradientKindDefinition } from "../kind";
import { stops } from "../kind";

/**
 * Light dispersed along a curved filament. A few thin strands of light arc
 * across the frame; each splits into a fringe of colours that widens along
 * its length, the way an edge of glass throws a spectrum. The palette is
 * the spectrum, in order across the fringe, so it can be a full rainbow or
 * two close hues. Strands keep a white-hot core on dark backgrounds and
 * read as tinted ink lines on pale ones.
 *
 * Unlike the Pro prism (a fan from one point), the light here is a sheet
 * of filaments with no source in frame.
 *
 * Params: `scale` sets the arc size, `warp` the dispersion (how far the
 * fringe fans out), `blur` the halo. The seed picks the sweep and how many
 * strands follow the first.
 *
 * Helpers are prefixed `sp` and only depend on the prelude.
 */
export const spectrum: GradientKindDefinition = {
  defaults: {
    background: "#030304",
    blur: 0.45,
    colors: ["#6a3cff", "#2f8bff", "#2fe0c8", "#ffd23f", "#ff4a3d"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.08,
    interaction: { pointer: 0.15, scroll: 0.1 },
    loopSeconds: 20,
    scale: 1,
    seed: 3,
    speed: 0.5,
    warp: 0.5,
  },
  description:
    "Thin arcs of light splitting into their spectrum across the dark.",
  fallbackLayers: (colors) => [
    `radial-gradient(120% 90% at 30% 120%, transparent 58%, ${stops(colors, 60, 66)}, transparent 70%)`,
  ],
  glsl: `
// Signed distance (approx) from q to strand k, and the position along it.
vec2 spStrand(vec2 q, vec2 h, float k, float side) {
  float s = 1.0 / u_scale;
  // A wide arc: part of a big ellipse leaning across the frame.
  float a = -0.35 + (side - 0.5) * 0.8 + 0.12 * k;
  vec2 r = rot2(a) * q;
  float bend = (0.55 + 0.1 * k) / s;
  float y0 = -0.08 * h.y + 0.11 * k + 0.12 * flowNoise(vec2(0.2, k), 1.0 + k);
  float x = r.x;
  float wave = 0.09 * flowNoise(vec2(x * 0.9, 0.4 + k), 2.0 + k);
  float curve = y0 + bend * 0.5 * x * x + wave;
  // Slope from the analytic part keeps the width even along the arc.
  float slope = bend * x;
  float d = (r.y - curve) / sqrt(1.0 + slope * slope);
  return vec2(d, x / max(h.x, 1e-3));
}

vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  float lightBg = smoothstep(0.55, 0.85, u_bg.x);
  float side = fract(u_seed.y * 0.0917 + 0.5);
  float strands = 1.0 + floor(fract(u_seed.x * 0.0731 + 0.5) * 3.0);
  // Odd layouts mirror, so arcs sweep either way.
  vec2 q = p;
  if (fract(u_seed.x * 0.31 + u_seed.y * 0.17) > 0.5) q.x = -q.x;
  float halo = 0.02 + 0.06 * u_blur;
  vec3 lab = u_bg;
  float n = float(u_count);
  float hotSum = 0.0;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    if (fk >= strands) break;
    vec2 st = spStrand(q, h, fk, side);
    float along = st.y;
    float fade = smoothstep(-1.15, -0.4, along) * (1.0 - 0.35 * fk);
    // The fringe widens along the strand, from a line to a fan.
    float fan = (0.004 + 0.1 * u_warp * smoothstep(-0.9, 1.0, along)) * (1.0 + 0.4 * fk);
    float core = 0.0018 + 0.004 * u_blur;
    // The strand is the lit edge of a ribbon: its surface trails off on
    // one side as a soft body in the palette's middle colour.
    float bodyW = (0.05 + 0.08 * u_blur) * (1.0 + 0.5 * fk);
    float body = st.x < 0.0 ? exp(st.x / bodyW) * smoothstep(-0.006, 0.0, st.x) : 0.0;
    body *= fade * (0.35 + 0.15 * flowNoise(vec2(along * 1.4, fk), 8.0 + fk));
    lab = labMix(lab, ramp(0.35 + 0.15 * fk), clamp(body * mix(0.9, 0.5, lightBg), 0.0, 1.0));
    for (int i = 0; i < 6; i++) {
      if (i >= u_count) break;
      float fi = float(i);
      float off = (fi / max(n - 1.0, 1.0) - 0.5) * fan;
      float dd = st.x - off;
      float band = exp(-dd * dd / ((fan / n + core) * (fan / n + core)));
      float glow = exp(-abs(dd) / halo) * mix(0.35, 0.12, lightBg);
      float wgt = (band + glow) * fade;
      lab = labMix(lab, paletteColor(i), clamp(wgt * mix(0.9, 0.75, lightBg), 0.0, 1.0));
    }
    float hot = exp(-st.x * st.x / (core * core)) * fade;
    hotSum += hot * (1.0 - 0.4 * fk);
  }
  // Where the fringe converges the light burns white on dark grounds.
  vec3 white = vec3(min(1.0, paletteRange().x + 0.05), 0.0, 0.0);
  lab = labMix(lab, white, clamp(hotSum * 0.8 * (1.0 - lightBg), 0.0, 1.0));
  lab.x *= vignette(p, 0.25 * (1.0 - lightBg));
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/spectrum").then((module) => module.wgsl),
  label: "Spectrum",
  name: "spectrum",
};
