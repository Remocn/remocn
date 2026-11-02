import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pitchBlanksConfig: ComponentConfig = {
  componentName: "PitchBlanks",
  importPath: "@/components/remocn/pitch-blanks",
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
      default: "{remocn} is a {launch-film kit} for {teams of one}.",
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
