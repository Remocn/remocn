/**
 * WGSL twin of the smear kind's GLSL (smear.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn smearNoise(p: vec2f, layer: f32) -> f32 { return snoise2(p + u.seed + 0.35 * drift(layer) + vec2f(layer * 7.13, layer * 3.71)); }
fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  let lightBg = smoothstep(0.55, 0.85, u.bg.x);
  let a = 0.5 * sin(seedAngle()) + select(0.0, 1.5708, fract(u.seed.y * 0.071) <= 0.5) * 0.35;
  var q = rot2(a) * p * u.scale;
  q.y = q.y + (0.05 + 0.2 * u.warp) * smearNoise(vec2f(q.x * 0.45, 0.3), 1.0);
  let stretch = 0.3 + 0.35 * (1.0 - u.blur);
  let ss = vec2f(q.x * stretch, q.y * 1.5) * 1.6;
  let bloom = smearNoise(ss, 2.0) + 0.5 * smearNoise(ss * vec2f(1.7, 2.3) + 3.3, 3.0);
  let hue = 0.5 + 0.5 * smearNoise(ss * 0.7 + 11.0, 4.0);
  let edge = 0.04 + 0.32 * u.blur;
  let m = smoothstep(0.12 - edge, 0.12 + edge, bloom);
  let streak = smearNoise(vec2f(q.x * 0.5, q.y * 12.0 / (0.6 + u.blur)), 5.0);
  var col = ramp(clamp(hue + 0.08 * streak, 0.0, 1.0)); col.x = col.x + 0.045 * streak;
  var ground = u.bg;
  let shade = 0.5 + 0.5 * smearNoise(ss * 0.6 - 7.0, 6.0);
  ground = labMix(ground, paletteColor(u.count - 1), 0.12 * shade); ground.x = ground.x + 0.01 * streak;
  var lab = labMix(ground, col, m * (0.82 + 0.18 * shade));
  let core = smoothstep(0.75, 1.25, bloom + 0.2 * streak);
  lab = labMix(lab, paletteColor(u.count - 1), 0.3 * core);
  lab.x = lab.x * vignette(p, 0.18 * (1.0 - lightBg));
  return filmGrade(lab);
}
`;
