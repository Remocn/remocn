import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const menuPickConfig: ComponentConfig = {
  componentName: "MenuPick",
  importPath: "@/components/remocn/menu-pick",
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
    prompt: {
      type: "text-content",
      default: "Choose your launch",
      description: "Prompt",
    },
    pick: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Pick",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
