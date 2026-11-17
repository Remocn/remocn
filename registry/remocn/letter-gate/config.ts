import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const letterGateConfig: ComponentConfig = {
  componentName: "LetterGateDemo",
  importPath: "@/components/remocn/letter-gate",
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
      default: "Start building",
      description: "Text",
    },
    gate: {
      type: "text-content",
      default: "bu",
      description: "Gate",
    },
    prompt: {
      type: "text-content",
      default: "A launch film for v2",
      description: "Prompt",
    },
    placeholder: {
      type: "text-content",
      default: "Describe your launch",
      description: "Placeholder",
    },
    label: {
      type: "text-content",
      default: "Prompt",
      description: "Label",
    },
    nextLabel: {
      type: "text-content",
      default: "Script",
      description: "Next label",
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
    ground: groundControl("Ground A"),
    groundB: groundControl("Ground B"),
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
  durationInFrames: 118,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
