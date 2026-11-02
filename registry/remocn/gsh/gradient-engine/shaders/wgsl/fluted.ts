/**
 * WGSL twin of the fluted kind's GLSL (fluted.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
// The light behind the glass at q: intensity (x) and the column's core (y).
fn flLight(q: vec2f, h: vec2f, mode: f32, side: f32) -> vec2f {
  var soft = 0.5 + 0.9 * u.blur;
  var ribbon = 0.0;
  if (mode != 1.0) {
    // A ribbon sweeping corner to corner, bending with the flow.
    var a = -0.6 + (side - 0.5) * 0.9;
    var dir = vec2f(cos(a), sin(a));
    var n = vec2f(-dir.y, dir.x);
    // GLSL calls this u, which would shadow the uniform block here.
    var ru = dot(q, dir);
    var v = dot(q, n) - 0.18 * sin(ru * 2.2 + 1.3 * side) * h.y;
    v += 0.1 * flowNoise(vec2f(ru * 0.8, 0.2), 1.0);
    // Lit from above: a crisp bright lip, then a long fall into the dark.
    var w = 0.13 * soft;
    var lip = select(exp(v / (1.4 * w)), exp(-v * v / (0.5 * w * w)), v > 0.0);
    var glow = exp(-abs(v) / (5.0 * w));
    // A second, fainter fold under the first.
    var v2 = v + 0.3 + 0.06 * flowNoise(vec2f(ru * 0.7, 2.1), 2.0);
    var fold = 0.3 * select(exp(v2 / (2.0 * w)), exp(-v2 * v2 / (0.2 * w * w)), v2 > 0.0);
    ribbon = (0.95 * lip + 0.15 * glow + 0.75 * fold) * (0.8 + 0.2 * flowNoise(vec2f(ru * 1.5, 3.0), 3.0));
  }
  var column = 0.0;
  var core = 0.0;
  if (mode == 1.0) {
    // An arch: the top of a big soft disc rising from below, its rim lit
    // hardest at the crown and its body falling away into the dark.
    var c = vec2f((side - 0.5) * 1.1 * h.x, -1.35 * h.y) + vec2f(0.06, 0.03) * drift(4.0);
    var radius = 1.05 * h.y + 0.3 * h.x * abs(side - 0.5);
    var d = (q - c) * vec2f(0.8, 1.0);
    var r = length(d);
    var x = r - radius + 0.03 * flowNoise(d * 1.4, 5.0);
    var crown = 0.45 + 0.55 * smoothstep(-0.2, 1.0, d.y / max(r, 1e-3));
    var w = 0.08 * soft;
    var rim = exp(-x * x / (w * w));
    var body = select(exp(-x / (0.22 * soft)), exp(x / (0.3 * soft)), x < 0.0);
    column = 0.85 * (0.5 * rim + 0.75 * body) * crown;
  } else if (mode == 2.0) {
    var x0 = (side - 0.5) * 0.9 * h.x + 0.04 * drift(4.0).x + 0.025 * flowNoise(vec2f(0.5, q.y * 1.2), 7.0);
    var dx = q.x - x0;
    var tall = smoothstep(-1.2 * h.y, 0.3 * h.y, q.y + 0.15 * flowNoise(vec2f(0.3, q.y), 5.0));
    core = exp(-dx * dx / (0.006 * soft)) * mix(0.6, 1.0, tall);
    column = 0.85 * core + 0.35 * exp(-abs(dx) / (0.16 * soft)) * mix(0.55, 1.0, tall);
  }
  return vec2f(ribbon + column, core);
}

fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  var h = frameHalf();
  var minSide = min(u.full.x, u.full.y);
  var mode = floor(fract(u.seed.x * 0.0731 + 0.5) * 3.0);
  var side = fract(u.seed.y * 0.0917 + 0.5);

  // Flutes: an uneven but monotonic stretch of x, so widths vary.
  var w = (2.0 * h.x) / (36.0 * u.scale);
  var x = p.x / w;
  var xf = x + 0.32 * sin(x * 0.61 + 1.7) + 0.18 * sin(x * 1.37 + 0.4);
  // GLSL calls this u, which would shadow the uniform block here.
  var fu = fract(xf);
  var idx = floor(xf);
  // Progressive refraction: the image slides across each flute.
  var shift = (0.3 + 1.6 * u.warp) * w;
  var q = p;
  q.x += (fu - 0.5) * shift;
  // Each flute leans the image a touch, so diagonal edges turn into teeth.
  q.y += (fu - 0.5) * shift * 0.35 * sin(idx * 2.3);

  var light = flLight(q, h, mode, side);
  var t = clamp(pow(light.x, 1.15), 0.0, 1.0);
  var col = ramp(t);
  col = labMix(col, paletteColor(u.count - 1), light.y * 0.85);
  var lab = labMix(u.bg, col, smoothstep(0.0, 0.45, t));

  // Glass: the curve catches a thin highlight near one side of each flute
  // and darkens toward the seams.
  var seen = clamp(length(lab - u.bg) * 4.0, 0.0, 1.0);
  // Hand-made glass: each flute is a touch brighter or darker.
  lab.x *= 1.0 + 0.07 * seen * (fract(sin(idx * 12.9898) * 43758.5453) - 0.5);
  var curve = sin(fu * 3.14159265);
  lab.x += (0.05 * exp(-pow((fu - 0.28) / 0.07, 2.0)) - 0.04 * (1.0 - curve)) * mix(0.35, 1.0, seen);
  var seamPx = min(fu, 1.0 - fu) * w * minSide;
  lab.x -= 0.05 * (1.0 - smoothstep(0.0, 1.2, seamPx)) * seen;
  var lightBg = smoothstep(0.55, 0.85, u.bg.x);
  lab.x *= vignette(p, 0.3 * (1.0 - lightBg));
  return filmGrade(lab);
}
`;
