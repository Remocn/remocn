import type { SceneProps } from "../content";
import { key, ramp, tween } from "../motion";
import { Layer, Logo } from "../ui";

export function SlicedReveal({ t, brandName, logoSrc, accent }: SceneProps) {
  return (
    <Layer
      x={70}
      y={13}
      w={340}
      h={244}
      style={{ opacity: 1 - ramp(t, 1.45, 1.72) }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <Layer
          key={i}
          w={340}
          h={244}
          style={{
            clipPath: `inset(${i * 11}% 0 ${Math.max(0, 89 - i * 11)}% 0)`,
            transform: `translateX(${Math.sin(i * 0.7 + t * 4) * (1 - ramp(t, 1.1, 1.7)) * 35}px) skewX(${Math.sin(t * 4 + i) * 12}deg)`,
            filter: `blur(${7 + Math.sin(t * 3) * 3}px)`,
            opacity: 0.8,
          }}
        >
          <Layer x={82} y={9}>
            <Logo
              brandName={brandName}
              logoSrc={logoSrc}
              size={218}
              color={t < 0.8 ? "#292f35" : accent}
              markOnly
            />
          </Layer>
        </Layer>
      ))}
    </Layer>
  );
}
export function Opening(props: SceneProps) {
  const { t, brandName, accent, content } = props;
  if (t < 1.75)
    return (
      <>
        <Layer w={480} h={270} style={{ background: "white" }} />
        <SlicedReveal {...props} />
        {t < 0.85 && (
          <Layer
            x={115}
            y={99}
            w={250}
            h={68}
            style={{
              background: "#3b424d",
              opacity: 0.6,
              filter: "blur(20px)",
              transform: "skewX(-18deg)",
            }}
          />
        )}
        <Layer
          x={20}
          y={112}
          w={440}
          h={47}
          style={{
            display: "grid",
            placeItems: "center",
            fontSize: t < 0.85 ? 33 : 29,
            fontWeight: 500,
            letterSpacing: -1.7,
            color: t < 0.85 ? "white" : "#101010",
            opacity: ramp(t, 0, 0.17),
            transform: `translateY(${key(t, [0, 0.2, 0.8, 0.9, 1.15, 1.7], [12, 0, 0, 6, 0, 0])}px)`,
          }}
        >
          {t < 0.85 ? content.introduction : brandName}
        </Layer>
      </>
    );
  const enter = tween(t, 1.75, 2.1);
  const word = tween(t, 2.3, 2.8);
  return (
    <Layer
      x={20}
      y={99}
      w={440}
      h={72}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: enter,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          transform: `scale(${0.96 + enter * 0.04})`,
        }}
      >
        <Logo {...props} size={43} color={accent} markOnly />
        <div
          style={{
            maxWidth: word * 255,
            opacity: word,
            overflow: "hidden",
            fontSize: 40,
            letterSpacing: -1.8,
            whiteSpace: "nowrap",
          }}
        >
          {brandName}
        </div>
      </div>
    </Layer>
  );
}
