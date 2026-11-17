import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const whatSticksConfig: ComponentConfig = {
  componentName: "WhatSticks",
  importPath: "@/components/remocn/what-sticks",
  lists: {
    lines: {
      default: [
        "Scenes install with one command.",
        "Every word on screen is a prop.",
        "Transitions land on the beat.",
        "Captions come from the transcript.",
        "You own every file.",
        "It renders on your laptop.",
      ],
      description: "Lines",
    },
    moments: {
      default: [
        "Tonight, you’ll remember all of it.",
        "Tomorrow, about half.",
        "Next week, just this.",
      ],
      description: "Moments",
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
    stagger: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Line stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Rubik" }),
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
  durationInFrames: 230,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
