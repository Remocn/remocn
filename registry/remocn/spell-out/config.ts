import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const spellOutConfig: ComponentConfig = {
  componentName: "SpellOut",
  importPath: "@/components/remocn/spell-out",
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
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    line: {
      type: "text-content",
      default: "Say it once. Remember it.",
      description: "Line",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
