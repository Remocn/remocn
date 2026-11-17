"use client";

import { useEffect, useMemo, useState } from "react";
import { type ControlConfig, toProps } from "@/lib/customizer-config";
import { loadPreviewFont } from "@/lib/previews/fonts";

/**
 * The customizer's values as the props the preview renders. Auto colours are
 * left out, and a picked font reaches the component only once it has loaded:
 * scenes measure their text on mount, and measuring the fallback face would
 * lay the copy out for the wrong width.
 */
export function usePreviewProps(
  controls: ControlConfig,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const [ready, setReady] = useState<ReadonlySet<string>>(() => new Set());
  const fonts = Object.entries(controls).flatMap(([key, ctrl]) =>
    ctrl.type === "font" && values[key] !== ctrl.default
      ? [String(values[key])]
      : [],
  );
  const wanted = fonts.join("\n");

  useEffect(() => {
    let live = true;
    for (const font of wanted.split("\n").filter(Boolean)) {
      loadPreviewFont(font).then(
        () => live && setReady((prev) => new Set(prev).add(font)),
        // A font that fails to load leaves the component's own in place.
        () => undefined,
      );
    }
    return () => {
      live = false;
    };
  }, [wanted]);

  return useMemo(() => {
    const props = toProps(controls, values);
    for (const [key, ctrl] of Object.entries(controls)) {
      if (ctrl.type !== "font") continue;
      if (!ready.has(String(props[key]))) props[key] = ctrl.default;
    }
    return props;
  }, [controls, values, ready]);
}
