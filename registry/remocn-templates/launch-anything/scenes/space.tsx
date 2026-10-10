import { Img } from "remotion";
import type { SceneProps } from "../content";
import { tween } from "../motion";
import { Center, Title } from "../ui";

// Three editorial cuts retain the original montage timing, with original plates.
export function Space({ scene, t }: SceneProps) {
  const first = t < 20.62;
  const inset = !first && t < 21.02;
  const age = t - (first ? 20.22 : inset ? 20.62 : 21.02);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#eee8d9",
      }}
    >
      <Img
        src={first ? scene.media.rocket : scene.media.earth}
        style={{
          position: "absolute",
          inset: inset ? "20px 32px" : 0,
          width: inset ? 416 : "100%",
          height: inset ? 230 : "100%",
          objectFit: "cover",
          transform: `translateX(${tween(age, 0, 0.53, -3, 3)}px) scale(${tween(age, 0, 0.53, 1.07, 1.02)})`,
          filter: first ? "brightness(0.8)" : "brightness(0.68)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 18,
          border: "0.65px solid #f4f0e970",
          opacity: inset ? 0 : 0.8,
        }}
      />
      <Center>
        <Title
          text={scene.content.launch}
          size={92}
          style={{
            letterSpacing: "-0.05em",
            fontWeight: 400,
            color: "#f8f2e5",
          }}
        />
      </Center>
    </div>
  );
}
