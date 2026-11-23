import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const giantMarkBackdropConfig: ComponentConfig = {
  componentName: "GiantMarkBackdrop",
  importPath: "@/components/remocn/giant-mark-backdrop",
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
    prompt: {
      type: "text-content",
      default: "Make a launch film for our v2 release",
      description: "Prompt",
    },
    placeholder: {
      type: "text-content",
      default: "Describe your launch film",
      description: "Placeholder",
    },
    attachLabel: {
      type: "text-content",
      default: "Attach",
      description: "First chip",
    },
    stylesLabel: {
      type: "text-content",
      default: "Styles",
      description: "Second chip",
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Instrument Sans", grain: true }),
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
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
