import type { GradientKindDefinition } from "../kind";
import { pick, stops } from "../kind";

export const grain: GradientKindDefinition = {
  defaults: {
    background: "#070505",
    blur: 0.55,
    colors: ["#ffd8b4", "#e0703b", "#8a2c1d", "#2b1015"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.5,
    interaction: { pointer: 0.25, scroll: 0.15 },
    loopSeconds: 16,
    scale: 1,
    seed: 7,
    speed: 0.6,
    warp: 0.55,
  },
  description: "A grainy beam of light from one corner, brushed into the dark.",
  fallbackLayers: (colors) => [
    `radial-gradient(60% 45% at 18% 20%, ${pick(colors, 0)} 0%, transparent 60%)`,
    `linear-gradient(150deg, ${stops(colors, 0, 70)}, transparent 85%)`,
  ],
  glsl: `
vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  // The light sits just outside the frame and throws a beam across it.
  float a = seedAngle();
  vec2 dir = vec2(cos(a), sin(a));
  vec2 across = vec2(-dir.y, dir.x);
  vec2 src = -dir * (abs(dir.x) * h.x + abs(dir.y) * h.y + 0.12);
  vec2 q = p - src;
  float u = dot(q, dir);
  float v = dot(q, across);

  float bend = 0.06 * sin(u * 1.4 + 0.6 * u_loop.x + a)
    + 0.12 * u_warp * flowNoise(vec2(u * 0.7, 1.3) * u_scale, 1.0);
  float width = (0.1 + 0.18 * u_blur) * (0.45 + 0.7 * u);
  float vb = v - bend;
  float beam = exp(-vb * vb / (width * width));
  // Brushed streaks: long along the beam, short across it.
  float streak = flowNoise(vec2(u * 0.8, vb * 9.0 / (0.45 + u_blur)) * u_scale, 2.0);
  // A wider, dimmer sheet behind it for depth.
  float vb2 = v + 0.3 - 0.5 * bend;
  float beam2 = exp(-vb2 * vb2 / (width * width * 4.0));
  float fall = exp(-u * 0.75);
  float source = exp(-dot(q, q) * 2.2);

  float intensity = (beam * (0.88 + 0.3 * streak) + 0.35 * beam2 * (0.8 + 0.3 * streak)) * fall * 1.5
    + 0.55 * source;
  float ti = 1.0 - exp(-1.6 * intensity);
  vec3 col = ramp(1.0 - ti);
  vec3 lab = labMix(u_bg, col, smoothstep(0.0, 0.75, ti));
  lab.x += 0.08 * max(intensity - 1.0, 0.0);
  lab.x *= vignette(p, 0.35);
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/grain").then((module) => module.wgsl),
  label: "Grain",
  name: "grain",
};
