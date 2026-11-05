export type Clip =
  | { kind: "shader-title"; image: string; title: string }
  | { kind: "type-title"; image: string; title: string }
  | { kind: "karaoke"; words: string[] }
  | { kind: "zoom"; frames: [string, string] }
  | { kind: "whip"; frames: [string, string] }
  | { kind: "glitch"; text: string }
  | { kind: "terminal"; command: string; result: string }
  | { kind: "rolling"; to: number }
  | { kind: "logo"; name: string; image: string }
  | { kind: "bars"; label: string; values: number[] }
  | { kind: "crt"; text: string }
  | { kind: "cursor"; label: string }
  | { kind: "checklist"; items: string[] }
  | { kind: "line-chart"; label: string; delta: string }
  | { kind: "code-morph"; key: string; from: string; to: string }
  | { kind: "marker"; words: string[]; marked: number }
  | { kind: "stars"; count: string }
  | { kind: "decode"; text: string }
  | { kind: "slot"; digits: string }
  | { kind: "split-flap"; text: string }
  | { kind: "power-off"; name: string }
  | { kind: "keystroke"; keys: string[]; label: string }
  | { kind: "word-pop"; words: string[] }
  | { kind: "search"; query: string; results: string[] };

export type SceneEntry = { block: string; clip: Clip };

const VIOLET = "/landing/shader-violet.png";
const MAGENTA = "/landing/shader-magenta.png";

export const SCENARIO_SCENES: Record<number, SceneEntry>[] = [
  {
    1: {
      block: "shader-liquid-metal",
      clip: {
        kind: "shader-title",
        image: VIOLET,
        title: "Ship it on Tuesday.",
      },
    },
    2: { block: "zoom-blur", clip: { kind: "zoom", frames: ["Acme", "2.0"] } },
    3: {
      block: "terminal-simulator",
      clip: {
        kind: "terminal",
        command: "acme deploy --prod",
        result: "live at acme.dev",
      },
    },
    4: { block: "rolling-number", clip: { kind: "rolling", to: 2418 } },
    5: {
      block: "caption-karaoke",
      clip: { kind: "karaoke", words: ["one", "prompt,", "one", "afternoon"] },
    },
    6: {
      block: "logo-enter",
      clip: { kind: "logo", name: "acme", image: MAGENTA },
    },
  },
  {
    1: {
      block: "animated-line-chart",
      clip: { kind: "line-chart", label: "Weekly active", delta: "+38%" },
    },
    2: {
      block: "whip-pan",
      clip: { kind: "whip", frames: ["Faster", "Lighter"] },
    },
    3: {
      block: "code-morph",
      clip: { kind: "code-morph", key: "version", from: "2.3.0", to: "2.4.0" },
    },
    4: {
      block: "animated-bar-chart",
      clip: {
        kind: "bars",
        label: "Changes shipped",
        values: [4, 7, 5, 9, 12],
      },
    },
    5: {
      block: "caption-marker",
      clip: {
        kind: "marker",
        words: ["twelve", "fixes,", "zero", "downtime"],
        marked: 2,
      },
    },
    6: { block: "github-stars", clip: { kind: "stars", count: "1.6k" } },
  },
  {
    1: { block: "crt-screen", clip: { kind: "crt", text: "PULSE" } },
    2: { block: "glitch-cut", clip: { kind: "glitch", text: "BETA" } },
    3: {
      block: "matrix-decode",
      clip: { kind: "decode", text: "INVITES OPEN" },
    },
    4: { block: "slot-machine-roll", clip: { kind: "slot", digits: "1024" } },
    5: {
      block: "caption-split-flap",
      clip: { kind: "split-flap", text: "FALL" },
    },
    6: { block: "tv-power-off", clip: { kind: "power-off", name: "pulse" } },
  },
  {
    1: {
      block: "typewriter",
      clip: { kind: "type-title", image: MAGENTA, title: "Notes, but fast." },
    },
    2: { block: "simulated-cursor", clip: { kind: "cursor", label: "Save" } },
    3: {
      block: "check-list",
      clip: { kind: "checklist", items: ["Capture", "Sync", "Share"] },
    },
    4: {
      block: "keystroke",
      clip: { kind: "keystroke", keys: ["⌘", "N"], label: "New note" },
    },
    5: {
      block: "caption-word-pop",
      clip: { kind: "word-pop", words: ["write", "it", "down,", "ship", "it"] },
    },
    6: {
      block: "search-reveal",
      clip: {
        kind: "search",
        query: "standup",
        results: ["Standup, Mon", "Standup, Tue"],
      },
    },
  },
];
