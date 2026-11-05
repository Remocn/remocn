import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const anagramShuffleConfig: ComponentConfig = {
  componentName: "AnagramShuffle",
  importPath: "@/components/remocn/anagram-shuffle",
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
    from: {
      type: "text-content",
      default: "listen",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "silent",
      description: "To",
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
