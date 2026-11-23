import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const comboCounterConfig: ComponentConfig = {
  componentName: "ComboCounter",
  importPath: "@/components/remocn/combo-counter",
  lists: {
    hits: {
      default: [
        "Captions",
        "Transitions",
        "Logo reveal",
        "Backgrounds",
        "Charts",
        "Text effects",
        "Lower thirds",
        "Mockups",
        "Countdowns",
        "Kinetic type",
        "Particles",
        "Templates",
      ],
      description: "Hits",
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
    hitLabel: {
      type: "text-content",
      default: "HIT",
      description: "Hit label",
    },
    comboLabel: {
      type: "text-content",
      default: "COMBO",
      description: "Combo label",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Saira" }),
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
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
