import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const waitlistSwarmConfig: ComponentConfig = {
  componentName: "WaitlistSwarm",
  importPath: "@/components/remocn/waitlist-swarm",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    label: {
      type: "text-content",
      default: "on the waitlist",
      description: "Label",
    },
    value: {
      type: "number",
      default: 12480,
      min: 0,
      max: 37440,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    count: {
      type: "number",
      default: 760,
      min: 0,
      max: 2280,
      step: 1,
      description: "Count",
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
