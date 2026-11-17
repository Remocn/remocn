import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const glowBornCardConfig: ComponentConfig = {
  componentName: "GlowBornCard",
  importPath: "@/components/remocn/glow-born-card",
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
      default: "Or import a scene from",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: "your repo",
      description: "After",
    },
    title: {
      type: "text-content",
      default: "Import from repository",
      description: "Title",
    },
    label: {
      type: "text-content",
      default: "Repository",
      description: "Label",
    },
    value: {
      type: "text-content",
      default: "lumen-labs/launch",
      description: "Value",
    },
    hint: {
      type: "text-content",
      default: "Public or private, any branch",
      description: "Hint",
    },
    branch: {
      type: "text-content",
      default: "main · 214 commits · 3h ago",
      description: "Branch",
    },
    actionLabel: {
      type: "text-content",
      default: "Import",
      description: "Button label",
    },
    doneLabel: {
      type: "text-content",
      default: "Imported",
      description: "Done label",
    },
    cancelLabel: {
      type: "text-content",
      default: "Cancel",
      description: "Cancel label",
    },
    accent: {
      type: "color",
      default: "#45f0d6",
      description: "Accent",
    },
    primary: {
      type: "color",
      default: "#3B5BFD",
      description: "Primary",
    },
    ground: groundControl(),
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
  durationInFrames: 136,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
