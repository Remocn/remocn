import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const hotSlabMorphConfig: ComponentConfig = {
  componentName: "HotSlabMorphDemo",
  importPath: "@/components/remocn/hot-slab-morph",
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
    lineA: {
      type: "text-content",
      default: "Start from a template",
      description: "Line a",
    },
    lineB: {
      type: "text-content",
      default: "or just describe it",
      description: "Line b",
    },
    prompt: {
      type: "text-content",
      default: "A 30-second launch film for our new editor",
      description: "Prompt",
    },
    placeholder: {
      type: "text-content",
      default: "Describe your launch film",
      description: "Placeholder",
    },
    searchLabel: {
      type: "text-content",
      default: "Search templates",
      description: "Search label",
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl("Ground A"),
    groundB: groundControl("Ground B"),
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
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
