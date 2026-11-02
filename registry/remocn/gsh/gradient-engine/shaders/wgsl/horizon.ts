/**
 * WGSL twin of the horizon kind's GLSL (horizon.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn hzCol(i: i32) -> vec3f { return u.colors[min(i, u.count - 1)].xyz; }

// Sin-free lattice hash (Dave Hoskins), -1..1.
fn hzHash(p: vec2f) -> vec2f {
  var p3 = fract(vec3f(p.xyx) * vec3f(0.1031, 0.103, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

// 2D gradient noise, roughly -0.7..0.7.
fn hzNoise(p: vec2f) -> f32 {
  var i = floor(p);
  var f = fract(p);
  var fu = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  var a = dot(hzHash(i), f);
  var b = dot(hzHash(i + vec2f(1.0, 0.0)), f - vec2f(1.0, 0.0));
  var c = dot(hzHash(i + vec2f(0.0, 1.0)), f - vec2f(0.0, 1.0));
  var d = dot(hzHash(i + vec2f(1.0, 1.0)), f - vec2f(1.0, 1.0));
  return mix(mix(a, b, fu.x), mix(c, d, fu.x), fu.y);
}

// Gradient noise with its analytic derivative: (value, d/dx, d/dy).
fn hzNoiseD(p: vec2f) -> vec3f {
  var i = floor(p);
  var f = fract(p);
  var fu = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  var du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  var ga = hzHash(i);
  var gb = hzHash(i + vec2f(1.0, 0.0));
  var gc = hzHash(i + vec2f(0.0, 1.0));
  var gd = hzHash(i + vec2f(1.0, 1.0));
  var va = dot(ga, f);
  var vb = dot(gb, f - vec2f(1.0, 0.0));
  var vc = dot(gc, f - vec2f(0.0, 1.0));
  var vd = dot(gd, f - vec2f(1.0, 1.0));
  var k = va - vb - vc + vd;
  var v = va + fu.x * (vb - va) + fu.y * (vc - va) + fu.x * fu.y * k;
  var d = ga + fu.x * (gb - ga) + fu.y * (gc - ga) + fu.x * fu.y * (ga - gb - gc + gd)
    + du * (fu.yx * k + vec2f(vb, vc) - va);
  return vec3f(v, d);
}

// The loop point rotated by a per-layer angle: still periodic, out of phase.
fn hzLoop(a: f32) -> vec2f {
  var c = cos(a);
  var s = sin(a);
  return vec2f(c * u.loopv.x - s * u.loopv.y, s * u.loopv.x + c * u.loopv.y);
}

// Sheet coordinates: stretched, drifting on the loop circle, seeded.
fn hzSheet(sp: vec2f, freq: vec2f, layer: f32) -> vec2f {
  return sp * freq + hzLoop(layer * 2.1) * vec2f(0.9, 0.5) + u.seed * 0.37 + layer * 13.7;
}

// Height of the horizon at x, measured against grainient's hero: a wide well
// just right of centre, a gentle shelf on the left and a late climb on the
// right. Portrait frames sit the horizon lower.
fn hzRim(x: f32, portrait: f32, breathe: f32) -> f32 {
  var well = exp(-(x - 0.08) * (x - 0.08) * 4.5);
  var r = max(x - 0.4, 0.0);
  var shelf = -0.145 - 0.035 * (1.0 - smoothstep(-0.6, 0.0, x));
  return shelf - (0.19 + breathe) * well * (1.0 - 0.75 * portrait) + 0.65 * r * r - 0.11 * portrait;
}

// The void: black, with a cool haze bleeding up from the horizon and faint
// ripple rings inside it.
fn hzVoid(inside: f32, sideGlow: f32) -> vec3f {
  var haze = (exp(-inside * 30.0) * 0.2 + exp(-inside * 10.0) * 0.06) * sideGlow;
  var rings = sin(inside * 210.0 - 0.8 * hzLoop(2.5).y) * exp(-inside * 6.0);
  return vec3f(haze * (1.0 + 0.22 * rings) + 0.005 * rings, hzCol(2).yz * haze * 0.55);
}

// Star flares: x in half-widths, y in half-heights, size.
const HZ_STARS = array<vec3f, 5>(
  vec3f(-0.29, -0.71, 1.2),
  vec3f(0.31, -0.88, 1.0),
  vec3f(0.79, -0.8, 0.7),
  vec3f(-0.53, -0.55, 0.5),
  vec3f(0.15, -0.94, 0.45)
);

fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  var h = frameHalf();
  var portrait = clamp((h.y / h.x - 0.65) / 1.2, 0.0, 1.0);
  var tilt = (fract(u.seed.x * 0.0193) - 0.5) * 0.1;
  var x = p.x - tilt;

  var breathe = 0.01 * hzLoop(0.7).x;
  var rimY = hzRim(x, portrait, breathe);
  var slope = (hzRim(x + 0.01, portrait, breathe) - rimY) * 100.0;
  var out_ = (rimY - p.y) / sqrt(1.0 + slope * slope); // > 0 in the light
  var sideGlow = 0.55 + 0.7 * smoothstep(0.15, 0.85, abs(p.x) / h.x);

  var vq = (uv - 0.5) * vec2f(1.0, 1.1);
  var vig = 1.0 - 0.6 * dot(vq, vq);
  // Most of the frame is void: skip the light entirely there.
  if (out_ < -0.012) {
    var lab = hzVoid(-out_, sideGlow);
    lab.x *= vig;
    return lab + u.bg;
  }

  // The well: a dark funnel at the bottom centre.
  var vp = vec2f(-0.03 + tilt * 0.5, -0.91 * h.y);
  var hq = (p - vp) / vec2f(0.19, 0.068);
  var hd = length(hq);
  var landscape = 1.0 - portrait;

  // Deeper bands flatten toward the horizontal, like a ground plane.
  var rimMin = -0.32 - 0.11 * portrait;
  var yRef = mix(rimY, rimMin + (rimY - rimMin) * 0.3, smoothstep(0.0, 0.3, out_));
  var depth = max(yRef - p.y, 0.0);
  // Perspective: bands crowd toward the horizon and widen toward the viewer.
  var across = log(1.0 + depth * 7.0) * 0.32;
  var along = p.x;
  across += 0.035 * u.warp * sin(along * 3.1 + across * 9.0 + hzLoop(4.0).x * 2.0);

  // Near the well the bands dip and dive into it, like light bent by a
  // black hole.
  var wrap = (1.0 - smoothstep(0.9, 2.6, hd)) * landscape;
  across = max(across - 0.09 * wrap * smoothstep(0.0, 0.15, across), 0.0);
  along = mix(along, along * (1.0 + 0.8 * wrap), wrap);

  var sc = u.scale;
  var f0 = vec2f(1.0, 6.0) * sc;
  var f1 = vec2f(1.7, 14.0) * sc;
  var s0 = hzNoise(hzSheet(vec2f(along, across), f0, 0.0));
  var n1 = hzNoiseD(hzSheet(vec2f(along + s0 * 0.45, across + s0 * 0.012), f1, 1.0));
  var s1 = n1.x;
  // Turbulence: slanted wisps that cross the bands and fray them, strongest
  // where the streaks climb on the right.
  var rise = smoothstep(0.1, 0.75, p.x / h.x);
  var q2 = vec2f(along, across + along * (0.08 + 0.3 * rise));
  var s2 = hzNoise(hzSheet(q2, vec2f(2.0, 15.0) * sc, 2.0));

  var env = smoothstep(-0.012, 0.05, out_) * (0.75 + 0.25 * exp(-out_ * 3.0));
  // The well fades from the surrounding light into black over a wide falloff.
  var hole = mix(pow(1.0 - exp(-hd * hd * 0.38), 1.6), 1.0, portrait);
  var nearWell = (1.0 - smoothstep(1.0, 2.6, hd)) * landscape;
  // The band is quieter and darker just under the hero copy.
  var quiet = exp(-p.x * p.x * 9.0) * (1.0 - smoothstep(0.04, 0.16, out_)) * landscape;
  // The hottest light arches over the well and runs down its flanks.
  var flank = smoothstep(-0.7, 0.1, hq.y / max(hd, 1e-3));
  var ring = exp(-max(hd - 1.7, 0.0) * 1.3) * smoothstep(0.9, 2.0, hd) * flank * landscape;
  var side = 0.8 + 0.45 * smoothstep(0.1, 0.8, abs(p.x) / h.x);
  // The bottom corners fall away to teal-black.
  var corner = (1.0 - smoothstep(-h.y, -0.55 * h.y, p.y)) * smoothstep(0.35, 0.9, abs(p.x) / h.x) * landscape;
  side *= 1.0 - 0.55 * corner;

  var glow = clamp(0.5 + 0.9 * s0, 0.0, 1.0);
  var fray = (0.16 + 0.12 * rise) * (1.0 - 0.8 * portrait);
  var v = mix(s1 + 0.4 * s0 + fray * s2 + 0.08 * rise, 0.2 + 0.3 * s0, portrait * 0.85);
  // Long-exposure softness: a wide transfer, and the dark gaps between bands
  // are lifted so few near-black stripes remain inside the band.
  var streak = smoothstep(-0.4 - 0.3 * u.blur, 0.55 + 0.2 * u.blur, v);
  streak = mix(0.18, 1.0, streak);
  // Near the well the streaks smooth out so its outline stays a clean ellipse.
  streak = mix(streak, 0.7, nearWell * 0.25);
  // Where a streak brightens going down, its upper edge catches cool light
  // and the lower edge stays warm.
  var grad = n1.z * f1.y * 0.01;
  var coolEdge = smoothstep(0.02, 0.18, grad) * streak;
  var warmEdge = smoothstep(0.02, 0.18, -grad) * streak;

  // Colour: teal-black gaps, rust and rose bodies, steel-blue upper edges and
  // rim, pale blue-white on the brightest edges.
  var gap = mix(hzCol(3), vec3f(hzCol(2).x * 0.45, hzCol(2).yz * 0.7), 0.55 + 0.35 * s0);
  var warmPick = smoothstep(-0.05, 0.5, s1 - 0.5 * s0);
  var body = mix(hzCol(0), hzCol(1), warmPick);
  body = mix(body, hzCol(0), warmEdge * 0.5);
  // Glow, not paint: part of the body falls to desaturated mauve and grey-blue.
  var mauve = mix(body, hzCol(2), 0.25 + 0.25 * (1.0 - smoothstep(-0.3, 0.3, s0)));
  body = mix(body, vec3f(mauve.x, mauve.yz * 0.7), (0.1 + 0.12 * rise) * landscape);
  var col = mix(gap, body, smoothstep(0.2, 0.75, streak));
  // Portrait frames grade softly from steel at the edge through rose to rust.
  var tall = mix(hzCol(2), mix(hzCol(1), hzCol(0), 0.6 * smoothstep(0.15, 0.55, out_)), smoothstep(0.03, 0.22, out_));
  col = mix(col, tall, portrait * 0.7);
  var rimness = exp(-max(out_, 0.0) * mix(24.0, 5.0, portrait));
  col = mix(col, hzCol(2), clamp(coolEdge * 0.6 + rimness * 0.9 + ring * 0.5, 0.0, 1.0));
  col = mix(col, gap, 0.65 * corner);
  col = mix(col, hzCol(4), clamp(coolEdge * coolEdge * 0.7 + ring * streak * 0.6 + rimness * glow * 0.25, 0.0, 1.0));

  // A broad bloom where the coarse sheet peaks.
  var bloom = smoothstep(0.2, 0.75, s0) * exp(-out_ * 2.5);
  var energy = env * hole * side * (1.0 - 0.45 * quiet) * (0.12 + 0.1 * rise + glow * glow * 0.3 + streak * 0.8 + coolEdge * 0.45 + bloom * 0.35)
    + env * ring * (0.45 + 1.35 * streak)
    + exp(-abs(out_ - 0.018) * 30.0) * (0.25 + 0.6 * glow) * env;
  energy = mix(energy, env * (0.75 + 0.35 * glow) * (1.0 - 0.5 * smoothstep(0.25, 0.8, out_)), portrait * 0.6);

  // Filmic tone: soft shoulder on lightness, chroma follows the light and
  // rolls off in the highlights.
  var lum = 1.0 - exp(-energy * 1.7);
  var L = col.x * lum * 1.22;
  // Darks desaturate toward black, like a film toe.
  var chroma = smoothstep(0.0, 0.45, lum) * mix(0.5, 1.0, smoothstep(0.25, 0.7, lum));
  var lab = vec3f(L, col.yz * chroma * mix(0.87, 1.0, portrait) * (1.0 - 0.45 * smoothstep(0.7, 1.0, L)));

  // Chromatic fringing: a thin cyan line on upper edges, red on lower edges.
  var mid = 4.0 * streak * (1.0 - streak);
  var fringe = mid * mid * mid * clamp(grad * 6.0, -1.0, 1.0) * lum * landscape;
  lab = vec3f(lab.x, lab.yz - fringe * select(vec2f(0.03, 0.018), vec2f(0.045, 0.034), fringe > 0.0));

  // The very peaks run to near-white, over tiny areas.
  var hot = smoothstep(1.2, 2.3, energy);
  lab = mix(lab, vec3f(0.965, -0.004, -0.014), hot * 0.85);

  // The haze runs continuously across the edge and fades into the band.
  lab += hzVoid(max(-out_, 0.0), sideGlow) * exp(-max(out_, 0.0) * 30.0);

  // Star flares: a soft glow and core, long hair-fine horizontal flare and a
  // shorter vertical one. Pixels outside a star's reach skip it.
  for (var i = 0; i < 5; i++) {
    var st = HZ_STARS[i];
    var sd = p - vec2f(st.x * h.x + tilt, st.y * h.y);
    var size = st.z;
    if (abs(sd.x) > 0.42 * size || abs(sd.y) > 0.22 * size) { continue; }
    var tw = clamp(0.7 + 0.5 * hzLoop(f32(i) * 1.9 + 0.4).x, 0.15, 1.2);
    var r2 = dot(sd, sd);
    var core = exp(-r2 * 45000.0);
    var halo = exp(-r2 * 1800.0 / (size * size)) * 0.1 * smoothstep(0.6, 1.2, size);
    var fx = exp(-abs(sd.y) * 2200.0) * exp(-abs(sd.x) * 6.0 / size)
      * (1.0 - smoothstep(0.25, 0.42, abs(sd.x) / size));
    var fy = exp(-abs(sd.x) * 2200.0) * exp(-abs(sd.y) * 12.0 / size)
      * (1.0 - smoothstep(0.12, 0.22, abs(sd.y) / size));
    var star = (core * 1.4 + halo + (fx + fy) * 0.55) * size * tw * smoothstep(0.0, 0.08, out_);
    lab.x += star * 0.7;
    var tint = hzCol(1);
    if (i == 1 || i == 2) { tint = hzCol(4); }
    lab = vec3f(lab.x, mix(lab.yz, tint.yz * 0.6, clamp(star, 0.0, 1.0)));
  }

  lab.x *= vig;
  return lab + u.bg;
}
`;
