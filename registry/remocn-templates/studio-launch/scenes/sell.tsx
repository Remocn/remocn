import type { SceneProps } from "../content";
import { Dashboard } from "../interfaces";
import { tween } from "../motion";
import { Glow, Headline, Landscape, Layer } from "../ui";
export function Sell(props: SceneProps) {
  const { t } = props;
  if (t < 26.85)
    return (
      <>
        <Layer w={480} h={270} style={{ background: "white" }} />
        <Headline t={t} start={25.5667} color="black" size={24}>
          <span style={{ maxWidth: 220 }}>{props.content.sellHeadline}</span>
        </Headline>
        <Glow t={t} accent={props.accent} light strength={0.7} />
      </>
    );
  const s = tween(t, 26.85, 27.45, 0.34, 0.39);
  return (
    <>
      <Landscape {...props} />
      <Layer
        x={225}
        y={180}
        w={30}
        h={80}
        style={{
          background: "linear-gradient(90deg,#08090a,#343637,#101213)",
          boxShadow: "9px 7px 14px #0004",
        }}
      />
      <Layer
        x={174}
        y={252}
        w={132}
        h={8}
        style={{ background: "#27292b", borderRadius: "50%" }}
      />
      <Layer
        x={240 - 400 * s}
        y={26}
        style={{
          transform: `scale(${s})`,
          transformOrigin: "0 0",
          border: "8px solid #181a1b",
          borderRadius: 7,
          boxShadow: "0 12px 24px #0007",
          overflow: "hidden",
        }}
      >
        <Dashboard {...props} page="community" light />
      </Layer>
    </>
  );
}
