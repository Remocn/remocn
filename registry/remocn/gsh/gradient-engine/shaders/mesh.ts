import type { GradientKindDefinition } from "../kind";
import { pick } from "../kind";

const BLOBS = [
  [16, 20],
  [84, 26],
  [72, 86],
  [22, 80],
  [52, 48],
  [92, 62],
] as const;

export const mesh: GradientKindDefinition = {
  defaults: {
    background: "#0a0d24",
    blur: 0.45,
    colors: ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.1,
    interaction: { pointer: 0.2, scroll: 0.1 },
    loopSeconds: 14,
    scale: 1,
    seed: 42,
    speed: 0.6,
    warp: 0.4,
  },
  description: "Soft, lit colour fields drifting through each other.",
  fallbackLayers: (colors) =>
    colors.map((_, i) => {
      const [x, y] = BLOBS[i % BLOBS.length] ?? [50, 50];
      return `radial-gradient(85% 95% at ${x}% ${y}%, ${pick(colors, i)} 0%, transparent 68%)`;
    }),
  glsl: `
vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  // The palette marches from a lit corner to the far one: colour 0 sits in
  // the light, the last colour in the shadow.
  float theta = seedAngle();
  vec2 axis = vec2(cos(theta), sin(theta));
  vec2 side = vec2(-axis.y, axis.x);
  float span = abs(axis.x) * h.x + abs(axis.y) * h.y;
  vec2 q = p + u_warp * 0.14 * vec2(
    flowNoise(p * 1.2 * u_scale, 1.0),
    flowNoise(p * 1.2 * u_scale + 4.1, 2.0)
  );
  float sigma = (0.22 + 0.2 * u_blur) / u_scale;
  float inv = 1.0 / (sigma * sigma);
  float count = float(u_count);
  float wb = 0.06;
  vec3 lab = u_bg * wb;
  float chroma = length(u_bg.yz) * wb;
  float total = wb;
  for (int i = 0; i < 6; i++) {
    if (i >= u_count) break;
    float fi = float(i);
    float k = fi / max(1.0, count - 1.0);
    float zig = (mod(fi, 2.0) * 2.0 - 1.0) * (0.25 + 0.5 * fract(fi * 0.618 + 0.3));
    vec2 c = axis * span * (0.9 - 1.8 * k) + side * span * 0.5 * zig
      + 0.25 * h * (rot2(fi * 1.7) * u_loop);
    vec2 d = q - c;
    // Fields are wider across the axis than along it: soft bands of light.
    d = vec2(dot(d, axis) * 1.2, dot(d, side) * 0.65);
    float w = exp(-dot(d, d) * inv);
    lab += u_colors[i] * w;
    chroma += length(u_colors[i].yz) * w;
    total += w;
  }
  lab /= total;
  chroma /= total;
  float current = length(lab.yz);
  if (current > 1e-4) {
    lab.yz *= mix(1.0, chroma / current, 0.85);
  }
  lab.x += 0.05 * dot(p, axis) / span;
  // One long silk fold across the frame: a lit crest, then the cloth turns
  // into shadow behind it.
  float along = dot(q, side);
  float crest = 0.16 * sin(along * 1.6 + 0.8 * dot(u_loop, vec2(0.6, 0.8)) + theta)
    + 0.08 * flowNoise(vec2(along * 0.6, 2.0), 3.0);
  float acrossFold = dot(q, axis) - crest;
  float fw = 0.05 + 0.08 * u_blur;
  lab.x += 0.06 * exp(-acrossFold * acrossFold / (fw * fw)) - 0.07 * smoothstep(0.0, 0.5, -acrossFold);
  lab.x *= vignette(p, 0.18);
  return filmGrade(lab);
}
`,
  label: "Mesh",
  name: "mesh",
  wgsl: () => import("./wgsl/mesh").then((module) => module.wgsl),
};
