import type { GradientKindDefinition } from "../kind";
import { pick } from "../kind";

export const voidKind: GradientKindDefinition = {
  defaults: {
    background: "#020203",
    blur: 0.3,
    colors: ["#c9b6ff", "#7b4dff", "#2c1670"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.22,
    interaction: { pointer: 0.15, scroll: 0.1 },
    loopSeconds: 18,
    scale: 1,
    seed: 4,
    speed: 0.6,
    warp: 0.6,
  },
  description:
    "A dark core inside a field of radial streaks, brightest toward the frame edge.",
  fallbackLayers: (colors) => [
    `radial-gradient(circle at 50% 50%, transparent 30%, color-mix(in oklab, ${pick(colors, 2)} 55%, transparent) 48%, color-mix(in oklab, ${pick(colors, 1)} 65%, transparent) 70%, color-mix(in oklab, ${pick(colors, 0)} 55%, transparent) 100%)`,
  ],
  glsl: `
// Colour streaks radiate from a dark core, like a zoom blur. The streaks
// are noise sampled on circles round the centre: fine in angle, smooth in
// radius, and with no seam. scale sets the core; warp the streak contrast.
vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  // The seed picks where the core sits: near the centre, pushed to one
  // side, sunk below the bottom edge so the streaks fan up from it, or
  // tucked into a top corner so they fan down across the frame.
  float framing = floor(fract(u_seed.x * 0.0731 + 0.5) * 4.0);
  float side = sign(u_seed.y + 0.01);
  vec2 centre = vec2(0.06 * h.x * sin(u_seed.y), 0.03 * cos(u_seed.x));
  float radius = 0.25;
  if (framing == 1.0) {
    centre = vec2(0.5 * h.x * side, 0.04);
    radius = 0.22;
  } else if (framing == 2.0) {
    centre = vec2(0.12 * h.x * side, -h.y - 0.08);
    radius = 0.36;
  } else if (framing == 3.0) {
    centre = vec2(-side * (h.x - 0.05), h.y - 0.05);
    radius = 0.3;
  }
  float breathe = 1.0 + 0.035 * flowNoise(vec2(0.37, 0.71), 1.0);
  radius *= u_scale * breathe;

  vec2 d = p - centre;
  float r = length(d);
  vec2 dir = d / max(r, 1e-4);

  // Fine streaks over a broad angular swell. Blur smears the fine ones.
  float fineAmount = 1.0 - 0.75 * u_blur;
  float broad = flowNoise(dir * 2.2 + vec2(0.0, r * 0.4), 1.5);
  float s1 = flowNoise(dir * 16.0 + vec2(r * 0.5, 0.0), 2.0);
  float s2 = flowNoise(dir * 41.0 - vec2(0.0, r * 0.9), 3.0);
  float fine = (s1 + 0.7 * s2) / 1.7;
  float streak = 1.0 + u_warp * (0.3 * broad + 0.32 * fineAmount * fine);

  // One brighter sector, which drifts slowly round the core.
  float swing = seedAngle() + 1.6 * u_loop.y;
  float sector = 0.5 + 0.5 * dot(dir, vec2(sin(swing), -cos(swing)));

  // Dark inside the core, rising through the streaks to the frame edge.
  float soft = 0.5 + 0.6 * u_blur;
  float rise = smoothstep(radius * (1.0 - 0.25 * soft), radius * (1.0 + 1.8 * soft), r);
  float edge = clamp((r - radius) / max(length(h) + length(centre) - radius, 0.2), 0.0, 1.0);
  float glow = rise * (0.28 + 0.42 * edge) * streak * (0.35 + 0.65 * sector * sector);

  // colour 0 is the brightest light, the last the deepest.
  float t = clamp(1.0 - glow * 1.1 - 0.1 * sector, 0.0, 1.0);
  vec3 col = ramp(t);
  vec3 lab = labMix(u_bg, col, clamp(glow * 1.25, 0.0, 1.0));
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/void").then((module) => module.wgsl),
  label: "Void",
  name: "void",
};
