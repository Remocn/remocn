import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const rimDrawCardConfig: ComponentConfig = {
  componentName: "RimDrawCard",
  importPath: "@/components/remocn/rim-draw-card",
  lists: {
    uses: {
      default: ["Launch posts", "Changelog", "Release emails"],
      description: "Uses",
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
    line: {
      type: "text-content",
      default: "Just tell it once.",
      description: "Line",
    },
    command: {
      type: "text-content",
      default: "/brand-voice",
      description: "Command",
    },
    title: {
      type: "text-content",
      default: "Brand voice",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "Used every time you write launch copy.",
      description: "Subtitle",
    },
    label: {
      type: "text-content",
      default: "Instructions",
      description: "Label",
    },
    instructions: {
      type: "text-content",
      default:
        "Short, calm sentences. Name the feature first, then what it saves you.",
      description: "Instructions",
    },
    action: {
      type: "text-content",
      default: "Save skill",
      description: "Action",
    },
    done: {
      type: "text-content",
      default: "Saved",
      description: "Done",
    },
    preview: {
      type: "text-content",
      default: "Scenes now render three times faster. Ship the reel tonight.",
      description: "Preview",
    },
    cancelLabel: {
      type: "text-content",
      default: "Cancel",
      description: "Cancel label",
    },
    placeholder: {
      type: "text-content",
      default: "Describe how this skill should write",
      description: "Placeholder",
    },
    limit: {
      type: "number",
      default: 600,
      min: 100,
      max: 2000,
      step: 50,
      description: "Character limit",
      hiddenFromList: false,
    },
    typeRate: {
      type: "number",
      default: 2.2,
      min: 0.4,
      max: 6,
      step: 0.2,
      description: "Typing rate (chars per frame)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    primary: { type: "color", default: undefined, description: "Button color" },
    ground: groundControl(),
    ...sceneControls({ font: "Hanken Grotesk" }),
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
  durationInFrames: 138,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
