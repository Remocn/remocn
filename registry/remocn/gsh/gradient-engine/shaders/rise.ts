import type { GradientKindDefinition } from "../kind";
import { pick, stops } from "../kind";

export const rise: GradientKindDefinition = {
  defaults: {
    background: "#030306",
    blur: 0.5,
    colors: ["#fff1e2", "#ff8a3d", "#a3301a", "#2a0d0a"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.12,
    interaction: { pointer: 0.15, scroll: 0.15 },
    loopSeconds: 16,
    scale: 1,
    seed: 4,
    speed: 0.6,
    warp: 0.3,
  },
  description:
    "A glow rising from past the edge of the frame, like light over a horizon.",
  fallbackLayers: (colors, background) => [
    `radial-gradient(90% 70% at 50% 108%, ${pick(colors, 0)} 0%, ${stops(colors, 22, 70)}, ${background} 100%)`,
  ],
  glsl: `
vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  float lightBg = smoothstep(0.55, 0.85, u_bg.x);
  // The seed picks where the light sits: below the frame (most seeds),
  // above it, or past a lower corner. A second digit stacks one or two
  // brighter lips inside the dome, like light caught on layered haze.
  float placement = fract(u_seed.x * 0.0619 + 0.13);
  float angle = 0.0;
  if (placement > 0.85) {
    angle = 3.14159265;
  } else if (placement > 0.7) {
    angle = 0.62;
  } else if (placement > 0.55) {
    angle = -0.62;
  }
  float lips = floor(fract(u_seed.y * 0.0377 + 0.31) * 3.0);
  vec2 q = rot2(angle) * p;
  float reach = abs(cos(angle)) * h.y + abs(sin(angle)) * h.x;

  // A wide dome whose crest sits inside the frame. Small scales make it so
  // large that only its upper ramp shows: a whole-frame sky.
  float radius = 0.62 / u_scale;
  radius *= 1.0 + 0.14 * flowNoise(vec2(0.37, 0.91), 1.0);
  vec2 centre = vec2(0.5 * flowNoise(vec2(1.7, 0.3), 2.0), -reach - 0.3 * radius + 0.1 * u_loop.y);
  vec2 d2 = (q - centre) * vec2(0.62, 1.0);
  float r = length(d2);
  float x = q.x / max(h.x, 1e-3);

  // The horizon undulates; warp sets how much.
  float ripple = 0.06 * flowNoise(vec2(q.x * 0.9, 0.5), 3.0)
    + 0.015 * flowNoise(vec2(q.x * 2.0, 4.5), 4.0);
  float d = r - radius + u_warp * ripple;

  // Falloff: soft at the crest, softer still toward the sides, like a lens
  // that loses focus away from the centre.
  float fall = (0.07 + 0.32 * u_blur) * (1.0 + 0.7 * x * x) * (0.7 + 0.3 * radius);
  float outside = max(d, 0.0);
  float glow = exp(-outside / fall);
  // Inside the dome the light heats toward its source past the edge.
  float inner = (0.12 + 0.2 * u_blur) * max(1.0, radius);
  float t = d < 0.0 ? 0.4 * exp(d / inner) : 0.4 + 0.6 * (1.0 - exp(-outside / (1.8 * fall)));
  vec3 col = ramp(t);

  // A bright lip on the horizon, then stacked lips inside it.
  float lipW = 0.025 + 0.07 * u_blur;
  float lip = exp(-d * d / (lipW * lipW));
  float stack = 0.0;
  for (int i = 1; i < 3; i++) {
    if (float(i) > lips) break;
    float off = d + float(i) * (0.06 + 0.05 * u_blur) * (0.8 + 0.4 * radius);
    off += 0.02 * u_warp * flowNoise(vec2(q.x * 1.4, float(i) * 3.1), 5.0 + float(i));
    stack += exp(-off * off / (lipW * lipW * 0.8)) * (1.0 - 0.25 * float(i));
  }
  vec3 hot = vec3(min(1.0, paletteColor(0).x + 0.05), paletteColor(0).yz * 0.6);
  col = labMix(col, hot, clamp((lip * 0.28 + stack * 0.45) * (1.0 - 0.6 * lightBg), 0.0, 1.0));
  // Each stacked lip is a thin band of brighter haze over the dome.
  col.x += 0.05 * stack * (1.0 - lightBg);

  vec3 lab = labMix(u_bg, col, glow);
  // Faint haze over the dark half so it never reads as flat black.
  float haze = exp(-outside / (0.7 + 0.7 * u_blur)) * (1.0 - glow);
  lab = labMix(lab, ramp(0.8), 0.24 * haze * (1.0 - lightBg));
  lab.x *= vignette(p, 0.25 * (1.0 - lightBg));
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/rise").then((module) => module.wgsl),
  label: "Rise",
  name: "rise",
};
