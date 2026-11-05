/**
 * WGSL twin of the rise kind's GLSL (rise.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  let h = frameHalf();
  let lightBg = smoothstep(0.55, 0.85, u.bg.x);
  let placement = fract(u.seed.x * 0.0619 + 0.13);
  var angle = 0.0;
  if (placement > 0.85) {
    angle = 3.14159265;
  } else if (placement > 0.7) {
    angle = 0.62;
  } else if (placement > 0.55) {
    angle = -0.62;
  }
  let lips = floor(fract(u.seed.y * 0.0377 + 0.31) * 3.0);
  let q = rot2(angle) * p;
  let reach = abs(cos(angle)) * h.y + abs(sin(angle)) * h.x;

  var radius = 0.62 / u.scale;
  radius *= 1.0 + 0.14 * flowNoise(vec2f(0.37, 0.91), 1.0);
  let centre = vec2f(0.5 * flowNoise(vec2f(1.7, 0.3), 2.0), -reach - 0.3 * radius + 0.1 * u.loopv.y);
  let d2 = (q - centre) * vec2f(0.62, 1.0);
  let r = length(d2);
  let x = q.x / max(h.x, 1e-3);

  let ripple = 0.06 * flowNoise(vec2f(q.x * 0.9, 0.5), 3.0)
    + 0.015 * flowNoise(vec2f(q.x * 2.0, 4.5), 4.0);
  let d = r - radius + u.warp * ripple;

  let fall = (0.07 + 0.32 * u.blur) * (1.0 + 0.7 * x * x) * (0.7 + 0.3 * radius);
  let outside = max(d, 0.0);
  let glow = exp(-outside / fall);
  let inner = (0.12 + 0.2 * u.blur) * max(1.0, radius);
  let t = select(0.4 + 0.6 * (1.0 - exp(-outside / (1.8 * fall))), 0.4 * exp(d / inner), d < 0.0);
  var col = ramp(t);

  let lipW = 0.025 + 0.07 * u.blur;
  let lip = exp(-d * d / (lipW * lipW));
  var stack = 0.0;
  for (var i = 1; i < 3; i++) {
    if (f32(i) > lips) { break; }
    var off = d + f32(i) * (0.06 + 0.05 * u.blur) * (0.8 + 0.4 * radius);
    off += 0.02 * u.warp * flowNoise(vec2f(q.x * 1.4, f32(i) * 3.1), 5.0 + f32(i));
    stack += exp(-off * off / (lipW * lipW * 0.8)) * (1.0 - 0.25 * f32(i));
  }
  let hot = vec3f(min(1.0, paletteColor(0).x + 0.05), paletteColor(0).yz * 0.6);
  col = labMix(col, hot, clamp((lip * 0.28 + stack * 0.45) * (1.0 - 0.6 * lightBg), 0.0, 1.0));
  col.x += 0.05 * stack * (1.0 - lightBg);

  var lab = labMix(u.bg, col, glow);
  let haze = exp(-outside / (0.7 + 0.7 * u.blur)) * (1.0 - glow);
  lab = labMix(lab, ramp(0.8), 0.24 * haze * (1.0 - lightBg));
  lab.x *= vignette(p, 0.25 * (1.0 - lightBg));
  return filmGrade(lab);
}
`;
