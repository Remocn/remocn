import { useLayoutEffect, useRef } from "react";
import type { ReleaseTeaserScene } from "./content";
import {
  createRing,
  createRotator,
  dot,
  normalize,
  project,
  type Vec3,
} from "./geometry";
import { ringPose } from "./motion";
import { BrandImage } from "./ui";

const ring = createRing();

/** Resolve any browser CSS color to channels without bundling a color library. */
function channels(ctx: CanvasRenderingContext2D, color: string): number[] {
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000000";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
}

function DimensionalRing({
  scene,
  frame,
}: {
  scene: ReleaseTeaserScene;
  frame: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const colorCache = useRef(new Map<string, number[]>());
  // Synchronous layout paint: a seek paints only its requested frame, with no RAF or history.
  useLayoutEffect(() => {
    const ctx = canvas.current?.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const colorChannels = (color: string) => {
      const cached = colorCache.current.get(color);
      if (cached) return cached;
      const value = channels(ctx, color);
      colorCache.current.set(color, value);
      return value;
    };
    const accent = colorChannels(scene.theme.accent);
    const surface = colorChannels(scene.theme.surface);
    ctx.clearRect(0, 0, 1920, 1080);
    ctx.scale(2, 2);
    const pose = ringPose(frame, scene.reducedMotion);
    const rotatePoint = createRotator(pose.rx, pose.ry, pose.rz);
    const key = normalize([Math.cos(pose.lightAngle) * 0.95, 0.6, 0.3]);
    const rim = normalize([-0.8, -0.5, 0.18]);
    const half = normalize([key[0], key[1], key[2] + 1]);
    const faces = ring
      .map((face) => ({
        ...face,
        normal: rotatePoint(face.normal),
        edgeNormals: face.edgeNormals?.map(rotatePoint),
        center: rotatePoint(face.center),
        vertices: face.vertices.map(rotatePoint),
      }))
      .sort((a, b) => a.center[2] - b.center[2]);
    for (const face of faces) {
      if (
        dot(
          face.normal,
          normalize([
            -face.center[0],
            -face.center[1],
            1100 / pose.scale - face.center[2],
          ]),
        ) <= 0
      )
        continue;
      const shade = (normal: Vec3) => {
        const diffuse = Math.max(0, dot(normal, key));
        const rimLight = Math.max(0, dot(normal, rim));
        const specular =
          Math.max(0, dot(normal, half)) ** (face.bevel ? 26 : 48);
        const intensity = scene.lightIntensity * pose.opacity;
        const rgb = surface.map((c, i) =>
          Math.min(
            255,
            c * 0.19 +
              intensity *
                (accent[i] * (diffuse ** 3 * 0.36 + rimLight ** 6 * 0.16) +
                  180 * specular * 0.68),
          ),
        );
        return `rgb(${rgb.join(",")})`;
      };
      const points = face.vertices.map((v) =>
        project(v, pose.scale, pose.x, pose.y),
      );
      ctx.beginPath();
      ctx.moveTo(...points[0]);
      for (const p of points.slice(1)) ctx.lineTo(...p);
      ctx.closePath();
      if (face.edgeNormals) {
        const gradient = ctx.createLinearGradient(
          (points[0][0] + points[1][0]) / 2,
          (points[0][1] + points[1][1]) / 2,
          (points[2][0] + points[3][0]) / 2,
          (points[2][1] + points[3][1]) / 2,
        );
        gradient.addColorStop(0, shade(face.edgeNormals[0]));
        gradient.addColorStop(1, shade(face.edgeNormals[1]));
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = shade(face.normal);
      }
      ctx.fill();
      // A sub-pixel seam overlap prevents hairlines between adjoining mesh quads.
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 0.45;
      ctx.stroke();
    }
  }, [
    frame,
    scene.reducedMotion,
    scene.lightIntensity,
    scene.theme.accent,
    scene.theme.surface,
  ]);

  return (
    <canvas
      ref={canvas}
      width={1920}
      height={1080}
      tabIndex={-1}
      aria-hidden="true"
      style={{ width: 960, height: 540, position: "absolute", inset: 0 }}
    />
  );
}

export function TeaserBackground({
  scene,
  frame,
}: {
  scene: ReleaseTeaserScene;
  frame: number;
}) {
  const pose = ringPose(frame, scene.reducedMotion);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        opacity: pose.opacity,
      }}
    >
      {scene.logoSrc ? (
        <div
          style={{
            position: "absolute",
            left: pose.x - 220,
            top: pose.y - 220,
            width: 440,
            height: 440,
            scale: pose.scale,
            rotate: `${(pose.rz * 180) / Math.PI}deg`,
            opacity: 0.18 * scene.lightIntensity,
          }}
        >
          <BrandImage
            src={scene.logoSrc}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      ) : (
        <DimensionalRing scene={scene} frame={frame} />
      )}
    </div>
  );
}
