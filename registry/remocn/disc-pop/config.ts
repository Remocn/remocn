import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const discPopConfig: ComponentConfig = {
  componentName: "DiscPopDemo",
  importPath: "@/components/remocn/disc-pop",
  lists: {
    greeting: {
      default: ["Hi there.", "What are you launching"],
      description: "Greeting",
      min: 2,
      max: 2,
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
    prompt: {
      type: "text-content",
      default:
        "Make a launch film for our piano app: bold title, three product shots, calm ending.",
      description: "Prompt",
    },
    fileName: {
      type: "text-content",
      default: "brand-kit.zip",
      description: "File name",
    },
    fileMeta: {
      type: "text-content",
      default: "Logo, colours, 6 shots",
      description: "File detail",
    },
    overline: {
      type: "text-content",
      default: "LAUNCH FILM · 01",
      description: "Overline",
    },
    title: {
      type: "text-content",
      default: "Keys, in an afternoon.",
      description: "Title",
    },
    exportLabel: {
      type: "text-content",
      default: "Export",
      description: "Export label",
    },
    sceneA: {
      type: "number",
      default: 84,
      min: 30,
      max: 180,
      step: 1,
      description: "Scene A (frames)",
      hiddenFromList: false,
    },
    sceneB: {
      type: "number",
      default: 84,
      min: 30,
      max: 180,
      step: 1,
      description: "Scene B (frames)",
      hiddenFromList: false,
    },
    transition: {
      type: "number",
      default: 30,
      min: 10,
      max: 60,
      step: 1,
      description: "Transition (frames)",
      hiddenFromList: false,
    },
    groundA: groundControl("Ground A"),
    groundB: groundControl("Ground B"),
    ...sceneControls({ font: "Figtree" }),
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
