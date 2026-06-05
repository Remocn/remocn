import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

/**
 * Toggles between light and dark theme when the "D" key is pressed.
 * Ignores key presses while the user is typing in a field or holding a modifier.
 */
export function useThemeShortcut() {
  const { resolvedTheme, setTheme } = useTheme();

  // Mirror the theme in a ref so the listener stays registered across toggles.
  const resolvedThemeRef = useRef(resolvedTheme);
  resolvedThemeRef.current = resolvedTheme;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "d") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      event.preventDefault();
      setTheme(resolvedThemeRef.current === "dark" ? "light" : "dark");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setTheme]);
}
