/**
 * WGSL twin of the chrome kind's GLSL (chrome.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn chromeHeight(q: vec2f, t1: vec2f, t2: vec2f) -> f32 {
  let bendBy = (0.9 + 1.6 * u.warp) * flowNoise(q * vec2f(0.35, 0.55), 2.0);
  let a = 2.1 * q.y + bendBy;
  let c = 1.3 * q.x + 0.4 * bendBy + 1.3;
  return sin(a) * t1.x - cos(a) * t1.y
    + 0.2 * (sin(2.0 * a + 0.9) * t2.x - cos(2.0 * a + 0.9) * t2.y) * (1.0 - 0.6 * u.blur)
    + 0.15 * (sin(c) * t2.x - cos(c) * t2.y);
}

fn chromeStudio(r: vec3f, sa: f32) -> vec3f {
  let t = r.y * 0.9 + 0.3 * r.x * cos(sa);
  let soft = 0.04 + 0.12 * u.blur;
  var floorC = labMix(u.bg, paletteColor(0), 0.08 + 0.5 * smoothstep(0.9, 1.0, r.z));
  floorC = labMix(floorC, paletteColor(0), 0.7 * exp(-pow((t + 0.5) / (0.18 + soft), 2.0)));
  var env = labMix(floorC, paletteColor(0), smoothstep(0.1, 0.3, t));
  let horizon = exp(-pow((t - 0.12) / (soft * 1.3), 2.0));
  env = labMix(env, u.bg, 0.92 * horizon);
  let cool = exp(-pow((t - 0.4) / (soft * 0.9), 2.0));
  env = labMix(env, paletteColor(select(1, 2, u.count > 2)), 0.55 * cool);
  let key = exp(-pow((t - 0.58) / soft, 2.0));
  env = labMix(env, paletteColor(1), key);
  env.x += 0.16 * key * key;
  env = labMix(env, u.bg, 0.6 * smoothstep(0.75, 1.0, t));
  return env;
}

fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  let sa = seedAngle();
  let t1 = loopTurn();
  let t2 = vec2f(t1.x * t1.x - t1.y * t1.y, 2.0 * t1.x * t1.y);
  let q = rot2(0.6 * sin(sa) + 0.3) * p * 1.75 * u.scale + vec2f(1.7, -0.9) * cos(sa);

  let e = 0.004;
  let h = chromeHeight(q, t1, t2);
  let g = vec2f(chromeHeight(q + vec2f(e, 0.0), t1, t2) - h, chromeHeight(q + vec2f(0.0, e), t1, t2) - h) / e;
  let n = normalize(vec3f(-g * 0.6 / sqrt(u.scale), 1.0));
  let r = reflect(vec3f(0.0, 0.0, -1.0), n);

  var lab = chromeStudio(r, sa);
  lab = labMix(lab, u.bg, 0.3 * (1.0 - smoothstep(-1.8, -0.6, h)));
  lab.x *= vignette(p, 0.35);
  return filmGrade(lab);
}
`;
