/**
 * WGSL twin of the spectrum kind's GLSL (spectrum.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn spStrand(q: vec2f, h: vec2f, k: f32, side: f32) -> vec2f {
  let s = 1.0 / u.scale;
  let a = -0.35 + (side - 0.5) * 0.8 + 0.12 * k;
  let r = rot2(a) * q;
  let bend = (0.55 + 0.1 * k) / s;
  let y0 = -0.08 * h.y + 0.11 * k + 0.12 * flowNoise(vec2f(0.2, k), 1.0 + k);
  let x = r.x;
  let wave = 0.09 * flowNoise(vec2f(x * 0.9, 0.4 + k), 2.0 + k);
  let curve = y0 + bend * 0.5 * x * x + wave;
  let slope = bend * x;
  let d = (r.y - curve) / sqrt(1.0 + slope * slope);
  return vec2f(d, x / max(h.x, 1e-3));
}

fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  let h = frameHalf();
  let lightBg = smoothstep(0.55, 0.85, u.bg.x);
  let side = fract(u.seed.y * 0.0917 + 0.5);
  let strands = 1.0 + floor(fract(u.seed.x * 0.0731 + 0.5) * 3.0);
  var q = p;
  if (fract(u.seed.x * 0.31 + u.seed.y * 0.17) > 0.5) { q.x = -q.x; }
  let halo = 0.02 + 0.06 * u.blur;
  var lab = u.bg;
  let n = f32(u.count);
  var hotSum = 0.0;
  for (var k = 0; k < 3; k++) {
    let fk = f32(k);
    if (fk >= strands) { break; }
    let st = spStrand(q, h, fk, side);
    let along = st.y;
    let fade = smoothstep(-1.15, -0.4, along) * (1.0 - 0.35 * fk);
    let fan = (0.004 + 0.1 * u.warp * smoothstep(-0.9, 1.0, along)) * (1.0 + 0.4 * fk);
    let core = 0.0018 + 0.004 * u.blur;
    let bodyW = (0.05 + 0.08 * u.blur) * (1.0 + 0.5 * fk);
    var body = select(0.0, exp(st.x / bodyW) * smoothstep(-0.006, 0.0, st.x), st.x < 0.0);
    body *= fade * (0.35 + 0.15 * flowNoise(vec2f(along * 1.4, fk), 8.0 + fk));
    lab = labMix(lab, ramp(0.35 + 0.15 * fk), clamp(body * mix(0.9, 0.5, lightBg), 0.0, 1.0));
    for (var i = 0; i < 6; i++) {
      if (i >= u.count) { break; }
      let fi = f32(i);
      let off = (fi / max(n - 1.0, 1.0) - 0.5) * fan;
      let dd = st.x - off;
      let band = exp(-dd * dd / ((fan / n + core) * (fan / n + core)));
      let glow = exp(-abs(dd) / halo) * mix(0.35, 0.12, lightBg);
      let wgt = (band + glow) * fade;
      lab = labMix(lab, paletteColor(i), clamp(wgt * mix(0.9, 0.75, lightBg), 0.0, 1.0));
    }
    let hot = exp(-st.x * st.x / (core * core)) * fade;
    hotSum += hot * (1.0 - 0.4 * fk);
  }
  let white = vec3f(min(1.0, paletteRange().x + 0.05), 0.0, 0.0);
  lab = labMix(lab, white, clamp(hotSum * 0.8 * (1.0 - lightBg), 0.0, 1.0));
  lab.x *= vignette(p, 0.25 * (1.0 - lightBg));
  return filmGrade(lab);
}
`;
