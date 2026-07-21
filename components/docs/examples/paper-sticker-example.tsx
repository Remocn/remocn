"use client";

import { AbsoluteFill } from "remotion";
import { PaperSticker } from "@/registry/remocn/paper-sticker";

const MONO_FONT =
  "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace";

const LABELS = ["remotion", "shadcn", "bun", "biome", "typescript"];

const STAGGER = 6;

export function PaperStickerExampleScene({
  at = 0,
  padding,
  background,
  maxTilt,
  seed = "sticker",
  step,
}: {
  at?: number;
  padding?: string;
  background?: string;
  maxTilt?: number;
  seed?: string;
  step?: number;
}) {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        flexDirection: "row",
        gap: 24,
        padding: 120,
      }}
    >
      {LABELS.map((label, i) => (
        <PaperSticker
          key={label}
          at={at + i * STAGGER}
          seed={`${seed}:${label}`}
          padding={padding}
          background={background}
          maxTilt={maxTilt}
          step={step}
        >
          <span
            style={{ fontFamily: MONO_FONT, fontSize: 28, color: "#26242c" }}
          >
            {label}
          </span>
        </PaperSticker>
      ))}
    </AbsoluteFill>
  );
}

export const paperStickerExampleCode = (
  values: Record<string, unknown>,
): string => {
  const at = (values.at as number) ?? 0;
  const padding = (values.padding as string) ?? "10px 16px";
  const background = (values.background as string) ?? "#fbfaf6";
  const maxTilt = (values.maxTilt as number) ?? 2.6;
  const seed = (values.seed as string) ?? "sticker";
  const step = (values.step as number) ?? 3;
  return `import { PaperSticker } from "@/components/remocn/paper-sticker";

const labels = ${JSON.stringify(LABELS)};

export const MyScene = () => (
  <>
    {labels.map((label, i) => (
      <PaperSticker
        key={label}
        at={${at} + i * ${STAGGER}}
        seed={\`${seed}:\${label}\`}
        padding="${padding}"
        background="${background}"
        maxTilt={${maxTilt}}
        step={${step}}
      >
        <span style={{ fontFamily: "monospace", fontSize: 28 }}>{label}</span>
      </PaperSticker>
    ))}
  </>
);`;
};
