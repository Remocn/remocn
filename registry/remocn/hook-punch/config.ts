import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    hold: {
      type: "number",
      default: 30,
      min: 12,
      max: 90,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Bricolage Grotesque" }),
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
