import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const nowPlayingConfig: ComponentConfig = {
  componentName: "NowPlaying",
  importPath: "@/components/remocn/now-playing",
  lists: {
    lyrics: {
      default: [
        "Shipped it at midnight",
        "and the build came green",
        "every frame in motion",
        "every pixel in line",
        "press play on launch day",
        "watch the counter climb",
        "we wrote it all in React",
        "and rendered it in time",
      ],
      description: "Lyrics",
    },
  },
  controls: {
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
    nowPlayingLabel: {
      type: "text-content",
      default: "Now playing",
      description: "Playing status",
    },
    pausedLabel: {
      type: "text-content",
      default: "Paused",
      description: "Paused status",
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
    lineHold: {
      type: "number",
      default: 18,
      min: 6,
      max: 60,
      step: 1,
      description: "Lyric line hold (frames)",
      hiddenFromList: false,
    },
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
    ground: groundControl(),
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
  durationInFrames: 300,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
