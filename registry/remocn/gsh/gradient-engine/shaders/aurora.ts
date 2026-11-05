import type { GradientKindDefinition } from "../kind";
import { pick } from "../kind";

export const aurora: GradientKindDefinition = {
  defaults: {
    background: "#03050b",
    blur: 0.35,
    colors: ["#a0f0c8", "#3fb5a3", "#5147b6", "#b25c9c"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.1,
    interaction: { pointer: 0.2, scroll: 0.2 },
    loopSeconds: 18,
    scale: 1,
    seed: 3,
    speed: 0.7,
    warp: 0.5,
  },
  description: "Folded curtains of light hanging over a night sky.",
  fallbackLayers: (colors) => [
    ...colors.map(
      (_, i) =>
        `radial-gradient(30% 55% at ${15 + (70 * i) / Math.max(1, colors.length - 1)}% 30%, color-mix(in oklab, ${pick(colors, i)} 75%, transparent) 0%, transparent 70%)`,
    ),
    `linear-gradient(180deg, transparent 35%, color-mix(in oklab, ${pick(colors, 0)} 45%, transparent) 58%, transparent 80%)`,
  ],
  glsl: `
// One curtain sheet. Returns its intensity and the height above its hem (0..1).
vec2 auroraSheet(vec2 p, float layer, float hem0, bool detail) {
  float x = p.x * u_scale;
  // Folds sway the sheet sideways, more so higher up.
  float fold = flowNoise(vec2(x * 0.5, p.y * 0.25 + layer), layer);
  float xf = x + (0.1 + 0.3 * u_warp) * fold;
  float hem = hem0 + 0.24 * flowNoise(vec2(xf * 0.6, layer * 3.1), layer + 1.0)
    + 0.1 * sin(x * 1.2 + layer) + 0.06 * fold + 0.08 * x * x;
  float rise = p.y - hem;
  float up = exp(-max(rise, 0.0) * (2.8 - 1.0 * u_blur));
  float down = exp(min(rise, 0.0) * (9.0 - 5.0 * u_blur));
  // Rays: fine across the sheet, stretched along it.
  float n = 0.65 * flowNoise(vec2(xf * 4.0, p.y * 0.15), layer + 2.0);
  if (detail) {
    n += 0.35 * flowNoise(vec2(xf * 11.0, p.y * 0.3), layer + 3.0);
  }
  float rays = mix(1.0, 0.6 + 0.55 * n, 0.85 - 0.45 * u_blur);
  // The sheet thins where it folds edge-on.
  float density = 0.45 + 0.55 * smoothstep(-0.6, 0.6, fold);
  return vec2(up * down * rays * density, clamp(rise / 0.75, 0.0, 1.0));
}

vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  vec3 lab = u_bg;
  lab.x += 0.035 * smoothstep(0.3, -h.y, p.y);
  vec2 back = auroraSheet(p * vec2(0.75, 1.0) + vec2(0.9, 0.0), 11.0, -0.02, false);
  vec2 front = auroraSheet(p, 13.0, -0.3, true);
  lab = labMix(lab, ramp(0.3 + 0.7 * back.y), clamp(back.x * 0.35, 0.0, 1.0));
  lab = labMix(lab, ramp(front.y), clamp(front.x * 1.45, 0.0, 1.0));
  // A bright hem, and the light it throws onto the horizon.
  lab.x += 0.12 * front.x * (1.0 - front.y);
  float horizon = exp(-(p.y + h.y) * 5.0) * (0.5 + 0.5 * front.x);
  lab = labMix(lab, paletteColor(1), clamp(horizon * 0.2, 0.0, 1.0));
  lab.x *= vignette(p, 0.3);
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/aurora").then((module) => module.wgsl),
  label: "Aurora",
  name: "aurora",
};
