import type { ClipSpec } from "../tiles/config";

function clip(
  name: string,
  background: string,
  options: Partial<ClipSpec> = {},
): ClipSpec {
  return {
    name,
    start: 0,
    zoom: 1,
    end: "hold",
    background,
    radius: 0.25,
    cut: "auto",
    props: {},
    ...options,
  };
}

const FUCHSIA = ["#A800B7", "#F472B6", "#3B0764"];

export const DEFAULT_LIVE_CLIPS: ClipSpec[][] = [
  [
    clip("shader-liquid-metal", "#2E0727", {
      end: "run",
      props: {
        colorBack: "#2E0727",
        colorTint: "#FF5FD9",
        repetition: 2,
        distortion: 0.18,
        speed: 0.7,
      },
    }),
    clip("soft-blur-in", "#FFFFFF", {
      props: { text: "Acme", fontSize: 220, color: "#0E1012" },
    }),
    clip("zoom-blur", "#141318"),
    clip("icon-sparkles", "#FDF4FF", {
      zoom: 0.62,
      end: "loop",
      props: { color: "#A800B7", strokeWidth: 1.8 },
    }),
    clip("caption-karaoke", "#262626"),
    clip("logo-enter", "#FFFFFF"),
  ],
  [
    clip("animated-bar-chart", "#0A0A0A", { props: { barColor: "#C026D3" } }),
    clip("rolling-number", "#FFFFFF", {
      props: { to: 2418, fontSize: 210, color: "#0E1012" },
    }),
    clip("terminal-simulator", "#050505"),
    clip("icon-check", "#ECFDF3", {
      zoom: 0.62,
      end: "loop",
      props: { color: "#16A34A", strokeWidth: 2 },
    }),
    clip("whip-pan", "#141318"),
    clip("github-stars", "#F4F4F5", { props: { orientation: "vertical" } }),
  ],
  [
    clip("shader-grain-gradient", "#12020F", {
      end: "run",
      props: {
        colors: FUCHSIA,
        colorBack: "#12020F",
        intensity: 0.35,
        noise: 0.25,
      },
    }),
    clip("slot-machine-roll", "#0E1012", {
      props: { from: "10.23", to: "10.24", color: "#FFFFFF", fontSize: 190 },
    }),
    clip("rgb-glitch-text", "#0B0D0C", {
      props: { text: "PULSE", color: "#FFFFFF", fontSize: 170 },
    }),
    clip("icon-bell", "#0E1012", {
      zoom: 0.62,
      end: "loop",
      props: { color: "#F0ABFC", strokeWidth: 2 },
    }),
    clip("caption-split-flap", "#262626"),
    clip("matrix-decode", "#07110B", {
      props: { text: "BETA", fontSize: 150 },
    }),
  ],
  [
    clip("shader-mesh-gradient", "#3B0764", {
      end: "run",
      props: {
        colors: ["#A800B7", "#F5D0FE", "#3B0764", "#E879F9"],
        distortion: 0.8,
        swirl: 0.3,
      },
    }),
    clip("typewriter", "#FFFFFF", {
      props: {
        text: "notes",
        fontSize: 180,
        color: "#0E1012",
        cursorColor: "#A800B7",
      },
    }),
    clip("check-list", "#F1EEE7"),
    clip("icon-heart", "#FFF1F2", {
      zoom: 0.62,
      end: "loop",
      props: { color: "#E11D48", strokeWidth: 2 },
    }),
    clip("caption-word-pop", "#262626"),
    clip("keystroke", "#E9E9E5"),
  ],
];
