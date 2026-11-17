import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const aiAnswerSourcesConfig: ComponentConfig = {
  componentName: "AiAnswerSources",
  importPath: "@/components/remocn/ai-answer-sources",
  lists: {
    related: {
      default: [
        "How long should a launch video be?",
        "Which scenes work best for a SaaS demo?",
        "Can I render launch videos in CI?",
      ],
      description: "Related questions",
    },
  },
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    query: {
      type: "text-content",
      default: "What is the fastest way to make a launch video?",
      description: "Query",
    },
    brand: {
      type: "text-content",
      default: "sift",
      description: "Brand",
    },
    placeholder: {
      type: "text-content",
      default: "Ask anything",
      description: "Search placeholder",
    },
    searchLabel: {
      type: "text-content",
      default: "Searching the web",
      description: "Search step label",
    },
    followUpPlaceholder: {
      type: "text-content",
      default: "Ask a follow-up",
      description: "Follow-up placeholder",
    },
    accent: {
      type: "color",
      default: "#20808D",
      description: "Accent",
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
  durationInFrames: 419,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
