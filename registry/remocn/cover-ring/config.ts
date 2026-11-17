import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const coverRingConfig: ComponentConfig = {
  componentName: "CoverRing",
  importPath: "@/components/remocn/cover-ring",
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
      default: "Launch videos aren't edited anymore",
      description: "Line",
    },
    caption: {
      type: "text-content",
      default: "They're composed.",
      description: "Caption",
    },
    fontWeight: {
      type: "number",
      default: 300,
      min: 100,
      max: 900,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
