import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const focusPanTextConfig: ComponentConfig = {
  componentName: "FocusPanText",
  importPath: "@/components/remocn/focus-pan-text",
  lists: {
    lines: {
      default: [
        "The security scan is clean.",
        "All 48 checks passed.",
        "Your domain is live.",
        "You're ready to launch.",
      ],
      description: "Lines",
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
    meta: {
      type: "text-content",
      default: "Just now",
      description: "Meta",
    },
    accentWord: {
      type: "text-content",
      default: "",
      description: "Accent word",
    },
    firstHold: {
      type: "number",
      default: 30,
      min: 0,
      max: 90,
      step: 1,
      description: "First hold",
      hiddenFromList: false,
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
    fontWeight: {
      type: "number",
      default: 400,
      min: 300,
      max: 400,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Inter Tight" }),
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
  durationInFrames: 169,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
