/**
 * WGSL twin of the dither-field kind's GLSL (dither-field.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
const BAYER_DF = array<f32, 16>(
  0.0, 8.0, 2.0, 10.0,
  12.0, 4.0, 14.0, 6.0,
  3.0, 11.0, 1.0, 9.0,
  15.0, 7.0, 13.0, 5.0
);

// Ramp stop i: 0 is the background, then the palette. An if, not a select,
// so i <= 0 never indexes the palette at -1.
fn dfStop(i: i32) -> vec3f {
  if (i <= 0) { return u.bg; }
  return u.colors[min(i - 1, u.count - 1)].xyz;
}

// The body's height, 0..1, at q (p units). It sits right of centre, or low
// in portrait frames, and falls to 0 well before the opposite side.
fn dfField(q: vec2f, h: vec2f) -> f32 {
  var portrait = clamp((h.y / h.x - 0.8) / 0.6, 0.0, 1.0);
  var centre = mix(vec2f(0.52 * h.x, -0.02), vec2f(0.04, -0.62 * h.y), portrait);
  var reach = mix(0.56, 0.5, portrait);
  var w = q + u.warp * 0.2 * vec2f(flowNoise(q * 1.1, 1.0), flowNoise(q * 1.1 + 4.1, 2.0));
  var d = (w - centre) * vec2f(0.9, 1.0);
  var body = pow(clamp(1.0 - length(d) / reach, 0.0, 1.0), 0.75);
  // A second, smaller lobe circling the first.
  var orbit = centre + 0.3 * normalize(drift(3.0) + vec2f(1e-4)) * vec2f(1.2, 0.7);
  var lobe = pow(clamp(1.0 - length(w - orbit) / 0.24, 0.0, 1.0), 1.4);
  body = max(body, 0.55 * lobe) + 0.25 * body * lobe;
  body += 0.06 * flowNoise(w * 2.4, 4.0) * smoothstep(0.0, 0.2, body);
  // Keep clear of the opposite side, where a hero puts its copy.
  var side = mix(q.x / h.x, -q.y / h.y, portrait);
  body *= smoothstep(mix(-0.18, 0.1, portrait), mix(0.25, 0.42, portrait), side);
  return clamp(body, 0.0, 1.0);
}

fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  var h = frameHalf();
  var minSide = min(u.full.x, u.full.y);
  var px = floor(uv * u.full);
  var coarse = 4.0 * clamp(floor(u.scale * 4.0 + 0.5), 2.0, 16.0);

  // The focus: an idle drift, eased toward the pointer while it is near.
  var idle = mix(vec2f(0.46 * h.x, 0.04), vec2f(0.0, -0.6 * h.y), clamp((h.y / h.x - 0.8) / 0.6, 0.0, 1.0)) + 0.12 * drift(1.5);
  var ptr = (u.pointer.xy - 0.5) * 2.0 * h;
  ptr.y = -ptr.y;
  var focus = mix(idle, ptr, clamp(u.pointer.z, 0.0, 1.0));

  // Quadtree: a cell splits while its centre is inside the next radius.
  var core = 0.07 + 0.08 * u.blur;
  var radii = array<f32, 3>(core * 3.6, core * 2.2, core);
  var size = coarse;
  var id = floor(px / size);
  var tier = 0;
  for (var k = 0; k < 3; k++) {
    var centre = (id + 0.5) * size;
    var cq = (centre - 0.5 * u.full) / minSide;
    cq.y = -cq.y;
    var dq = abs(cq - focus);
    if (max(dq.x, dq.y) >= radii[k]) { break; }
    tier = k + 1;
    if (k < 2) {
      size *= 0.5;
      id = floor(px / size);
    }
  }

  // Viewfinder brackets around the smooth square, in the ramp's last stop,
  // shown only while the square sits on the body.
  var fine = coarse * 0.25;
  var fpx = vec2f(focus.x, -focus.y) * minSide + 0.5 * u.full;
  var corePx = radii[2] * minSide;
  var lo = (ceil((fpx - corePx) / fine - 0.5)) * fine;
  var hi = (floor((fpx + corePx) / fine - 0.5) + 1.0) * fine;
  var gap = 3.0;
  var arm = max(10.0, fine * 3.0);
  var inBox = all(px > lo - gap - 3.0) && all(px < hi + gap + 3.0);
  var inner = all(px > lo - gap - 1.0) && all(px < hi + gap + 1.0);
  var nearCorner = (min(abs(px.x - lo.x), abs(px.x - hi.x)) < arm) && (min(abs(px.y - lo.y), abs(px.y - hi.y)) < arm);
  if (hi.x > lo.x && inBox && !inner && nearCorner && dfField(focus, h) > 0.2) {
    return dfStop(u.count);
  }

  var stops = f32(u.count);
  if (tier == 3) {
    // Sampled from the pixel itself: the prelude's pointer lens bends p,
    // which would tear the core away from the cells around it.
    var sq = (px + 0.5 - 0.5 * u.full) / minSide;
    sq.y = -sq.y;
    var x = dfField(sq, h) * stops;
    var i = i32(floor(x));
    var f = smoothstep(0.0, 1.0, fract(x));
    return labMix(dfStop(i), dfStop(i + 1), f);
  }

  var cellPx = (id + 0.5) * size;
  var q = (cellPx - 0.5 * u.full) / minSide;
  q.y = -q.y;
  var x = dfField(q, h) * stops;
  var b = vec2i(gmod2(id, 4.0));
  var threshold = (BAYER_DF[b.y * 4 + b.x] + 0.5) / 16.0;
  var i = i32(floor(x)) + select(0, 1, fract(x) > threshold);
  // Coarse cells read as a display: a hairline gap between lit cells, and a
  // faint unlit pixel at the centre of every empty one.
  var local = px - id * size;
  if (i == 0) {
    var dot_ = abs(local - (size * 0.5 - 1.0));
    var lit = tier == 0 && max(dot_.x, dot_.y) < 1.0;
    if (lit) { return mix(u.bg, dfStop(1), 0.4); }
    return u.bg;
  }
  if (tier == 0 && (local.x >= size - 1.0 || local.y >= size - 1.0)) {
    return mix(dfStop(i), u.bg, 0.35);
  }
  return dfStop(i);
}
`;
