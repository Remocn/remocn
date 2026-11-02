import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const hookPunchConfig: ComponentConfig = {
  componentName: "HookPunch",
  importPath: "@/components/remocn/hook-punch",
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
    stop: {
      type: "text-content",
      default: "Stop",
      description: "Stop",
    },
    scroll: {
      type: "text-content",
      default: "scrolling.",
      description: "Scroll",
    },
    lead: {
      type: "text-content",
      default: "This video took",
      description: "Lead",
    },
    payoff: {
      type: "text-content",
      default: "1 day.",
      description: "Payoff",
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
  durationInFrames: 105,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
