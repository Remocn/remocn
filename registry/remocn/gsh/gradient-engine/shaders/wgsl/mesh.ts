/**
 * WGSL twin of the mesh kind's GLSL (mesh.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  let h = frameHalf();
  let theta = seedAngle();
  let axis = vec2f(cos(theta), sin(theta));
  let side = vec2f(-axis.y, axis.x);
  let span = abs(axis.x) * h.x + abs(axis.y) * h.y;
  let q = p + u.warp * 0.14 * vec2f(
    flowNoise(p * 1.2 * u.scale, 1.0),
    flowNoise(p * 1.2 * u.scale + 4.1, 2.0)
  );
  let sigma = (0.22 + 0.2 * u.blur) / u.scale;
  let inv = 1.0 / (sigma * sigma);
  let count = f32(u.count);
  let wb = 0.06;
  var lab = u.bg * wb;
  var chroma = length(u.bg.yz) * wb;
  var total = wb;
  for (var i = 0; i < 6; i++) {
    if (i >= u.count) { break; }
    let fi = f32(i);
    let k = fi / max(1.0, count - 1.0);
    let zig = (gmod1(fi, 2.0) * 2.0 - 1.0) * (0.25 + 0.5 * fract(fi * 0.618 + 0.3));
    let c = axis * span * (0.9 - 1.8 * k) + side * span * 0.5 * zig
      + 0.25 * h * (rot2(fi * 1.7) * u.loopv);
    var d = q - c;
    d = vec2f(dot(d, axis) * 1.2, dot(d, side) * 0.65);
    let w = exp(-dot(d, d) * inv);
    lab += u.colors[i].xyz * w;
    chroma += length(u.colors[i].yz) * w;
    total += w;
  }
  lab /= total;
  chroma /= total;
  let current = length(lab.yz);
  if (current > 1e-4) {
    lab = vec3f(lab.x, lab.yz * mix(1.0, chroma / current, 0.85));
  }
  lab.x += 0.05 * dot(p, axis) / span;
  let along = dot(q, side);
  let crest = 0.16 * sin(along * 1.6 + 0.8 * dot(u.loopv, vec2f(0.6, 0.8)) + theta)
    + 0.08 * flowNoise(vec2f(along * 0.6, 2.0), 3.0);
  let acrossFold = dot(q, axis) - crest;
  let fw = 0.05 + 0.08 * u.blur;
  lab.x += 0.06 * exp(-acrossFold * acrossFold / (fw * fw)) - 0.07 * smoothstep(0.0, 0.5, -acrossFold);
  lab.x *= vignette(p, 0.18);
  return filmGrade(lab);
}
`;
