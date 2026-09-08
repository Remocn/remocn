import type { SceneProps } from "../content";
import { fitSize, mix, motion, progress, useSceneTime } from "../motion";
import { CornerLabel, center, Headline, Stage } from "../shared";

export function HookScene({ content, theme }: SceneProps) {
  const t = useSceneTime();
  const swap = progress(t, 1.12, 0.3, motion.camera);
  const leave = progress(t, 2.22, 0.28, motion.exit);
  const text = t < 1.27 ? content.hook : content.hookPayoff;
  const words = text.split(/\s+/);
  const split = Math.ceil(words.length / 2);
  const lines = [words.slice(0, split).join(" "), words.slice(split).join(" ")];
  return (
    <Stage theme={theme}>
      <CornerLabel theme={theme}>
        {content.productName} / Introducing
      </CornerLabel>
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 900,
          left: 800,
          top: 350,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${theme.accent}22, transparent 65%)`,
          translate: `${-t * 50}px 0`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "230px 120px",
          ...center,
          flexDirection: "column",
          alignItems: "flex-start",
          translate: `${t < 1.27 ? -swap * 140 : (1 - swap) * 140}px ${-leave * 130}px`,
          opacity: 1 - leave,
          filter: `blur(${Math.sin(swap * Math.PI) * 10}px)`,
        }}
      >
        {lines.map((line, i) => (
          <Headline
            key={`${text}-${i}`}
            text={line}
            time={t < 1.27 ? t : t - 1.27}
            start={i * 0.08}
            size={fitSize(line, 210, 1640)}
            width={1640}
            color={t >= 1.27 && i === 1 ? theme.accent : theme.paper}
            style={{ marginBottom: 5 }}
          />
        ))}
        <div
          style={{
            width: mix(6, 140, progress(t, 0.5, 0.7)),
            height: 8,
            background: theme.accent,
            marginTop: 58,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 90,
          left: 122,
          right: 122,
          height: 1,
          background: "#ffffff18",
        }}
      >
        <div
          style={{
            width: `${(t / 2.5) * 100}%`,
            height: 1,
            background: theme.accent,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: theme.accent,
          clipPath: `inset(${mix(100, 0, leave)}% 0 0 0)`,
        }}
      />
    </Stage>
  );
}
