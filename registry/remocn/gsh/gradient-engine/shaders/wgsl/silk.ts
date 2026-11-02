/**
 * WGSL twin of the silk kind's GLSL (silk.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn silkPhase(q: vec2f, t1: vec2f, t2: vec2f, ph: f32) -> f32 {
  let x = q.x;
  let centre = 0.075 * turnSin(1.25 * x + 0.7 + ph, t1) + 0.05 * turnSin(2.7 * x - 1.9 + 2.0 * ph, t2);
  let spread = 1.0 + 0.22 * turnSin(1.6 * x + 2.1 - ph, t1) + 0.3 * sin(0.9 * x + 4.0 + 3.0 * ph);
  let twist = flowNoise(vec2f(x * 0.5, q.y * 0.8), 2.0);
  return (q.y - centre) * spread + (0.02 + 0.07 * u.warp) * twist;
}

fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  let sa = seedAngle();
  let tilt = 0.4 * sin(sa);
  var q = rot2(tilt) * p;
  q.y -= 0.04 + 0.16 * cos(sa * 1.7);
  q.y *= select(1.0, -1.0, fract(sa * 0.91) > 0.66);
  let ph = sa * 2.3;
  let t1 = loopTurn();
  let t2 = vec2f(t1.x * t1.x - t1.y * t1.y, 2.0 * t1.x * t1.y);

  let e = 0.0025;
  let v = silkPhase(q, t1, t2, ph);
  let grad = vec2f(silkPhase(q + vec2f(e, 0.0), t1, t2, ph) - v, silkPhase(q + vec2f(0.0, e), t1, t2, ph) - v) / e;

  let x = q.x;
  let bend = 0.45 * turnSin(1.1 * x + 0.4 + ph, t1) + 0.2 * sin(2.3 * x + 1.0 - ph);
  let f1 = 5.5 * u.scale * (0.8 + 0.45 * fract(sa * 1.37));
  let phi1 = v * f1 + bend;
  let slope = 0.7 * cos(phi1) * grad * f1;
  let n = normalize(vec3f(-slope, 1.0));

  let light = normalize(vec3f(0.3 * cos(sa * 2.3), 0.85, 0.4));
  var diffuse = 0.5 + 0.5 * dot(n, light);
  diffuse *= diffuse;
  let r = 2.0 * n.z * n.xy;
  let w = mix(0.07, 0.3, u.blur);
  let key = exp(-pow((r.y - 0.42) / w, 2.0));
  let bounce = exp(-pow((r.y + 0.35) / (1.6 * w), 2.0));
  let fill = exp(-pow((r.y - 0.12) / (2.4 * w), 2.0));
  let spec = key * (0.75 + 0.25 * diffuse) + 0.38 * fill;

  let lightBg = smoothstep(0.55, 0.75, u.bg.x);
  let body = mix(
    labMix(u.bg, paletteColor(0), smoothstep(0.12, 0.9, diffuse)),
    labMix(paletteColor(0), u.bg, 0.15 + 0.85 * diffuse),
    lightBg
  );
  let facing = smoothstep(-0.25, 0.25, n.x);
  let tint = labMix(paletteColor(1), paletteColor(select(1, 2, u.count > 2)), facing);
  let f2 = 40.0 * u.scale;
  let v2 = v * f2 + 1.5 * sin(v * f1 * 1.7 + 1.0);
  let thread = exp(-pow((fract(v2) - 0.5) / mix(0.08, 0.22, u.blur), 2.0));
  let bundle = smoothstep(0.1, 0.9, sin(phi1 * 0.5 + 2.0)) * (0.4 + 0.6 * u.warp);
  let shine = spec + 0.55 * thread * bundle * clamp(key + fill, 0.0, 1.0);
  var lab = labMix(body, paletteColor(select(0, 2, u.count > 2)), 0.3 * bounce * (1.0 - lightBg));
  lab = labMix(lab, tint, clamp(shine, 0.0, 1.0));
  lab.x += (0.32 - 0.25 * lightBg) * spec * spec + 0.05 * thread * bundle * diffuse;

  let top = 0.16;
  let px = length(grad) / min(u.full.x, u.full.y);
  let soft = max(px * 1.5, 1e-4) + 0.03 * u.blur;
  let below = top - v;
  let mask = smoothstep(-soft, soft, below);
  let fade = exp(-max(below, 0.0) * mix(1.8, 1.2, u.blur));
  let rim = exp(-pow(below / (soft + 0.006), 2.0));

  lab = labMix(lab, labMix(paletteColor(0), tint, 0.35), 0.7 * exp(-max(below, 0.0) * mix(16.0, 8.0, u.blur)) * (1.0 - lightBg));
  let back = labMix(u.bg, paletteColor(0), 0.14 * exp(-abs(below) * 5.0));
  var outLab = labMix(back, lab, mask * fade);
  let catchLight = 0.45 + 0.55 * smoothstep(-0.6, 0.8, flowNoise(vec2f(q.x * 0.9, 3.0), 5.0));
  outLab = labMix(outLab, paletteColor(1), 0.9 * rim * catchLight);
  outLab.x += 0.12 * rim * catchLight;
  return filmGrade(outLab);
}
`;
