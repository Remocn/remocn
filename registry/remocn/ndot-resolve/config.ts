import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ndotResolveConfig: ComponentConfig = {
  componentName: "NdotResolve",
  importPath: "@/components/remocn/ndot-resolve",
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
    text: {
      type: "text-content",
      default: "Less noise. More launch.",
      description: "Text",
    },
    emphasis: {
      type: "text-content",
      default: "launch",
      description: "Emphasis",
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
