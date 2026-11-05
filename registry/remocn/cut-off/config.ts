import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const cutOffConfig: ComponentConfig = {
  componentName: "CutOff",
  importPath: "@/components/remocn/cut-off",
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
    line: {
      type: "text-content",
      default:
        "So first I export the clips, redo all the captions, then line up the mus",
      description: "Line",
    },
    reply: {
      type: "text-content",
      default: "Or let the code cut it.",
      description: "Reply",
    },
    highlight: {
      type: "text-content",
      default: "the code",
      description: "Highlight",
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
