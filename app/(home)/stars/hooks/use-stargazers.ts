"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { parseRepoInput } from "@/lib/parse-repo";
import { messageForApiError } from "../lib/api-errors";
import { fetchStargazers, StargazersApiError } from "../lib/api";
import { preloadAvatars } from "../lib/preload-avatars";
import type { StarsStatus, StargazersPayload } from "../lib/types";

/**
 * Owns the generation state machine: status (idle/generating/ready), the
 * fetched payload, the zero-star inline flag, and the in-flight AbortController.
 */
export function useStargazers() {
  const [status, setStatus] = useState<StarsStatus>("idle");
  const [data, setData] = useState<StargazersPayload | null>(null);
  const [zeroStars, setZeroStars] = useState(false);
  const genAbortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (rawRepo: string) => {
    const valid = parseRepoInput(rawRepo);
    if (!valid) {
      toast.error("Enter a repo as owner/name");
      return;
    }
    setZeroStars(false);
    setStatus("generating");

    const controller = new AbortController();
    genAbortRef.current = controller;

    try {
      const json = await fetchStargazers(rawRepo, controller.signal);

      // Zero-star repos come back 200 with an empty list — a friendly inline
      // state, not a hard error.
      if (json.totalStars === 0 || json.stargazers.length === 0) {
        setZeroStars(true);
        setStatus("idle");
        return;
      }

      setData(json);
      // Warm the avatar cache while the generating animation is still on screen,
      // so the Player mounts ready-to-play (autoPlay won't stall on un-cached
      // remote <Img>s). Bounded + non-blocking on failures; skip if cancelled.
      await preloadAvatars(json.stargazers.map((s) => s.avatarUrl));
      if (controller.signal.aborted) return;
      setStatus("ready");
    } catch (err) {
      // Cancel (AbortController) returns to idle silently.
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      if (err instanceof StargazersApiError) {
        toast.error(messageForApiError(err.code, err.status));
        setStatus("idle");
        return;
      }
      toast.error("Couldn't reach GitHub — retry");
      setStatus("idle");
    } finally {
      genAbortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    genAbortRef.current?.abort();
    setStatus("idle");
  }, []);

  const reset = useCallback(() => {
    genAbortRef.current?.abort();
    setData(null);
    setZeroStars(false);
    setStatus("idle");
  }, []);

  const clearZeroStars = useCallback(() => {
    setZeroStars(false);
  }, []);

  return {
    status,
    data,
    zeroStars,
    generate,
    cancel,
    reset,
    clearZeroStars,
  };
}
