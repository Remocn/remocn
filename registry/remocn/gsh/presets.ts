import type { GradientParams } from "./gradient-engine";

export type GshPresetId =
  | "afterhours"
  | "blue-hour"
  | "charcoal-satin"
  | "cobalt-rise"
  | "coldlight"
  | "comet"
  | "copper"
  | "corona"
  | "cyan-drift"
  | "earthshine"
  | "ember"
  | "europa"
  | "film-blue"
  | "flood"
  | "garnet"
  | "glasswork"
  | "greenhouse"
  | "hearth"
  | "iris"
  | "kiln"
  | "kiruna"
  | "lantern"
  | "low-orbit"
  | "lunar"
  | "mercury"
  | "nightfold"
  | "nova"
  | "paper-crease"
  | "petal-arc"
  | "polar"
  | "projector"
  | "refraction"
  | "riptide"
  | "solar-wind"
  | "solstice"
  | "spectral-sea"
  | "spotlight"
  | "static-sunset"
  | "velvet-hour";

export const GSH_PRESETS: Record<GshPresetId, Partial<GradientParams>> = {
  afterhours: {
    kind: "ribbon",
    colors: ["#ff2e88", "#7a5cff", "#2ee6ff"],
    background: "#050308",
    loopSeconds: 28,
    warp: 0.4,
    blur: 0.3,
    grain: 0.08,
    seed: 7,
  },
  "blue-hour": {
    kind: "radial-glow",
    colors: ["#eef8ff", "#8fd0f5", "#3d6fd0", "#1b1846"],
    background: "#010309",
    speed: 0.9,
    loopSeconds: 10,
    warp: 0.35,
    blur: 0.4,
    grain: 0.16,
    seed: 31,
  },
  "charcoal-satin": {
    kind: "silk",
    colors: ["#5c6270", "#ffffff", "#a9b0bd"],
    background: "#050506",
    loopSeconds: 28,
    scale: 2,
    warp: 0.9,
    blur: 0.25,
    seed: 2,
  },
  "cobalt-rise": {
    kind: "dither-burst",
    colors: ["#14208f", "#2e5bff", "#9fbcff", "#f4f6ff"],
    background: "#020309",
    speed: 1.16,
    loopSeconds: 14,
    warp: 0.25,
    seed: 12,
  },
  coldlight: {
    kind: "dither-burst",
    colors: ["#0b3a52", "#1aa3c8", "#a7ecff", "#f2fdff"],
    background: "#020406",
    speed: 1.02,
    loopSeconds: 14,
    warp: 0.45,
    blur: 0.6,
    seed: 44,
  },
  comet: {
    kind: "beam",
    colors: ["#e8fffb", "#4fe0d0", "#0d6f8a"],
    background: "#02060a",
    speed: 0.88,
    loopSeconds: 12,
  },
  copper: {
    kind: "chrome",
    colors: ["#b8562a", "#ffd9bf", "#ffb070"],
    background: "#060302",
    speed: 0.27,
    loopSeconds: 30,
    scale: 0.6,
    warp: 0.2,
    blur: 0.3,
    seed: 30,
  },
  corona: {
    kind: "radial-glow",
    colors: ["#fff6e6", "#ffc47b", "#c9543a", "#2a1430"],
    background: "#020101",
    speed: 0.78,
    loopSeconds: 10,
    warp: 0.35,
    blur: 0.35,
    grain: 0.18,
    seed: 8,
  },
  "cyan-drift": {
    kind: "grain",
    colors: ["#e9fffd", "#7ff5e8", "#22b8d8", "#0b2a4a"],
    background: "#010509",
    speed: 1.24,
    loopSeconds: 12,
    scale: 0.9,
    warp: 0.6,
    blur: 0.7,
    seed: 143,
  },
  earthshine: {
    kind: "limb",
    colors: ["#e8f4ff", "#4aa3ff", "#1d4fd6", "#06143a"],
    background: "#02040a",
    speed: 2,
    loopSeconds: 10,
    seed: 3,
  },
  ember: {
    kind: "radial-glow",
    colors: ["#ffe9cc", "#fe9e50", "#d6472e", "#5a0d22"],
    background: "#0a0302",
    speed: 0.97,
    loopSeconds: 10,
    warp: 0.6,
    blur: 0.6,
    grain: 0.16,
    seed: 14,
  },
  europa: {
    kind: "limb",
    colors: ["#f0fbff", "#a6e4ff", "#3d9bd6", "#0a2a40"],
    background: "#01040a",
    speed: 2,
    loopSeconds: 8,
    seed: 9,
  },
  "film-blue": {
    kind: "grain",
    colors: ["#d9f1ff", "#5fb4e6", "#2b5fbe", "#14204a"],
    background: "#03070f",
    speed: 1.35,
    loopSeconds: 11,
    scale: 0.9,
    warp: 0.35,
    blur: 0.6,
    seed: 22,
  },
  flood: {
    kind: "beam",
    colors: ["#e8f2ff", "#7fb2ff", "#2457e6", "#081a4a"],
    background: "#01030b",
    speed: 0.79,
    loopSeconds: 12,
    seed: 5,
  },
  garnet: {
    kind: "silk",
    colors: ["#b0102a", "#ffc2a8", "#ff4d7a"],
    background: "#080203",
    loopSeconds: 28,
    scale: 0.55,
    warp: 0.3,
    blur: 0.4,
    seed: 2,
  },
  glasswork: {
    kind: "spectrum",
    colors: ["#9fb2ff", "#3552ff", "#1a2a9e", "#b08cff"],
    background: "#eef0f6",
    speed: 0.37,
    loopSeconds: 16,
    warp: 0.45,
    blur: 0.4,
    seed: 20,
  },
  greenhouse: {
    kind: "pixel-glass",
    colors: ["#dcfff4", "#55e6bd", "#0e9a7e"],
    background: "#010605",
    speed: 0.94,
    loopSeconds: 16,
    scale: 0.8,
    warp: 0.7,
    grain: 0.08,
    seed: 27,
  },
  hearth: {
    kind: "rise",
    colors: ["#fff0dc", "#ff8a3a", "#9c2f14", "#2a0c07"],
    background: "#050303",
    speed: 1.07,
    loopSeconds: 13,
    scale: 1.35,
    warp: 0.25,
    grain: 0.1,
    seed: 10,
  },
  iris: {
    kind: "halo",
    colors: ["#fff6e8", "#ffc66b", "#ef4f86", "#4058ff"],
    speed: 1.53,
    loopSeconds: 12,
    warp: 0.7,
    blur: 0.35,
  },
  kiln: {
    kind: "dither-burst",
    colors: ["#5c0a02", "#e2340c", "#ff9a3a", "#ffe9c7"],
    background: "#060201",
    speed: 1.21,
    loopSeconds: 13,
    warp: 0.35,
    blur: 0.45,
    seed: 13,
  },
  kiruna: {
    kind: "aurora",
    colors: ["#dcfff4", "#55e6bd", "#0e9a7e", "#04332b"],
    background: "#010605",
    speed: 0.8,
    loopSeconds: 16,
    scale: 0.75,
    warp: 0.45,
    grain: 0.16,
    seed: 106,
  },
  lantern: {
    kind: "fluted",
    colors: ["#3d2304", "#b8650c", "#ffb340", "#fff1c9"],
    background: "#060401",
    speed: 2,
    loopSeconds: 12,
    warp: 0.4,
    seed: 23,
  },
  "low-orbit": {
    kind: "limb",
    colors: ["#effffb", "#56e3d6", "#0f8c9c", "#04242e"],
    background: "#010405",
    speed: 1.86,
    loopSeconds: 13,
    warp: 0.6,
    seed: 8,
  },
  lunar: {
    kind: "limb",
    colors: ["#ffffff", "#c9d3e6", "#5a6b8c", "#141b2b"],
    background: "#030407",
    speed: 2,
    loopSeconds: 8,
    warp: 0.3,
    seed: 5,
  },
  mercury: {
    kind: "chrome",
    colors: ["#8c929c", "#ffffff", "#4a5060"],
    background: "#040506",
    speed: 0.2,
    loopSeconds: 30,
    scale: 0.6,
    warp: 0.9,
    seed: 30,
  },
  nightfold: {
    kind: "mist",
    colors: ["#f1dcff", "#a77bff", "#3d2aa6", "#120d33"],
    background: "#040309",
    speed: 0.9,
    loopSeconds: 16,
    scale: 0.8,
    warp: 0.4,
    blur: 0.7,
  },
  nova: {
    kind: "beam",
    colors: ["#fffaf2", "#ffd07a", "#ff6a3d", "#3a0a1a"],
    background: "#050203",
    speed: 1.6,
    loopSeconds: 12,
    scale: 0.7,
    warp: 0.65,
    seed: 14,
  },
  "paper-crease": {
    kind: "mist",
    colors: ["#6e8dff", "#a9b9ff", "#d9defa", "#1a1f4a"],
    background: "#eeece8",
    speed: 0.8,
    loopSeconds: 14,
    scale: 0.8,
    warp: 0.4,
    blur: 0.65,
    grain: 0.3,
    seed: 4,
  },
  "petal-arc": {
    kind: "spectrum",
    colors: ["#8a3cff", "#ff4fb8", "#2fd8d0"],
    background: "#050208",
    warp: 0.6,
    blur: 0.55,
    seed: 9,
  },
  polar: {
    kind: "aurora",
    colors: ["#dcffee", "#43d9a8", "#12685d", "#0a1d30"],
    background: "#010307",
    loopSeconds: 16,
    scale: 0.7,
    warp: 0.45,
    blur: 0.45,
    grain: 0.16,
  },
  projector: { kind: "beam", speed: 0.91, loopSeconds: 12, seed: 3 },
  refraction: { kind: "spectrum", speed: 0.38 },
  riptide: {
    kind: "mist",
    colors: ["#e6fffb", "#43e0cf", "#0b6f74", "#032224"],
    background: "#020607",
    speed: 0.7,
    loopSeconds: 16,
    scale: 0.9,
    warp: 0.6,
    blur: 0.6,
    grain: 0.4,
    seed: 43,
  },
  "solar-wind": {
    kind: "aurora",
    colors: ["#ffe2f2", "#e879c9", "#5b309b", "#120a2a"],
    background: "#040208",
    speed: 0.71,
    loopSeconds: 16,
    scale: 0.7,
    warp: 0.55,
    blur: 0.45,
    grain: 0.16,
    seed: 17,
  },
  solstice: {
    kind: "halo",
    colors: ["#fff6dc", "#ffc85a", "#e0782a", "#5a2410"],
    background: "#050302",
    speed: 1.75,
    loopSeconds: 13,
    scale: 2.2,
    warp: 0.5,
    seed: 25,
  },
  "spectral-sea": {
    kind: "grain",
    colors: ["#c8f5ec", "#33b5b5", "#0a5f94", "#132a5a"],
    background: "#00060c",
    speed: 1.28,
    loopSeconds: 11,
    scale: 0.9,
    warp: 0.6,
    blur: 0.7,
    grain: 0.6,
    seed: 88,
  },
  spotlight: {
    kind: "beam",
    colors: ["#ffffff", "#b7c3d9", "#3a4766"],
    background: "#04040a",
    speed: 1.12,
    loopSeconds: 12,
    warp: 0.55,
    seed: 29,
  },
  "static-sunset": {
    kind: "grain",
    colors: ["#ffd9a8", "#f58c3d", "#d23e4c", "#6a1f6e"],
    background: "#0a0510",
    speed: 1.06,
    loopSeconds: 12,
    scale: 0.9,
    warp: 0.6,
    blur: 0.7,
    grain: 0.6,
  },
  "velvet-hour": { kind: "silk", loopSeconds: 28, seed: 7 },
};

export const GSH_LIGHT_PRESETS: GshPresetId[] = ["glasswork", "paper-crease"];
