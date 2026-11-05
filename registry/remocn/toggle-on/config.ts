import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const toggleOnConfig: ComponentConfig = {
  componentName: "ToggleOn",
  importPath: "@/components/remocn/toggle-on",
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
      default: "Auto-captions",
      description: "Label",
    },
    state: {
      type: "text-content",
      default: "On",
      description: "State",
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
