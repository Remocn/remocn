import type { SceneProps } from "../content";
import { fitSize, mix, progress, useSceneTime } from "../motion";
import { BrandMark, center, Eyebrow, Stage, Wordmark } from "../shared";

export function BrandScene(props: SceneProps) {
  const { content, theme } = props;
  const t = useSceneTime();
  const reveal = progress(t, 0, 0.58);
  const exit = progress(t, 2.02, 0.48);
  return (
    <Stage theme={theme}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...center,
          opacity: reveal * (1 - exit),
          scale: mix(0.83, 1, reveal),
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 850 + i * 300,
              height: 850 + i * 300,
              border: `1px solid ${theme.accent}${i === 0 ? "30" : "16"}`,
              borderRadius: "50%",
              scale: mix(0.85, 1.03, progress(t, i * 0.06, 2.2)),
              rotate: `${i * 22 + t * 8}deg`,
              transform: "rotateX(62deg)",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            width: 1200,
            height: 800,
            top: 480,
            background: `radial-gradient(ellipse, ${theme.accent}35, transparent 66%)`,
          }}
        />
        <div
          style={{
            ...center,
            flexDirection: "column",
            gap: 44,
            translate: `0 ${-exit * 150}px`,
          }}
        >
          <Eyebrow
            style={{ color: theme.accent, opacity: progress(t, 0.35, 0.3) }}
          >
            Introducing
          </Eyebrow>
          <Wordmark {...props} size={260} color={theme.paper} />
          <div
            style={{
              fontSize: fitSize(content.tagline, 44, 1600),
              letterSpacing: "-0.025em",
              opacity: progress(t, 0.55, 0.4),
            }}
          >
            {content.tagline}
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: mix(0, 854, reveal),
          top: mix(0, 350, reveal),
          width: mix(1920, 212, reveal),
          height: mix(1080, 212, reveal),
          borderRadius: mix(0, 52, reveal),
          background: theme.accent,
          ...center,
          opacity: 1 - progress(t, 0.28, 0.26),
          scale: mix(1, 0.8, reveal),
        }}
      >
        <BrandMark {...props} size={100} color={theme.ink} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 220,
          top: 436,
          width: 1480,
          height: 208,
          borderRadius: 24,
          border: `1px solid ${theme.accent}55`,
          background: "#201e26",
          opacity: exit,
          scale: mix(0.72, 1, exit),
        }}
      />
    </Stage>
  );
}
