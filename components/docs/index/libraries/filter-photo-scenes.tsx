"use client";

import type { ComponentType, ReactNode } from "react";
import { AbsoluteFill, Img } from "remotion";

/** The frame every filter tile runs through: one landscape, so tiles compare. */
export const FILTER_PHOTO = "/reel/reel-5.jpg";

export function PhotoScene() {
  return (
    <AbsoluteFill style={{ background: "#0e1012" }}>
      <Img
        src={FILTER_PHOTO}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
}

type FilterProps = Record<string, unknown> & { children?: ReactNode };
type Loader = () => Promise<{ default: ComponentType<FilterProps> }>;

/** Wrap a filter component around the shared photo. */
function overPhoto<P>(
  Filter: ComponentType<P & { children?: ReactNode }>,
  extra?: Partial<P>,
): ComponentType<FilterProps> {
  return function FilteredPhoto(props: FilterProps) {
    const Any = Filter as ComponentType<FilterProps>;
    return (
      <Any {...extra} {...props}>
        <PhotoScene />
      </Any>
    );
  };
}

/** Region the pixelate tile hides, in 1280×720 composition pixels. */
const PIXELATE_REGION = [{ x: 420, y: 150, width: 440, height: 300 }];

/**
 * Filter tiles run each filter over {@link PhotoScene} instead of its docs demo
 * scene, so the gallery reads as one frame through every look. A filter
 * missing here falls back to its registry demo.
 */
export const FILTER_PHOTO_LOADERS: Record<string, Loader> = {
  "camera-lens": () =>
    import("@/registry/remocn/camera-lens").then((m) => ({
      default: overPhoto(m.CameraLens),
    })),
  "security-cam": () =>
    import("@/registry/remocn/security-cam").then((m) => ({
      default: overPhoto(m.SecurityCam),
    })),
  hologram: () =>
    import("@/registry/remocn/hologram").then((m) => ({
      default: overPhoto(m.Hologram),
    })),
  "vhs-filter": () =>
    import("@/registry/remocn/vhs-filter").then((m) => ({
      default: overPhoto(m.VhsFilter),
    })),
  "crt-screen": () =>
    import("@/registry/remocn/crt-screen").then((m) => ({
      default: overPhoto(m.CrtScreen),
    })),
  "sustained-glitch": () =>
    import("@/registry/remocn/sustained-glitch").then((m) => ({
      default: overPhoto(m.SustainedGlitch),
    })),
  "pixelate-region": () =>
    import("@/registry/remocn/pixelate-region").then((m) => ({
      default: overPhoto(m.PixelateRegion, { regions: PIXELATE_REGION }),
    })),
  "ascii-render": () =>
    import("@/registry/remocn/ascii-render").then((m) => ({
      default: overPhoto(m.AsciiRender),
    })),
  "halftone-print": () =>
    import("@/registry/remocn/halftone-print").then((m) => ({
      default: overPhoto(m.HalftonePrint),
    })),
  "underwater-ripple": () =>
    import("@/registry/remocn/underwater-ripple").then((m) => ({
      default: overPhoto(m.UnderwaterRipple),
    })),
};
