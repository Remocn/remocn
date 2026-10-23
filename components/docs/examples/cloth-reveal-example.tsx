"use client";

import {
  ClothReveal,
  type ClothRevealDirection,
} from "@/registry/remocn/cloth-reveal";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function Lockup() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 32,
          backgroundColor: "#E5322D",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "#111111",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 104,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: "#FFFFFF",
        }}
      >
        remocn
      </span>
    </div>
  );
}

interface ClothRevealExampleProps {
  direction?: ClothRevealDirection;
  clothColor?: string;
  undersideColor?: string;
  background?: string;
  delay?: number;
  seed?: number;
  speed?: number;
}

export function ClothRevealExampleScene({
  direction = "right",
  clothColor = "#E5322D",
  undersideColor = "#8E1A16",
  background = "#111111",
  delay = 6,
  seed = 2,
  speed = 1,
}: ClothRevealExampleProps) {
  return (
    <ClothReveal
      direction={direction}
      clothColor={clothColor}
      undersideColor={undersideColor}
      background={background}
      delay={delay}
      seed={seed}
      speed={speed}
    >
      <Lockup />
    </ClothReveal>
  );
}

export const clothRevealExampleCode = (
  values: Record<string, unknown>,
): string => {
  const direction = (values.direction as string) ?? "right";
  const clothColor = (values.clothColor as string) ?? "#E5322D";
  const undersideColor = (values.undersideColor as string) ?? "#8E1A16";
  const background = (values.background as string) ?? "#111111";
  const delay = (values.delay as number) ?? 6;
  const seed = (values.seed as number) ?? 2;
  const speed = (values.speed as number) ?? 1;
  const speedLine = speed === 1 ? "" : `\n    speed={${speed}}`;
  return `import { ClothReveal } from "@/components/remocn/cloth-reveal";

export const MyScene = () => (
  <ClothReveal
    direction="${direction}"
    clothColor="${clothColor}"
    undersideColor="${undersideColor}"
    background="${background}"
    delay={${delay}}
    seed={${seed}}${speedLine}
  >
    <YourLogo />
  </ClothReveal>
);`;
};
