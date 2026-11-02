import type { GradientKindDefinition } from "../kind";
import { stops } from "../kind";

export const waves: GradientKindDefinition = {
  defaults: {
    background: "#05070d",
    blur: 0.35,
    colors: ["#a9c1df", "#5479b0", "#24467e", "#0f1c38"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.08,
    interaction: { pointer: 0.15, scroll: 0.25 },
    loopSeconds: 16,
    scale: 1,
    seed: 11,
    speed: 0.6,
    warp: 0.4,
  },
  description: "Satin bands folding over each other, lit from above.",
  fallbackLayers: (colors, background) => [
    `linear-gradient(172deg, ${background} 0%, ${stops(colors, 28, 100)})`,
  ],
  glsl: `
vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  float tilt = -0.42 + 0.3 * (fract(u_seed.x * 0.173) - 0.5);
  vec2 normal = vec2(sin(tilt), cos(tilt));
  vec2 tangent = vec2(normal.y, -normal.x);
  float y = dot(p, normal) / (2.0 * h.y);
  float along = dot(p, tangent);
  float x = along * u_scale;
  float count = float(u_count);
  // Depth of field: crisp in the middle, softer toward the sides.
  float focus = 0.35 + 0.65 * min(1.0, abs(along) / h.x);
  vec3 lab = u_bg;
  lab.x += 0.05 * smoothstep(-0.2, 0.6, y);
  for (int i = 0; i < 6; i++) {
    if (i >= u_count) break;
    float fi = float(i);
    float base = 0.46 - 0.9 * (fi + 0.25) / count;
    float phase = fi * 1.9 + dot(u_loop, vec2(cos(fi * 1.3), sin(fi * 1.3))) * 1.8;
    float wave = 0.1 * sin(x * (1.3 + 0.3 * fi) + phase)
      + 0.04 * sin(x * (2.7 - 0.2 * fi) - 1.3 * phase + 1.0)
      + u_warp * 0.08 * flowNoise(vec2(x * 0.65, fi * 3.7), 60.0 + fi);
    float edge = base + wave * (0.6 + 0.4 * fi / count);
    float dd = edge - y;
    float soft = 0.002 + (0.01 + 0.06 * u_blur) * focus;
    float m = smoothstep(-soft, soft, dd);
    // The band casts a soft shadow on the one behind it.
    float shadow = exp(-max(-dd, 0.0) / (0.035 + 0.05 * u_blur)) * (1.0 - m);
    lab.x -= 0.08 * shadow * (0.3 + lab.x);
    // Satin: a bright lip at the crest, then the band turns away from the light.
    vec3 c = u_colors[i];
    float body = max(dd, 0.0);
    // Centred on the band's own colour, so a flat palette keeps its value.
    c.x += 0.1 * exp(-body / (0.012 + 0.03 * u_blur)) + 0.09 * (0.38 - smoothstep(0.0, 0.3, body))
      + 0.06 * along / h.x;
    lab = labMix(lab, c, m);
  }
  lab.x *= vignette(p, 0.22);
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/waves").then((module) => module.wgsl),
  label: "Waves",
  name: "waves",
};
