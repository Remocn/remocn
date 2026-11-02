/**
 * WGSL twin of the waves kind's GLSL (waves.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  let h = frameHalf();
  let tilt = -0.42 + 0.3 * (fract(u.seed.x * 0.173) - 0.5);
  let normal = vec2f(sin(tilt), cos(tilt));
  let tangent = vec2f(normal.y, -normal.x);
  let y = dot(p, normal) / (2.0 * h.y);
  let along = dot(p, tangent);
  let x = along * u.scale;
  let count = f32(u.count);
  let focus = 0.35 + 0.65 * min(1.0, abs(along) / h.x);
  var lab = u.bg;
  lab.x += 0.05 * smoothstep(-0.2, 0.6, y);
  for (var i = 0; i < 6; i++) {
    if (i >= u.count) { break; }
    let fi = f32(i);
    let base = 0.46 - 0.9 * (fi + 0.25) / count;
    let phase = fi * 1.9 + dot(u.loopv, vec2f(cos(fi * 1.3), sin(fi * 1.3))) * 1.8;
    let wave = 0.1 * sin(x * (1.3 + 0.3 * fi) + phase)
      + 0.04 * sin(x * (2.7 - 0.2 * fi) - 1.3 * phase + 1.0)
      + u.warp * 0.08 * flowNoise(vec2f(x * 0.65, fi * 3.7), 60.0 + fi);
    let edge = base + wave * (0.6 + 0.4 * fi / count);
    let dd = edge - y;
    let soft = 0.002 + (0.01 + 0.06 * u.blur) * focus;
    let m = smoothstep(-soft, soft, dd);
    let shadow = exp(-max(-dd, 0.0) / (0.035 + 0.05 * u.blur)) * (1.0 - m);
    lab.x -= 0.08 * shadow * (0.3 + lab.x);
    var c = u.colors[i].xyz;
    let body = max(dd, 0.0);
    c.x += 0.1 * exp(-body / (0.012 + 0.03 * u.blur)) + 0.09 * (0.38 - smoothstep(0.0, 0.3, body))
      + 0.06 * along / h.x;
    lab = labMix(lab, c, m);
  }
  lab.x *= vignette(p, 0.22);
  return filmGrade(lab);
}
`;
