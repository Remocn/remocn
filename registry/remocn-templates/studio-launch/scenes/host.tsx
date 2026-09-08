import type { SceneProps } from "../content";
import { Dashboard, SocialPost } from "../interfaces";
import { ramp, smooth, tween } from "../motion";
import { Glow, Headline, Layer } from "../ui";
export function Host(props: SceneProps) {
  const { t, accent, content } = props;
  return (
    <>
      <Layer w={480} h={270} style={{ background: "white" }} />
      {t < 18.95 ? (
        <Layer
          x={115}
          y={-30 - (t - 18) * 80}
          style={{ opacity: 1 - ramp(t, 18.6, 18.95) }}
        >
          <SocialPost {...props} light />
          <div style={{ height: 12 }} />
          <SocialPost {...props} light />
        </Layer>
      ) : t < 19.65 ? (
        <Headline t={t} start={18.95} color="#292929">
          {content.hostHeadline}
        </Headline>
      ) : (
        <Layer
          x={tween(t, 19.65, 20.8, -38, 15, smooth)}
          y={tween(t, 19.65, 20.8, -10, 10, smooth)}
          style={{
            transform: `scale(${tween(t, 19.65, 20.8, 0.72, 0.59, smooth)})`,
            transformOrigin: "0 0",
            opacity: tween(t, 19.65, 19.9),
          }}
        >
          <Dashboard {...props} page="courses" light />
        </Layer>
      )}
      <Glow t={t} accent={accent} light strength={0.65} />
    </>
  );
}
