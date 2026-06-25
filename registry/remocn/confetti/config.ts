import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const confettiConfig: ComponentConfig = {
  componentName: "Confetti",
  importPath: "@/components/remocn/confetti",
  controls: {
    particleCount: {
      type: "number",
      default: 140,
      min: 10,
      max: 400,
      step: 10,
      label: "Particles",
    },
    power: {
      type: "number",
      default: 17,
      min: 4,
      max: 40,
      step: 1,
      label: "Power",
    },
    gravity: {
      type: "number",
      default: 0.45,
      min: 0,
      max: 1.5,
      step: 0.05,
      label: "Gravity",
    },
    size: {
      type: "number",
      default: 13,
      min: 4,
      max: 30,
      step: 1,
      label: "Size",
    },
    seed: {
      type: "number-input",
      default: 1,
      min: 1,
      max: 9999,
      step: 1,
      label: "Seed",
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
