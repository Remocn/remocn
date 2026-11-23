"use client";

import { useEffect } from "react";

/**
 * Publishes the page's controls to the browser's own agent over WebMCP. The
 * bridge loads only where a browser can take the tools, or in development
 * for the console, so other readers download none of it.
 */
export function useAgentBridge() {
  useEffect(() => {
    const webmcp = "modelContext" in document;
    if (!webmcp && process.env.NODE_ENV !== "development") return;
    let live = true;
    let unregister: (() => void) | undefined;
    import("./bridge").then(({ connectAgent }) => {
      if (live) unregister = connectAgent();
    });
    return () => {
      live = false;
      unregister?.();
    };
  }, []);
}
