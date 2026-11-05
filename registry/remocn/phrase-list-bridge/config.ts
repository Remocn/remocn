import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const phraseListBridgeConfig: ComponentConfig = {
  componentName: "PhraseListBridge",
  importPath: "@/components/remocn/phrase-list-bridge",
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
    left: {
      type: "text-content",
      default: "Browse through",
      description: "Left",
    },
    right: {
      type: "text-content",
      default: "ready-made scenes",
      description: "Right",
    },
    pickedIndex: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Picked index",
      hiddenFromList: false,
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
