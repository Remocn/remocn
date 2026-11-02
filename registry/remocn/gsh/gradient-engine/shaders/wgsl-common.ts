/**
 * WGSL twin of common.ts. A kind supplies
 * `fn kindColor(p: vec2f, uv: vec2f) -> vec3f` returning OKLab, exactly as in
 * GLSL. The maths is a line-for-line port so frame N matches the WebGL
 * engine; the differences are WGSL's, not ours:
 *
 * - No overloading, so mod289/permute/taylorInvSqrt carry a size suffix.
 * - GLSL `mod` floors; WGSL `%` truncates. `gmod` is GLSL's `mod`.
 * - No swizzle assignment and immutable parameters, so a few helpers rebuild
 *   vectors instead of writing `v.yz *= k`.
 * - `@builtin(position)` is top-left origin, so the tile maths loses its flip.
 * - `loop` is a WGSL keyword: the uniform is `u.loopv`.
 */

export const wgslPrelude = /* wgsl */ `
struct Uniforms {
  full: vec2f,
  loopv: vec2f,
  tile: vec4f,
  seed: vec2f,
  scale: f32,
  warp: f32,
  blur: f32,
  grain: f32,
  frame: f32,
  count: i32,
  dither: vec3f,
  scroll: f32,
  bg: vec3f,
  pointer: vec3f,
  colors: array<vec4f, 6>,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

fn gmod1(x: f32, y: f32) -> f32 { return x - y * floor(x / y); }
fn gmod2(x: vec2f, y: f32) -> vec2f { return x - y * floor(x / y); }

// 4D simplex noise. Ian McEwan, Stefan Gustavson, Ashima Arts (MIT).
fn mod289_4(x: vec4f) -> vec4f { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn mod289_1(x: f32) -> f32 { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn permute4(x: vec4f) -> vec4f { return mod289_4(((x * 34.0) + 10.0) * x); }
fn permute1(x: f32) -> f32 { return mod289_1(((x * 34.0) + 10.0) * x); }
fn taylorInvSqrt4(r: vec4f) -> vec4f { return 1.79284291400159 - 0.85373472095314 * r; }
fn taylorInvSqrt1(r: f32) -> f32 { return 1.79284291400159 - 0.85373472095314 * r; }
fn grad4(j: f32, ip: vec4f) -> vec4f {
  let ones = vec4f(1.0, 1.0, 1.0, -1.0);
  var p: vec4f;
  let pxyz = floor(fract(vec3f(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p = vec4f(pxyz, 1.5 - dot(abs(pxyz), ones.xyz));
  let s = select(vec4f(0.0), vec4f(1.0), p < vec4f(0.0));
  p = vec4f(p.xyz + (s.xyz * 2.0 - 1.0) * s.www, p.w);
  return p;
}
fn snoise(v: vec4f) -> f32 {
  let C = vec4f(0.138196601125011, 0.276393202250021, 0.414589803375032, -0.447213595499958);
  var i = floor(v + dot(v, vec4f(0.309016994374947451)));
  let x0 = v - i + dot(i, C.xxxx);
  let isX = step(x0.yzw, x0.xxx);
  let isYZ = step(x0.zww, x0.yyz);
  var i0 = vec4f(isX.x + isX.y + isX.z, 1.0 - isX);
  i0.y += isYZ.x + isYZ.y;
  i0.z += 1.0 - isYZ.x;
  i0.w += 1.0 - isYZ.y;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;
  let i3 = clamp(i0, vec4f(0.0), vec4f(1.0));
  let i2 = clamp(i0 - 1.0, vec4f(0.0), vec4f(1.0));
  let i1 = clamp(i0 - 2.0, vec4f(0.0), vec4f(1.0));
  let x1 = x0 - i1 + C.xxxx;
  let x2 = x0 - i2 + C.yyyy;
  let x3 = x0 - i3 + C.zzzz;
  let x4 = x0 + C.wwww;
  i = mod289_4(i);
  let j0 = permute1(permute1(permute1(permute1(i.w) + i.z) + i.y) + i.x);
  let j1 = permute4(permute4(permute4(permute4(
      i.w + vec4f(i1.w, i2.w, i3.w, 1.0))
    + i.z + vec4f(i1.z, i2.z, i3.z, 1.0))
    + i.y + vec4f(i1.y, i2.y, i3.y, 1.0))
    + i.x + vec4f(i1.x, i2.x, i3.x, 1.0));
  let ip = vec4f(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);
  var p0 = grad4(j0, ip);
  var p1 = grad4(j1.x, ip);
  var p2 = grad4(j1.y, ip);
  var p3 = grad4(j1.z, ip);
  var p4 = grad4(j1.w, ip);
  let norm = taylorInvSqrt4(vec4f(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt1(dot(p4, p4));
  var m0 = max(0.6 - vec3f(dot(x0, x0), dot(x1, x1), dot(x2, x2)), vec3f(0.0));
  var m1 = max(0.6 - vec2f(dot(x3, x3), dot(x4, x4)), vec2f(0.0));
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * (dot(m0 * m0, vec3f(dot(p0, x0), dot(p1, x1), dot(p2, x2)))
    + dot(m1 * m1, vec2f(dot(p3, x3), dot(p4, x4))));
}

fn mod289_3(x: vec3f) -> vec3f { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn mod289_2(x: vec2f) -> vec2f { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn permute3(x: vec3f) -> vec3f { return mod289_3(((x * 34.0) + 10.0) * x); }
fn snoise2(v: vec2f) -> f32 {
  let C = vec4f(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  var i = floor(v + dot(v, C.yy));
  let x0 = v - i + dot(i, C.xx);
  let i1 = select(vec2f(0.0, 1.0), vec2f(1.0, 0.0), x0.x > x0.y);
  var x12 = x0.xyxy + C.xxzz;
  x12 = vec4f(x12.xy - i1, x12.zw);
  i = mod289_2(i);
  let p = permute3(permute3(i.y + vec3f(0.0, i1.y, 1.0)) + i.x + vec3f(0.0, i1.x, 1.0));
  var m = max(0.5 - vec3f(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), vec3f(0.0));
  m = m * m;
  m = m * m;
  let x = 2.0 * fract(p * C.www) - 1.0;
  let h = abs(x) - 0.5;
  let ox = floor(x + 0.5);
  let a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  let g = vec3f(a0.x * x0.x + h.x * x0.y, a0.yz * x12.xz + h.yz * x12.yw);
  return 130.0 * dot(m, g);
}

fn loopAt(layer: f32) -> vec2f {
  return u.loopv + vec2f(layer * 1.71, layer * -2.37);
}

fn loopNoise(p: vec2f, layer: f32) -> f32 {
  return snoise(vec4f(p + u.seed, loopAt(layer)));
}

fn fbm(p: vec2f, layer: f32) -> f32 {
  let fine = 1.0 - 0.85 * u.blur;
  var sum = loopNoise(p, layer);
  sum += 0.5 * fine * loopNoise(p * 2.03 + 17.1, layer + 0.5);
  sum += 0.25 * fine * fine * loopNoise(p * 4.07 - 9.7, layer + 1.0);
  return sum / (1.0 + 0.5 * fine + 0.25 * fine * fine);
}

// The loop angle as a unit vector, so waves can travel a whole period per
// loop. Frozen when speed is 0.
fn loopTurn() -> vec2f {
  let r = length(u.loopv);
  return select(vec2f(1.0, 0.0), u.loopv / r, r > 1e-6);
}

// sin(a - angle), where cs = (cos, sin)(angle).
fn turnSin(a: f32, cs: vec2f) -> f32 {
  return sin(a) * cs.x - cos(a) * cs.y;
}

fn rot2(a: f32) -> mat2x2f {
  let c = cos(a);
  let s = sin(a);
  return mat2x2f(c, s, -s, c);
}

fn drift(layer: f32) -> vec2f {
  return rot2(layer * 2.39996) * u.loopv;
}

fn flowNoise(p: vec2f, layer: f32) -> f32 {
  return snoise2(p + u.seed + drift(layer) + vec2f(layer * 7.13, layer * 3.71));
}

fn safeTanh(x: f32) -> f32 {
  return tanh(clamp(x, -9.0, 9.0));
}

fn paletteRange() -> vec2f {
  var l = u.bg.x;
  var c = length(u.bg.yz);
  for (var i = 0; i < 6; i++) {
    if (i >= u.count) { break; }
    l = max(l, u.colors[i].x);
    c = max(c, length(u.colors[i].yz));
  }
  return vec2f(l, c);
}

fn filmGrade(lab: vec3f) -> vec3f {
  let range = paletteRange();
  var l = max(lab.x, 0.0);
  let shoulder = max(range.x, 0.8);
  if (l > shoulder) {
    let room = max(1.0 - shoulder, 1e-3);
    l = shoulder + room * safeTanh((l - shoulder) / room);
  }
  let c = length(lab.yz);
  let cap = 0.05 + 0.9 * l * (1.0 - l) * (0.5 + 0.5 * l);
  let knee = max(range.y, 0.6 * cap);
  let top = max(cap, knee + 0.02);
  var soft = c;
  if (c > knee) { soft = knee + (top - knee) * safeTanh((c - knee) / (top - knee)); }
  var k = 1.0;
  if (c > 1e-5) { k = soft / c; }
  return vec3f(l, lab.yz * k);
}

fn vignette(p: vec2f, amount: f32) -> f32 {
  let q = p / (0.5 * u.full / min(u.full.x, u.full.y));
  return 1.0 - amount * smoothstep(0.35, 1.45, dot(q, q) * 0.55);
}

fn frameHalf() -> vec2f {
  return 0.5 * u.full / min(u.full.x, u.full.y);
}

fn seedAngle() -> f32 {
  return fract(u.seed.x * 0.1371 + u.seed.y * 0.0713) * 6.28318530718;
}

fn labMix(a: vec3f, b: vec3f, t: f32) -> vec3f {
  var m = mix(a, b, t);
  let target_ = mix(length(a.yz), length(b.yz), t);
  let current = length(m.yz);
  if (current > 1e-4) {
    m = vec3f(m.x, m.yz * mix(1.0, target_ / current, 0.75));
  }
  return m;
}

fn paletteColor(i: i32) -> vec3f {
  return u.colors[clamp(i, 0, u.count - 1)].xyz;
}

fn ramp(t: f32) -> vec3f {
  let x = clamp(t, 0.0, 1.0) * f32(u.count - 1);
  let i = i32(floor(x));
  var f = x - f32(i);
  f = f * f * (3.0 - 2.0 * f);
  return labMix(paletteColor(i), paletteColor(i + 1), f);
}

fn interact(p0: vec2f) -> vec2f {
  var p = p0;
  let half_ = frameHalf();
  var ptr = (u.pointer.xy - 0.5) * 2.0 * half_;
  ptr.y = -ptr.y;
  let d = p - ptr;
  let f = exp(-dot(d, d) * 5.0) * u.pointer.z;
  p -= d * f * 0.45;
  p.y += u.scroll * 0.08 * (0.6 + 0.4 * sin(p.x * 3.0));
  return p;
}
`;

export const wgslPostlude = /* wgsl */ `
fn oklabToLinear(lab: vec3f) -> vec3f {
  var l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  var m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  var s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3f(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

fn linearToSrgb(c0: vec3f) -> vec3f {
  let c = clamp(c0, vec3f(0.0), vec3f(1.0));
  let lo = c * 12.92;
  let hi = 1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055;
  return select(hi, lo, c <= vec3f(0.0031308));
}

fn hashU(x0: u32) -> u32 {
  var x = x0;
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}

fn hash01(p: vec2u, s: u32) -> f32 {
  return f32(hashU(p.x ^ hashU(p.y ^ hashU(s)))) / 4294967295.0;
}

const BAYER = array<f32, 16>(
  0.0, 8.0, 2.0, 10.0,
  12.0, 4.0, 14.0, 6.0,
  3.0, 11.0, 1.0, 9.0,
  15.0, 7.0, 13.0, 5.0
);

@fragment
fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  // Top-left origin already, so no flip: GL's (tile.w - fragCoord.y) is this y.
  let px = vec2f(u.tile.x + fragCoord.x, u.tile.y + fragCoord.y);
  let dither = u.dither.x > 0.5;
  let cell = floor(px / u.dither.y);
  let samplePx = select(px, (cell + 0.5) * u.dither.y, dither);

  let uv = samplePx / u.full;
  var p = (samplePx - 0.5 * u.full) / min(u.full.x, u.full.y);
  p.y = -p.y;
  p = interact(p);

  var rgb = linearToSrgb(oklabToLinear(kindColor(p, uv)));

  let ip = vec2u(px);
  let frame = u32(u.frame);
  let n = hash01(ip, frame * 2u + 1u) + hash01(ip, frame * 2u + 2u) - 1.0;
  let lum = dot(rgb, vec3f(0.2126, 0.7152, 0.0722));
  let amp = u.grain * 0.2 * (0.55 + 0.9 * lum * (1.0 - lum)) + select(1.0 / 255.0, 0.0, dither);
  rgb += n * amp;

  if (dither) {
    let b = vec2i(gmod2(cell, 4.0));
    let threshold = (BAYER[b.y * 4 + b.x] + 0.5) / 16.0;
    let steps = u.dither.z - 1.0;
    rgb = floor(clamp(rgb, vec3f(0.0), vec3f(1.0)) * steps + threshold) / steps;
  }

  return vec4f(clamp(rgb, vec3f(0.0), vec3f(1.0)), 1.0);
}
`;

/** The full fragment shader for a kind's `wgsl`, the twin of renderer.ts's GLSL assembly. */
export function composeWgsl(kindWgsl: string): string {
  return `${wgslPrelude}\n${kindWgsl}\n${wgslPostlude}`;
}
