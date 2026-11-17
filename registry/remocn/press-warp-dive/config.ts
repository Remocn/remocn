import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const pressWarpDiveConfig: ComponentConfig = {
  componentName: "PressWarpDiveDemo",
  importPath: "@/components/remocn/press-warp-dive",
  lists: {
    suggestions: {
      default: ["Feature walkthrough", "Release notes", "Teaser for socials"],
      description: "Suggestions",
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
    heading: {
      type: "text-content",
      default: "What are we launching?",
      description: "Heading",
    },
    prompt: {
      type: "text-content",
      default: "A 30-second launch film for our new editor",
      description: "Prompt",
    },
    headingB: {
      type: "text-content",
      default: "Your film is ready",
      description: "Heading b",
    },
    title: {
      type: "text-content",
      default: "Launch film, v2",
      description: "Title",
    },
    placeholder: {
      type: "text-content",
      default: "Describe your launch film",
      description: "Placeholder",
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
  durationInFrames: 138,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
