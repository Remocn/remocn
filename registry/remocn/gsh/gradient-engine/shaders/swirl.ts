import type { GradientKindDefinition } from "../kind";
import { stops } from "../kind";

export const swirl: GradientKindDefinition = {
  defaults: {
    background: "#07060a",
    blur: 0.6,
    colors: ["#ffe2c4", "#ff9a4d", "#d2456b", "#3a1f6b"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.16,
    interaction: { pointer: 0.25, scroll: 0.2 },
    loopSeconds: 20,
    scale: 1,
    seed: 5,
    speed: 0.6,
    warp: 0.55,
  },
  description:
    "Colour stirred into a slow, blurred vortex around an off-centre eye.",
  fallbackLayers: (colors) => [
    `radial-gradient(70% 80% at 58% 46%, ${stops(colors, 0, 75)}, transparent 100%)`,
  ],
  glsl: `
vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  float lightBg = smoothstep(0.55, 0.85, u_bg.x);
  float a = seedAngle();
  // The eye sits off centre and wanders a little.
  vec2 eye = vec2(0.32 * h.x * cos(a), 0.22 * h.y * sin(a * 1.7));
  eye += 0.05 * vec2(flowNoise(vec2(0.2, 0.8), 1.0), flowNoise(vec2(0.9, 0.1), 2.0));
  vec2 d = p - eye;
  float r = length(d);
  // Twist: strongest near the eye, easing out with distance. It breathes
  // with the loop, so the arms wind and unwind.
  float reach = 0.55 / u_scale;
  float twist = (2.2 + 2.8 * u_warp) * exp(-r / reach) + 0.9 * u_loop.x;
  float dir = fract(u_seed.y * 0.113) > 0.5 ? 1.0 : -1.0;
  vec2 q = rot2(dir * twist) * d;

  vec2 s = q * 1.25 * u_scale;
  float fine = 1.0 - 0.8 * u_blur;
  float n = flowNoise(s, 3.0) + 0.4 * fine * flowNoise(s * 2.3 + 5.1, 4.0);
  n /= 1.0 + 0.4 * fine;
  float t = clamp(0.45 + 0.5 * n, 0.0, 1.0);
  // Arms: a soft spiral band the palette rides along.
  float arm = 0.5 + 0.5 * sin(atan(q.y, q.x + 1e-6) * 2.0 + r * 3.0 + 2.0 * n);
  // The arms converge to a point at the eye; let them dissolve there.
  arm = mix(0.5, arm, smoothstep(0.0, 0.2, r));
  t = mix(t, 0.15 + 0.7 * arm, 0.3);
  vec3 col = ramp(t);

  // The eye is the brightest, calmest point; light thins with distance.
  float lit = exp(-r / ((0.35 + 0.35 * u_blur) * max(0.6, 1.0 / u_scale)));
  // Away from the eye the colour thins into the ground along the arms.
  float amount = lit * (0.7 + 0.3 * arm) + (1.0 - lit) * 0.55 * arm * smoothstep(-0.2, 0.6, n);
  // As the light thins it deepens toward the last colour instead of
  // greying out, the way a glow falls off on film.
  col = labMix(col, ramp(1.0), (1.0 - clamp(amount, 0.0, 1.0)) * 0.55 * (1.0 - lightBg));
  vec3 lab = labMix(u_bg, col, clamp(amount, 0.0, 1.0));
  vec3 hot = vec3(min(1.0, paletteColor(0).x + 0.05), paletteColor(0).yz * 0.6);
  lab = labMix(lab, hot, 0.5 * exp(-r * r / (0.02 + 0.04 * u_blur)) * (1.0 - lightBg));
  lab.x *= vignette(p, 0.3 * (1.0 - lightBg));
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/swirl").then((module) => module.wgsl),
  label: "Swirl",
  name: "swirl",
};
