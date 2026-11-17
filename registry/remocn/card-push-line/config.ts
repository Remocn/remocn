import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const cardPushLineConfig: ComponentConfig = {
  componentName: "CardPushLine",
  importPath: "@/components/remocn/card-push-line",
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
    line: {
      type: "text-content",
      default: "You can just write it",
      description: "Line",
    },
    command: {
      type: "text-content",
      default: "/launch-video",
      description: "Command",
    },
    prompt: {
      type: "text-content",
      default: "a teaser for the 2.0 release",
      description: "Prompt",
    },
    placeholder: {
      type: "text-content",
      default: "Describe your launch…",
      description: "Placeholder",
    },
    modelLabel: {
      type: "text-content",
      default: "Remocn 1",
      description: "Model label",
    },
    chipLabel: {
      type: "text-content",
      default: "Brand kit",
      description: "Chip label",
    },
    attachName: {
      type: "text-content",
      default: "release-notes-2.0.md",
      description: "Attach name",
    },
    attachMeta: {
      type: "text-content",
      default: "Markdown · 18 KB",
      description: "Attach meta",
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
    accent: { type: "color", default: undefined, description: "Accent" },
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
  durationInFrames: 144,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
