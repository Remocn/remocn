/**
 * WGSL twin of the halo kind's GLSL (halo.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
// A thick torus of light: the inner edge is crisp, the body holds its
// brightness then rolls off into a wide haze. warp sets how lopsided the
// light is and how far the hue wanders round the ring; blur softens the
// rim and widens the haze.
fn haloBody(x: f32, soft: f32, width: f32) -> f32 {
  var edge = smoothstep(-soft, soft, x);
  var xo = max(x, 0.0) / width;
  var x4 = xo * xo * xo * xo;
  return edge / (1.0 + x4 * x4);
}

fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  var lightBg = smoothstep(0.55, 0.85, u.bg.x);
  var h = frameHalf();
  // The seed picks a framing: centred, rising from the bottom edge, off to
  // one side, hanging in a top corner and cropped by the frame, or tilted
  // into an ellipse, as if seen at an angle, centred or low like a portal.
  var framing = floor(fract(u.seed.x * 0.0731 + 0.5) * 6.0);
  var side = sign(u.seed.y + 0.01);
  var centre = vec2f(0.0, 0.0);
  var radius = 0.19;
  var tilt = 0.0;
  var squash = 1.0;
  if (framing == 1.0) {
    centre = vec2f(0.0, -0.56);
    radius = 0.3;
  } else if (framing == 2.0) {
    centre = vec2f(0.34 * h.x * side, -0.02);
    radius = 0.2;
  } else if (framing == 3.0) {
    centre = vec2f(-side * (h.x - 0.12), h.y - 0.1);
    radius = 0.3;
  } else if (framing == 4.0) {
    radius = 0.3;
    tilt = 0.22 * side;
    squash = 0.4;
  } else if (framing == 5.0) {
    centre = vec2f(0.0, -0.3);
    radius = 0.44;
    tilt = 0.08 * side;
    squash = 0.28;
  }
  radius *= u.scale;

  // The hot side sways slowly round the ring.
  var swing = seedAngle() + 2.4 * u.loopv.x;
  var hotDir = vec2f(sin(swing), cos(swing));

  var d = rot2(tilt) * (p - centre);
  d.y /= squash;
  var r = length(d);
  var dir = d / max(r, 1e-4);
  var x = r / radius - 1.0;

  var soft = 0.01 + 0.06 * u.blur;
  var width = 0.42 + 0.2 * u.blur;
  var hot = 0.5 + 0.5 * dot(dir, hotDir);
  var key = mix(1.0, 0.22 + 0.78 * hot * hot, 0.3 + 0.6 * u.warp);

  // Noise sampled on the unit circle (so it has no seam) drifts the hue
  // and, a little, the thickness round the ring.
  var around = flowNoise(dir * 0.8 + vec2f(3.1, 0.0), 2.0);
  var body = haloBody(x, soft, width * (1.0 + 0.07 * u.warp * flowNoise(dir * 0.7, 1.0)));
  // A ghost exposure, nudged toward the hot side: a doubled, glassy rim.
  var dg = d - hotDir * radius * 0.08;
  var xg = length(dg) / radius - 1.06;
  var ghost = smoothstep(-soft, soft, xg) * exp(-max(xg, 0.0) / (0.05 + 0.08 * u.blur));
  var haze = exp(-max(x, 0.0) / (0.6 + 0.8 * u.blur)) * smoothstep(0.0, width, x);
  // Faint tinted fog inside the core, so the dark has depth.
  var fog = (1.0 - smoothstep(-soft, soft, x)) * exp(x / 0.25);

  var glow = 0.95 * body * key + 0.3 * ghost * (0.3 + 0.7 * hot) + 0.12 * haze * (0.4 + 0.6 * key) + 0.12 * fog * (0.3 + 0.7 * hot);

  // Colour: the inner rim runs hot (colour 0), the body moves through the
  // palette outward, and the hue drifts round the ring.
  var depth = clamp(max(x, 0.0) / (width * 1.6), 0.0, 1.0);
  var t = clamp(0.12 + 0.45 * depth + 0.5 * u.warp * (0.5 + 0.5 * around) + 0.35 * (1.0 - hot), 0.0, 1.0);
  var col = ramp(t);
  var rimLine = smoothstep(-soft, soft, x) * exp(-max(x, 0.0) / (0.06 + 0.1 * u.blur));
  col = labMix(col, paletteColor(0), rimLine * hot * 0.8);
  col = labMix(col, paletteColor(u.count - 1), fog * 0.6);

  var lab = labMix(u.bg, col, clamp(glow, 0.0, 1.0));
  lab.x += 0.08 * max(glow - 0.85, 0.0) * (1.0 - lightBg);
  return filmGrade(lab);
}
`;
