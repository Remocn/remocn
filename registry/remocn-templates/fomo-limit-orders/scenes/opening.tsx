import type { SceneProps } from "../content";
import { ramp, tween } from "../motion";
import { Layer } from "../ui";

export function Opening({ t, content }: SceneProps) {
  const text =
    t < 0.7 ? content.intro : t < 1.9 ? content.feature : content.audience;
  const start = t < 0.7 ? 0 : t < 1.9 ? 0.7 : 1.9;
  const words = text.split(" ");
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const upper = i < 5;
        const column = i % 5;
        const height = [18, 48, 85, 61, 30][column];
        const drift = tween(t, 0.8 + column * 0.025, 1.25 + column * 0.025);
        return (
          <Layer
            key={i}
            x={upper ? 277 + column * 47 : -35 + column * 47}
            y={upper ? -14 : 270 - height + 12}
            w={47}
            h={height}
            style={{
              opacity: ramp(t, 0.8, 1.05) * (1 - ramp(t, 2.45, 2.7)),
              transform: `translateY(${(1 - drift) * (upper ? -75 : 75) + Math.sin(t * 2 + column) * 5}px)`,
              borderRadius: 2,
              background: `linear-gradient(${upper ? 150 : 30}deg, #9891d752, #6665a04a 40%, #42336130 76%, #09061300)`,
              boxShadow: "inset 0.5px 0 1px #d3b4ff26",
              filter: "blur(0.7px)",
            }}
          />
        );
      })}
      <Layer
        x={19}
        y={110}
        w={450}
        h={42}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 6,
          fontSize: 24.5,
          letterSpacing: -1.1,
          whiteSpace: "nowrap",
          opacity: 1 - ramp(t, 2.55, 2.7),
        }}
      >
        {words.map((word, i) => {
          const enter = tween(t, start + i * 0.1, start + i * 0.1 + 0.2);
          return (
            <span
              key={`${start}-${i}`}
              style={{
                opacity: enter,
                filter: `blur(${(1 - enter) * 5}px)`,
                transform: `translateY(${(1 - enter) * 9}px)`,
              }}
            >
              {word}
            </span>
          );
        })}
      </Layer>
    </>
  );
}
