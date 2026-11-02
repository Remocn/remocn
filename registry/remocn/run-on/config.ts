import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const runOnConfig: ComponentConfig = {
  componentName: "RunOn",
  importPath: "@/components/remocn/run-on",
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
    text: {
      type: "text-content",
      default:
        "Open last year’s project and relink the fonts and nudge every keyframe and render and spot a typo and render it all again",
      description: "Text",
    },
    promise: {
      type: "text-content",
      default: "Or change one line.",
      description: "Promise",
    },
    highlight: {
      type: "text-content",
      default: "one line",
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
  durationInFrames: 200,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
