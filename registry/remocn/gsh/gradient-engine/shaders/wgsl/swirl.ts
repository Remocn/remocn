/**
 * WGSL twin of the swirl kind's GLSL (swirl.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  let h = frameHalf(); let lightBg = smoothstep(0.55, 0.85, u.bg.x); let a = seedAngle();
  var eye = vec2f(0.32 * h.x * cos(a), 0.22 * h.y * sin(a * 1.7)); eye = eye + 0.05 * vec2f(flowNoise(vec2f(0.2,0.8),1.0), flowNoise(vec2f(0.9,0.1),2.0));
  let d = p - eye; let r = length(d); let reach = 0.55 / u.scale; let twist = (2.2 + 2.8 * u.warp) * exp(-r / reach) + 0.9 * u.loopv.x;
  let dir = select(-1.0, 1.0, fract(u.seed.y * 0.113) > 0.5); let q = rot2(dir * twist) * d;
  let ss = q * 1.25 * u.scale; let fine = 1.0 - 0.8 * u.blur; var n = flowNoise(ss,3.0) + 0.4 * fine * flowNoise(ss * 2.3 + 5.1,4.0); n = n / (1.0 + 0.4 * fine);
  let t0 = clamp(0.45 + 0.5 * n,0.0,1.0); let arm0 = 0.5 + 0.5 * sin(atan2(q.y, q.x + 1e-6) * 2.0 + r * 3.0 + 2.0 * n); let arm = mix(0.5, arm0, smoothstep(0.0,0.2,r)); let t = mix(t0, 0.15 + 0.7 * arm, 0.3);
  var col = ramp(t); let lit = exp(-r / ((0.35 + 0.35 * u.blur) * max(0.6, 1.0 / u.scale))); let amount = lit * (0.7 + 0.3 * arm) + (1.0 - lit) * 0.55 * arm * smoothstep(-0.2,0.6,n);
  col = labMix(col, ramp(1.0), (1.0 - clamp(amount,0.0,1.0)) * 0.55 * (1.0-lightBg)); var lab = labMix(u.bg,col,clamp(amount,0.0,1.0)); let hot = vec3f(min(1.0,paletteColor(0).x+0.05),paletteColor(0).yz*0.6); lab = labMix(lab,hot,0.5*exp(-r*r/(0.02+0.04*u.blur))*(1.0-lightBg)); lab.x = lab.x * vignette(p,0.3*(1.0-lightBg)); return filmGrade(lab);
}
`;
