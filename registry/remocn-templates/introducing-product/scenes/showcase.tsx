import type { SceneProps } from "../content";
import { fitSize, mix, motion, progress, useSceneTime } from "../motion";
import { BrandMark, center, Stage } from "../shared";

/** A complete little launch sequence, rendered from editable React source. */
export function ShowcaseScene(props: SceneProps) {
  const { content, theme } = props;
  const t = useSceneTime();
  const phase = t < 1.1 ? 0 : t < 1.8 ? 1 : t < 2.5 ? 2 : 3;
  const starts = [0, 1.1, 1.8, 2.5];
  const p = progress(t, starts[phase], 0.34, motion.morph);
  const colors = [theme.accent, theme.peach, theme.mint, theme.paper];
  const title =
    phase === 0 ? content.showcaseTitle : content.showcaseWords[phase - 1];
  return (
    <Stage
      theme={theme}
      style={{ background: colors[phase], color: theme.ink }}
    >
      <div style={{ position: "absolute", inset: 0, ...center, opacity: 0.4 }}>
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * Math.PI) / 6 + t * 0.25;
          const radius = 460 + Math.sin(t * 2) * 30;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 100,
                height: 240,
                borderRadius: 100,
                background: phase === 3 ? theme.accent : theme.paper,
                translate: `${Math.cos(angle) * radius}px ${Math.sin(angle) * radius}px`,
                rotate: `${(angle * 180) / Math.PI + 90}deg`,
                scale: mix(0.1, 1, progress(t, 0.12 + i * 0.025, 0.55)),
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...center,
          fontSize: fitSize(title, phase === 0 ? 206 : 280, 1700),
          fontWeight: 600,
          letterSpacing: "-0.075em",
          scale:
            phase === 0
              ? 1 + 0.06 * progress(t, 0.7, 0.23, motion.pill)
              : mix(1.3, 1, p),
          filter: p < 1 && phase > 0 ? `blur(${(1 - p) * 14}px)` : undefined,
        }}
      >
        {title}
      </div>
      <div style={{ position: "absolute", top: 70, left: 100 }}>
        <BrandMark {...props} size={42} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 72,
          left: 100,
          right: 100,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 20,
        }}
      >
        <span>{content.productName}</span>
        <span>Made of components. Made by you.</span>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: theme.ink,
          clipPath: `inset(0 ${100 - progress(t, 3.7, 0.3, motion.camera) * 100}% 0 0)`,
        }}
      />
    </Stage>
  );
}
