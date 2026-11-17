import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const cardSwipeCoverConfig: ComponentConfig = {
  componentName: "CardSwipeCoverDemo",
  importPath: "@/components/remocn/card-swipe-cover",
  lists: {
    tabs: {
      default: ["All", "Videos", "Stills", "Captions"],
      description: "Tabs",
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
      default: "Every launch asset, *in one place.*",
      description: "Line",
    },
    title: {
      type: "text-content",
      default: "Launch kits",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "Four films, ready to render.",
      description: "Subtitle",
    },
    ctaLabel: {
      type: "text-content",
      default: "New kit",
      description: "Pill label",
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Card stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl("Ground A"),
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
