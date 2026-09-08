import type { SceneProps } from "../content";
import { fitSize, mix, motion, progress, useSceneTime } from "../motion";
import { BrandMark, center, Headline, Stage } from "../shared";

export function OwnershipScene(props: SceneProps) {
  const { content, theme } = props;
  const t = useSceneTime();
  const fold = progress(t, 2.3, 0.7, motion.morph);
  const words = content.ownershipTitle.split(/\s+/);
  const split = Math.ceil(words.length / 2);
  const lines = [words.slice(0, split).join(" "), words.slice(split).join(" ")];
  return (
    <Stage theme={theme}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...center,
          flexDirection: "column",
          gap: 10,
          opacity: 1 - fold,
          scale: mix(1, 0.84, fold),
          translate: `0 ${-fold * 60}px`,
        }}
      >
        {lines.map((line, i) => (
          <Headline
            key={i}
            text={line}
            time={t}
            start={0.08 + i * 0.18}
            size={178}
            width={1650}
            color={i === 1 ? theme.accent : theme.paper}
            style={{ textAlign: "center" }}
          />
        ))}
        <div
          style={{
            marginTop: 48,
            fontSize: fitSize(content.ownershipDetail, 34, 1400),
            color: theme.muted,
            opacity: progress(t, 0.65, 0.4),
          }}
        >
          {content.ownershipDetail}
        </div>
      </div>
      {["{", "}"].map((bracket, i) => (
        <div
          key={bracket}
          style={{
            position: "absolute",
            left: mix(i === 0 ? 115 : 1660, i === 0 ? 843 : 987, fold),
            top: mix(420, 428, fold),
            fontSize: mix(175, 118, fold),
            color: theme.accent,
            opacity: progress(t, 0.45, 0.5) * (1 - fold),
            fontWeight: 300,
          }}
        >
          {bracket}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 866,
          top: 395,
          width: 188,
          height: 188,
          borderRadius: 46,
          background: theme.accent,
          ...center,
          opacity: fold,
          scale: mix(0.3, 1, fold),
        }}
      >
        <BrandMark {...props} size={90} color={theme.ink} />
      </div>
    </Stage>
  );
}
