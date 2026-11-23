import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const pitchBlanksConfig: ComponentConfig = {
  componentName: "PitchBlanks",
  importPath: "@/components/remocn/pitch-blanks",
  lists: {
    labels: {
      default: ["product", "category", "audience"],
      description: "Labels",
    },
  },
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
    firstFill: {
      type: "number",
      default: 42,
      min: 10,
      max: 90,
      step: 1,
      description: "First fill (frame)",
      hiddenFromList: false,
    },
    fillGap: {
      type: "number",
      default: 32,
      min: 10,
      max: 60,
      step: 1,
      description: "Fill gap (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Bitter" }),
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
