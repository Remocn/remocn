import type { SceneProps } from "../content";
import { ramp, tween } from "../motion";
import { Glow, Layer, Logo } from "../ui";
export function Outro(props: SceneProps) {
  const { t, brandName } = props;
  if (t < 30.15) {
    const spread = tween(t, 28.8, 29.5);
    return (
      <>
        <Layer w={480} h={270} style={{ background: "white" }} />
        <Layer
          x={20}
          y={109}
          w={440}
          h={50}
          style={{
            display: "grid",
            placeItems: "center",
            color: "#111",
            fontSize: 27,
            letterSpacing: -1.4,
            opacity: 1 - spread,
          }}
        >
          {brandName}
        </Layer>
        <Layer
          x={140}
          y={32}
          style={{
            opacity: spread,
            filter: `blur(${14 - spread * 4}px)`,
            transform: `scale(${1 + spread * 0.2})`,
          }}
        >
          <Logo {...props} markOnly color={props.accent} size={190} />
        </Layer>
        <Glow t={t} accent={props.accent} light strength={0.8} />
      </>
    );
  }
  const enter = tween(t, 30.15, 30.45);
  const text = tween(t, 30.5, 31.55);
  return (
    <Layer
      x={15}
      y={101}
      w={450}
      h={68}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        opacity: enter * (1 - ramp(t, 35.15, 35.5) * 0.15),
      }}
    >
      <Logo {...props} markOnly size={39} color={props.accent} />
      <div
        style={{
          fontSize: 38,
          letterSpacing: -1.6,
          maxWidth: text * 350,
          overflow: "hidden",
          whiteSpace: "nowrap",
          opacity: text,
        }}
      >
        {brandName}
      </div>
    </Layer>
  );
}
