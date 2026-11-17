import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const macroTabNameConfig: ComponentConfig = {
  componentName: "MacroTabName",
  importPath: "@/components/remocn/macro-tab-name",
  lists: {
    neighbors: {
      default: ["Changelog", "Pricing"],
      description: "Neighbor tabs",
    },
    path: {
      default: ["Marketing", "Launch week"],
      description: "Breadcrumb",
    },
    docBody: {
      default: [
        "Hero cut, 0:42 — 1080p and 4K masters",
        "Pricing table screenshots, light and dark",
        "Waitlist email header, 600 × 200",
        "Social cutdowns: 1:1, 4:5, 9:16",
      ],
      description: "Document lines",
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
      default: "Launch Assets",
      description: "Name",
    },
    docMeta: {
      type: "text-content",
      default: "Edited 2 min ago · 14 files",
      description: "Doc meta",
    },
    placeholder: {
      type: "text-content",
      default: "Untitled",
      description: "Placeholder",
    },
    stagger: {
      type: "number",
      default: 3,
      min: 1,
      max: 8,
      step: 1,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Inter Tight" }),
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
  durationInFrames: 108,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
