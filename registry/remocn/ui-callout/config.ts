import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const uiCalloutConfig: ComponentConfig = {
  componentName: "UiCallout",
  importPath: "@/components/remocn/ui-callout",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    nextLabel: {
      type: "text-content",
      default: "Next",
      description: "Next label",
    },
    doneLabel: {
      type: "text-content",
      default: "Got it",
      description: "Done label",
    },
    variant: {
      type: "enum",
      default: "tooltip",
      variants: {
        tooltip: {},
        pill: {},
      },
      description: "Variant",
    },
    stagger: {
      type: "number",
      default: 30,
      min: 0,
      max: 90,
      step: 1,
      description: "Stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Instrument Sans" }),
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
