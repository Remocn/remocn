import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const moneySendConfig: ComponentConfig = {
  componentName: "MoneySend",
  importPath: "@/components/remocn/money-send",
  lists: {
    lines: {
      default: ["Type any amount.", "Say what it’s for.", "Sent in a second."],
      description: "Lines",
      min: 3,
      max: 3,
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
    recipient: {
      type: "text-content",
      default: "Maya Chen",
      description: "Recipient",
    },
    currency: {
      type: "text-content",
      default: "USD",
      description: "Currency",
    },
    note: {
      type: "text-content",
      default: "Dinner 🍜",
      description: "Note",
    },
    notePlaceholder: {
      type: "text-content",
      default: "Add a note",
      description: "Note placeholder",
    },
    doneLabel: {
      type: "text-content",
      default: "Done",
      description: "Done label",
    },
    amount: {
      type: "number",
      default: 120,
      min: 0,
      max: 360,
      step: 1,
      description: "Amount",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 11,
      min: 4,
      max: 20,
      step: 1,
      description: "Key stagger",
      hiddenFromList: false,
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
  durationInFrames: 260,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
