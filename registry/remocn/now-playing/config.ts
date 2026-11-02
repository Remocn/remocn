import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const nowPlayingConfig: ComponentConfig = {
  componentName: "NowPlaying",
  importPath: "@/components/remocn/now-playing",
  controls: {
    tint: {
      type: "color",
      default: "#B8553A",
      description: "Tint",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    title: {
      type: "text-content",
      default: "Launch Day",
      description: "Title",
    },
    artist: {
      type: "text-content",
      default: "remocn",
      description: "Artist",
    },
    playlist: {
      type: "text-content",
      default: "Launch Week Mix",
      description: "Playlist",
    },
    variant: {
      type: "enum",
      default: "full",
      variants: {
        full: {},
        mini: {},
      },
      description: "Variant",
    },
    duration: {
      type: "number",
      default: 165,
      min: 0,
      max: 495,
      step: 1,
      description: "Duration",
      hiddenFromList: false,
    },
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
  durationInFrames: 300,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
