import type { GradientKindDefinition } from "../kind";
import { pick } from "../kind";

/**
 * A gradient map drawn through ordered dither. A slow glowing body is mapped
 * onto the ramp background → colour 0 → colour 1 → …, and every pixel picks
 * one ramp stop with a 4x4 Bayer threshold, so the field is made of solid
 * cells in palette colours only.
 *
 * Cells form a quadtree around a focus: coarse cells far away, halving twice
 * toward it, and smooth colour at its centre. The focus idles on a small loop
 * and follows the pointer when one is over the canvas.
 *
 * Params: `scale` sets the coarse cell, 16px at 1 (4px steps from 8 to 64);
 * `warp` bends the body; `blur` widens the smooth core. Scroll has no
 * effect. Cells are measured in
 * canvas pixels, so mount it with `maxDpr: 1` and `image-rendering: pixelated`
 * for cells in CSS pixels.
 *
 * The kind dithers by itself, so params keep the engine's dither off: its
 * cells would resample this field and its levels would shift the palette.
 *
 * Helpers are prefixed `df` and only depend on the prelude.
 */
export const ditherField: GradientKindDefinition = {
  defaults: {
    background: "#050505",
    blur: 0.4,
    colors: ["#2b3dd8", "#ff6a3d", "#ffd9a8"],
    dither: { cell: 4, enabled: false, levels: 4 },
    grain: 0,
    interaction: { pointer: 1, scroll: 0 },
    loopSeconds: 20,
    scale: 1,
    seed: 3,
    speed: 0.5,
    warp: 0.5,
  },
  description:
    "A gradient map in ordered-dither cells that resolves to smooth colour around the pointer.",
  // Stepped rings, the CSS version of the quantised ramp.
  fallbackLayers: (colors, background) => {
    const ring = (i: number) => pick(colors, i);
    return [
      `radial-gradient(70% 85% at 72% 55%, ${ring(2)} 0 14%, ${ring(1)} 14% 30%, ${ring(0)} 30% 52%, color-mix(in oklab, ${ring(0)} 45%, ${background}) 52% 66%, transparent 66%)`,
    ];
  },
  glsl: `
const float BAYER_DF[16] = float[16](
  0.0, 8.0, 2.0, 10.0,
  12.0, 4.0, 14.0, 6.0,
  3.0, 11.0, 1.0, 9.0,
  15.0, 7.0, 13.0, 5.0
);

// Ramp stop i: 0 is the background, then the palette.
vec3 dfStop(int i) {
  return i <= 0 ? u_bg : u_colors[min(i - 1, u_count - 1)];
}

// The body's height, 0..1, at q (p units). It sits right of centre, or low
// in portrait frames, and falls to 0 well before the opposite side.
float dfField(vec2 q, vec2 h) {
  float portrait = clamp((h.y / h.x - 0.8) / 0.6, 0.0, 1.0);
  vec2 centre = mix(vec2(0.52 * h.x, -0.02), vec2(0.04, -0.62 * h.y), portrait);
  float reach = mix(0.56, 0.5, portrait);
  vec2 w = q + u_warp * 0.2 * vec2(flowNoise(q * 1.1, 1.0), flowNoise(q * 1.1 + 4.1, 2.0));
  vec2 d = (w - centre) * vec2(0.9, 1.0);
  float body = pow(clamp(1.0 - length(d) / reach, 0.0, 1.0), 0.75);
  // A second, smaller lobe circling the first.
  vec2 orbit = centre + 0.3 * normalize(drift(3.0) + vec2(1e-4)) * vec2(1.2, 0.7);
  float lobe = pow(clamp(1.0 - length(w - orbit) / 0.24, 0.0, 1.0), 1.4);
  body = max(body, 0.55 * lobe) + 0.25 * body * lobe;
  body += 0.06 * flowNoise(w * 2.4, 4.0) * smoothstep(0.0, 0.2, body);
  // Keep clear of the opposite side, where a hero puts its copy.
  float side = mix(q.x / h.x, -q.y / h.y, portrait);
  body *= smoothstep(mix(-0.18, 0.1, portrait), mix(0.25, 0.42, portrait), side);
  return clamp(body, 0.0, 1.0);
}

vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  float minSide = min(u_full.x, u_full.y);
  vec2 px = floor(uv * u_full);
  float coarse = 4.0 * clamp(floor(u_scale * 4.0 + 0.5), 2.0, 16.0);

  // The focus: an idle drift, eased toward the pointer while it is near.
  vec2 idle = mix(vec2(0.46 * h.x, 0.04), vec2(0.0, -0.6 * h.y), clamp((h.y / h.x - 0.8) / 0.6, 0.0, 1.0)) + 0.12 * drift(1.5);
  vec2 ptr = (u_pointer.xy - 0.5) * 2.0 * h;
  ptr.y = -ptr.y;
  vec2 focus = mix(idle, ptr, clamp(u_pointer.z, 0.0, 1.0));

  // Quadtree: a cell splits while its centre is inside the next radius.
  float core = 0.07 + 0.08 * u_blur;
  float radii[3] = float[3](core * 3.6, core * 2.2, core);
  float size = coarse;
  vec2 id = floor(px / size);
  int tier = 0;
  for (int k = 0; k < 3; k++) {
    vec2 centre = (id + 0.5) * size;
    vec2 cq = (centre - 0.5 * u_full) / minSide;
    cq.y = -cq.y;
    vec2 dq = abs(cq - focus);
    if (max(dq.x, dq.y) >= radii[k]) break;
    tier = k + 1;
    if (k < 2) {
      size *= 0.5;
      id = floor(px / size);
    }
  }

  // Viewfinder brackets around the smooth square, in the ramp's last stop,
  // shown only while the square sits on the body.
  float fine = coarse * 0.25;
  vec2 fpx = vec2(focus.x, -focus.y) * minSide + 0.5 * u_full;
  float corePx = radii[2] * minSide;
  vec2 lo = (ceil((fpx - corePx) / fine - 0.5)) * fine;
  vec2 hi = (floor((fpx + corePx) / fine - 0.5) + 1.0) * fine;
  float gap = 3.0;
  float arm = max(10.0, fine * 3.0);
  bool inBox = all(greaterThan(px, lo - gap - 3.0)) && all(lessThan(px, hi + gap + 3.0));
  bool inner = all(greaterThan(px, lo - gap - 1.0)) && all(lessThan(px, hi + gap + 1.0));
  bool nearCorner = (min(abs(px.x - lo.x), abs(px.x - hi.x)) < arm) && (min(abs(px.y - lo.y), abs(px.y - hi.y)) < arm);
  if (hi.x > lo.x && inBox && !inner && nearCorner && dfField(focus, h) > 0.2) {
    return dfStop(u_count);
  }

  float stops = float(u_count);
  if (tier == 3) {
    // Sampled from the pixel itself: the prelude's pointer lens bends p,
    // which would tear the core away from the cells around it.
    vec2 sq = (px + 0.5 - 0.5 * u_full) / minSide;
    sq.y = -sq.y;
    float x = dfField(sq, h) * stops;
    int i = int(floor(x));
    float f = smoothstep(0.0, 1.0, fract(x));
    return labMix(dfStop(i), dfStop(i + 1), f);
  }

  vec2 cellPx = (id + 0.5) * size;
  vec2 q = (cellPx - 0.5 * u_full) / minSide;
  q.y = -q.y;
  float x = dfField(q, h) * stops;
  ivec2 b = ivec2(mod(id, 4.0));
  float threshold = (BAYER_DF[b.y * 4 + b.x] + 0.5) / 16.0;
  int i = int(floor(x)) + (fract(x) > threshold ? 1 : 0);
  // Coarse cells read as a display: a hairline gap between lit cells, and a
  // faint unlit pixel at the centre of every empty one.
  vec2 local = px - id * size;
  if (i == 0) {
    vec2 dot_ = abs(local - (size * 0.5 - 1.0));
    bool lit = tier == 0 && max(dot_.x, dot_.y) < 1.0;
    return lit ? mix(u_bg, dfStop(1), 0.4) : u_bg;
  }
  if (tier == 0 && (local.x >= size - 1.0 || local.y >= size - 1.0)) {
    return mix(dfStop(i), u_bg, 0.35);
  }
  return dfStop(i);
}
`,
  wgsl: () => import("./wgsl/dither-field").then((module) => module.wgsl),
  label: "Dither field",
  name: "dither-field",
};
