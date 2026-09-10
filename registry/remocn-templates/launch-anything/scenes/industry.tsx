import { useId } from "react";
import type { SceneProps } from "../content";
import { tween } from "../motion";
import { Center, RevealCopy } from "../ui";

export function Industry({ scene, t }: SceneProps) {
  const id = useId();
  const age = t - 1021 / 60;
  const second = t >= 18.58;
  const start = second ? 18.58 : 1021 / 60;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#010102",
        color: "#fff",
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
          transform: `rotate(${age * 4 - 3}deg) scale(1.12)`,
        }}
      >
        <defs>
          <radialGradient id={`${id}-sphere`} cx="57%" cy="53%" r="51%">
            <stop offset="0.9" stopColor="#000" />
            <stop offset="0.965" stopColor="#08090a" />
            <stop offset="0.986" stopColor="#414044" />
            <stop offset="0.994" stopColor="#94979a" />
            <stop offset="1" stopColor="#040406" />
          </radialGradient>
          <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fff" stopOpacity="0.3" />
            <stop offset="0.52" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.8" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.25" />
          </linearGradient>
          <mask id={`${id}-mask`}>
            <rect width="480" height="270" fill={`url(#${id}-fade)`} />
          </mask>
        </defs>
        <g mask={`url(#${id}-mask)`}>
          <circle
            cx={275 - age * 2}
            cy="-118"
            r="197"
            fill={`url(#${id}-sphere)`}
          />
          <circle
            cx="-150"
            cy={129 + age * 3}
            r="210"
            fill={`url(#${id}-sphere)`}
          />
          <circle
            cx="603"
            cy={153 - age * 3}
            r="195"
            fill={`url(#${id}-sphere)`}
          />
          <circle cx="227" cy="470" r="235" fill={`url(#${id}-sphere)`} />
        </g>
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
