/**
 * WGSL twin of the void kind's GLSL (void.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  let h = frameHalf();
  let framing = floor(fract(u.seed.x * 0.0731 + 0.5) * 4.0);
  let side = select(-1.0, 1.0, u.seed.y + 0.01 >= 0.0);
  var centre = vec2f(0.06 * h.x * sin(u.seed.y), 0.03 * cos(u.seed.x));
  var radius = 0.25;
  if (framing == 1.0) { centre = vec2f(0.5 * h.x * side, 0.04); radius = 0.22; }
  else if (framing == 2.0) { centre = vec2f(0.12 * h.x * side, -h.y - 0.08); radius = 0.36; }
  else if (framing == 3.0) { centre = vec2f(-side * (h.x - 0.05), h.y - 0.05); radius = 0.3; }
  let breathe = 1.0 + 0.035 * flowNoise(vec2f(0.37, 0.71), 1.0);
  radius *= u.scale * breathe;
  let d = p - centre;
  let r = length(d);
  let dir = d / max(r, 1e-4);
  let fineAmount = 1.0 - 0.75 * u.blur;
  let broad = flowNoise(dir * 2.2 + vec2f(0.0, r * 0.4), 1.5);
  let s1 = flowNoise(dir * 16.0 + vec2f(r * 0.5, 0.0), 2.0);
  let s2 = flowNoise(dir * 41.0 - vec2f(0.0, r * 0.9), 3.0);
  let fine = (s1 + 0.7 * s2) / 1.7;
  let streak = 1.0 + u.warp * (0.3 * broad + 0.32 * fineAmount * fine);
  let swing = seedAngle() + 1.6 * u.loopv.y;
  let sector = 0.5 + 0.5 * dot(dir, vec2f(sin(swing), -cos(swing)));
  let soft = 0.5 + 0.6 * u.blur;
  let rise = smoothstep(radius * (1.0 - 0.25 * soft), radius * (1.0 + 1.8 * soft), r);
  let edge = clamp((r - radius) / max(length(h) + length(centre) - radius, 0.2), 0.0, 1.0);
  let glow = rise * (0.28 + 0.42 * edge) * streak * (0.35 + 0.65 * sector * sector);
  let t = clamp(1.0 - glow * 1.1 - 0.1 * sector, 0.0, 1.0);
  let col = ramp(t);
  let lab = labMix(u.bg, col, clamp(glow * 1.25, 0.0, 1.0));
  return filmGrade(lab);
}
`;
