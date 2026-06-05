"use client";

import { useThemeShortcut } from "@/hooks/use-theme-shortcut";

/**
 * Headless listener that wires up the "D" key theme toggle.
 * Must render inside the theme provider so `useTheme()` has context.
 */
export function ThemeShortcut() {
  useThemeShortcut();
  return null;
}
