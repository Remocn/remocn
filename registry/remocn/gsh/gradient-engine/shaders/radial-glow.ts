import type { GradientKindDefinition } from "../kind";
import { pick } from "../kind";

function haze(colors: readonly string[]): string {
  const last = Math.max(1, colors.length - 1);
  return colors
    .map(
      (color, i) =>
        `color-mix(in oklab, ${color} ${Math.round(45 - (30 * i) / last)}%, transparent) ${(29 + (40 * i) / last).toFixed(1)}%`,
    )
    .join(", ");
}

export const radialGlow: GradientKindDefinition = {
  defaults: {
    background: "#020204",
    blur: 0.45,
    colors: ["#f3f1ff", "#9db4ff", "#5a46cb", "#1d1240"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.14,
    interaction: { pointer: 0.2, scroll: 0.1 },
    loopSeconds: 14,
    scale: 1,
    seed: 11,
    speed: 0.6,
    warp: 0.5,
  },
  description:
    "An eclipse: light spilling round a dark disc, with a corona and god rays.",
  fallbackLayers: (colors) => [
    `radial-gradient(42% 58% at 50% 82%, transparent 54%, color-mix(in oklab, ${pick(colors, 0)} 80%, transparent) 58%, color-mix(in oklab, ${pick(colors, 1)} 45%, transparent) 64%, transparent 82%)`,
    // Haze outside the ring only, so the disc keeps the background colour.
    `radial-gradient(84% 116% at 50% 82%, transparent 27%, ${haze(colors)}, transparent 85%)`,
  ],
  glsl: `
vec3 kindColor(vec2 p, vec2 uv) {
  // Light-mode backgrounds get a glowing halo instead of a dark disc.
  float lightBg = smoothstep(0.55, 0.85, u_bg.x);
  // The seed picks a layout: a disc rising from the bottom edge, a full ring
  // in the frame, or the rim of a planet low and off to one side.
  vec2 h = frameHalf();
  float framing = fract(u_seed.x * 0.0731 + 0.5);
  float radius = 0.34;
  vec2 centre = vec2(0.0, -0.3);
  float spread = 0.28;
  if (framing > 0.7) {
    radius = 0.75;
    centre = vec2(0.35 * h.x * sign(u_seed.y), -0.95);
    spread = 0.1;
  } else if (framing > 0.4) {
    radius = 0.26;
    centre = vec2(0.0, -0.04);
    spread = 0.6;
  }
  radius /= u_scale;
  centre.y -= 0.04 * flowNoise(vec2(0.3, 0.7), 1.0);
  vec2 d = p - centre;
  float r = length(d);
  vec2 dir = d / max(r, 1e-4);
  float x = r - radius;
  float xo = max(x, 0.0);
  float soft = (0.01 + 0.045 * u_blur) * (1.0 + 5.0 * lightBg);

  // The source sits behind the disc, so the top of the rim is lit hardest.
  // The source drifts round behind the disc, so the hot side wanders.
  float sweep = 1.3 * u_loop.x;
  vec2 up = vec2(sin(sweep), cos(sweep));
  float facing = 0.5 + 0.5 * dot(dir, up) * smoothstep(0.0, radius, r);
  float key = mix(spread, 1.0, facing * facing);

  // God rays: noise sampled on the unit circle, so they radiate with no seam,
  // fine in angle and drifting slowly outward in radius.
  float rays = 0.5 + 0.5 * flowNoise(dir * 2.6 - vec2(0.0, r * 0.35), 2.0);
  rays = mix(rays, 0.5 + 0.5 * flowNoise(dir * 6.0 - vec2(r * 0.5, 0.0), 3.0), 0.35);
  rays = mix(1.0, 0.25 + 1.3 * rays * rays, u_warp);

  float rim = exp(-xo / soft);
  float corona = exp(-xo / (0.05 + 0.1 * u_blur));
  float haze = exp(-xo / (0.3 + 0.3 * u_blur));
  // A thin halo ring just outside the rim, in the palette's middle colour.
  float ringD = (x - 0.05 - 0.04 * u_blur) / ((0.018 + 0.03 * u_blur) * (1.0 + 2.0 * lightBg));
  float ring = exp(-ringD * ringD);
  float glow = (rim + 0.5 * corona * (0.6 + 0.4 * rays) + (0.4 + 0.35 * lightBg) * haze * mix(1.0, rays, 0.8) + 0.35 * ring) * key;

  // Inside: the occluder, with a hairline of light just inside its edge.
  float inside = 1.0 - smoothstep(-soft * 0.5, soft * 0.5, x);
  float innerRim = exp(min(x, 0.0) / (0.01 + 0.12 * lightBg));
  glow = mix(glow, (0.3 * innerRim + 0.06) * key, inside * (1.0 - 0.85 * lightBg));

  // Palette runs outward from the rim; the hottest light bleaches toward white.
  // A dark disc hides the rim, so colour can rise sharply there; a light
  // glow has no disc edge to hide behind, so it eases in.
  float reach = clamp(xo / (0.6 + 0.3 * u_blur), 0.0, 1.0);
  float t = mix(sqrt(reach), smoothstep(0.0, 0.7, reach), lightBg);
  vec3 col = ramp(t);
  vec3 hot = vec3(min(1.0, paletteColor(0).x + 0.06), paletteColor(0).yz * 0.4);
  col = labMix(col, hot, rim * (1.0 - inside) * (0.45 + 0.5 * lightBg));
  col = labMix(col, paletteColor(2), ring * (0.6 - 0.35 * lightBg) * (1.0 - rim));

  vec3 base = u_bg;
  base.x *= mix(1.0, mix(0.35, 1.0, lightBg), inside);
  vec3 lab = labMix(base, col, clamp(glow, 0.0, 1.0));
  lab.x += 0.1 * max(glow - 0.9, 0.0);
  lab.x *= vignette(p, 0.3 * (1.0 - lightBg));
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/radial-glow").then((module) => module.wgsl),
  label: "Radial glow",
  name: "radial-glow",
};
