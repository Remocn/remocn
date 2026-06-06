"use client";

import { useQueryState } from "nuqs";
import { useCallback } from "react";
import {
  orientationToParam,
  paramToOrientation,
} from "../lib/dims";
import type { Orientation } from "../lib/types";

/**
 * Wraps the nuqs `?o=h|v` query state (project rule: nuqs, not raw
 * useSearchParams). `?o=h|v` persists the orientation across reloads.
 */
export function useOrientation() {
  const [oParam, setOParam] = useQueryState("o", { defaultValue: "h" });
  const orientation = paramToOrientation(oParam);

  const setOrientation = useCallback(
    (o: Orientation) => {
      void setOParam(orientationToParam(o));
    },
    [setOParam],
  );

  return { orientation, setOrientation };
}
