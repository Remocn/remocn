import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const panelSplitConfig: ComponentConfig = {
  componentName: "PanelSplit",
  importPath: "@/components/remocn/panel-split",
  lists: {
    headline: {
      default: ["Driven by motion,", "obsessed with", "the seamless."],
      description: "Headline",
    },
    labels: {
      default: ["Portfolio", "Case 01", "Notes", "Reel"],
      description: "Labels",
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
    name: {
      type: "text-content",
      default: "Mara Okafor",
      description: "Name",
    },
    role: {
      type: "text-content",
      default: "Motion designer",
      description: "Role",
    },
    question: {
      type: "text-content",
      default: "What if every launch felt this good?",
      description: "Question",
    },
    body: {
      type: "text-content",
      default:
        "A studio practice built on timing, rhythm and the frames in between.",
      description: "Body",
    },
    caption: {
      type: "text-content",
      default: "Horizon, brand film",
      description: "Caption",
    },
    location: {
      type: "text-content",
      default: "Lisbon",
      description: "Location",
    },
    ctaLabel: {
      type: "text-content",
      default: "Play reel",
      description: "Button label",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    panel: { type: "color", default: undefined, description: "Panel" },
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
  durationInFrames: 144,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
