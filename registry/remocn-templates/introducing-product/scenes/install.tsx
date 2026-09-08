import { Sequence, useVideoConfig } from "remotion";
import { WordPush } from "@/components/remocn/word-push";
import type { SceneProps } from "../content";
import { fitSize, mix, motion, progress, useSceneTime } from "../motion";
import {
  CornerLabel,
  center,
  Headline,
  mono,
  Stage,
  WindowBar,
} from "../shared";

export function InstallScene({ content, theme }: SceneProps) {
  const t = useSceneTime();
  const { fps } = useVideoConfig();
  const open = progress(t, 1.82, 0.65, motion.morph);
  const paper = progress(t, 1.82, 0.65, motion.morph);
  const typed = content.installCommand.slice(
    0,
    Math.floor(
      progress(t, 0.13, 1.2, (v) => v) * content.installCommand.length,
    ),
  );
  return (
    <Stage theme={theme}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: theme.paper,
          opacity: paper,
        }}
      />
      <CornerLabel theme={theme} light={t > 2}>
        {content.productName} / Copy & create
      </CornerLabel>
      <div
        style={{ position: "absolute", left: 120, top: 184, opacity: 1 - open }}
      >
        <Headline text={content.installLabel} time={t} size={90} width={1650} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 220,
          top: mix(436, 310, open),
          width: 1480,
          height: mix(208, 570, open),
          borderRadius: 24,
          overflow: "hidden",
          background: "#201e26",
          border: `1px solid ${theme.accent}55`,
          boxShadow: `0 35px 100px ${theme.ink}30`,
        }}
      >
        <WindowBar title="terminal" dark />
        <div
          style={{
            padding: "36px 38px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            color: theme.paper,
            fontFamily: mono,
            fontSize: fitSize(content.installCommand, 39, 1310, 0.61),
          }}
        >
          <span style={{ color: theme.mint }}>$</span>
          <span>
            {typed}
            <span style={{ color: theme.accent, opacity: t > 1.4 ? 0 : 1 }}>
              ▍
            </span>
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            top: 173,
            left: 42,
            fontFamily: mono,
            fontSize: 26,
            opacity: progress(t, 1.45, 0.18) * (1 - open),
            color: theme.mint,
          }}
        >
          ✓ Component added. Ready to make yours.
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 156,
            bottom: 0,
            width: "100%",
            background: theme.accent,
            opacity: open,
            ...center,
          }}
        >
          <Sequence from={Math.round(2.35 * fps)} layout="none">
            <WordPush
              text={content.initialText}
              color={theme.ink}
              fontSize={fitSize(content.initialText, 135, 1250)}
              wordGap={13}
              accel={0.86}
              speed={30 / fps}
            />
          </Sequence>
          <div
            style={{
              position: "absolute",
              left: 35,
              bottom: 28,
              fontSize: 19,
              fontFamily: mono,
              opacity: 0.6,
            }}
          >
            word-push.tsx
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 220,
          right: 220,
          top: 184,
          color: theme.ink,
          fontSize: fitSize(content.galleryTitle, 88, 1480),
          letterSpacing: "-0.055em",
          opacity: open,
          translate: `0 ${mix(25, 0, open)}px`,
        }}
      >
        {content.galleryTitle}
      </div>
    </Stage>
  );
}
