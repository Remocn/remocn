/**
 * Shared GLSL for every kind. A kind supplies `vec3 kindColor(vec2 p, vec2 uv)`
 * returning OKLab; the prelude gives it noise, palette helpers and coordinates,
 * and the postlude converts to sRGB and applies grain and dither.
 *
 * Coordinates are always derived from the full image (u_full) plus the tile
 * origin (u_tile), so a tiled render matches a full render pixel for pixel.
 * Motion only ever reads u_loop, a point on a circle, so frames repeat exactly
 * every loop.
 */

export const vertexShader = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const fragmentPrelude = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 u_full;       // full image size in pixels
uniform vec4 u_tile;       // tile x, y (top-left origin), width, height
uniform vec2 u_loop;       // (cos, sin)(phase) * speed * radius
uniform vec2 u_seed;       // seed offset in noise space
uniform float u_scale;
uniform float u_warp;
uniform float u_blur;
uniform float u_grain;
uniform float u_frame;     // grain seed
uniform vec3 u_dither;     // enabled, cell, levels
uniform vec3 u_colors[6];  // OKLab
uniform int u_count;
uniform vec3 u_bg;         // OKLab
uniform vec3 u_pointer;    // x, y in image uv (top-left origin), influence
uniform float u_scroll;    // smoothed scroll velocity * influence

out vec4 outColor;

// 4D simplex noise. Ian McEwan, Stefan Gustavson, Ashima Arts (MIT).
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
float permute(float x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float taylorInvSqrt(float r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec4 grad4(float j, vec4 ip) {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p, s;
  p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;
  return p;
}
float snoise(vec4 v) {
  const vec4 C = vec4(0.138196601125011, 0.276393202250021, 0.414589803375032, -0.447213595499958);
  vec4 i = floor(v + dot(v, vec4(0.309016994374947451)));
  vec4 x0 = v - i + dot(i, C.xxxx);
  vec4 i0;
  vec3 isX = step(x0.yzw, x0.xxx);
  vec3 isYZ = step(x0.zww, x0.yyz);
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;
  vec4 i3 = clamp(i0, 0.0, 1.0);
  vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
  vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);
  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;
  i = mod289(i);
  float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute(permute(permute(permute(
      i.w + vec4(i1.w, i2.w, i3.w, 1.0))
    + i.z + vec4(i1.z, i2.z, i3.z, 1.0))
    + i.y + vec4(i1.y, i2.y, i3.y, 1.0))
    + i.x + vec4(i1.x, i2.x, i3.x, 1.0));
  vec4 ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);
  vec4 p0 = grad4(j0, ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4, p4));
  vec3 m0 = max(0.6 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3, x3), dot(x4, x4)), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * (dot(m0 * m0, vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2)))
    + dot(m1 * m1, vec2(dot(p3, x3), dot(p4, x4))));
}

// 2D simplex noise, same authors and licence. About a third of the cost of
// snoise(vec4), so kinds use it for structure and keep the 4D noise for the
// few places that need the field itself to morph.
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 10.0) * x); }
float snoise2(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Time coordinates for a noise layer. Every layer moves on its own circle.
vec2 loopAt(float layer) {
  return u_loop + vec2(layer * 1.71, layer * -2.37);
}

// Looping noise: spatial position plus a point on the time circle.
float loopNoise(vec2 p, float layer) {
  return snoise(vec4(p + u_seed, loopAt(layer)));
}

// Three octaves; blur fades out the fine ones.
float fbm(vec2 p, float layer) {
  float fine = 1.0 - 0.85 * u_blur;
  float sum = loopNoise(p, layer);
  sum += 0.5 * fine * loopNoise(p * 2.03 + 17.1, layer + 0.5);
  sum += 0.25 * fine * fine * loopNoise(p * 4.07 - 9.7, layer + 1.0);
  return sum / (1.0 + 0.5 * fine + 0.25 * fine * fine);
}

// The loop point rotated per layer. Translating a field by it is seamless,
// and layers drifting in different directions read as slow morphing.
vec2 drift(float layer) {
  float a = layer * 2.39996;
  float c = cos(a);
  float s = sin(a);
  return mat2(c, s, -s, c) * u_loop;
}

// Cheap looping noise: a 2D field translated around the loop circle.
float flowNoise(vec2 p, float layer) {
  return snoise2(p + u_seed + drift(layer) + vec2(layer * 7.13, layer * 3.71));
}

// The loop angle as a unit vector, so waves can travel a whole period per
// loop. Frozen when speed is 0.
vec2 loopTurn() {
  float r = length(u_loop);
  return r > 1e-6 ? u_loop / r : vec2(1.0, 0.0);
}

// sin(a - angle), where cs = (cos, sin)(angle).
float turnSin(float a, vec2 cs) {
  return sin(a) * cs.x - cos(a) * cs.y;
}

mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, s, -s, c);
}

// tanh that stays finite: some GPUs evaluate tanh(x) as a ratio of exps,
// which is inf/inf = NaN for large x.
float safeTanh(float x) {
  return tanh(clamp(x, -9.0, 9.0));
}

// The brightest lightness and strongest chroma among the supplied colours.
vec2 paletteRange() {
  float l = u_bg.x;
  float c = length(u_bg.yz);
  for (int i = 0; i < 6; i++) {
    if (i >= u_count) break;
    l = max(l, u_colors[i].x);
    c = max(c, length(u_colors[i].yz));
  }
  return vec2(l, c);
}

// Filmic grade in OKLab for the light a kind adds. It is an identity map for
// anything inside the palette's own range, so supplied colours and theme
// tokens render as chosen. Only highlights pushed past the brightest colour
// get a soft shoulder, and only chroma pushed past both the most saturated
// colour and a film-like cap (which eases off toward black and white) rolls off.
vec3 filmGrade(vec3 lab) {
  vec2 range = paletteRange();
  float l = max(lab.x, 0.0);
  float shoulder = max(range.x, 0.8);
  if (l > shoulder) {
    float room = max(1.0 - shoulder, 1e-3);
    l = shoulder + room * safeTanh((l - shoulder) / room);
  }
  float c = length(lab.yz);
  float cap = 0.05 + 0.9 * l * (1.0 - l) * (0.5 + 0.5 * l);
  float knee = max(range.y, 0.6 * cap);
  float top = max(cap, knee + 0.02);
  float soft = c <= knee ? c : knee + (top - knee) * safeTanh((c - knee) / (top - knee));
  float k = c > 1e-5 ? soft / c : 1.0;
  return vec3(l, lab.yz * k);
}

// Darkens the corners in OKLab lightness; amount 0..1.
float vignette(vec2 p, float amount) {
  vec2 q = p / (0.5 * u_full / min(u_full.x, u_full.y));
  return 1.0 - amount * smoothstep(0.35, 1.45, dot(q, q) * 0.55);
}

// Half the frame size in p units; the short side spans -0.5..0.5.
vec2 frameHalf() {
  return 0.5 * u_full / min(u_full.x, u_full.y);
}

float seedAngle() {
  return fract(u_seed.x * 0.1371 + u_seed.y * 0.0713) * 6.28318530718;
}

// Mix in OKLab, then pull chroma back toward the endpoints so midpoints stay vivid.
vec3 labMix(vec3 a, vec3 b, float t) {
  vec3 m = mix(a, b, t);
  float target = mix(length(a.yz), length(b.yz), t);
  float current = length(m.yz);
  if (current > 1e-4) {
    m.yz *= mix(1.0, target / current, 0.75);
  }
  return m;
}

vec3 paletteColor(int i) {
  return u_colors[clamp(i, 0, u_count - 1)];
}

// Smooth ramp through the palette, t in 0..1.
vec3 ramp(float t) {
  float x = clamp(t, 0.0, 1.0) * float(u_count - 1);
  int i = int(floor(x));
  float f = x - float(i);
  f = f * f * (3.0 - 2.0 * f);
  return labMix(paletteColor(i), paletteColor(i + 1), f);
}

// Pointer: a soft lens that pulls the field toward the cursor.
// Scroll: velocity shears the field vertically.
vec2 interact(vec2 p) {
  vec2 half_ = frameHalf();
  vec2 ptr = (u_pointer.xy - 0.5) * 2.0 * half_;
  ptr.y = -ptr.y;
  vec2 d = p - ptr;
  float f = exp(-dot(d, d) * 5.0) * u_pointer.z;
  p -= d * f * 0.45;
  p.y += u_scroll * 0.08 * (0.6 + 0.4 * sin(p.x * 3.0));
  return p;
}
`;

export const fragmentPostlude = `
vec3 oklabToLinear(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 linearToSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  vec3 lo = c * 12.92;
  vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
  return mix(hi, lo, vec3(lessThanEqual(c, vec3(0.0031308))));
}

uint hashU(uint x) {
  x ^= x >> 16;
  x *= 0x7feb352du;
  x ^= x >> 15;
  x *= 0x846ca68bu;
  x ^= x >> 16;
  return x;
}

float hash01(uvec2 p, uint s) {
  return float(hashU(p.x ^ hashU(p.y ^ hashU(s)))) / 4294967295.0;
}

const float BAYER[16] = float[16](
  0.0, 8.0, 2.0, 10.0,
  12.0, 4.0, 14.0, 6.0,
  3.0, 11.0, 1.0, 9.0,
  15.0, 7.0, 13.0, 5.0
);

void main() {
  vec2 px = vec2(u_tile.x + gl_FragCoord.x, u_tile.y + (u_tile.w - gl_FragCoord.y));
  bool dither = u_dither.x > 0.5;
  vec2 cell = floor(px / u_dither.y);
  vec2 samplePx = dither ? (cell + 0.5) * u_dither.y : px;

  vec2 uv = samplePx / u_full;
  vec2 p = (samplePx - 0.5 * u_full) / min(u_full.x, u_full.y);
  p.y = -p.y;
  p = interact(p);

  vec3 rgb = linearToSrgb(oklabToLinear(kindColor(p, uv)));

  // Triangular, deterministic grain seeded by the frame. A trace stays on even
  // at grain 0 to break up 8-bit banding.
  uvec2 ip = uvec2(px);
  uint frame = uint(u_frame);
  float n = hash01(ip, frame * 2u + 1u) + hash01(ip, frame * 2u + 2u) - 1.0;
  float lum = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
  float amp = u_grain * 0.2 * (0.55 + 0.9 * lum * (1.0 - lum)) + (dither ? 0.0 : 1.0 / 255.0);
  rgb += n * amp;

  if (dither) {
    ivec2 b = ivec2(mod(cell, 4.0));
    float threshold = (BAYER[b.y * 4 + b.x] + 0.5) / 16.0;
    float steps = u_dither.z - 1.0;
    rgb = floor(clamp(rgb, 0.0, 1.0) * steps + threshold) / steps;
  }

  outColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
}
`;
