import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const wordGapMediaConfig: ComponentConfig = {
  componentName: "WordGapMedia",
  importPath: "@/components/remocn/word-gap-media",
  lists: {
    captions: {
      default: ["Hero", "Gallery", "Detail", "Setting"],
      description: "Captions",
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
    before: {
      type: "text-content",
      default: "Launch all",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: "of this",
      description: "After",
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Instrument Sans" }),
  },
  durationInFrames: 168,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
