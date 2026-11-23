import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const caretCollapseConfig: ComponentConfig = {
  componentName: "CaretCollapseDemo",
  importPath: "@/components/remocn/caret-collapse",
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
    url: {
      type: "text-content",
      default: "remocn.dev/launch",
      description: "Url",
    },
    label: {
      type: "text-content",
      default: "is live",
      description: "Label",
    },
    question: {
      type: "text-content",
      default: "What will you launch next?",
      description: "Question",
    },
    prompt: {
      type: "text-content",
      default: "Make a 30-second launch film for our 2.0 release",
      description: "Prompt",
    },
    attachmentLabel: {
      type: "text-content",
      default: "Brand kit attached",
      description: "Attachment label",
    },
    modeLabel: {
      type: "text-content",
      default: "Launch film",
      description: "Mode label",
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 8,
      step: 1,
      description: "Word stagger",
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
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
