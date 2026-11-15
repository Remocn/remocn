import * as React from "react";
import * as ReactJsxDevRuntime from "react/jsx-dev-runtime";
import * as ReactJsxRuntime from "react/jsx-runtime";
import * as ReactDOM from "react-dom";
import * as Remotion from "remotion";
import * as RemotionNoReact from "remotion/no-react";
import { SHARED_GLOBAL, type SharedModule } from "./shared-modules";

const shared: Record<SharedModule, unknown> = {
  react: React,
  "react-dom": ReactDOM,
  "react/jsx-runtime": ReactJsxRuntime,
  "react/jsx-dev-runtime": ReactJsxDevRuntime,
  remotion: Remotion,
  "remotion/no-react": RemotionNoReact,
};

/**
 * Gives the preview bundle this page's React and Remotion (see
 * shared-modules.ts). Call it before the bundle is imported.
 */
export function registerShared() {
  (globalThis as Record<string, unknown>)[SHARED_GLOBAL] = shared;
}
