import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const walkoutNameConfig: ComponentConfig = {
  componentName: "WalkoutName",
  importPath: "@/components/remocn/walkout-name",
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
    nickname: {
      type: "text-content",
      default: "Ships before lunch",
      description: "Nickname",
    },
    record: {
      type: "text-content",
      default: "12–0",
      description: "Record",
    },
    finishes: {
      type: "text-content",
      default: "12 KO",
      description: "Finishes",
    },
    recordLabel: {
      type: "text-content",
      default: "Pro record",
      description: "Record label",
    },
    billing: {
      type: "text-content",
      default: "Main event · Tonight",
      description: "Billing",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
