import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const panelSplitConfig: ComponentConfig = {
  componentName: "PanelSplit",
  importPath: "@/components/remocn/panel-split",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
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
  },
  durationInFrames: 144,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
