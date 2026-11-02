import type { GradientKindDefinition } from "../kind";
import { pick } from "../kind";

export const limb: GradientKindDefinition = {
  defaults: {
    background: "#030308",
    blur: 0.35,
    colors: ["#e9ecff", "#8a8bff", "#4b2bd6", "#160c3a"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.16,
    interaction: { pointer: 0.15, scroll: 0.1 },
    loopSeconds: 20,
    scale: 1,
    seed: 1,
    speed: 0.5,
    warp: 0.5,
  },
  description:
    "The lit edge of a planet or moon against the dark: a thin bright crest over a soft atmosphere.",
  fallbackLayers: (colors) => [
    `radial-gradient(120% 120% at 50% 130%, transparent 58%, color-mix(in oklab, ${pick(colors, 3)} 50%, transparent) 61%, color-mix(in oklab, ${pick(colors, 2)} 70%, transparent) 64%, color-mix(in oklab, ${pick(colors, 1)} 75%, transparent) 66%, color-mix(in oklab, ${pick(colors, 0)} 80%, transparent) 67%, transparent 70%)`,
  ],
  glsl: `
// A planet much larger than the frame, or a moon inside it, lit from one
// side. The light is three layers: a thin crest at the edge, a saturated
// band just inside it, and atmosphere glowing just outside. warp sets how
// far the light wraps round; blur softens every layer.
vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  // The seed picks the body: a planet whose top arc crosses the frame, a
  // horizon tilted across the frame, a moon lit from the side, a planet
  // hanging from the top edge, a planet filling one side, a planet crossing
  // the frame on a diagonal, or a small moon lit from behind, ringed in light.
  float framing = floor(fract(u_seed.x * 0.0731 + 0.5) * 7.0);
  float side = sign(u_seed.y + 0.01);
  float tilt = sin(seedAngle());
  float radius = 0.95;
  vec2 centre = vec2(0.0, -1.02 + (1.0 - u_scale) * 0.3);
  // Arcs are lit from a little off overhead, so one end of the arc fades.
  float lightAngle = 0.5 * tilt;
  float backlit = 0.0;
  if (framing == 1.0) {
    radius = 2.6;
    centre = vec2(0.9 * side, -2.62);
    lightAngle = side * 0.35 + 0.2 * tilt;
  } else if (framing == 2.0) {
    radius = 0.3;
    centre = vec2(0.18 * h.x * side, 0.0);
    lightAngle = side * 1.9 + 0.2 * tilt;
  } else if (framing == 3.0) {
    radius = 1.1;
    centre = vec2(0.2 * side, 1.38);
    lightAngle = 3.14159265 + 0.4 * tilt;
  } else if (framing == 4.0) {
    radius = 1.3;
    centre = vec2(-side * (h.x + 0.98), -0.15);
    lightAngle = side * (1.45 + 0.2 * tilt);
  } else if (framing == 5.0) {
    radius = 1.25;
    centre = vec2(-side * (h.x + 0.5), -h.y - 0.62);
    lightAngle = side * 0.78;
  } else if (framing == 6.0) {
    radius = 0.2;
    centre = vec2(0.0, 0.02);
    lightAngle = 0.4 * tilt;
    backlit = 1.0;
  }
  radius *= u_scale;
  lightAngle += 0.9 * u_loop.y;
  vec2 light = vec2(sin(lightAngle), cos(lightAngle));

  vec2 d = p - centre;
  float r = length(d);
  vec2 dir = d / max(r, 1e-4);
  float x = r - radius;

  // How squarely each point of the rim faces the light. warp lets the
  // light wrap further round the body.
  float facing = dot(dir, light);
  float lit = smoothstep(-0.15 - 0.6 * u_warp, 0.95, facing);
  lit *= lit;
  // A body lit from behind glows all the way round.
  lit = mix(lit, 0.45 + 0.55 * lit, backlit);

  // The atmosphere breathes and drifts along the arc.
  float shimmer = 0.7 + 0.3 * flowNoise(dir * 2.4 + vec2(x * 3.0, 0.0), 1.0);
  // A small backlit moon shows its whole rim, so keep its outline round.
  shimmer = mix(shimmer, 1.0, 0.7 * backlit);

  float b = 0.6 + 0.8 * u_blur;
  float inside = 1.0 - smoothstep(-0.006 * b, 0.004 * b, x);
  // Outside the edge: a pale atmosphere band that holds, then fades.
  // The atmosphere breathes with the loop phase: the same depth at any
  // speed above 0.5, fading out toward a still frame at speed 0, and never
  // thinner than 0.5x, so the falloff below never divides by zero.
  float loopR = length(u_loop);
  float breath = loopR > 1e-4 ? (u_loop.x / loopR) * min(loopR / 0.3, 1.0) : 0.0;
  float atmosW = 0.07 * b * (0.7 + 0.6 * u_warp) * (1.0 + 0.5 * breath);
  float xa = max(x, 0.0) / atmosW;
  float atmos = smoothstep(-0.02 * b, 0.0, x) / (1.0 + xa * xa * xa * xa);
  // The edge itself, in the saturated colour, then the body falling away.
  float edgeBand = exp(-pow(x / (0.03 * b), 2.0));
  float band = inside * exp(x / (0.09 * b));
  float deep = inside * exp(x / (0.35 * b));
  float halo = exp(-max(x, 0.0) / (0.18 * b));

  float glow = (0.6 * atmos * shimmer + 0.8 * edgeBand + 0.6 * band + 0.25 * deep + 0.12 * halo) * lit;

  // The atmosphere in colour 0, the edge in 1, the body through 2 to the last.
  vec3 col = labMix(paletteColor(2), paletteColor(u_count - 1), clamp(1.0 - band, 0.0, 1.0));
  col = labMix(col, paletteColor(1), clamp(edgeBand * 1.1 + 0.5 * band, 0.0, 1.0));
  col = labMix(col, paletteColor(0), clamp(0.8 * atmos * (0.75 + 0.25 * shimmer) * smoothstep(-0.004, 0.025 * b, x), 0.0, 1.0));

  vec3 lab = labMix(u_bg, col, clamp(glow, 0.0, 1.0));
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/limb").then((module) => module.wgsl),
  label: "Limb",
  name: "limb",
};
