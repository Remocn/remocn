import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rotaryDialConfig: ComponentConfig = {
  componentName: "RotaryDial",
  importPath: "@/components/remocn/rotary-dial",
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
    unit: {
      type: "text-content",
      default: "×",
      description: "Unit",
    },
    label: {
      type: "text-content",
      default: "Render speed",
      description: "Label",
    },
    from: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    to: {
      type: "number",
      default: 10,
      min: 0,
      max: 30,
      step: 1,
      description: "To",
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
