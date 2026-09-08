import type { SceneProps } from "../content";
import { PhoneScreen, SocialPost } from "../interfaces";
import { key, ramp, smooth, tween } from "../motion";
import { Glow, Headline, Landscape, Layer } from "../ui";
export function Feed(props: SceneProps) {
  const { t, accent } = props;
  if (t < 6.3) {
    const p = tween(t, 4.25, 5.15, 0, 1, smooth);
    const scale = 2.7 - p * 1.7;
    return (
      <>
        <Landscape {...props} />
        <Layer
          x={70 + p * 45}
          y={30 - p * 10}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
            filter: `blur(${Math.sin(p * Math.PI) * 0.9}px)`,
          }}
        >
          <PhoneScreen {...props} />
        </Layer>
        <Glow t={t} accent={accent} strength={0.8} />
      </>
    );
  }
  const camera = tween(t, 6.85, 7.45, 0, 1, smooth);
  const exit = ramp(t, 7.85, 8.3);
  return (
    <>
      <Layer
        x={130 + camera * 75}
        y={79 - camera * 370}
        style={{
          transform: `scale(${1 + camera * 2.5})`,
          transformOrigin: "0 0",
          opacity: 1 - exit,
        }}
      >
        <SocialPost {...props} />
      </Layer>
      {t < 6.9 ? (
        <Layer
          x={150}
          y={36}
          w={180}
          style={{
            fontSize: 27,
            textAlign: "center",
            letterSpacing: -1,
            opacity: tween(t, 6.3, 6.55),
          }}
        >
          Post
        </Layer>
      ) : t < 7.95 ? (
        <Layer
          x={30}
          y={136}
          style={{
            fontSize: 31,
            letterSpacing: -1,
            opacity: tween(t, 6.95, 7.2),
          }}
        >
          Engage
        </Layer>
      ) : (
        <Headline
          t={t}
          start={7.95}
          size={key(t, [7.95, 8.25, 8.8], [29, 72, 105])}
        >
          Grow
        </Headline>
      )}
      <Glow t={t} accent={accent} strength={t > 8 ? 1.3 : 0.85} />
    </>
  );
}
