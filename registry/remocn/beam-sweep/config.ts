import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const beamSweepConfig: ComponentConfig = {
  componentName: "BeamSweepDemo",
  importPath: "@/components/remocn/beam-sweep",
  controls: {
    theme: {
      type: "text-content",
      default: "dark",
      description: "Theme",
    },
    line: {
      type: "text-content",
      default: "Just describe the launch.",
      description: "Line",
    },
    sub: {
      type: "text-content",
      default: "Every scene is cut to your product.",
      description: "Sub",
    },
  },
  durationInFrames: 108,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
