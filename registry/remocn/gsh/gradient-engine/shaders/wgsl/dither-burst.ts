/**
 * WGSL twin of the dither-burst kind's GLSL (dither-burst.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn dbBayer2(a0: vec2f) -> f32 {
  let a = floor(a0);
  return fract(dot(a, vec2f(0.5, a.y * 0.75)));
}

fn dbBayer8(a: vec2f) -> f32 {
  return dbBayer2(0.25 * a) * 0.0625 + dbBayer2(0.5 * a) * 0.25 + dbBayer2(a);
}

// Interleaved gradient noise (Jimenez 2014): ordered, but with no visible
// period, so it reads like blue noise.
fn dbIgn(a: vec2f) -> f32 {
  return fract(52.9829189 * fract(dot(floor(a), vec2f(0.06711056, 0.00583715))));
}

// GLSL's vec3(bvec3): 1.0 where true.
fn dbMask(b: vec3<bool>) -> vec3f {
  return select(vec3f(0.0), vec3f(1.0), b);
}

fn dbLabToSrgb(lab: vec3f) -> vec3f {
  var l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  var m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  var s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  var lin = vec3f(
    4.0767416621 * l * l * l - 3.3077115913 * m * m * m + 0.2309699292 * s * s * s,
    -1.2684380046 * l * l * l + 2.6097574011 * m * m * m - 0.3413193965 * s * s * s,
    -0.0041960863 * l * l * l - 0.7034186147 * m * m * m + 1.7076147010 * s * s * s
  );
  lin = clamp(lin, vec3f(0.0), vec3f(1.0));
  return mix(1.055 * pow(lin, vec3f(1.0 / 2.4)) - 0.055, lin * 12.92, dbMask(lin <= vec3f(0.0031308)));
}

fn dbSrgbToLab(c: vec3f) -> vec3f {
  var lin = mix(pow((c + 0.055) / 1.055, vec3f(2.4)), c / 12.92, dbMask(c <= vec3f(0.04045)));
  var l = 0.4122214708 * lin.r + 0.5363325363 * lin.g + 0.0514459929 * lin.b;
  var m = 0.2119034982 * lin.r + 0.6806995451 * lin.g + 0.1073969566 * lin.b;
  var s = 0.0883024619 * lin.r + 0.2817188376 * lin.g + 0.6299787005 * lin.b;
  var lms = pow(max(vec3f(l, m, s), vec3f(0.0)), vec3f(1.0 / 3.0));
  return vec3f(
    0.2104542553 * lms.x + 0.7936177850 * lms.y - 0.0040720468 * lms.z,
    1.9779984951 * lms.x - 2.4285922050 * lms.y + 0.4505937099 * lms.z,
    0.0259040371 * lms.x + 0.7827717662 * lms.y - 0.8086757660 * lms.z
  );
}

// How far the palette strays from the background. A flat palette has
// nothing to dither between, so it renders flat.
fn dbSpread() -> f32 {
  var d = 0.0;
  for (var i = 0; i < 6; i++) {
    if (i >= u.count) { break; }
    d = max(d, length(u.colors[i].xyz - u.bg));
  }
  return smoothstep(0.0, 0.04, d);
}

// The light's intensity at q: 0 is the background, 1 the core.
fn dbLight(q: vec2f, h: vec2f, mode: f32, side: f32) -> f32 {
  var s = 1.0 / u.scale;
  var soft = 0.6 + 0.8 * u.blur;
  if (mode < 1.0) {
    // Burst: broad, blurred rays from a point just past one edge.
    var a = 1.5708 + (side - 0.5) * 2.4;
    var src = vec2f(cos(a), -abs(sin(a))) * h * vec2f(1.0, 1.4) + 0.3 * drift(1.0);
    var d = q - src;
    var r = length(d);
    var dir = d / max(r, 1e-4);
    // Rays are noise on the unit circle, low in angle so they stay broad;
    // they fade in away from the source so it never reads as a star.
    var rays = 0.5 + 0.5 * flowNoise(dir * (1.6 + 1.4 * u.warp), 2.0);
    rays = mix(rays, 0.5 + 0.5 * flowNoise(dir * 4.0 + 7.0, 3.0), 0.3);
    var ray = mix(1.0, 0.25 + 1.2 * rays * rays, (0.35 + 0.55 * u.warp) * smoothstep(0.05, 0.7, r));
    var body = exp(-r / (0.62 * s * soft));
    return 1.15 * body * ray + 0.3 * exp(-r / (0.2 * s * soft));
  }
  if (mode < 2.0) {
    // Horizon: a huge disc rising from below, glowing into the dark.
    var tilt = (side - 0.5) * 0.5;
    var t = rot2(tilt) * q;
    var radius = 1.7 * s;
    var lift = (0.12 + 0.18 * u.scale) * h.y + 0.1 * flowNoise(vec2f(0.4, 0.9), 1.0);
    var centre = vec2f(0.45 * drift(2.0).x, -h.y - radius + lift);
    var x = length(t - centre) - radius;
    // The edge undulates, and with warp it drips into vertical streaks.
    x += 0.035 * u.warp * flowNoise(vec2f(t.x * 2.2, 0.3), 3.0);
    x += 0.06 * u.warp * u.warp * flowNoise(vec2f(t.x * 9.0, t.y * 0.6), 4.0) * (1.0 - smoothstep(-0.05, 0.25, x));
    var above = exp(-max(x, 0.0) / (0.14 * soft));
    var below = mix(1.0, 0.72, (1.0 - smoothstep(-0.6, 0.0, x)));
    if (x > 0.0) { return 0.92 * above; }
    return 0.92 + 0.3 * below * (1.0 - smoothstep(-0.08, 0.0, x));
  }
  if (mode < 3.0) {
    // Beam: a long diagonal band, a thin hot core in a wide soft halo.
    var a = 0.45 + (side - 0.5) * 1.1;
    var dir = vec2f(cos(a), sin(a));
    var n = vec2f(-dir.y, dir.x);
    // GLSL calls this u, which would shadow the uniform block here.
    var bu = dot(q, dir);
    var v = dot(q, n) + 0.08 * h.y + 0.14 * u.loopv.y + 0.07 * u.warp * flowNoise(vec2f(bu * 0.9, 0.5), 2.0) - 0.12 * bu * bu;
    var w = 0.05 * s * soft;
    var core = exp(-v * v / (w * w));
    var halo = exp(-abs(v) / (4.0 * w));
    var along = smoothstep(-1.4 * h.x, 0.3 * h.x, bu) * (0.85 + 0.15 * flowNoise(vec2f(bu * 1.2, 1.7), 3.0));
    return (0.75 * core + 0.6 * halo) * along;
  }
  // Bloom: light leaning in from a lower corner, with a hard-ish shoulder
  // where it meets the dark, bent by the flow.
  var corner = vec2f(select(1.0, -1.0, side < 0.5), -1.0) * h;
  var c = corner * 0.92 + 0.3 * drift(3.0);
  var w = q + 0.1 * u.warp * vec2f(flowNoise(q * 1.1, 4.0), flowNoise(q * 1.1 + 3.3, 5.0));
  var d = rot2((side - 0.5) * 1.4) * (w - c);
  var r = length(d * vec2f(0.75, 1.0));
  // The light spills out of the lobe in a long, uneven tail.
  var tail = exp(-r / (0.55 * s * soft)) * (0.7 + 0.3 * flowNoise(d * 1.6 + 2.0, 7.0));
  var edge = 1.0 - smoothstep((1.0 - 0.6 * soft) * s, s, r);
  return 0.95 * edge * exp(-r / (1.1 * s * soft)) + 0.45 * tail;
}

fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  var h = frameHalf();
  // The built-in dither; the engine's, when on, replaces it.
  var own = u.dither.x < 0.5;
  var cell = select(1.0, 3.0, own);
  var px = uv * u.full;
  var id = floor(px / cell);
  var centre = (id + 0.5) * cell;
  var q = (centre - 0.5 * u.full) / min(u.full.x, u.full.y);
  q.y = -q.y;
  q = interact(q);

  var pick8 = floor(fract(u.seed.x * 0.0731 + 0.5) * 8.0);
  var mode = gmod1(pick8, 4.0);
  var side = fract(u.seed.y * 0.0917 + 0.5);

  var light = dbLight(q, h, mode, side);
  var t = clamp(pow(max(light, 0.0), 1.25), 0.0, 1.0);
  var lab = labMix(u.bg, ramp(t), smoothstep(0.0, 0.4, t));
  // Past the core the light bleaches toward the palette's brightest.
  var hot = paletteColor(u.count - 1);
  lab = labMix(lab, vec3f(min(hot.x + 0.04, 1.0), hot.yz * 0.7), clamp((light - 1.0) * 1.5, 0.0, 1.0));
  var lightBg = smoothstep(0.55, 0.85, u.bg.x);
  lab.x *= vignette(q, 0.25 * (1.0 - lightBg));
  lab = filmGrade(lab);
  if (!own) { return lab; }

  // Ordered dither per sRGB channel, one threshold per cell.
  var spread = dbSpread();
  var threshold = select(dbIgn(id), dbBayer8(id), pick8 < 4.0);
  var steps = 11.0;
  var rgb = dbLabToSrgb(lab);
  var dithered = floor(rgb * steps + threshold) / steps;
  rgb = mix(rgb, dithered, vec3f(spread));
  // The cells read as a display: a faint seam on two edges.
  var local = px - id * cell;
  if (local.x >= cell - 1.0 || local.y >= cell - 1.0) {
    rgb *= 1.0 - 0.1 * spread;
  }
  return dbSrgbToLab(clamp(rgb, vec3f(0.0), vec3f(1.0)));
}
`;
