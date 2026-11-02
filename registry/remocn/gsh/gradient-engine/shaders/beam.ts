import type { GradientKindDefinition } from "../kind";
import { pick } from "../kind";

export const beam: GradientKindDefinition = {
  defaults: {
    background: "#02030a",
    blur: 0.35,
    colors: ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.2,
    interaction: { pointer: 0.15, scroll: 0.1 },
    loopSeconds: 14,
    scale: 1,
    seed: 2,
    speed: 0.6,
    warp: 0.6,
  },
  description:
    "A cone of streaked light thrown from a source on the edge of the frame.",
  fallbackLayers: (colors) => [
    `radial-gradient(60% 90% at 50% 100%, color-mix(in oklab, ${pick(colors, 0)} 80%, transparent) 0%, color-mix(in oklab, ${pick(colors, 1)} 55%, transparent) 18%, color-mix(in oklab, ${pick(colors, 2)} 30%, transparent) 45%, transparent 75%)`,
    `conic-gradient(from 315deg at 50% 100%, transparent 0deg, color-mix(in oklab, ${pick(colors, 3)} 25%, transparent) 45deg, transparent 90deg)`,
  ],
  glsl: `
// Light from a point on or beyond the frame edge, spread into a cone of
// rays. The rays are noise sampled across the cone's angle, so they are
// fine across and long along the beam. scale widens the cone; warp sets
// ray contrast.

// One beam. Returns glow, the palette position, and how much of the light
// is the white-hot core and needle.
vec3 beamLight(vec2 p, vec2 source, float aim, float width, float reach, float layer, float omni) {
  vec2 axis = vec2(sin(aim), cos(aim));
  vec2 v = p - source;
  float dist = length(v);
  float along = dot(v, axis);
  float across = axis.x * v.y - axis.y * v.x;
  float ang = atan(across, max(along, 1e-3));
  float u = ang / width;
  float forward = smoothstep(-0.02, 0.06, along);
  float cone = exp(-u * u) * forward;

  // Rays: two scales of noise across the cone, stretched along it. A flare
  // rays out all round, so it samples on the unit circle instead, which
  // has no seam behind the source.
  vec2 dir = v / max(dist, 1e-4);
  vec2 coarseAt = omni > 0.5 ? dir * 3.2 + vec2(dist * 0.35, 0.0) : vec2(u * 2.2, dist * 0.35);
  vec2 fineAt = omni > 0.5 ? dir * 9.0 + vec2(13.0, dist * 0.9) : vec2(u * 6.0 + 13.0, dist * 0.9);
  float coarse = flowNoise(coarseAt, layer);
  float fine = flowNoise(fineAt, layer + 1.0);
  cone = mix(cone, 0.55 + 0.45 * exp(-u * u), omni);
  forward = mix(forward, 1.0, omni);
  float fineAmount = 0.55 * (1.0 - 0.6 * u_blur);
  float rays = 0.5 + 0.5 * (coarse + fineAmount * fine) / (1.0 + fineAmount);
  rays = mix(1.0, smoothstep(0.1, 0.95, rays) * 1.5, u_warp);

  float fall = exp(-dist / reach);
  float core = exp(-dist / (0.05 + 0.05 * u_blur));
  // A hairline down the axis, the brightest ray.
  float needle = exp(-pow(across / (0.0035 + 0.01 * u_blur), 2.0)) * exp(-dist / (0.6 * reach)) * smoothstep(0.0, 0.03, along) * u_warp * (1.0 - 0.5 * omni);
  float haze = exp(-dist / (0.4 + 0.5 * u_blur));
  // A broad, soft fill under the rays gives the beam volume.
  float fill = mix(exp(-u * u * 0.35), 1.0, omni) * forward * fall;

  float glow = cone * fall * (0.2 + 0.8 * rays) + 0.22 * fill + 0.85 * core + 0.55 * needle + 0.08 * haze;
  // Near the source the light is colour 0; colour takes over along the
  // beam and at the cone's edges.
  float t = clamp(dist / (reach * 1.4) + 0.35 * abs(u) * (1.0 - omni) - 0.25 * core, 0.0, 1.0);
  return vec3(glow, t, clamp(core + needle, 0.0, 1.0));
}

vec3 kindColor(vec2 p, vec2 uv) {
  float lightBg = smoothstep(0.55, 0.85, u_bg.x);
  vec2 h = frameHalf();
  // The seed picks the source: bottom centre, a bottom corner, the top
  // edge, a top corner, a side edge, two crossing beams from the bottom
  // corners, a source far below or above the frame, so only its rays
  // reach in, or a flare inside the frame raying out all round.
  float framing = floor(fract(u_seed.x * 0.0731 + 0.5) * 9.0);
  float side = sign(u_seed.y + 0.01);
  vec2 source = vec2(0.0, -h.y - 0.02);
  float aim = 0.0;
  float width = 0.3 * u_scale;
  float reach = 0.55 + 0.6 * u_scale;
  if (framing == 1.0) {
    source = vec2(-side * (h.x - 0.06), -h.y - 0.02);
    aim = side * 0.62;
  } else if (framing == 2.0) {
    source = vec2(0.0, h.y + 0.02);
    aim = 3.14159265;
  } else if (framing == 3.0) {
    source = vec2(-side * (h.x - 0.1), h.y + 0.02);
    aim = 3.14159265 - side * 0.5;
  } else if (framing == 4.0) {
    source = vec2(-side * (h.x + 0.02), -0.12);
    aim = side * 1.32;
  } else if (framing == 5.0) {
    source = vec2(-(h.x - 0.12), -h.y - 0.02);
    aim = 0.42;
    width *= 0.7;
  } else if (framing == 6.0) {
    source = vec2(0.3 * h.x * side, -h.y - 1.0);
    aim = -side * 0.12;
    width *= 0.45;
    reach *= 2.4;
  } else if (framing == 7.0) {
    source = vec2(0.3 * h.x * side, h.y + 1.0);
    aim = 3.14159265 + side * 0.15;
    width *= 0.45;
    reach *= 2.4;
  } else if (framing == 8.0) {
    source = vec2(0.22 * h.x * side, 0.04);
    aim = seedAngle();
    width = 0.6 * u_scale;
    reach = 0.3 + 0.3 * u_scale;
  }
  // The cone sways a little through the loop.
  float sway = 0.22 * u_loop.y;
  vec3 light = beamLight(p, source, aim + sway, width, reach, 1.0, framing == 8.0 ? 1.0 : 0.0);
  if (framing == 5.0) {
    // The second beam mirrors the first and sways the other way.
    vec3 twin = beamLight(p, vec2(-source.x, source.y), -aim - sway, width, reach, 4.0, 0.0);
    float total = max(light.x + twin.x, 1e-4);
    light = vec3(light.x + twin.x, (light.x * light.y + twin.x * twin.y) / total, max(light.z, twin.z));
  }
  float glow = light.x;

  vec3 col = ramp(light.y);
  col = labMix(col, paletteColor(0), light.z);
  vec3 lab = labMix(u_bg, col, clamp(glow, 0.0, 1.0));
  lab.x += 0.08 * max(glow - 0.9, 0.0) * (1.0 - lightBg);
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/beam").then((module) => module.wgsl),
  label: "Beam",
  name: "beam",
};
