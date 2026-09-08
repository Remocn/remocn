import type { SceneProps } from "../content";
import { fitSize, mix, progress, useSceneTime } from "../motion";
import { BrandMark, center, Stage, Wordmark } from "../shared";

export function OutroScene(props: SceneProps) {
  const { content, theme } = props;
  const t = useSceneTime();
  const reveal = progress(t, 0.08, 0.45);
  return (
    <Stage theme={theme}>
      <div
        style={{
          position: "absolute",
          width: 1600,
          height: 850,
          left: 160,
          top: 650,
          background: `radial-gradient(ellipse, ${theme.accent}20, transparent 65%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: mix(866, 390, reveal),
          top: mix(395, 363, reveal),
          width: mix(188, 160, reveal),
          height: mix(188, 160, reveal),
          borderRadius: 42,
          background: theme.accent,
          ...center,
          opacity: 1 - reveal,
        }}
      >
        <BrandMark {...props} size={90} color={theme.ink} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...center,
          flexDirection: "column",
          paddingBottom: 55,
          gap: 50,
          opacity: reveal,
          translate: `0 ${mix(18, 0, reveal)}px`,
        }}
      >
        <Wordmark {...props} size={240} color={theme.paper} />
        <div
          style={{
            fontSize: fitSize(content.closingLine, 42, 1560),
            color: theme.muted,
            letterSpacing: "-0.025em",
          }}
        >
          {content.closingLine}
        </div>
        <div
          style={{
            marginTop: 28,
            padding: "18px 39px",
            borderRadius: 60,
            border: `1px solid ${theme.accent}60`,
            background: `${theme.accent}0c`,
            color: theme.accent,
            fontSize: fitSize(content.website, 39, 1400),
            letterSpacing: "-0.025em",
          }}
        >
          {content.website} <span style={{ marginLeft: 22 }}>↗</span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 100,
          right: 100,
          borderTop: "1px solid #ffffff14",
          paddingTop: 28,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 18,
          color: theme.muted,
          opacity: reveal,
        }}
      >
        <span>Built with {content.productName}</span>
        <span>Copy. Create. Ship.</span>
      </div>
    </Stage>
  );
}
