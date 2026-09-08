import type { SceneProps } from "../content";
import { fitSize, mix, motion, progress, useSceneTime } from "../motion";
import { PreviewTile } from "../previews";
import { CornerLabel, Headline, mono, Stage } from "../shared";

export function ComposeScene(props: SceneProps) {
  const { content, theme } = props;
  const t = useSceneTime();
  const gather = progress(t, 0.6, 0.65, motion.morph);
  const play = progress(t, 1.3, 2.1, (v) => v);
  const takeover = progress(t, 3.55, 0.45, motion.camera);
  const colors = [theme.accent, theme.peach, theme.mint];
  return (
    <Stage theme={theme} light>
      <CornerLabel theme={theme} light>
        {content.productName} / One composition
      </CornerLabel>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 168,
          opacity: 1 - takeover,
        }}
      >
        <Headline text={content.timelineTitle} time={t} size={105} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 650,
          width: 1620,
          height: 290,
          opacity: progress(t, 0.5, 0.45) * (1 - takeover),
          borderTop: `1px solid ${theme.ink}22`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -32,
            display: "flex",
            justifyContent: "space-between",
            fontFamily: mono,
            fontSize: 17,
            color: theme.muted,
          }}
        >
          {["00:00", "00:02", "00:04", "00:06", "00:08"].map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
        {colors.map((c, i) => (
          <div
            key={c}
            style={{
              position: "absolute",
              left: 0,
              top: 22 + i * 80,
              height: 62,
              width: 1620,
              borderRadius: 12,
              background: "#14131805",
              border: "1px solid #1413180b",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: 1620 * play,
            top: -10,
            bottom: 12,
            width: 3,
            background: theme.ink,
            zIndex: 4,
          }}
        >
          <div
            style={{
              width: 13,
              height: 13,
              background: theme.ink,
              marginLeft: -5,
              rotate: "45deg",
            }}
          />
        </div>
      </div>
      {[0, 1, 2].map((i) => {
        const x = mix(150 + i * 560, 160 + i * 500, gather);
        const y = mix(344, 672 + i * 80, gather);
        return (
          <div key={i} style={{ opacity: 1 - takeover }}>
            <PreviewTile
              {...props}
              kind={i}
              time={t}
              x={x}
              y={y}
              width={mix(500, 590, gather)}
              height={mix(240, 62, gather)}
              rotate={mix((i - 1) * 4, 0, gather)}
            />
            <div
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: mix(500, 590, gather),
                height: mix(240, 62, gather),
                background: colors[i],
                borderRadius: 12,
                opacity: gather,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x + 22,
                top: y + 16,
                fontFamily: mono,
                fontSize: 21,
                opacity: gather,
                color: theme.ink,
                background: `${colors[i]}e8`,
                paddingRight: 18,
              }}
            >
              {["01  Intro", "02  Motion", "03  Outro"][i]}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: mix(710, 0, takeover),
          top: mix(332, 0, takeover),
          width: mix(500, 1920, takeover),
          height: mix(240, 1080, takeover),
          background: theme.accent,
          borderRadius: mix(18, 0, takeover),
          opacity: progress(t, 1.13, 0.3),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          boxShadow: "0 20px 65px #14131812",
        }}
      >
        <div
          style={{
            fontSize: mix(
              fitSize(content.showcaseTitle, 54, 450),
              fitSize(content.showcaseTitle, 206, 1700),
              takeover,
            ),
            letterSpacing: "-0.065em",
            fontWeight: 500,
            textAlign: "center",
            padding: 20,
          }}
        >
          {content.showcaseTitle}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 981,
          left: 150,
          fontSize: 18,
          letterSpacing: "0.1em",
          color: theme.muted,
          opacity: 1 - takeover,
        }}
      >
        REMOTION COMPOSITION
      </div>
    </Stage>
  );
}
