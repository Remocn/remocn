import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { RadialBurst } from "@/components/remocn/radial-burst";
import { WordPush } from "@/components/remocn/word-push";
import type { SceneProps } from "./content";
import { fitSize, mix, motion, progress } from "./motion";
import { Cursor, center, WindowBar } from "./shared";

/** Actual registry components, isolated in a 1920×1080 preview canvas. */
export function ComponentPreview({
  kind,
  time,
  theme,
  content,
}: SceneProps & { kind: number; time: number }) {
  const { fps } = useVideoConfig();
  if (kind === 0)
    return (
      <AbsoluteFill style={{ background: theme.accent }}>
        <WordPush
          text={content.initialText}
          color={theme.ink}
          fontSize={fitSize(content.initialText, 230, 1650)}
          wordGap={12}
          speed={30 / fps}
        />
      </AbsoluteFill>
    );
  if (kind === 1)
    return (
      <RadialBurst
        color={theme.ink}
        accentColor={theme.paper}
        backgroundColor={theme.peach}
        intensity={1.1}
        echoes={2}
        loop
        speed={1}
      />
    );
  if (kind === 2) {
    const phase = time % 2;
    const p = progress(phase, 0.25, 1.2, motion.camera);
    return (
      <AbsoluteFill
        style={{ background: theme.ink, ...center, color: theme.paper }}
      >
        <span
          style={{ fontSize: 250, fontWeight: 500, letterSpacing: "-0.06em" }}
        >
          Aa
        </span>
        <AbsoluteFill
          style={{
            background: theme.mint,
            color: theme.ink,
            ...center,
            clipPath: `inset(0 ${100 - p * 100}% 0 0)`,
          }}
        >
          <span
            style={{ fontSize: 250, fontWeight: 500, letterSpacing: "-0.06em" }}
          >
            Aa
          </span>
        </AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: p * 1920,
            top: 0,
            height: 1080,
            width: 7,
            background: theme.paper,
          }}
        />
      </AbsoluteFill>
    );
  }
  const p = progress(time % 2.5, 0.3, 0.6);
  const click = time % 2.5 > 0.98;
  return (
    <AbsoluteFill style={{ background: theme.paper, ...center }}>
      <div
        style={{
          width: 880,
          height: 300,
          borderRadius: 180,
          background: click ? theme.accent : theme.ink,
          color: click ? theme.ink : theme.paper,
          ...center,
          fontSize: 105,
          fontWeight: 500,
          scale: click ? 0.97 : 1,
        }}
      >
        {click ? "✓ Added" : "Add component"}
      </div>
      <Cursor
        x={mix(1540, 1230, p)}
        y={mix(970, 610, p)}
        scale={4}
        pressed={click}
      />
    </AbsoluteFill>
  );
}

export function PreviewTile({
  x,
  y,
  width,
  height,
  kind,
  time,
  theme,
  content,
  rotate = 0,
  opacity = 1,
  startAt = 0,
}: SceneProps & {
  x: number;
  y: number;
  width: number;
  height: number;
  kind: number;
  time: number;
  rotate?: number;
  opacity?: number;
  startAt?: number;
}) {
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "0 22px 45px #14131818",
        rotate: `${rotate}deg`,
        opacity,
      }}
    >
      <div
        style={{
          width: 1920,
          height: 1080,
          scale: width / 1920,
          transformOrigin: "0 0",
          position: "absolute",
          top: (height - (width * 1080) / 1920) / 2,
        }}
      >
        <Sequence from={Math.round(startAt * fps)} layout="none">
          <ComponentPreview
            kind={kind}
            time={time}
            theme={theme}
            content={content}
          />
        </Sequence>
      </div>
    </div>
  );
}

/** Shared across the gallery-to-editor cut so geometry and text stay continuous. */
export function EditingPreview({
  content,
  theme,
  text = content.initialText,
  color = theme.accent,
  wordGap = 10,
  previewStart = -1,
  opacity = 1,
  cursorTime = 0,
}: SceneProps & {
  text?: string;
  color?: string;
  wordGap?: number;
  previewStart?: number;
  opacity?: number;
  cursorTime?: number;
}) {
  const { fps } = useVideoConfig();
  const t = cursorTime;
  const cursorMove = progress(t, 0.65, 0.65);
  return (
    <div
      style={{
        position: "absolute",
        left: 960,
        top: 335,
        width: 820,
        height: 570,
        borderRadius: 22,
        background: theme.paper,
        overflow: "hidden",
        opacity,
      }}
    >
      <WindowBar title="live preview" />
      <div
        style={{
          position: "absolute",
          inset: "58px 0 0",
          background: theme.ink,
        }}
      >
        <Sequence
          key={previewStart}
          from={Math.round(previewStart * fps)}
          layout="none"
        >
          <WordPush
            text={text}
            color={color}
            fontSize={fitSize(text, 95, 730)}
            wordGap={wordGap}
            accel={0.88}
            speed={30 / fps}
          />
        </Sequence>
        <div
          style={{
            position: "absolute",
            bottom: 34,
            left: 34,
            display: "flex",
            gap: 14,
          }}
        >
          {[theme.accent, theme.peach, theme.mint].map((c) => (
            <div
              key={c}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: c,
                outline: color === c ? `2px solid ${theme.paper}` : undefined,
                outlineOffset: 5,
              }}
            />
          ))}
        </div>
        <Cursor
          x={mix(720, 70, cursorMove)}
          y={mix(580, 455, cursorMove)}
          pressed={t > 1.3 && t < 1.46}
          color={theme.paper}
        />
      </div>
    </div>
  );
}
