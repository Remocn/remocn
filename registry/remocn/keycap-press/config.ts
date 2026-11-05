import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const keycapPressConfig: ComponentConfig = {
  componentName: "KeycapPress",
  importPath: "@/components/remocn/keycap-press",
  controls: {
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    label: {
      type: "text-content",
      default: "Everything, one shortcut away",
      description: "Label",
    },
    material: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Material",
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
