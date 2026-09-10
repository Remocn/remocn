import { useId } from "react";
import { Img } from "remotion";
import type { SceneProps } from "../content";
import { key, tween } from "../motion";
import { Center, Title } from "../ui";

export function Space({ scene, t }: SceneProps) {
  const id = useId();
  const first = t < 20.62;
  const wide = !first && t < 21.02;
  const age = t - 20.22;
  const rocketTransform = `translate(${key(age, [0, 0.4], [-17, 7])}px, ${key(age, [0, 0.4], [18, -11])}px) scale(1.07)`;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: first ? "#071629" : "#000",
      }}
    >
      {first ? (
        <Img
          src={scene.media.rocket}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            transform: rocketTransform,
            objectFit: "cover",
            filter: "blur(0.7px)",
          }}
        />
      ) : null}
      {wide ? (
        <>
          <Img
            src={scene.media.earth}
            style={{
              position: "absolute",
              width: 470,
              height: 265,
              top: 219 - tween(t, 20.62, 21.02, 0, 10),
              left: 47,
              objectFit: "cover",
              filter: "blur(1px) brightness(0.6)",
              borderRadius: "50%",
            }}
          />
          <svg
            viewBox="0 0 20 150"
            width="9"
            height="113"
            aria-label="Ascending rocket"
            role="img"
            style={{
              position: "absolute",
              left: 237,
              top: tween(t, 20.62, 21.02, 59, 47),
            }}
          >
            <defs>
              <linearGradient id={id} x2="0" y2="1">
                <stop stopColor="#fffbdc" />
                <stop offset="1" stopColor="#ed853f" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M6 17Q10-6 14 17V75H6Z" fill="#e8dee3" />
            <path d="M8 75H12L11 150H9Z" fill={`url(#${id})`} />
          </svg>
        </>
      ) : null}
      {!first && !wide ? (
        <Img
          src={scene.media.earth}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translateX(${tween(t, 21.02, 21.55, 10, -7)}px) scale(${tween(t, 21.02, 21.55, 1.07, 1)})`,
            filter: "brightness(0.75)",
          }}
        />
      ) : null}
      <Center>
        <Title
          text={scene.content.launch}
          size={100}
          style={{
            letterSpacing: "-0.07em",
            fontWeight: 400,
            color: "#fff8f5",
            filter: "drop-shadow(0 0 0.65px #fff)",
            maskImage: "linear-gradient(100deg, black 60%, #0009 100%)",
          }}
        />
      </Center>
      {first ? (
        <Img
          src={scene.media.rocket}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: rocketTransform,
            maskImage:
              "radial-gradient(ellipse 9% 32% at 44% 69%, black, transparent 98%)",
            mixBlendMode: "screen",
            filter: "blur(1px)",
          }}
        />
      ) : null}
    </div>
  );
}
