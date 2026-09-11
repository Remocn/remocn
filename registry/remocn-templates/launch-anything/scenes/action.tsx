import { useId } from "react";
import type { SceneProps } from "../content";
import { actionFrame, tween } from "../motion";
import { Center, RevealCopy } from "../ui";
import { ActionFrame, actionBackground } from "./action-frame";

export function Action({ scene, t }: SceneProps) {
  const id = useId();
  const shape = actionFrame(t);
  const travel = shape.enter;
  const press = shape.press;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: actionBackground,
        color: "#050608",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateX(${-118 * travel}px)`,
          opacity: 1 - tween(t, 5.4, 5.65),
        }}
      >
        <Center>
          <RevealCopy
            text={scene.content.next}
            size={47 - 11 * travel}
            t={t}
            start={3.8}
            dark
          />
        </Center>
      </div>
      <ActionFrame scene={scene} t={t} />
      <div
        style={{
          position: "absolute",
          left: shape.x - 105,
          top: 105,
          width: 216,
          height: 61,
          opacity: travel,
          perspective: 600,
        }}
      >
        <svg
          role="img"
          aria-label="Click pointer"
          viewBox="0 0 60 72"
          width="46"
          height="55"
          style={{
            position: "absolute",
            left: 110,
            top: tween(t, 5.02, 5.35, 92, 34) + press * 5,
            opacity: tween(t, 5.02, 5.18) * (1 - tween(t, 5.48, 5.75)),
            filter: "drop-shadow(0 6px 4px #365a342a)",
            transform: `scale(${1 - press * 0.12}) rotate(-12deg)`,
          }}
        >
          <defs>
            <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
              <stop stopColor="#93af8f" />
              <stop offset="0.5" stopColor={scene.accent} />
              <stop offset="1" stopColor="#d3dfc2" />
            </linearGradient>
          </defs>
          <path
            d="M27 4Q30 0 33 4L57 57Q58 64 51 62L32 54 13 63Q5 66 9 56Z"
            fill={`url(#${id})`}
            stroke="#b3c6a4"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  );
}
