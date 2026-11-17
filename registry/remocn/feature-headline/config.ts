import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const featureHeadlineConfig: ComponentConfig = {
  componentName: "FeatureHeadline",
  importPath: "@/components/remocn/feature-headline",
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
    tag: {
      type: "text-content",
      default: "New",
      description: "Tag",
    },
    label: {
      type: "text-content",
      default: "Captions",
      description: "Label",
    },
    headline: {
      type: "text-content",
      default: "Captions that move with every word.",
      description: "Headline",
    },
    highlight: {
      type: "text-content",
      default: "every word",
      description: "Highlight",
    },
    subhead: {
      type: "text-content",
      default:
        "31 transcript-driven caption styles, ready to drop into any video.",
      description: "Subhead",
    },
    align: {
      type: "enum",
      default: "left",
      variants: {
        left: {},
        center: {},
      },
      description: "Align",
    },
    exit: {
      type: "boolean",
      default: true,
      description: "Exit",
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
    fontWeight: {
      type: "number",
      default: 500,
      min: 400,
      max: 500,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
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
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
