/**
 * WGSL twin of the linear-flow kind's GLSL (linear-flow.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  var h = frameHalf();
  var angle = 0.6 + 1.2 * (fract(u.seed.y * 0.137) - 0.5) + 0.3 * u.loopv.y;
  var dir = vec2f(cos(angle), sin(angle));
  var perp = vec2f(-dir.y, dir.x);
  var extent = abs(dir.x) * h.x + abs(dir.y) * h.y;
  var a = dot(p, dir) / extent;
  var b = dot(p, perp) / extent;
  // Iso-lines bow, as if the light wraps round a curved surface.
  var s = a + 0.16 * b * b - 0.05;
  s += u.warp * 0.18 * flowNoise(p * 0.6 * u.scale, 1.0);
  var t = clamp(0.5 + 0.5 * s * u.scale, 0.0, 1.0);
  var lab = ramp(t * t * (3.0 - 2.0 * t));

  // Light leak: a soft streak along the iso-lines toward the bright end.
  var w = 0.1 + 0.18 * u.blur;
  var sd = (s - 0.5 + 0.08 * flowNoise(vec2f(b * 1.1, 3.0), 2.0)) / w;
  var streak = exp(-sd * sd) * (0.65 + 0.35 * flowNoise(vec2f(b * 2.2, 7.0), 3.0));
  lab.x += 0.12 * streak;
  lab = vec3f(lab.x, lab.yz * (1.0 - 0.3 * streak));

  // The dark end falls into shadow and the corners sink toward the base colour.
  var dark = 1.0 - smoothstep(0.55, 0.85, u.bg.x);
  lab.x *= mix(1.0, mix(0.72, 1.0, smoothstep(-1.2, 0.1, s)), dark);
  var corner = smoothstep(0.45, 1.15, length(p / h) * 0.75);
  lab = labMix(lab, u.bg, corner * 0.3);
  lab.x *= vignette(p, 0.2 * dark);
  return filmGrade(lab);
}
`;
