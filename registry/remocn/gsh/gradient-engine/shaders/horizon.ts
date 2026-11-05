import type { GradientKindDefinition } from "../kind";
import { pick } from "../kind";

/**
 * A black-hole horizon: a void with a curved lower edge, faint ripple rings
 * just inside it, and layered, lensed light streaks converging on a vanishing
 * point below the frame, finished with star flares and a vignette.
 *
 * Palette roles: 0 core streak, 1 secondary streak, 2 rim (cool edge),
 * 3 deep shadow, 4 highlight. Shorter palettes reuse the last colour.
 *
 * Horizon is a scene kind: its colours drive the palette, but the scene adds
 * its own lighting (void, haze, rings, highlights, vignette), so a flat
 * palette does not render as that flat colour. It is exempt from the ΔE 0.02
 * flat-colour fidelity check the other kinds meet.
 *
 * Helpers are prefixed `hz` and self-contained so the kind only depends on
 * the prelude's uniforms.
 */
export const horizon: GradientKindDefinition = {
  defaults: {
    background: "#000000",
    blur: 0.35,
    colors: ["#b4553a", "#c98f8a", "#6f8fb0", "#3a1f33", "#dfe8ff"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.12,
    interaction: { pointer: 0.15, scroll: 0.2 },
    loopSeconds: 24,
    scale: 1,
    seed: 7,
    speed: 0.6,
    warp: 0.5,
  },
  description:
    "An event horizon over a void, with lensed light streaks and star flares.",
  // Static horizon for CSS: a curved void edge with a thin cool rim, flat
  // streak ellipses in the band, a soft well at the bottom and a plum base.
  fallbackLayers: (colors, background) => {
    const mix = (i: number, amount: number) =>
      `color-mix(in oklab, ${pick(colors, i)} ${amount}%, transparent)`;
    return [
      `radial-gradient(1000px 79% at 46% 0%, ${background} 95%, transparent 100%)`,
      `radial-gradient(1030px 82% at 46% 0%, transparent 93%, ${mix(2, 45)} 96.5%, transparent 100%)`,
      `radial-gradient(14% 6% at 47% 98%, ${background} 0%, transparent 100%)`,
      `radial-gradient(20% 3% at 40% 90%, ${mix(4, 45)} 0%, transparent 100%)`,
      `radial-gradient(42% 8% at 16% 76%, ${mix(0, 75)} 0%, transparent 100%)`,
      `radial-gradient(38% 6% at 20% 86%, ${mix(1, 50)} 0%, transparent 100%)`,
      `radial-gradient(34% 12% at 86% 66%, ${mix(1, 70)} 0%, transparent 100%)`,
      `radial-gradient(30% 7% at 80% 84%, ${mix(0, 65)} 0%, transparent 100%)`,
      `linear-gradient(180deg, transparent 55%, ${mix(3, 70)} 100%)`,
    ];
  },
  glsl: `
vec3 hzCol(int i) { return u_colors[min(i, u_count - 1)]; }

// Sin-free lattice hash (Dave Hoskins), -1..1.
vec2 hzHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

// 2D gradient noise, roughly -0.7..0.7.
float hzNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hzHash(i), f);
  float b = dot(hzHash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hzHash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hzHash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Gradient noise with its analytic derivative: (value, d/dx, d/dy).
vec3 hzNoiseD(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 ga = hzHash(i);
  vec2 gb = hzHash(i + vec2(1.0, 0.0));
  vec2 gc = hzHash(i + vec2(0.0, 1.0));
  vec2 gd = hzHash(i + vec2(1.0, 1.0));
  float va = dot(ga, f);
  float vb = dot(gb, f - vec2(1.0, 0.0));
  float vc = dot(gc, f - vec2(0.0, 1.0));
  float vd = dot(gd, f - vec2(1.0, 1.0));
  float k = va - vb - vc + vd;
  float v = va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k;
  vec2 d = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd)
    + du * (u.yx * k + vec2(vb, vc) - va);
  return vec3(v, d);
}

// The loop point rotated by a per-layer angle: still periodic, out of phase.
vec2 hzLoop(float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * u_loop.x - s * u_loop.y, s * u_loop.x + c * u_loop.y);
}

// Sheet coordinates: stretched, drifting on the loop circle, seeded.
vec2 hzSheet(vec2 sp, vec2 freq, float layer) {
  return sp * freq + hzLoop(layer * 2.1) * vec2(0.9, 0.5) + u_seed * 0.37 + layer * 13.7;
}

// Height of the horizon at x, measured against grainient's hero: a wide well
// just right of centre, a gentle shelf on the left and a late climb on the
// right. Portrait frames sit the horizon lower.
float hzRim(float x, float portrait, float breathe) {
  float well = exp(-(x - 0.08) * (x - 0.08) * 4.5);
  float r = max(x - 0.4, 0.0);
  float shelf = -0.145 - 0.035 * (1.0 - smoothstep(-0.6, 0.0, x));
  return shelf - (0.19 + breathe) * well * (1.0 - 0.75 * portrait) + 0.65 * r * r - 0.11 * portrait;
}

// The void: black, with a cool haze bleeding up from the horizon and faint
// ripple rings inside it.
vec3 hzVoid(float inside, float sideGlow) {
  float haze = (exp(-inside * 30.0) * 0.2 + exp(-inside * 10.0) * 0.06) * sideGlow;
  float rings = sin(inside * 210.0 - 0.8 * hzLoop(2.5).y) * exp(-inside * 6.0);
  return vec3(haze * (1.0 + 0.22 * rings) + 0.005 * rings, hzCol(2).yz * haze * 0.55);
}

// Star flares: x in half-widths, y in half-heights, size.
const vec3 HZ_STARS[5] = vec3[5](
  vec3(-0.29, -0.71, 1.2),
  vec3(0.31, -0.88, 1.0),
  vec3(0.79, -0.8, 0.7),
  vec3(-0.53, -0.55, 0.5),
  vec3(0.15, -0.94, 0.45)
);

vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  float portrait = clamp((h.y / h.x - 0.65) / 1.2, 0.0, 1.0);
  float tilt = (fract(u_seed.x * 0.0193) - 0.5) * 0.1;
  float x = p.x - tilt;

  float breathe = 0.01 * hzLoop(0.7).x;
  float rimY = hzRim(x, portrait, breathe);
  float slope = (hzRim(x + 0.01, portrait, breathe) - rimY) * 100.0;
  float out_ = (rimY - p.y) / sqrt(1.0 + slope * slope); // > 0 in the light
  float sideGlow = 0.55 + 0.7 * smoothstep(0.15, 0.85, abs(p.x) / h.x);

  vec2 vq = (uv - 0.5) * vec2(1.0, 1.1);
  float vignette = 1.0 - 0.6 * dot(vq, vq);
  // Most of the frame is void: skip the light entirely there.
  if (out_ < -0.012) {
    vec3 lab = hzVoid(-out_, sideGlow);
    lab.x *= vignette;
    return lab + u_bg;
  }

  // The well: a dark funnel at the bottom centre.
  vec2 vp = vec2(-0.03 + tilt * 0.5, -0.91 * h.y);
  vec2 hq = (p - vp) / vec2(0.19, 0.068);
  float hd = length(hq);
  float landscape = 1.0 - portrait;

  // Deeper bands flatten toward the horizontal, like a ground plane.
  float rimMin = -0.32 - 0.11 * portrait;
  float yRef = mix(rimY, rimMin + (rimY - rimMin) * 0.3, smoothstep(0.0, 0.3, out_));
  float depth = max(yRef - p.y, 0.0);
  // Perspective: bands crowd toward the horizon and widen toward the viewer.
  float across = log(1.0 + depth * 7.0) * 0.32;
  float along = p.x;
  across += 0.035 * u_warp * sin(along * 3.1 + across * 9.0 + hzLoop(4.0).x * 2.0);

  // Near the well the bands dip and dive into it, like light bent by a
  // black hole.
  float wrap = (1.0 - smoothstep(0.9, 2.6, hd)) * landscape;
  across = max(across - 0.09 * wrap * smoothstep(0.0, 0.15, across), 0.0);
  along = mix(along, along * (1.0 + 0.8 * wrap), wrap);

  float sc = u_scale;
  vec2 f0 = vec2(1.0, 6.0) * sc;
  vec2 f1 = vec2(1.7, 14.0) * sc;
  float s0 = hzNoise(hzSheet(vec2(along, across), f0, 0.0));
  vec3 n1 = hzNoiseD(hzSheet(vec2(along + s0 * 0.45, across + s0 * 0.012), f1, 1.0));
  float s1 = n1.x;
  // Turbulence: slanted wisps that cross the bands and fray them, strongest
  // where the streaks climb on the right.
  float rise = smoothstep(0.1, 0.75, p.x / h.x);
  vec2 q2 = vec2(along, across + along * (0.08 + 0.3 * rise));
  float s2 = hzNoise(hzSheet(q2, vec2(2.0, 15.0) * sc, 2.0));

  float env = smoothstep(-0.012, 0.05, out_) * (0.75 + 0.25 * exp(-out_ * 3.0));
  // The well fades from the surrounding light into black over a wide falloff.
  float hole = mix(pow(1.0 - exp(-hd * hd * 0.38), 1.6), 1.0, portrait);
  float nearWell = (1.0 - smoothstep(1.0, 2.6, hd)) * landscape;
  // The band is quieter and darker just under the hero copy.
  float quiet = exp(-p.x * p.x * 9.0) * (1.0 - smoothstep(0.04, 0.16, out_)) * landscape;
  // The hottest light arches over the well and runs down its flanks.
  float flank = smoothstep(-0.7, 0.1, hq.y / max(hd, 1e-3));
  float ring = exp(-max(hd - 1.7, 0.0) * 1.3) * smoothstep(0.9, 2.0, hd) * flank * landscape;
  float side = 0.8 + 0.45 * smoothstep(0.1, 0.8, abs(p.x) / h.x);
  // The bottom corners fall away to teal-black.
  float corner = (1.0 - smoothstep(-h.y, -0.55 * h.y, p.y)) * smoothstep(0.35, 0.9, abs(p.x) / h.x) * landscape;
  side *= 1.0 - 0.55 * corner;

  float glow = clamp(0.5 + 0.9 * s0, 0.0, 1.0);
  float fray = (0.16 + 0.12 * rise) * (1.0 - 0.8 * portrait);
  float v = mix(s1 + 0.4 * s0 + fray * s2 + 0.08 * rise, 0.2 + 0.3 * s0, portrait * 0.85);
  // Long-exposure softness: a wide transfer, and the dark gaps between bands
  // are lifted so few near-black stripes remain inside the band.
  float streak = smoothstep(-0.4 - 0.3 * u_blur, 0.55 + 0.2 * u_blur, v);
  streak = mix(0.18, 1.0, streak);
  // Near the well the streaks smooth out so its outline stays a clean ellipse.
  streak = mix(streak, 0.7, nearWell * 0.25);
  // Where a streak brightens going down, its upper edge catches cool light
  // and the lower edge stays warm.
  float grad = n1.z * f1.y * 0.01;
  float coolEdge = smoothstep(0.02, 0.18, grad) * streak;
  float warmEdge = smoothstep(0.02, 0.18, -grad) * streak;

  // Colour: teal-black gaps, rust and rose bodies, steel-blue upper edges and
  // rim, pale blue-white on the brightest edges.
  vec3 gap = mix(hzCol(3), vec3(hzCol(2).x * 0.45, hzCol(2).yz * 0.7), 0.55 + 0.35 * s0);
  float warmPick = smoothstep(-0.05, 0.5, s1 - 0.5 * s0);
  vec3 body = mix(hzCol(0), hzCol(1), warmPick);
  body = mix(body, hzCol(0), warmEdge * 0.5);
  // Glow, not paint: part of the body falls to desaturated mauve and grey-blue.
  vec3 mauve = mix(body, hzCol(2), 0.25 + 0.25 * (1.0 - smoothstep(-0.3, 0.3, s0)));
  body = mix(body, vec3(mauve.x, mauve.yz * 0.7), (0.1 + 0.12 * rise) * landscape);
  vec3 col = mix(gap, body, smoothstep(0.2, 0.75, streak));
  // Portrait frames grade softly from steel at the edge through rose to rust.
  vec3 tall = mix(hzCol(2), mix(hzCol(1), hzCol(0), 0.6 * smoothstep(0.15, 0.55, out_)), smoothstep(0.03, 0.22, out_));
  col = mix(col, tall, portrait * 0.7);
  float rimness = exp(-max(out_, 0.0) * mix(24.0, 5.0, portrait));
  col = mix(col, hzCol(2), clamp(coolEdge * 0.6 + rimness * 0.9 + ring * 0.5, 0.0, 1.0));
  col = mix(col, gap, 0.65 * corner);
  col = mix(col, hzCol(4), clamp(coolEdge * coolEdge * 0.7 + ring * streak * 0.6 + rimness * glow * 0.25, 0.0, 1.0));

  // A broad bloom where the coarse sheet peaks.
  float bloom = smoothstep(0.2, 0.75, s0) * exp(-out_ * 2.5);
  float energy = env * hole * side * (1.0 - 0.45 * quiet) * (0.12 + 0.1 * rise + glow * glow * 0.3 + streak * 0.8 + coolEdge * 0.45 + bloom * 0.35)
    + env * ring * (0.45 + 1.35 * streak)
    + exp(-abs(out_ - 0.018) * 30.0) * (0.25 + 0.6 * glow) * env;
  energy = mix(energy, env * (0.75 + 0.35 * glow) * (1.0 - 0.5 * smoothstep(0.25, 0.8, out_)), portrait * 0.6);

  // Filmic tone: soft shoulder on lightness, chroma follows the light and
  // rolls off in the highlights.
  float lum = 1.0 - exp(-energy * 1.7);
  float L = col.x * lum * 1.22;
  // Darks desaturate toward black, like a film toe.
  float chroma = smoothstep(0.0, 0.45, lum) * mix(0.5, 1.0, smoothstep(0.25, 0.7, lum));
  vec3 lab = vec3(L, col.yz * chroma * mix(0.87, 1.0, portrait) * (1.0 - 0.45 * smoothstep(0.7, 1.0, L)));

  // Chromatic fringing: a thin cyan line on upper edges, red on lower edges.
  float mid = 4.0 * streak * (1.0 - streak);
  float fringe = mid * mid * mid * clamp(grad * 6.0, -1.0, 1.0) * lum * landscape;
  lab.yz -= fringe * (fringe > 0.0 ? vec2(0.045, 0.034) : vec2(0.03, 0.018));

  // The very peaks run to near-white, over tiny areas.
  float hot = smoothstep(1.2, 2.3, energy);
  lab = mix(lab, vec3(0.965, -0.004, -0.014), hot * 0.85);

  // The haze runs continuously across the edge and fades into the band.
  lab += hzVoid(max(-out_, 0.0), sideGlow) * exp(-max(out_, 0.0) * 30.0);

  // Star flares: a soft glow and core, long hair-fine horizontal flare and a
  // shorter vertical one. Pixels outside a star's reach skip it.
  for (int i = 0; i < 5; i++) {
    vec3 st = HZ_STARS[i];
    vec2 sd = p - vec2(st.x * h.x + tilt, st.y * h.y);
    float size = st.z;
    if (abs(sd.x) > 0.42 * size || abs(sd.y) > 0.22 * size) continue;
    float tw = clamp(0.7 + 0.5 * hzLoop(float(i) * 1.9 + 0.4).x, 0.15, 1.2);
    float r2 = dot(sd, sd);
    float core = exp(-r2 * 45000.0);
    float halo = exp(-r2 * 1800.0 / (size * size)) * 0.1 * smoothstep(0.6, 1.2, size);
    float fx = exp(-abs(sd.y) * 2200.0) * exp(-abs(sd.x) * 6.0 / size)
      * (1.0 - smoothstep(0.25, 0.42, abs(sd.x) / size));
    float fy = exp(-abs(sd.x) * 2200.0) * exp(-abs(sd.y) * 12.0 / size)
      * (1.0 - smoothstep(0.12, 0.22, abs(sd.y) / size));
    float star = (core * 1.4 + halo + (fx + fy) * 0.55) * size * tw * smoothstep(0.0, 0.08, out_);
    lab.x += star * 0.7;
    vec3 tint = i == 1 || i == 2 ? hzCol(4) : hzCol(1);
    lab.yz = mix(lab.yz, tint.yz * 0.6, clamp(star, 0.0, 1.0));
  }

  lab.x *= vignette;
  return lab + u_bg;
}
`,
  wgsl: () => import("./wgsl/horizon").then((module) => module.wgsl),
  label: "Horizon",
  name: "horizon",
};
