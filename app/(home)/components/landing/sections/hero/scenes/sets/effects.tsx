"use client";

import { motion } from "motion/react";
import { EASE_IN_OUT, EASE_OUT, Frame, Letters } from "./kit";
import type { SceneDef, SceneProps, SceneSet } from "./types";

type Effect =
  | "blur"
  | "glitch"
  | "halftone"
  | "extrude"
  | "outline"
  | "wave"
  | "echo"
  | "stretch"
  | "tracking"
  | "rolodex"
  | "sheen"
  | "focus"
  | "squeeze";

type Material = {
  word: string;
  surface: string;
  ink: string;
  accent: string;
  dark: boolean;
};

const MATERIALS: Material[] = [
  {
    word: "Acme",
    surface: "bg-[#0E1012]",
    ink: "#FFFFFF",
    accent: "#F0ABFC",
    dark: true,
  },
  {
    word: "Ledger",
    surface: "bg-white",
    ink: "#0E1012",
    accent: "#A800B7",
    dark: false,
  },
  {
    word: "Pulse",
    surface: "bg-black",
    ink: "#FFFFFF",
    accent: "#22C55E",
    dark: true,
  },
  {
    word: "Notes",
    surface: "bg-[#FBE8FD]",
    ink: "#0E1012",
    accent: "#A800B7",
    dark: false,
  },
];

const BLOCK: Record<Effect, string> = {
  blur: "soft-blur-in",
  glitch: "rgb-glitch-text",
  halftone: "halftone-print",
  extrude: "extrude-pop",
  outline: "outline-trace",
  wave: "chromatic-wave",
  echo: "echo-stack",
  stretch: "stretch-in",
  tracking: "tracking-in",
  rolodex: "rolodex-flip",
  sheen: "sheen-slide-in",
  focus: "focus-blur-resolve",
  squeeze: "squeeze-in",
};

const WORD = "text-[46px] font-semibold tracking-[-0.05em] leading-none";

function EffectWord({
  cycle,
  speed,
  effect,
  material,
}: SceneProps & { effect: Effect; material: Material }) {
  const { word, ink, accent } = material;
  const d = (s: number) => s / speed;
  const color = { color: ink };

  const body = (() => {
    switch (effect) {
      case "blur":
        return (
          <Letters
            text={word}
            cycle={cycle}
            speed={speed}
            className={WORD}
            initial={{ opacity: 0, filter: "blur(12px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            stagger={0.06}
          />
        );
      case "glitch":
        return (
          <span key={cycle} className={`relative ${WORD}`}>
            {[accent, "#38BDF8"].map((tint, i) => (
              <motion.span
                key={tint}
                className="absolute inset-0 mix-blend-screen"
                style={{ color: tint }}
                animate={{
                  x: [0, 0, i ? 5 : -5, i ? -3 : 3, 0, 0],
                  opacity: [0, 0, 1, 1, 0, 0],
                }}
                transition={{
                  duration: d(1.2),
                  times: [0, 0.3, 0.35, 0.42, 0.48, 1],
                }}
              >
                {word}
              </motion.span>
            ))}
            <span className="relative" style={color}>
              {word}
            </span>
          </span>
        );
      case "halftone":
        return (
          <motion.span
            key={cycle}
            className={WORD}
            style={{
              color: "transparent",
              backgroundImage: `radial-gradient(circle, ${ink} 45%, transparent 47%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
            }}
            initial={{ backgroundSize: "2px 2px" }}
            animate={{ backgroundSize: ["2px 2px", "9px 9px", "5px 5px"] }}
            transition={{ duration: d(1.4), ease: EASE_IN_OUT }}
          >
            {word}
          </motion.span>
        );
      case "extrude":
        return (
          <motion.span
            key={cycle}
            className={WORD}
            style={color}
            initial={{ textShadow: `0 0 0 ${accent}`, y: 0 }}
            animate={{
              textShadow: [
                `0 0 0 ${accent}`,
                `4px 4px 0 ${accent}, 8px 8px 0 ${accent}55`,
              ],
              y: [0, -4],
            }}
            transition={{
              type: "spring",
              visualDuration: d(0.5),
              bounce: 0.4,
              delay: d(0.2),
            }}
          >
            {word}
          </motion.span>
        );
      case "outline":
        return (
          <motion.span
            key={cycle}
            className={WORD}
            style={{ WebkitTextStroke: `1.5px ${ink}` }}
            initial={{ color: "rgba(0,0,0,0)" }}
            animate={{ color: ["rgba(0,0,0,0)", "rgba(0,0,0,0)", ink] }}
            transition={{
              duration: d(1.4),
              times: [0, 0.55, 1],
              ease: EASE_OUT,
            }}
          >
            {word}
          </motion.span>
        );
      case "wave":
        return (
          <span className={`inline-flex ${WORD}`}>
            {word.split("").map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                animate={{ y: [0, -10, 0], color: [ink, accent, ink] }}
                transition={{
                  duration: d(1),
                  delay: d(i * 0.08),
                  repeat: Infinity,
                  repeatDelay: d(0.6),
                  ease: "easeInOut",
                }}
              >
                {char}
              </motion.span>
            ))}
          </span>
        );
      case "echo":
        return (
          <span key={cycle} className={`relative ${WORD}`}>
            {[3, 2, 1].map((n) => (
              <motion.span
                key={n}
                className="absolute inset-0"
                style={{ color: accent }}
                initial={{ y: 0, opacity: 0 }}
                animate={{ y: -n * 9, opacity: 0.18 * (4 - n) }}
                transition={{
                  duration: d(0.6),
                  ease: EASE_OUT,
                  delay: d(0.2 + n * 0.05),
                }}
              >
                {word}
              </motion.span>
            ))}
            <span className="relative" style={color}>
              {word}
            </span>
          </span>
        );
      case "stretch":
        return (
          <motion.span
            key={cycle}
            className={`inline-block ${WORD}`}
            style={color}
            initial={{ scaleX: 0.15, scaleY: 1.6, opacity: 0 }}
            animate={{ scaleX: 1, scaleY: 1, opacity: 1 }}
            transition={{
              type: "spring",
              visualDuration: d(0.55),
              bounce: 0.3,
              delay: d(0.15),
            }}
          >
            {word}
          </motion.span>
        );
      case "tracking":
        return (
          <motion.span
            key={cycle}
            className={WORD}
            style={color}
            initial={{ letterSpacing: "0.5em", opacity: 0 }}
            animate={{ letterSpacing: "-0.05em", opacity: 1 }}
            transition={{ duration: d(0.9), ease: EASE_OUT, delay: d(0.1) }}
          >
            {word}
          </motion.span>
        );
      case "rolodex":
        return (
          <span className="[perspective:300px]">
            <Letters
              text={word}
              cycle={cycle}
              speed={speed}
              className={WORD}
              letterClassName="[transform-origin:50%_50%_-16px]"
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              stagger={0.07}
            />
          </span>
        );
      case "sheen":
        return (
          <span
            key={cycle}
            className={`relative inline-block overflow-hidden ${WORD}`}
          >
            <motion.span
              className="relative inline-block"
              style={color}
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: d(0.5), ease: EASE_OUT, delay: d(0.1) }}
            >
              {word}
            </motion.span>
            <motion.span
              className="absolute inset-y-0 w-6 -skew-x-12"
              style={{
                backgroundColor: accent,
                mixBlendMode: material.dark ? "screen" : "multiply",
                opacity: 0.6,
              }}
              initial={{ left: "-20%" }}
              animate={{ left: "120%" }}
              transition={{
                duration: d(0.7),
                ease: EASE_IN_OUT,
                delay: d(0.6),
              }}
            />
          </span>
        );
      case "focus":
        return (
          <span className={`inline-flex ${WORD}`} style={color}>
            {word.split("").map((char, i) => (
              <motion.span
                key={`${char}-${i}-${cycle}`}
                initial={{ filter: "blur(10px)", opacity: 0.3 }}
                animate={{ filter: "blur(0px)", opacity: 1 }}
                transition={{
                  duration: d(0.5),
                  ease: EASE_OUT,
                  delay: d(0.1 + ((i * 37) % 5) * 0.12),
                }}
              >
                {char}
              </motion.span>
            ))}
          </span>
        );
      case "squeeze":
        return (
          <motion.span
            key={cycle}
            className={`inline-block ${WORD}`}
            style={color}
            initial={{ scaleY: 0.05, scaleX: 1.4, opacity: 0 }}
            animate={{ scaleY: 1, scaleX: 1, opacity: 1 }}
            transition={{
              type: "spring",
              visualDuration: d(0.5),
              bounce: 0.35,
              delay: d(0.15),
            }}
          >
            {word}
          </motion.span>
        );
    }
  })();

  return <Frame className="flex items-center justify-center">{body}</Frame>;
}

const PLAN: Effect[][] = [
  ["blur", "glitch", "halftone", "extrude", "outline", "wave"],
  ["echo", "stretch", "tracking", "rolodex", "sheen", "focus"],
  ["halftone", "wave", "blur", "squeeze", "glitch", "rolodex"],
  ["extrude", "squeeze", "outline", "focus", "tracking", "sheen"],
];

function scene(scenario: number, effect: Effect): SceneDef {
  const material = MATERIALS[scenario];
  return {
    block: BLOCK[effect],
    surface: material.surface,
    dark: material.dark,
    duration: effect === "wave" ? 3 : 2,
    render: (p) => <EffectWord {...p} effect={effect} material={material} />,
  };
}

export const EFFECTS_SET: SceneSet = PLAN.map((effects, scenario) =>
  Object.fromEntries(
    effects.map((effect, i) => [i + 1, scene(scenario, effect)]),
  ),
);
