import type { ControlConfig } from "@/lib/customizer-config";
import { sanitizePatch } from "./patch";
import type { Patch, Preset } from "./types";

/**
 * Looks that work on any component: each sets only the shared Launch Pack
 * props (speed, scale, delay, ink, background, fontFamily, grain) and the
 * `theme` select where a component has them. Written once, offered
 * everywhere: as chips, and as targets the request is matched against by
 * meaning, beside the component's own presets.
 */
interface Mood {
  id: string;
  label: string;
  description: string;
  askedAs: string[];
  props: Patch;
  /** Props the mood is about: a component without them doesn't get it. */
  requires?: string[];
}

const DARK = { background: "#0a0a0a", ink: "#fafafa", theme: "dark" };
const LIGHT = { background: "#fafafa", ink: "#0a0a0a", theme: "light" };

export const MOODS: Mood[] = [
  {
    id: "calm",
    label: "Calm",
    description: "Slow, relaxed motion that takes its time.",
    askedAs: [
      "calm and slow",
      "relaxed pace",
      "gentle and unhurried",
      "спокойно и плавно",
      "медленно и размеренно",
    ],
    props: { speed: 0.75 },
  },
  {
    id: "energetic",
    label: "Energetic",
    description: "Fast, punchy motion with a lot of energy.",
    askedAs: [
      "energetic and fast",
      "punchy hype",
      "high energy",
      "энергично и быстро",
      "динамично",
    ],
    props: { speed: 1.5 },
  },
  {
    id: "cinematic",
    label: "Cinematic",
    description: "A slow, dark, filmic look with grain and a bigger subject.",
    askedAs: [
      "cinematic",
      "like a movie trailer",
      "filmic and moody",
      "как в кино",
      "кинематографично",
    ],
    props: { speed: 0.75, scale: 1.1, grain: true, ...DARK },
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Elegant serif type on a light page, at an unhurried pace.",
    askedAs: [
      "editorial",
      "elegant magazine look",
      "classy serif",
      "как в журнале",
      "элегантно",
    ],
    props: { fontFamily: "Instrument Serif", speed: 0.75, ...LIGHT },
    requires: ["fontFamily"],
  },
  {
    id: "technical",
    label: "Technical",
    description: "Monospaced type on dark, for developer tools and terminals.",
    askedAs: [
      "technical developer vibe",
      "like a terminal",
      "hacker style",
      "для разработчиков",
      "как терминал",
    ],
    props: { fontFamily: "JetBrains Mono", grain: false, ...DARK },
    requires: ["fontFamily"],
  },
  {
    id: "clean",
    label: "Clean",
    description: "Minimal and neutral: plain sans type, no grain, light page.",
    askedAs: [
      "clean and minimal",
      "simple corporate",
      "neutral and plain",
      "минималистично",
      "чисто и просто",
    ],
    props: { fontFamily: "Inter", grain: false, ...LIGHT },
    requires: ["fontFamily"],
  },
  {
    id: "playful",
    label: "Playful",
    description:
      "Friendly, bouncy and a little faster, with a characterful font.",
    askedAs: [
      "playful and fun",
      "friendly cheerful",
      "for kids",
      "весело и игриво",
      "дружелюбно",
    ],
    props: { fontFamily: "Bricolage Grotesque", speed: 1.25 },
    requires: ["fontFamily"],
  },
  {
    id: "dark",
    label: "Dark",
    description: "Light text on a dark background.",
    askedAs: [
      "dark mode",
      "dark theme",
      "night",
      "тёмная тема",
      "на тёмном фоне",
    ],
    props: DARK,
  },
  {
    id: "light",
    label: "Light",
    description: "Dark text on a light background.",
    askedAs: [
      "light mode",
      "light theme",
      "white background",
      "светлая тема",
      "на белом фоне",
    ],
    props: LIGHT,
  },
];

/**
 * The moods as presets for one component: each with only the props it has,
 * and only the moods that would change something.
 */
export function moodsFor(
  controls: ControlConfig,
  values: Record<string, unknown>,
): Preset[] {
  return MOODS.flatMap((mood) => {
    const props = sanitizePatch(controls, mood.props);
    if (mood.requires?.some((key) => !(key in props))) return [];
    const changes = Object.entries(props).some(
      ([key, value]) => !Object.is(values[key], value),
    );
    if (!changes) return [];
    const { requires: _, ...preset } = mood;
    return [{ ...preset, id: `mood:${mood.id}`, props }];
  });
}
