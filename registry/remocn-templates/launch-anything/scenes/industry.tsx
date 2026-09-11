import type { SceneProps } from "../content";
import { tween } from "../motion";
import { Center, RevealCopy } from "../ui";

export function Industry({ scene, t }: SceneProps) {
  const age = t - 1021 / 60;
  const second = t >= 18.58;
  const start = second ? 18.58 : 1021 / 60;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#122d24",
        color: "#f7f1e4",
        overflow: "hidden",
      }}
    >
      <svg
        viewBox="0 0 480 270"
        width="480"
        height="270"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          transform: `rotate(${age * 2 - 3}deg) scale(1.12)`,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M${-70 + i * 21} 310V${90 - i * 22}Q${240} ${-140 - i * 24} ${550 - i * 21} ${90 - i * 22}V310`}
            fill="none"
            stroke={i % 2 ? "#b6c7ad" : "#688d73"}
            strokeWidth={0.7}
            opacity={0.12 + i * 0.04}
          />
        ))}
      </svg>
      <Center
        style={{
          transform: `perspective(700px) rotateY(${tween(t, start, start + 0.5, -8, 0)}deg) rotateZ(${tween(t, start, start + 0.55, 4, 0)}deg)`,
        }}
      >
        <RevealCopy
          text={second ? scene.content.promise : scene.content.industry}
          t={t}
          start={start}
          size={43}
        />
      </Center>
    </div>
  );
}
