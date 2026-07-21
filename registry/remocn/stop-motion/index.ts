import { spring } from "remotion";

export const DEFAULT_STEP = 3;

export const qf = (frame: number, step = DEFAULT_STEP): number =>
  Math.floor(frame / step) * step;

export const qstep = (frame: number, step = DEFAULT_STEP): number =>
  Math.floor(frame / step);

export const hash01 = (seed: string): number => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h = Math.imul(h ^ (h >>> 13), 2246822519);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export const hashRange = (seed: string, lo: number, hi: number): number =>
  lo + hash01(seed) * (hi - lo);

export type Jitter = { x: number; y: number; rot: number };

export const paperJitter = (
  frame: number,
  seed: string,
  options?: { amp?: number; rotAmp?: number; step?: number },
): Jitter => {
  const amp = options?.amp ?? 1.4;
  const rotAmp = options?.rotAmp ?? 0.35;
  const s = qstep(frame, options?.step ?? DEFAULT_STEP);
  return {
    x: hashRange(`${seed}:x:${s}`, -amp, amp),
    y: hashRange(`${seed}:y:${s}`, -amp, amp),
    rot: hashRange(`${seed}:r:${s}`, -rotAmp, rotAmp),
  };
};

export const steppedSpring = (args: {
  frame: number;
  fps: number;
  delay?: number;
  step?: number;
  config?: { damping?: number; stiffness?: number; mass?: number };
}): number =>
  spring({
    frame: qf(
      Math.max(0, args.frame - (args.delay ?? 0)),
      args.step ?? DEFAULT_STEP,
    ),
    fps: args.fps,
    config: args.config,
  });

export const steppedRamp = (
  frame: number,
  from: number,
  to: number,
  options?: { ease?: (t: number) => number; step?: number },
): number => {
  const f = qf(frame, options?.step ?? DEFAULT_STEP);
  if (f <= from) return 0;
  if (f >= to) return 1;
  const ease = options?.ease ?? ((t: number) => t);
  return ease((f - from) / (to - from));
};
