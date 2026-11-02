import type { GradientKindDefinition } from "../kind";
import { pick, stops } from "../kind";

export const mist: GradientKindDefinition = {
  defaults: {
    background: "#040407",
    blur: 0.55,
    colors: ["#f4d9ff", "#a77bff", "#3b2a9e", "#120d33"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.14,
    interaction: { pointer: 0.2, scroll: 0.15 },
    loopSeconds: 18,
    scale: 1,
    seed: 2,
    speed: 0.5,
    warp: 0.45,
  },
  description:
    "Out-of-focus folds of light: a curved edge glowing against the dark.",
  fallbackLayers: (colors) => [
    `radial-gradient(120% 70% at 70% 100%, ${stops(colors, 0, 80)}, transparent 100%)`,
    `linear-gradient(160deg, transparent 40%, color-mix(in oklab, ${pick(colors, 1)} 40%, transparent) 70%, transparent 95%)`,
  ],
  glsl: `
// Signed distance-ish to one fold: a broad S-curve across the frame.
// Negative on the lit side.
float mistFold(vec2 q, float layer, float amp) {
  float bend = amp * sin(q.x * 1.6 * u_scale + 0.9 * layer + 0.35 * u_loop.y)
    + (0.08 + 0.22 * u_warp) * flowNoise(vec2(q.x * 0.55 * u_scale, layer * 2.3), layer);
  return q.y - bend - 0.12 * q.x;
}

vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  float lightBg = smoothstep(0.55, 0.85, u_bg.x);
  float a = seedAngle();
  // Mostly near-horizontal folds; the seed tilts and flips them.
  float tilt = 0.55 * sin(a) + (cos(a) < 0.0 ? 3.14159265 : 0.0);
  vec2 q = rot2(tilt) * p;
  float x = q.x / max(h.x, 1e-3);

  // The fold drifts slowly up and down through the loop.
  float lift = 0.05 * flowNoise(vec2(0.21, 0.67), 7.0);
  float s = mistFold(q + vec2(0.0, lift), 1.0, 0.16);
  // Along-fold shading: long, soft streaks like light on satin.
  float sheen = flowNoise(vec2(q.x * 0.9 * u_scale, s * 4.0 / (0.5 + u_blur)), 2.0);

  // Lit side: the palette runs from the hot lip into its deep colours.
  float span = 0.45 + 0.35 * u_blur;
  float lit = clamp(-s / span, 0.0, 1.0);
  vec3 col = ramp(0.12 + 0.88 * pow(lit, 0.8));
  // Light spilling past the fold takes the second colour, not white.
  col = labMix(col, paletteColor(1), smoothstep(0.0, 0.2, s) * 0.8);
  float soft = 0.02 + 0.09 * u_blur;
  float side = 1.0 - smoothstep(-soft, soft, s);
  // Light falls off into the far side and fades deep into the lit side.
  float spill = exp(-max(s, 0.0) / (0.05 + 0.18 * u_blur));
  float depth = exp(-max(-s - 0.1, 0.0) / (0.35 + 0.45 * u_blur));
  float amount = max(side * mix(0.3, 1.0, depth), spill * 0.7);
  amount *= 0.86 + 0.18 * sheen;
  // Depth of field: the fold sharpens near the middle of the frame.
  amount *= 1.0 - 0.25 * smoothstep(0.6, 1.2, abs(x));

  vec3 lab = labMix(u_bg, col, clamp(amount, 0.0, 1.0));
  // The lip: bright on dark grounds, an ink crease on light ones.
  float lipW = 0.02 + 0.06 * u_blur;
  // The lip sits just inside the lit side, so it reads as light catching the
  // fold rather than a line drawn on it.
  float sl = s + 0.6 * lipW;
  float lip = exp(-sl * sl / (lipW * lipW)) * (0.75 + 0.25 * sheen);
  vec3 hot = vec3(min(1.0, paletteColor(0).x + 0.05), paletteColor(0).yz * 0.85);
  vec3 ink = vec3(paletteColor(u_count - 1).x * 0.6, paletteColor(u_count - 1).yz);
  lab = labMix(lab, mix(hot, ink, lightBg), clamp(lip * (0.22 + 0.05 * lightBg), 0.0, 1.0));

  // A second, fainter fold behind, offset so the frame has depth.
  float s2 = mistFold(q * vec2(0.8, 1.0) + vec2(0.7, -0.32 + lift), 4.0, 0.22);
  float back = (1.0 - smoothstep(-0.25, 0.08 + 0.1 * u_blur, s2)) * exp(-max(-s2, 0.0) / 0.5);
  back *= 1.0 - side;
  lab = labMix(lab, ramp(0.55), clamp(back * 0.35 * (0.8 + 0.2 * sheen), 0.0, 1.0));

  lab.x *= vignette(p, 0.25 * (1.0 - lightBg));
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/mist").then((module) => module.wgsl),
  label: "Mist",
  name: "mist",
};
