"use client";

import {
  type ComponentType,
  type LazyExoticComponent,
  lazy,
  Suspense,
} from "react";
import { AbsoluteFill, Freeze, Sequence, useCurrentFrame } from "remotion";
import { cn } from "@/lib/utils";
import registry from "@/registry/__index__";
import { previewManifest } from "@/registry/__manifest__";
import { LANDING_SCENES } from "../../../scenes";
import { type ClipEnd, type ClipSpec, TILE_SIZE } from "./config";

type AnyComponent = ComponentType<Record<string, unknown>>;

const loaded = new Map<string, AnyComponent>();
const pending = new Map<string, Promise<AnyComponent>>();
const lazyCache = new Map<string, LazyExoticComponent<AnyComponent>>();

function previewOf(name: string) {
  return LANDING_SCENES[name]?.preview ?? previewManifest[name];
}

function loaderOf(name: string) {
  if (name in LANDING_SCENES) return LANDING_SCENES[name].load;
  if (name in registry) return registry[name].load;
  return undefined;
}

export function preloadClip(name: string) {
  let promise = pending.get(name);
  if (!promise) {
    const load = loaderOf(name);
    if (!load) return undefined;
    promise = load().then(({ default: component }) => {
      loaded.set(name, component);
      return component;
    });
    pending.set(name, promise);
  }
  return promise;
}

function lazyFor(name: string) {
  let component = lazyCache.get(name);
  if (!component) {
    component = lazy(() =>
      (loaderOf(name) ?? registry[name].load)().then(
        ({ default: loadedComponent }) => {
          loaded.set(name, loadedComponent);
          return { default: loadedComponent };
        },
      ),
    );
    lazyCache.set(name, component);
  }
  return component;
}

export const CATALOG = [
  ...Object.keys(LANDING_SCENES),
  ...Object.keys(previewManifest).filter((name) => name in registry),
].sort();

export function nativeDuration(name: string) {
  return previewOf(name)?.durationInFrames ?? 90;
}

export function defaultBackground(name: string) {
  const fill = previewOf(name)?.previewBackdrop;
  if (fill && fill.type !== "image") return fill.value;
  return "#0E1012";
}

export function defaultEnd(name: string): ClipEnd {
  return name.startsWith("shader-") ? "run" : "hold";
}

function frameFor(end: ClipEnd, frame: number, native: number) {
  if (end === "run") return frame;
  if (end === "loop") return frame % native;
  return Math.min(frame, native - 1);
}

type Box = { width: number; height: number };

export function Clip({
  spec,
  frame: box = { width: TILE_SIZE, height: TILE_SIZE },
  canvas,
  anchor = "center",
}: {
  spec: ClipSpec;
  frame?: Box;
  canvas?: Box;
  anchor?: "center" | "bottom-left";
}) {
  const local = useCurrentFrame();
  const preview = previewOf(spec.name);
  if (!preview || !loaderOf(spec.name)) {
    return <AbsoluteFill style={{ background: spec.background }} />;
  }
  const Ready = loaded.get(spec.name);
  const Component = Ready ?? lazyFor(spec.name);
  const width = canvas?.width ?? preview.compositionWidth;
  const height = canvas?.height ?? preview.compositionHeight;
  const corner = anchor === "bottom-left";
  const scale =
    (corner
      ? box.width / width
      : Math.max(box.width / width, box.height / height)) * spec.zoom;
  const native = preview.durationInFrames;
  const frame = frameFor(spec.end, local + spec.start, native);

  return (
    <AbsoluteFill
      style={{
        background: spec.background,
        color: spec.background === "transparent" ? "inherit" : "#0E1012",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: corner ? 0 : (box.width - width) / 2,
          top: corner ? box.height - height : (box.height - height) / 2,
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: corner ? "bottom left" : undefined,
        }}
        className={cn(
          corner && "[&>*>*]:!items-end [&>*>*]:!justify-start",
          spec.background === "transparent" && "[&>*>*]:!bg-transparent",
        )}
      >
        <Freeze frame={frame}>
          <Sequence
            width={width}
            height={height}
            durationInFrames={spec.end === "run" ? 100000 : native}
          >
            {Ready ? (
              <Ready {...preview.defaults} {...spec.props} />
            ) : (
              <Suspense fallback={null}>
                <Component {...preview.defaults} {...spec.props} />
              </Suspense>
            )}
          </Sequence>
        </Freeze>
      </div>
    </AbsoluteFill>
  );
}
