/**
 * WGSL twin of the limb kind's GLSL (limb.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
// A planet much larger than the frame, or a moon inside it, lit from one
// side. The light is three layers: a thin crest at the edge, a saturated
// band just inside it, and atmosphere glowing just outside. warp sets how
// far the light wraps round; blur softens every layer.
fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  var h = frameHalf();
  // The seed picks the body: a planet whose top arc crosses the frame, a
  // horizon tilted across the frame, a moon lit from the side, a planet
  // hanging from the top edge, a planet filling one side, a planet crossing
  // the frame on a diagonal, or a small moon lit from behind, ringed in light.
  var framing = floor(fract(u.seed.x * 0.0731 + 0.5) * 7.0);
  var side = sign(u.seed.y + 0.01);
  var tilt = sin(seedAngle());
  var radius = 0.95;
  var centre = vec2f(0.0, -1.02 + (1.0 - u.scale) * 0.3);
  // Arcs are lit from a little off overhead, so one end of the arc fades.
  var lightAngle = 0.5 * tilt;
  var backlit = 0.0;
  if (framing == 1.0) {
    radius = 2.6;
    centre = vec2f(0.9 * side, -2.62);
    lightAngle = side * 0.35 + 0.2 * tilt;
  } else if (framing == 2.0) {
    radius = 0.3;
    centre = vec2f(0.18 * h.x * side, 0.0);
    lightAngle = side * 1.9 + 0.2 * tilt;
  } else if (framing == 3.0) {
    radius = 1.1;
    centre = vec2f(0.2 * side, 1.38);
    lightAngle = 3.14159265 + 0.4 * tilt;
  } else if (framing == 4.0) {
    radius = 1.3;
    centre = vec2f(-side * (h.x + 0.98), -0.15);
    lightAngle = side * (1.45 + 0.2 * tilt);
  } else if (framing == 5.0) {
    radius = 1.25;
    centre = vec2f(-side * (h.x + 0.5), -h.y - 0.62);
    lightAngle = side * 0.78;
  } else if (framing == 6.0) {
    radius = 0.2;
    centre = vec2f(0.0, 0.02);
    lightAngle = 0.4 * tilt;
    backlit = 1.0;
  }
  radius *= u.scale;
  lightAngle += 0.9 * u.loopv.y;
  var light = vec2f(sin(lightAngle), cos(lightAngle));

  var d = p - centre;
  var r = length(d);
  var dir = d / max(r, 1e-4);
  var x = r - radius;

  // How squarely each point of the rim faces the light. warp lets the
  // light wrap further round the body.
  var facing = dot(dir, light);
  var lit = smoothstep(-0.15 - 0.6 * u.warp, 0.95, facing);
  lit *= lit;
  // A body lit from behind glows all the way round.
  lit = mix(lit, 0.45 + 0.55 * lit, backlit);

  // The atmosphere breathes and drifts along the arc.
  var shimmer = 0.7 + 0.3 * flowNoise(dir * 2.4 + vec2f(x * 3.0, 0.0), 1.0);
  // A small backlit moon shows its whole rim, so keep its outline round.
  shimmer = mix(shimmer, 1.0, 0.7 * backlit);

  var b = 0.6 + 0.8 * u.blur;
  var inside = 1.0 - smoothstep(-0.006 * b, 0.004 * b, x);
  // Outside the edge: a pale atmosphere band that holds, then fades.
  // The atmosphere breathes with the loop phase: the same depth at any
  // speed above 0.5, fading out toward a still frame at speed 0, and never
  // thinner than 0.5x, so the falloff below never divides by zero.
  var loopR = length(u.loopv);
  var breath = 0.0;
  if (loopR > 1e-4) { breath = (u.loopv.x / loopR) * min(loopR / 0.3, 1.0); }
  var atmosW = 0.07 * b * (0.7 + 0.6 * u.warp) * (1.0 + 0.5 * breath);
  var xa = max(x, 0.0) / atmosW;
  var atmos = smoothstep(-0.02 * b, 0.0, x) / (1.0 + xa * xa * xa * xa);
  // The edge itself, in the saturated colour, then the body falling away.
  var edgeBand = exp(-pow(x / (0.03 * b), 2.0));
  var band = inside * exp(x / (0.09 * b));
  var deep = inside * exp(x / (0.35 * b));
  var halo = exp(-max(x, 0.0) / (0.18 * b));

  var glow = (0.6 * atmos * shimmer + 0.8 * edgeBand + 0.6 * band + 0.25 * deep + 0.12 * halo) * lit;

  // The atmosphere in colour 0, the edge in 1, the body through 2 to the last.
  var col = labMix(paletteColor(2), paletteColor(u.count - 1), clamp(1.0 - band, 0.0, 1.0));
  col = labMix(col, paletteColor(1), clamp(edgeBand * 1.1 + 0.5 * band, 0.0, 1.0));
  col = labMix(col, paletteColor(0), clamp(0.8 * atmos * (0.75 + 0.25 * shimmer) * smoothstep(-0.004, 0.025 * b, x), 0.0, 1.0));

  var lab = labMix(u.bg, col, clamp(glow, 0.0, 1.0));
  return filmGrade(lab);
}
`;
