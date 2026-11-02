import type { GradientKindDefinition } from "../kind";
import { pick } from "../kind";

export const halo: GradientKindDefinition = {
  defaults: {
    background: "#030306",
    blur: 0.4,
    colors: ["#fff4ec", "#ffb36b", "#e2457a", "#3d4dff"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.16,
    interaction: { pointer: 0.15, scroll: 0.1 },
    loopSeconds: 16,
    scale: 1,
    seed: 3,
    speed: 0.6,
    warp: 0.55,
  },
  description:
    "A ring of light round a dark core, with a sharp inner rim and colour running round it.",
  fallbackLayers: (colors) => [
    `radial-gradient(circle at 50% 50%, transparent 24%, color-mix(in oklab, ${pick(colors, 0)} 85%, transparent) 25%, color-mix(in oklab, ${pick(colors, 1)} 60%, transparent) 30%, color-mix(in oklab, ${pick(colors, 2)} 30%, transparent) 37%, transparent 52%)`,
    `radial-gradient(circle at 50% 50%, transparent 30%, color-mix(in oklab, ${pick(colors, 3)} 22%, transparent) 40%, transparent 70%)`,
  ],
  glsl: `
// A thick torus of light: the inner edge is crisp, the body holds its
// brightness then rolls off into a wide haze. warp sets how lopsided the
// light is and how far the hue wanders round the ring; blur softens the
// rim and widens the haze.
float haloBody(float x, float soft, float width) {
  float edge = smoothstep(-soft, soft, x);
  float xo = max(x, 0.0) / width;
  float x4 = xo * xo * xo * xo;
  return edge / (1.0 + x4 * x4);
}

vec3 kindColor(vec2 p, vec2 uv) {
  float lightBg = smoothstep(0.55, 0.85, u_bg.x);
  vec2 h = frameHalf();
  // The seed picks a framing: centred, rising from the bottom edge, off to
  // one side, hanging in a top corner and cropped by the frame, or tilted
  // into an ellipse, as if seen at an angle, centred or low like a portal.
  float framing = floor(fract(u_seed.x * 0.0731 + 0.5) * 6.0);
  float side = sign(u_seed.y + 0.01);
  vec2 centre = vec2(0.0, 0.0);
  float radius = 0.19;
  float tilt = 0.0;
  float squash = 1.0;
  if (framing == 1.0) {
    centre = vec2(0.0, -0.56);
    radius = 0.3;
  } else if (framing == 2.0) {
    centre = vec2(0.34 * h.x * side, -0.02);
    radius = 0.2;
  } else if (framing == 3.0) {
    centre = vec2(-side * (h.x - 0.12), h.y - 0.1);
    radius = 0.3;
  } else if (framing == 4.0) {
    radius = 0.3;
    tilt = 0.22 * side;
    squash = 0.4;
  } else if (framing == 5.0) {
    centre = vec2(0.0, -0.3);
    radius = 0.44;
    tilt = 0.08 * side;
    squash = 0.28;
  }
  radius *= u_scale;

  // The hot side sways slowly round the ring.
  float swing = seedAngle() + 2.4 * u_loop.x;
  vec2 hotDir = vec2(sin(swing), cos(swing));

  vec2 d = rot2(tilt) * (p - centre);
  d.y /= squash;
  float r = length(d);
  vec2 dir = d / max(r, 1e-4);
  float x = r / radius - 1.0;

  float soft = 0.01 + 0.06 * u_blur;
  float width = 0.42 + 0.2 * u_blur;
  float hot = 0.5 + 0.5 * dot(dir, hotDir);
  float key = mix(1.0, 0.22 + 0.78 * hot * hot, 0.3 + 0.6 * u_warp);

  // Noise sampled on the unit circle (so it has no seam) drifts the hue
  // and, a little, the thickness round the ring.
  float around = flowNoise(dir * 0.8 + vec2(3.1, 0.0), 2.0);
  float body = haloBody(x, soft, width * (1.0 + 0.07 * u_warp * flowNoise(dir * 0.7, 1.0)));
  // A ghost exposure, nudged toward the hot side: a doubled, glassy rim.
  vec2 dg = d - hotDir * radius * 0.08;
  float xg = length(dg) / radius - 1.06;
  float ghost = smoothstep(-soft, soft, xg) * exp(-max(xg, 0.0) / (0.05 + 0.08 * u_blur));
  float haze = exp(-max(x, 0.0) / (0.6 + 0.8 * u_blur)) * smoothstep(0.0, width, x);
  // Faint tinted fog inside the core, so the dark has depth.
  float fog = (1.0 - smoothstep(-soft, soft, x)) * exp(x / 0.25);

  float glow = 0.95 * body * key + 0.3 * ghost * (0.3 + 0.7 * hot) + 0.12 * haze * (0.4 + 0.6 * key) + 0.12 * fog * (0.3 + 0.7 * hot);

  // Colour: the inner rim runs hot (colour 0), the body moves through the
  // palette outward, and the hue drifts round the ring.
  float depth = clamp(max(x, 0.0) / (width * 1.6), 0.0, 1.0);
  float t = clamp(0.12 + 0.45 * depth + 0.5 * u_warp * (0.5 + 0.5 * around) + 0.35 * (1.0 - hot), 0.0, 1.0);
  vec3 col = ramp(t);
  float rimLine = smoothstep(-soft, soft, x) * exp(-max(x, 0.0) / (0.06 + 0.1 * u_blur));
  col = labMix(col, paletteColor(0), rimLine * hot * 0.8);
  col = labMix(col, paletteColor(u_count - 1), fog * 0.6);

  vec3 lab = labMix(u_bg, col, clamp(glow, 0.0, 1.0));
  lab.x += 0.08 * max(glow - 0.85, 0.0) * (1.0 - lightBg);
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/halo").then((module) => module.wgsl),
  label: "Halo",
  name: "halo",
};
