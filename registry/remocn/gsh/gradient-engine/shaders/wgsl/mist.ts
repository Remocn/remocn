/**
 * WGSL twin of the mist kind's GLSL (mist.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn mistFold(q: vec2f, layer: f32, amp: f32) -> f32 {
  let bend = amp * sin(q.x * 1.6 * u.scale + 0.9 * layer + 0.35 * u.loopv.y)
    + (0.08 + 0.22 * u.warp) * flowNoise(vec2f(q.x * 0.55 * u.scale, layer * 2.3), layer);
  return q.y - bend - 0.12 * q.x;
}

fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  let h = frameHalf();
  let lightBg = smoothstep(0.55, 0.85, u.bg.x);
  let a = seedAngle();
  let tilt = 0.55 * sin(a) + select(0.0, 3.14159265, cos(a) < 0.0);
  let q = rot2(tilt) * p;
  let x = q.x / max(h.x, 1e-3);

  let lift = 0.05 * flowNoise(vec2f(0.21, 0.67), 7.0);
  let s = mistFold(q + vec2f(0.0, lift), 1.0, 0.16);
  let sheen = flowNoise(vec2f(q.x * 0.9 * u.scale, s * 4.0 / (0.5 + u.blur)), 2.0);

  let span = 0.45 + 0.35 * u.blur;
  let lit = clamp(-s / span, 0.0, 1.0);
  var col = ramp(0.12 + 0.88 * pow(lit, 0.8));
  col = labMix(col, paletteColor(1), smoothstep(0.0, 0.2, s) * 0.8);
  let soft = 0.02 + 0.09 * u.blur;
  let side = 1.0 - smoothstep(-soft, soft, s);
  let spill = exp(-max(s, 0.0) / (0.05 + 0.18 * u.blur));
  let depth = exp(-max(-s - 0.1, 0.0) / (0.35 + 0.45 * u.blur));
  var amount = max(side * mix(0.3, 1.0, depth), spill * 0.7);
  amount *= 0.86 + 0.18 * sheen;
  amount *= 1.0 - 0.25 * smoothstep(0.6, 1.2, abs(x));

  var lab = labMix(u.bg, col, clamp(amount, 0.0, 1.0));
  let lipW = 0.02 + 0.06 * u.blur;
  let sl = s + 0.6 * lipW;
  let lip = exp(-sl * sl / (lipW * lipW)) * (0.75 + 0.25 * sheen);
  let hot = vec3f(min(1.0, paletteColor(0).x + 0.05), paletteColor(0).yz * 0.85);
  let ink = vec3f(paletteColor(u.count - 1).x * 0.6, paletteColor(u.count - 1).yz);
  lab = labMix(lab, mix(hot, ink, lightBg), clamp(lip * (0.22 + 0.05 * lightBg), 0.0, 1.0));

  let s2 = mistFold(q * vec2f(0.8, 1.0) + vec2f(0.7, -0.32 + lift), 4.0, 0.22);
  var back = (1.0 - smoothstep(-0.25, 0.08 + 0.1 * u.blur, s2)) * exp(-max(-s2, 0.0) / 0.5);
  back *= 1.0 - side;
  lab = labMix(lab, ramp(0.55), clamp(back * 0.35 * (0.8 + 0.2 * sheen), 0.0, 1.0));

  lab.x *= vignette(p, 0.25 * (1.0 - lightBg));
  return filmGrade(lab);
}
`;
