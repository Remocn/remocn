/**
 * WGSL twin of the grain kind's GLSL (grain.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  var h = frameHalf();
  // The light sits just outside the frame and throws a beam across it.
  var a = seedAngle();
  var dir = vec2f(cos(a), sin(a));
  var across = vec2f(-dir.y, dir.x);
  var src = -dir * (abs(dir.x) * h.x + abs(dir.y) * h.y + 0.12);
  var q = p - src;
  // GLSL calls this u, which would shadow the uniform block here.
  var bu = dot(q, dir);
  var v = dot(q, across);

  var bend = 0.06 * sin(bu * 1.4 + 0.6 * u.loopv.x + a)
    + 0.12 * u.warp * flowNoise(vec2f(bu * 0.7, 1.3) * u.scale, 1.0);
  var width = (0.1 + 0.18 * u.blur) * (0.45 + 0.7 * bu);
  var vb = v - bend;
  var beam = exp(-vb * vb / (width * width));
  // Brushed streaks: long along the beam, short across it.
  var streak = flowNoise(vec2f(bu * 0.8, vb * 9.0 / (0.45 + u.blur)) * u.scale, 2.0);
  // A wider, dimmer sheet behind it for depth.
  var vb2 = v + 0.3 - 0.5 * bend;
  var beam2 = exp(-vb2 * vb2 / (width * width * 4.0));
  var fall = exp(-bu * 0.75);
  var source = exp(-dot(q, q) * 2.2);

  var intensity = (beam * (0.88 + 0.3 * streak) + 0.35 * beam2 * (0.8 + 0.3 * streak)) * fall * 1.5
    + 0.55 * source;
  var ti = 1.0 - exp(-1.6 * intensity);
  var col = ramp(1.0 - ti);
  var lab = labMix(u.bg, col, smoothstep(0.0, 0.75, ti));
  lab.x += 0.08 * max(intensity - 1.0, 0.0);
  lab.x *= vignette(p, 0.35);
  return filmGrade(lab);
}
`;
