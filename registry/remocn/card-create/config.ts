import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const cardCreateConfig: ComponentConfig = {
  componentName: "CardCreate",
  importPath: "@/components/remocn/card-create",
  lists: {
    lines: {
      default: [
        "Spin up a new card.",
        "Pick a finish.",
        "Put your name on it.",
        "Only you see the number.",
        "Ready to spend.",
      ],
      description: "Lines",
      min: 5,
      max: 5,
    },
    colors: {
      default: [
        "#232428",
        "#c4673f",
        "#8fa68a",
        "#d9bf86",
        "#3d5677",
        "#ebe8e1",
      ],
      description: "Colors",
    },
    finishes: {
      default: ["Graphite", "Terracotta", "Sage", "Sand", "Harbour", "Bone"],
      description: "Finishes",
    },
  },
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    holder: {
      type: "text-content",
      default: "Maya Chen",
      description: "Holder",
    },
    last4: {
      type: "text-content",
      default: "4821",
      description: "Last4",
    },
    brand: {
      type: "text-content",
      default: "fernway",
      description: "Brand",
    },
    ctaLabel: {
      type: "text-content",
      default: "Add to wallet",
      description: "Button",
    },
    toastLabel: {
      type: "text-content",
      default: "Card ready to use",
      description: "Toast",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
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
  durationInFrames: 370,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
