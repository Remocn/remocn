"use client";

import {
  ComicPanels,
  comicPanelsDefaults,
} from "@/registry/remocn/comic-panels";

const FONT_FAMILY =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function Lockup({ ink, accent }: { ink: string; accent: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 32,
          backgroundColor: accent,
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
            backgroundColor: ink,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 104,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: ink,
        }}
      >
        remocn
      </span>
    </div>
  );
}

interface ComicPanelsExampleProps {
  word?: string;
  ink?: string;
  paper?: string;
  accent?: string;
  heroScale?: number;
  speed?: number;
}

export function ComicPanelsExampleScene({
  word = "POW",
  ink = comicPanelsDefaults.colors.ink,
  paper,
  accent = comicPanelsDefaults.colors.accent,
  heroScale,
  speed,
}: ComicPanelsExampleProps) {
  return (
    <ComicPanels
      word={word}
      ink={ink}
      paper={paper}
      accent={accent}
      heroScale={heroScale}
      speed={speed}
    >
      <Lockup ink={ink} accent={accent} />
    </ComicPanels>
  );
}

export const comicPanelsExampleCode = (
  values: Record<string, unknown>,
): string => {
  const d = comicPanelsDefaults;
  const word = (values.word as string) ?? "POW";
  const ink = (values.ink as string) ?? d.colors.ink;
  const paper = (values.paper as string) ?? d.colors.paper;
  const accent = (values.accent as string) ?? d.colors.accent;
  const heroScale = (values.heroScale as number) ?? d.heroScale;
  const speed = (values.speed as number) ?? 1;
  return `import { ComicPanels } from "@/components/remocn/comic-panels";

export const MyScene = () => (
  <ComicPanels
    word=${JSON.stringify(word)}
    ink="${ink}"
    paper="${paper}"
    accent="${accent}"
    heroScale={${heroScale}}
    speed={${speed}}
  >
    <Logo />
  </ComicPanels>
);`;
};
