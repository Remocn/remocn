import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    travel: {
      type: "number",
      default: 30,
      min: 10,
      max: 60,
      step: 1,
      description: "Travel (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ grain: true }),
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
