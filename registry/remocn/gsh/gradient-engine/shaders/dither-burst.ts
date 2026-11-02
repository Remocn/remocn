import type { GradientKindDefinition } from "../kind";
import { stops } from "../kind";

/**
 * One soft light drawn through ordered dither. The light is a single
 * structure (rays bursting from an edge, a horizon glowing up out of the
 * dark, a diagonal beam, or a bloom from a corner), and it is quantised per
 * sRGB channel in square cells, so ramps keep every hue in between and
 * mid-tones fizz with neighbouring colours. That is the difference from
 * dither-field and the Pro dither-gradient, which pick whole palette stops.
 *
 * The seed picks the structure, the side the light comes from, and the
 * threshold matrix (Bayer 8x8 or interleaved gradient noise, which reads
 * like blue noise). Colours run from the light's outer edge (first) to its
 * core (last); the background is the dark (or paper) it falls into.
 *
 * The dither is the kind's own look, always on: 3px cells and 12 steps per
 * channel. Switch the engine's dither on and it replaces this one, with its
 * own cell and levels, on the same soft light. `scale` sizes the light,
 * `warp` sets ray and edge contrast, `blur` its softness.
 *
 * Helpers are prefixed `db` and only depend on the prelude.
 */
export const ditherBurst: GradientKindDefinition = {
  defaults: {
    background: "#030305",
    blur: 0.5,
    colors: ["#1b2cc1", "#3d7bff", "#bcd3ff", "#f6f4ef"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0,
    interaction: { pointer: 0.15, scroll: 0 },
    loopSeconds: 18,
    scale: 1,
    seed: 2,
    speed: 0.5,
    warp: 0.55,
  },
  description:
    "A soft burst of light resolved into crisp dither cells, every hue kept.",
  // The light rising from below, core colour at the bottom edge.
  fallbackLayers: (colors) => [
    `radial-gradient(90% 80% at 50% 108%, ${stops([...colors].reverse(), 6, 62)}, transparent 76%)`,
  ],
  glsl: `
float dbBayer2(vec2 a) {
  a = floor(a);
  return fract(dot(a, vec2(0.5, a.y * 0.75)));
}

float dbBayer8(vec2 a) {
  return dbBayer2(0.25 * a) * 0.0625 + dbBayer2(0.5 * a) * 0.25 + dbBayer2(a);
}

// Interleaved gradient noise (Jimenez 2014): ordered, but with no visible
// period, so it reads like blue noise.
float dbIgn(vec2 a) {
  return fract(52.9829189 * fract(dot(floor(a), vec2(0.06711056, 0.00583715))));
}

vec3 dbLabToSrgb(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  vec3 lin = vec3(
    4.0767416621 * l * l * l - 3.3077115913 * m * m * m + 0.2309699292 * s * s * s,
    -1.2684380046 * l * l * l + 2.6097574011 * m * m * m - 0.3413193965 * s * s * s,
    -0.0041960863 * l * l * l - 0.7034186147 * m * m * m + 1.7076147010 * s * s * s
  );
  lin = clamp(lin, 0.0, 1.0);
  return mix(1.055 * pow(lin, vec3(1.0 / 2.4)) - 0.055, lin * 12.92, vec3(lessThanEqual(lin, vec3(0.0031308))));
}

vec3 dbSrgbToLab(vec3 c) {
  vec3 lin = mix(pow((c + 0.055) / 1.055, vec3(2.4)), c / 12.92, vec3(lessThanEqual(c, vec3(0.04045))));
  float l = 0.4122214708 * lin.r + 0.5363325363 * lin.g + 0.0514459929 * lin.b;
  float m = 0.2119034982 * lin.r + 0.6806995451 * lin.g + 0.1073969566 * lin.b;
  float s = 0.0883024619 * lin.r + 0.2817188376 * lin.g + 0.6299787005 * lin.b;
  vec3 lms = pow(max(vec3(l, m, s), 0.0), vec3(1.0 / 3.0));
  return vec3(
    0.2104542553 * lms.x + 0.7936177850 * lms.y - 0.0040720468 * lms.z,
    1.9779984951 * lms.x - 2.4285922050 * lms.y + 0.4505937099 * lms.z,
    0.0259040371 * lms.x + 0.7827717662 * lms.y - 0.8086757660 * lms.z
  );
}

// How far the palette strays from the background. A flat palette has
// nothing to dither between, so it renders flat.
float dbSpread() {
  float d = 0.0;
  for (int i = 0; i < 6; i++) {
    if (i >= u_count) break;
    d = max(d, length(u_colors[i] - u_bg));
  }
  return smoothstep(0.0, 0.04, d);
}

// The light's intensity at q: 0 is the background, 1 the core.
float dbLight(vec2 q, vec2 h, float mode, float side) {
  float s = 1.0 / u_scale;
  float soft = 0.6 + 0.8 * u_blur;
  if (mode < 1.0) {
    // Burst: broad, blurred rays from a point just past one edge.
    float a = 1.5708 + (side - 0.5) * 2.4;
    vec2 src = vec2(cos(a), -abs(sin(a))) * h * vec2(1.0, 1.4) + 0.3 * drift(1.0);
    vec2 d = q - src;
    float r = length(d);
    vec2 dir = d / max(r, 1e-4);
    // Rays are noise on the unit circle, low in angle so they stay broad;
    // they fade in away from the source so it never reads as a star.
    float rays = 0.5 + 0.5 * flowNoise(dir * (1.6 + 1.4 * u_warp), 2.0);
    rays = mix(rays, 0.5 + 0.5 * flowNoise(dir * 4.0 + 7.0, 3.0), 0.3);
    float ray = mix(1.0, 0.25 + 1.2 * rays * rays, (0.35 + 0.55 * u_warp) * smoothstep(0.05, 0.7, r));
    float body = exp(-r / (0.62 * s * soft));
    return 1.15 * body * ray + 0.3 * exp(-r / (0.2 * s * soft));
  }
  if (mode < 2.0) {
    // Horizon: a huge disc rising from below, glowing into the dark.
    float tilt = (side - 0.5) * 0.5;
    vec2 t = rot2(tilt) * q;
    float radius = 1.7 * s;
    float lift = (0.12 + 0.18 * u_scale) * h.y + 0.1 * flowNoise(vec2(0.4, 0.9), 1.0);
    vec2 centre = vec2(0.45 * drift(2.0).x, -h.y - radius + lift);
    float x = length(t - centre) - radius;
    // The edge undulates, and with warp it drips into vertical streaks.
    x += 0.035 * u_warp * flowNoise(vec2(t.x * 2.2, 0.3), 3.0);
    x += 0.06 * u_warp * u_warp * flowNoise(vec2(t.x * 9.0, t.y * 0.6), 4.0) * (1.0 - smoothstep(-0.05, 0.25, x));
    float above = exp(-max(x, 0.0) / (0.14 * soft));
    float below = mix(1.0, 0.72, (1.0 - smoothstep(-0.6, 0.0, x)));
    return x > 0.0 ? 0.92 * above : 0.92 + 0.3 * below * (1.0 - smoothstep(-0.08, 0.0, x));
  }
  if (mode < 3.0) {
    // Beam: a long diagonal band, a thin hot core in a wide soft halo.
    float a = 0.45 + (side - 0.5) * 1.1;
    vec2 dir = vec2(cos(a), sin(a));
    vec2 n = vec2(-dir.y, dir.x);
    float u = dot(q, dir);
    float v = dot(q, n) + 0.08 * h.y + 0.14 * u_loop.y + 0.07 * u_warp * flowNoise(vec2(u * 0.9, 0.5), 2.0) - 0.12 * u * u;
    float w = 0.05 * s * soft;
    float core = exp(-v * v / (w * w));
    float halo = exp(-abs(v) / (4.0 * w));
    float along = smoothstep(-1.4 * h.x, 0.3 * h.x, u) * (0.85 + 0.15 * flowNoise(vec2(u * 1.2, 1.7), 3.0));
    return (0.75 * core + 0.6 * halo) * along;
  }
  // Bloom: light leaning in from a lower corner, with a hard-ish shoulder
  // where it meets the dark, bent by the flow.
  vec2 corner = vec2(side < 0.5 ? -1.0 : 1.0, -1.0) * h;
  vec2 c = corner * 0.92 + 0.3 * drift(3.0);
  vec2 w = q + 0.1 * u_warp * vec2(flowNoise(q * 1.1, 4.0), flowNoise(q * 1.1 + 3.3, 5.0));
  vec2 d = rot2((side - 0.5) * 1.4) * (w - c);
  float r = length(d * vec2(0.75, 1.0));
  // The light spills out of the lobe in a long, uneven tail.
  float tail = exp(-r / (0.55 * s * soft)) * (0.7 + 0.3 * flowNoise(d * 1.6 + 2.0, 7.0));
  float edge = 1.0 - smoothstep((1.0 - 0.6 * soft) * s, s, r);
  return 0.95 * edge * exp(-r / (1.1 * s * soft)) + 0.45 * tail;
}

vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  // The built-in dither; the engine's, when on, replaces it.
  bool own = u_dither.x < 0.5;
  float cell = own ? 3.0 : 1.0;
  vec2 px = uv * u_full;
  vec2 id = floor(px / cell);
  vec2 centre = (id + 0.5) * cell;
  vec2 q = (centre - 0.5 * u_full) / min(u_full.x, u_full.y);
  q.y = -q.y;
  q = interact(q);

  float pick8 = floor(fract(u_seed.x * 0.0731 + 0.5) * 8.0);
  float mode = mod(pick8, 4.0);
  float side = fract(u_seed.y * 0.0917 + 0.5);

  float light = dbLight(q, h, mode, side);
  float t = clamp(pow(max(light, 0.0), 1.25), 0.0, 1.0);
  vec3 lab = labMix(u_bg, ramp(t), smoothstep(0.0, 0.4, t));
  // Past the core the light bleaches toward the palette's brightest.
  vec3 hot = paletteColor(u_count - 1);
  lab = labMix(lab, vec3(min(hot.x + 0.04, 1.0), hot.yz * 0.7), clamp((light - 1.0) * 1.5, 0.0, 1.0));
  float lightBg = smoothstep(0.55, 0.85, u_bg.x);
  lab.x *= vignette(q, 0.25 * (1.0 - lightBg));
  lab = filmGrade(lab);
  if (!own) return lab;

  // Ordered dither per sRGB channel, one threshold per cell.
  float spread = dbSpread();
  float threshold = pick8 < 4.0 ? dbBayer8(id) : dbIgn(id);
  float steps = 11.0;
  vec3 rgb = dbLabToSrgb(lab);
  vec3 dithered = floor(rgb * steps + threshold) / steps;
  rgb = mix(rgb, dithered, spread);
  // The cells read as a display: a faint seam on two edges.
  vec2 local = px - id * cell;
  if (local.x >= cell - 1.0 || local.y >= cell - 1.0) {
    rgb *= 1.0 - 0.1 * spread;
  }
  return dbSrgbToLab(clamp(rgb, 0.0, 1.0));
}
`,
  wgsl: () => import("./wgsl/dither-burst").then((module) => module.wgsl),
  label: "Dither burst",
  name: "dither-burst",
};
