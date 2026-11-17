import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const caretDollyConfig: ComponentConfig = {
  componentName: "CaretDolly",
  importPath: "@/components/remocn/caret-dolly",
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
      default:
        "Make a launch video for our new app with a bold title, product shots and a calm ending",
      description: "Prompt",
    },
    focus: {
      type: "text-content",
      default: "launch video",
      description: "Focus",
    },
    chipLabel: {
      type: "text-content",
      default: "Video",
      description: "Chip label",
    },
    modelLabel: {
      type: "text-content",
      default: "Remocn 1",
      description: "Model label",
    },
    zoom: {
      type: "number",
      default: 1,
      min: 0.5,
      max: 1.5,
      step: 0.05,
      description: "Close-up zoom",
      hiddenFromList: false,
    },
    motionBlur: {
      type: "boolean",
      default: true,
      description: "Motion blur",
    },
    accent: { type: "color", default: undefined, description: "Accent" },
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
