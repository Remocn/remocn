import type { SceneProps } from "../content";
import { fitSize, mix, progress, useSceneTime } from "../motion";
import { EditingPreview } from "../previews";
import { CornerLabel, Headline, mono, Stage, WindowBar } from "../shared";

export function CustomizeScene({ content, theme }: SceneProps) {
  const t = useSceneTime();
  const recolored = t >= 1.35;
  const rewritten = t >= 2.65;
  const retimed = t >= 3.65;
  const text = rewritten ? content.editedText : content.initialText;
  const color = recolored ? theme.peach : theme.accent;
  const wordGap = retimed ? 6 : 10;
  const previewStart = retimed ? 3.65 : rewritten ? 2.65 : -1;
  const enter = progress(t, 0, 0.45);
  const lines = [
    "<WordPush",
    `  text=${JSON.stringify(text)}`,
    `  color="${color}"`,
    `  wordGap={${wordGap}}`,
    "/>",
  ];
  const activeLine = retimed ? 3 : rewritten ? 1 : recolored ? 2 : -1;
  return (
    <Stage theme={theme}>
      <CornerLabel theme={theme}>
        {content.productName} / Own every detail
      </CornerLabel>
      <div style={{ position: "absolute", left: 120, top: 168 }}>
        <Headline text={content.editTitle} time={t} size={104} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 335,
          width: 770,
          height: 570,
          borderRadius: 22,
          border: "1px solid #ffffff20",
          overflow: "hidden",
          background: "#201e26",
          opacity: enter,
          translate: `${mix(-75, 0, enter)}px 0`,
        }}
      >
        <WindowBar title="your-video.tsx" dark />
        <div
          style={{
            padding: "54px 22px",
            fontFamily: mono,
            fontSize: 31,
            lineHeight: "68px",
          }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                borderRadius: 8,
                background:
                  activeLine === i ? `${theme.accent}18` : "transparent",
                color: i === 0 || i === 4 ? theme.mint : theme.paper,
              }}
            >
              <span
                style={{
                  width: 53,
                  flexShrink: 0,
                  color: "#6b6777",
                  textAlign: "center",
                  fontSize: 22,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  whiteSpace: "pre",
                  fontSize: fitSize(line, 31, 660, 0.61),
                }}
              >
                {line}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: 40,
            bottom: 30,
            color: theme.muted,
            fontSize: 20,
          }}
        >
          React source. In your project.
        </div>
      </div>
      <EditingPreview
        content={content}
        theme={theme}
        text={text}
        color={color}
        wordGap={wordGap}
        previewStart={previewStart}
        cursorTime={t}
      />
      <div
        style={{
          position: "absolute",
          left: 140,
          right: 140,
          bottom: 83,
          display: "flex",
          gap: 35,
          fontSize: 23,
          color: theme.muted,
        }}
      >
        {["Your colors", "Your words", "Your timing"].map((label, i) => (
          <span
            key={label}
            style={{
              color: [recolored, rewritten, retimed][i]
                ? theme.paper
                : theme.muted,
              opacity: enter,
            }}
          >
            {[recolored, rewritten, retimed][i] ? "✓ " : ""}
            {label}
          </span>
        ))}
      </div>
    </Stage>
  );
}
