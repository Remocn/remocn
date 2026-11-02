import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const versusSplitConfig: ComponentConfig = {
  componentName: "VersusSplit",
  importPath: "@/components/remocn/versus-split",
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
    away: {
      type: "text-content",
      default: "The old way",
      description: "Away",
    },
    homeLabel: {
      type: "text-content",
      default: "Challenger",
      description: "Home label",
    },
    awayLabel: {
      type: "text-content",
      default: "Title holder",
      description: "Away label",
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
