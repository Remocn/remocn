import type { GradientKindDefinition } from "../kind";
import { stops } from "../kind";

export const linearFlow: GradientKindDefinition = {
  defaults: {
    background: "#06070c",
    blur: 0.5,
    colors: ["#c13b3b", "#140a0e", "#2c55c5", "#eef2ff"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.08,
    interaction: { pointer: 0.15, scroll: 0.15 },
    loopSeconds: 18,
    scale: 1,
    seed: 21,
    speed: 0.5,
    warp: 0.22,
  },
  description:
    "A directional blend with bowed light lines and a soft light leak.",
  fallbackLayers: (colors) => [`linear-gradient(120deg, ${stops(colors)})`],
  glsl: `
vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  float angle = 0.6 + 1.2 * (fract(u_seed.y * 0.137) - 0.5) + 0.3 * u_loop.y;
  vec2 dir = vec2(cos(angle), sin(angle));
  vec2 perp = vec2(-dir.y, dir.x);
  float extent = abs(dir.x) * h.x + abs(dir.y) * h.y;
  float a = dot(p, dir) / extent;
  float b = dot(p, perp) / extent;
  // Iso-lines bow, as if the light wraps round a curved surface.
  float s = a + 0.16 * b * b - 0.05;
  s += u_warp * 0.18 * flowNoise(p * 0.6 * u_scale, 1.0);
  float t = clamp(0.5 + 0.5 * s * u_scale, 0.0, 1.0);
  vec3 lab = ramp(t * t * (3.0 - 2.0 * t));

  // Light leak: a soft streak along the iso-lines toward the bright end.
  float w = 0.1 + 0.18 * u_blur;
  float sd = (s - 0.5 + 0.08 * flowNoise(vec2(b * 1.1, 3.0), 2.0)) / w;
  float streak = exp(-sd * sd) * (0.65 + 0.35 * flowNoise(vec2(b * 2.2, 7.0), 3.0));
  lab.x += 0.12 * streak;
  lab.yz *= 1.0 - 0.3 * streak;

  // The dark end falls into shadow and the corners sink toward the base colour.
  float dark = 1.0 - smoothstep(0.55, 0.85, u_bg.x);
  lab.x *= mix(1.0, mix(0.72, 1.0, smoothstep(-1.2, 0.1, s)), dark);
  float corner = smoothstep(0.45, 1.15, length(p / h) * 0.75);
  lab = labMix(lab, u_bg, corner * 0.3);
  lab.x *= vignette(p, 0.2 * dark);
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/linear-flow").then((module) => module.wgsl),
  label: "Linear flow",
  name: "linear-flow",
};
