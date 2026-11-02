import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const dropTimerConfig: ComponentConfig = {
  componentName: "DropTimer",
  importPath: "@/components/remocn/drop-timer",
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
      default: "DROPS IN",
      description: "Label",
    },
    live: {
      type: "text-content",
      default: "LIVE NOW",
      description: "Live",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    url: {
      type: "text-content",
      default: "remocn.dev",
      description: "Url",
    },
    from: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    tick: {
      type: "number",
      default: 14,
      min: 0,
      max: 42,
      step: 1,
      description: "Tick",
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
