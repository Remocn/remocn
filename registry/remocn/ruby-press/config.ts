import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rubyPressConfig: ComponentConfig = {
  componentName: "RubyPress",
  importPath: "@/components/remocn/ruby-press",
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
    before: {
      type: "text-content",
      default: "Subtitles for every market in",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: ".",
      description: "After",
    },
    hold: {
      type: "number",
      default: 14,
      min: 0,
      max: 42,
      step: 1,
      description: "Hold",
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
