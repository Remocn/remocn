/**
 * What the hero composer cycles through: an agent, the folder it runs in, the
 * prompt it's given and four real registry blocks it would pick for it. Every
 * `name` is a live registry item, `title` and `href` come from its docs page.
 */

export type AgentId = "claude-code" | "codex" | "cursor" | "gemini-cli";

export type ChipTile =
  | { kind: "drift"; src: string }
  | { kind: "gradient"; background: string }
  | { kind: "blur-in" }
  | { kind: "typewriter" }
  | { kind: "zoom"; color: string }
  | { kind: "whip"; color: string }
  | { kind: "glitch"; color: string }
  | { kind: "caption" }
  | { kind: "terminal" }
  | { kind: "chart" }
  | { kind: "check" }
  | { kind: "cursor" }
  | { kind: "number" }
  | { kind: "logo" }
  | { kind: "scanlines" };

export type PickedBlock = {
  /** Registry item name. */
  name: string;
  /** Docs page title, shown on the chip. */
  title: string;
  href: string;
  tile: ChipTile;
};

export type Scenario = {
  agent: AgentId;
  folder: string;
  prompt: string;
  picked: [PickedBlock, PickedBlock, PickedBlock, PickedBlock];
};

export const AGENT_LABEL: Record<AgentId, string> = {
  "claude-code": "Claude Code",
  codex: "Codex",
  cursor: "Cursor",
  "gemini-cli": "Gemini CLI",
};

export const SCENARIOS: Scenario[] = [
  {
    agent: "claude-code",
    folder: "~/acme-launch",
    prompt:
      "Make a 20s launch video for Acme. Dark, fast, one liquid shader behind the title, captions on the voiceover.",
    picked: [
      {
        name: "shader-liquid-metal",
        title: "Liquid Metal",
        href: "/docs/shaders/components/shader-liquid-metal",
        tile: { kind: "drift", src: "/landing/shader-violet.png" },
      },
      {
        name: "soft-blur-in",
        title: "Soft Blur In",
        href: "/docs/typography/soft-blur-in",
        tile: { kind: "blur-in" },
      },
      {
        name: "zoom-blur",
        title: "Zoom Blur",
        href: "/docs/transitions/zoom-blur",
        tile: { kind: "zoom", color: "#0E7490" },
      },
      {
        name: "caption-karaoke",
        title: "Karaoke",
        href: "/docs/captions/components/caption-karaoke",
        tile: { kind: "caption" },
      },
    ],
  },
  {
    agent: "codex",
    folder: "~/ledger",
    prompt:
      "Turn this week's changelog into a 30s feature video. Charts filling in, a terminal deploy, our logo at the end.",
    picked: [
      {
        name: "animated-bar-chart",
        title: "Animated Bar Chart",
        href: "/docs/ui-blocks/animated-bar-chart",
        tile: { kind: "chart" },
      },
      {
        name: "terminal-simulator",
        title: "Terminal Simulator",
        href: "/docs/ui-blocks/terminal-simulator",
        tile: { kind: "terminal" },
      },
      {
        name: "whip-pan",
        title: "Whip Pan",
        href: "/docs/transitions/whip-pan",
        tile: { kind: "whip", color: "#A800B7" },
      },
      {
        name: "logo-enter",
        title: "Logo Enter",
        href: "/docs/social/logo-enter",
        tile: { kind: "logo" },
      },
    ],
  },
  {
    agent: "cursor",
    folder: "~/pulse-beta",
    prompt:
      "A 15s vertical teaser for the Pulse beta. Glitchy CRT look, hard cuts, the launch date counting up at the end.",
    picked: [
      {
        name: "crt-screen",
        title: "CRT Screen",
        href: "/docs/filters/components/crt-screen",
        tile: { kind: "scanlines" },
      },
      {
        name: "glitch-cut",
        title: "Glitch Cut",
        href: "/docs/transitions/glitch-cut",
        tile: { kind: "glitch", color: "#22C55E" },
      },
      {
        name: "rolling-number",
        title: "Rolling Number",
        href: "/docs/typography/rolling-number",
        tile: { kind: "number" },
      },
      {
        name: "shader-grain-gradient",
        title: "Grain Gradient",
        href: "/docs/shaders/components/shader-grain-gradient",
        tile: {
          kind: "gradient",
          background:
            "radial-gradient(circle at 30% 30%, #F97316, #DB2777 55%, #3B0764)",
        },
      },
    ],
  },
  {
    agent: "gemini-cli",
    folder: "~/notes-app",
    prompt:
      "Show how fast our notes app is. A cursor typing a note, checkmarks popping in, a soft mesh gradient behind it all.",
    picked: [
      {
        name: "simulated-cursor",
        title: "Simulated Cursor",
        href: "/docs/effects/simulated-cursor",
        tile: { kind: "cursor" },
      },
      {
        name: "typewriter",
        title: "Typewriter",
        href: "/docs/typography/typewriter",
        tile: { kind: "typewriter" },
      },
      {
        name: "check-list",
        title: "Check List",
        href: "/docs/ui-blocks/check-list",
        tile: { kind: "check" },
      },
      {
        name: "shader-mesh-gradient",
        title: "Mesh Gradient",
        href: "/docs/shaders/components/shader-mesh-gradient",
        tile: { kind: "drift", src: "/landing/shader-magenta.png" },
      },
    ],
  },
];

/** The longest prompt reserves the paragraph height so nothing below jumps. */
export const LONGEST_PROMPT = SCENARIOS.reduce(
  (longest, scenario) =>
    scenario.prompt.length > longest.length ? scenario.prompt : longest,
  "",
);
