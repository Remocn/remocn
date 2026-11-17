import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const doubleTakeConfig: ComponentConfig = {
  componentName: "DoubleTake",
  importPath: "@/components/remocn/double-take",
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
    text: {
      type: "text-content",
      default:
        "One person wrote this entire launch video over a single lunch break.",
      description: "Text",
    },
    focus: {
      type: "text-content",
      default: "One person",
      description: "Focus",
    },
    cue: {
      type: "text-content",
      default: "Read that again.",
      description: "Cue",
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
    hold: {
      type: "number",
      default: 8,
      min: 0,
      max: 40,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Outfit" }),
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
