"use client";

import { useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { parseRepoInput } from "@/lib/parse-repo";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import registry from "@/registry/__index__";
import type { GitHubStarsInputProps } from "../lib/types";
import { useMp4Export } from "./use-mp4-export";
import { useOrientation } from "./use-orientation";
import { useStargazers } from "./use-stargazers";
import { useStarsCustomizer } from "./use-stars-customizer";

/**
 * THE ORCHESTRATOR. Composes orientation + stargazers + customizer + export
 * into a single view-model the render-only component tree spreads. Owns the
 * input value, the `?repo=` query state, the auto-advance guard, submit/reset,
 * and the memoized inputProps.
 */
export function useStarsTool() {
  const entry = registry["github-stars"];
  const reduced = usePrefersReducedMotion();

  // URL state (project rule: nuqs, not raw useSearchParams). `?repo=` reopens a
  // shared link; `?o=h|v` persists the orientation.
  const [repoParam, setRepoParam] = useQueryState("repo", {
    defaultValue: "",
  });
  const { orientation, setOrientation } = useOrientation();

  const [inputValue, setInputValue] = useState(repoParam ?? "");

  const stargazers = useStargazers();
  const customizer = useStarsCustomizer();
  const mp4 = useMp4Export();

  const { data, zeroStars, generate, clearZeroStars } = stargazers;

  const canGenerate = parseRepoInput(inputValue) !== null;

  // ---- generation --------------------------------------------------------

  const onInputChange = useCallback(
    (v: string) => {
      setInputValue(v);
      if (zeroStars) clearZeroStars();
    },
    [zeroStars, clearZeroStars],
  );

  // Auto-advance past idle when the page loads with a valid `?repo=` (shared link).
  const didAutoStart = useRef(false);
  useEffect(() => {
    if (didAutoStart.current) return;
    didAutoStart.current = true;
    if (repoParam && parseRepoInput(repoParam)) {
      setInputValue(repoParam);
      void generate(repoParam);
    }
  }, [repoParam, generate]);

  const handleSubmit = useCallback(() => {
    const value = inputValue.trim();
    if (!parseRepoInput(value)) {
      toast.error("Enter a repo as owner/name");
      return;
    }
    void setRepoParam(value);
    void generate(value);
  }, [inputValue, generate, setRepoParam]);

  // Clear the current repo and return to the idle input so the user can paste a
  // different one. The `didAutoStart` ref stays set, so wiping `?repo=` here does
  // NOT re-trigger the auto-advance (that only runs on a fresh page load).
  const handleReset = useCallback(() => {
    stargazers.reset();
    mp4.cancel();
    setInputValue("");
    void setRepoParam(null);
  }, [stargazers, mp4, setRepoParam]);

  // ---- inputProps + export ----------------------------------------------

  const inputProps = useMemo<GitHubStarsInputProps | null>(
    () =>
      data
        ? {
            repo: `${data.owner}/${data.repo}`,
            totalStars: data.totalStars,
            stargazers: data.stargazers,
            orientation,
            accentColor: customizer.values.accentColor,
            speed: customizer.values.speed,
            theme: customizer.values.theme,
          }
        : null,
    [data, orientation, customizer.values],
  );

  const handleDownload = useCallback(() => {
    if (!inputProps) return;
    // inputProps already carry orientation/accent/speed/theme — they are the
    // exact POST body the render API expects; the server names the file.
    void mp4.download(inputProps);
  }, [inputProps, mp4]);

  return {
    status: stargazers.status,
    idle: {
      inputValue,
      onInputChange,
      onSubmit: handleSubmit,
      canGenerate,
      zeroStars,
    },
    generating: {
      reduced,
      onCancel: stargazers.cancel,
    },
    ready:
      entry && data && inputProps
        ? {
            entry,
            inputProps,
            repo: `${data.owner}/${data.repo}`,
            totalStars: data.totalStars,
            truncated: data.truncated,
            reduced,
            orientation,
            onOrientationChange: setOrientation,
            onReset: handleReset,
            showCustomizer: customizer.showCustomizer,
            onToggleCustomizer: customizer.toggleCustomizer,
            customValues: customizer.values,
            onCustomChange: customizer.onChange,
            exporting: mp4.exporting,
            exportProgress: mp4.progress,
            onDownload: handleDownload,
            onCancelExport: mp4.cancel,
          }
        : null,
  };
}
