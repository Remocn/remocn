import type { GradientKindDefinition } from "../kind";
import { pick } from "../kind";

export const smear: GradientKindDefinition = {
  defaults: {
    background: "#efe8dc",
    blur: 0.55,
    colors: ["#f2552c", "#f7b23b", "#e889b5", "#2f6b3f"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.4,
    interaction: { pointer: 0.25, scroll: 0.3 },
    loopSeconds: 14,
    scale: 1,
    seed: 9,
    speed: 0.7,
    warp: 0.4,
  },
  description:
    "A long exposure of colour: soft blooms dragged into streaks across the frame.",
  fallbackLayers: (colors) => [
    `radial-gradient(45% 22% at 30% 40%, color-mix(in oklab, ${pick(colors, 0)} 85%, transparent) 0%, transparent 100%)`,
    `radial-gradient(40% 20% at 68% 62%, color-mix(in oklab, ${pick(colors, 1)} 80%, transparent) 0%, transparent 100%)`,
    `radial-gradient(35% 18% at 55% 25%, color-mix(in oklab, ${pick(colors, 2)} 70%, transparent) 0%, transparent 100%)`,
    `linear-gradient(160deg, transparent 30%, color-mix(in oklab, ${pick(colors, 3)} 18%, transparent) 100%)`,
  ],
  glsl: `
// flowNoise with a third of the travel: blooms this stretched would otherwise
// sweep a whole bloom-width each loop.
float smearNoise(vec2 p, float layer) {
  return snoise2(p + u_seed + 0.35 * drift(layer) + vec2(layer * 7.13, layer * 3.71));
}

vec3 kindColor(vec2 p, vec2 uv) {
  float lightBg = smoothstep(0.55, 0.85, u_bg.x);
  // The camera moved along one direction; the seed picks it.
  float a = 0.5 * sin(seedAngle()) + (fract(u_seed.y * 0.071) > 0.5 ? 0.0 : 1.5708) * 0.35;
  vec2 q = rot2(a) * p * u_scale;
  // Streaks bend a little where the hand wobbled.
  q.y += (0.05 + 0.2 * u_warp) * smearNoise(vec2(q.x * 0.45, 0.3), 1.0);
  float stretch = 0.3 + 0.35 * (1.0 - u_blur);
  vec2 s = vec2(q.x * stretch, q.y * 1.5) * 1.6;

  // Blooms: where they are, and which colour each one is.
  float bloom = smearNoise(s, 2.0) + 0.5 * smearNoise(s * vec2(1.7, 2.3) + 3.3, 3.0);
  float hue = 0.5 + 0.5 * smearNoise(s * 0.7 + 11.0, 4.0);
  float edge = 0.04 + 0.32 * u_blur;
  float m = smoothstep(0.12 - edge, 0.12 + edge, bloom);
  // Streaks inside the smear: fine across, long along.
  float streak = smearNoise(vec2(q.x * 0.5, q.y * 12.0 / (0.6 + u_blur)), 5.0);
  vec3 col = ramp(clamp(hue + 0.08 * streak, 0.0, 1.0));
  col.x += 0.045 * streak;

  // The ground is not flat: a faint smear of the deepest colour runs through it.
  vec3 ground = u_bg;
  float shade = 0.5 + 0.5 * smearNoise(s * 0.6 - 7.0, 6.0);
  ground = labMix(ground, paletteColor(u_count - 1), 0.12 * shade);
  ground.x += 0.01 * streak;

  vec3 lab = labMix(ground, col, m * (0.82 + 0.18 * shade));
  // Hot cores where blooms are densest.
  // Dense blooms get a darker heart, like the centre of a flower.
  float core = smoothstep(0.75, 1.25, bloom + 0.2 * streak);
  lab = labMix(lab, paletteColor(u_count - 1), 0.3 * core);
  lab.x *= vignette(p, 0.18 * (1.0 - lightBg));
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/smear").then((module) => module.wgsl),
  label: "Smear",
  name: "smear",
};
