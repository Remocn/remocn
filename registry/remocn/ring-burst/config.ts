import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ringBurstConfig: ComponentConfig = {
  componentName: "RingBurst",
  importPath: "@/components/remocn/ring-burst",
  controls: {
    theme: {
      type: "text-content",
      default: "dark",
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    from: {
      type: "text-content",
      default: "Before.",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "remocn",
      description: "To",
    },
    delay: {
      type: "number",
      default: 20,
      min: 0,
      max: 60,
      step: 1,
      description: "Delay",
      hiddenFromList: false,
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
