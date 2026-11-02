import type { GradientKindDefinition } from "../kind";
import { stops } from "../kind";

/**
 * Flowing light seen through a wall of vertical flutes. Behind the glass is
 * one soft structure: a ribbon of light sweeping across the frame, an arch
 * of light rising from below, or a ribbon crossed by a column of light. Each flute shifts the image sideways by
 * an amount that grows across its width, so every bright edge breaks into a
 * fine sawtooth, and flutes vary in width like hand-drawn glass.
 *
 * Unlike the Pro reeded glass (lamps seen through mirrored flutes), the
 * light here is a single swept form and the refraction is progressive.
 *
 * The seed picks ribbon, arch or ribbon and column, and where they sit.
 * Colours run from the light's outer edge (first) to its hot core (last);
 * the column takes the last colour. `scale` sets flute width (about 36
 * flutes across the long side at 1), `warp` the refraction, `blur` the
 * softness.
 *
 * Helpers are prefixed `fl` and only depend on the prelude.
 */
export const fluted: GradientKindDefinition = {
  defaults: {
    background: "#050507",
    blur: 0.5,
    colors: ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.16,
    interaction: { pointer: 0.15, scroll: 0.1 },
    loopSeconds: 20,
    scale: 1,
    seed: 5,
    speed: 0.5,
    warp: 0.5,
  },
  description:
    "A sweep of light behind fluted glass, every edge broken into fine teeth.",
  fallbackLayers: (colors) => [
    `repeating-linear-gradient(90deg, rgb(255 255 255 / 0.05) 0 1px, transparent 1px 4.5%)`,
    `linear-gradient(155deg, transparent 30%, ${stops(colors, 40, 60)}, transparent 72%)`,
  ],
  glsl: `
// The light behind the glass at q: intensity (x) and the column's core (y).
vec2 flLight(vec2 q, vec2 h, float mode, float side) {
  float soft = 0.5 + 0.9 * u_blur;
  float ribbon = 0.0;
  if (mode != 1.0) {
    // A ribbon sweeping corner to corner, bending with the flow.
    float a = -0.6 + (side - 0.5) * 0.9;
    vec2 dir = vec2(cos(a), sin(a));
    vec2 n = vec2(-dir.y, dir.x);
    float u = dot(q, dir);
    float v = dot(q, n) - 0.18 * sin(u * 2.2 + 1.3 * side) * h.y;
    v += 0.1 * flowNoise(vec2(u * 0.8, 0.2), 1.0);
    // Lit from above: a crisp bright lip, then a long fall into the dark.
    float w = 0.13 * soft;
    float lip = v > 0.0 ? exp(-v * v / (0.5 * w * w)) : exp(v / (1.4 * w));
    float glow = exp(-abs(v) / (5.0 * w));
    // A second, fainter fold under the first.
    float v2 = v + 0.3 + 0.06 * flowNoise(vec2(u * 0.7, 2.1), 2.0);
    float fold = 0.3 * (v2 > 0.0 ? exp(-v2 * v2 / (0.2 * w * w)) : exp(v2 / (2.0 * w)));
    ribbon = (0.95 * lip + 0.15 * glow + 0.75 * fold) * (0.8 + 0.2 * flowNoise(vec2(u * 1.5, 3.0), 3.0));
  }
  float column = 0.0;
  float core = 0.0;
  if (mode == 1.0) {
    // An arch: the top of a big soft disc rising from below, its rim lit
    // hardest at the crown and its body falling away into the dark.
    vec2 c = vec2((side - 0.5) * 1.1 * h.x, -1.35 * h.y) + vec2(0.06, 0.03) * drift(4.0);
    float radius = 1.05 * h.y + 0.3 * h.x * abs(side - 0.5);
    vec2 d = (q - c) * vec2(0.8, 1.0);
    float r = length(d);
    float x = r - radius + 0.03 * flowNoise(d * 1.4, 5.0);
    float crown = 0.45 + 0.55 * smoothstep(-0.2, 1.0, d.y / max(r, 1e-3));
    float w = 0.08 * soft;
    float rim = exp(-x * x / (w * w));
    float body = x < 0.0 ? exp(x / (0.3 * soft)) : exp(-x / (0.22 * soft));
    column = 0.85 * (0.5 * rim + 0.75 * body) * crown;
  } else if (mode == 2.0) {
    float x0 = (side - 0.5) * 0.9 * h.x + 0.04 * drift(4.0).x + 0.025 * flowNoise(vec2(0.5, q.y * 1.2), 7.0);
    float dx = q.x - x0;
    float tall = smoothstep(-1.2 * h.y, 0.3 * h.y, q.y + 0.15 * flowNoise(vec2(0.3, q.y), 5.0));
    core = exp(-dx * dx / (0.006 * soft)) * mix(0.6, 1.0, tall);
    column = 0.85 * core + 0.35 * exp(-abs(dx) / (0.16 * soft)) * mix(0.55, 1.0, tall);
  }
  return vec2(ribbon + column, core);
}

vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  float minSide = min(u_full.x, u_full.y);
  float mode = floor(fract(u_seed.x * 0.0731 + 0.5) * 3.0);
  float side = fract(u_seed.y * 0.0917 + 0.5);

  // Flutes: an uneven but monotonic stretch of x, so widths vary.
  float w = (2.0 * h.x) / (36.0 * u_scale);
  float x = p.x / w;
  float xf = x + 0.32 * sin(x * 0.61 + 1.7) + 0.18 * sin(x * 1.37 + 0.4);
  float u = fract(xf);
  float idx = floor(xf);
  // Progressive refraction: the image slides across each flute.
  float shift = (0.3 + 1.6 * u_warp) * w;
  vec2 q = p;
  q.x += (u - 0.5) * shift;
  // Each flute leans the image a touch, so diagonal edges turn into teeth.
  q.y += (u - 0.5) * shift * 0.35 * sin(idx * 2.3);

  vec2 light = flLight(q, h, mode, side);
  float t = clamp(pow(light.x, 1.15), 0.0, 1.0);
  vec3 col = ramp(t);
  col = labMix(col, paletteColor(u_count - 1), light.y * 0.85);
  vec3 lab = labMix(u_bg, col, smoothstep(0.0, 0.45, t));

  // Glass: the curve catches a thin highlight near one side of each flute
  // and darkens toward the seams.
  float seen = clamp(length(lab - u_bg) * 4.0, 0.0, 1.0);
  // Hand-made glass: each flute is a touch brighter or darker.
  lab.x *= 1.0 + 0.07 * seen * (fract(sin(idx * 12.9898) * 43758.5453) - 0.5);
  float curve = sin(u * 3.14159265);
  lab.x += (0.05 * exp(-pow((u - 0.28) / 0.07, 2.0)) - 0.04 * (1.0 - curve)) * mix(0.35, 1.0, seen);
  float seamPx = min(u, 1.0 - u) * w * minSide;
  lab.x -= 0.05 * (1.0 - smoothstep(0.0, 1.2, seamPx)) * seen;
  float lightBg = smoothstep(0.55, 0.85, u_bg.x);
  lab.x *= vignette(p, 0.3 * (1.0 - lightBg));
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/fluted").then((module) => module.wgsl),
  label: "Fluted",
  name: "fluted",
};
