"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Owns the optional Customize panel: scalar inputProps (accent/theme/speed)
 * plus the panel's open/closed visibility.
 */
export function useStarsCustomizer() {
  const [accentColor, setAccentColor] = useState("#ffbb00");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [speed, setSpeed] = useState(1);
  const [showCustomizer, setShowCustomizer] = useState(false);

  const onChange = useCallback((key: string, value: unknown) => {
    if (key === "accentColor") setAccentColor(value as string);
    else if (key === "theme") setTheme(value as "light" | "dark");
    else if (key === "speed") setSpeed(value as number);
  }, []);

  const toggleCustomizer = useCallback(() => {
    setShowCustomizer((s) => !s);
  }, []);

  const values = useMemo(
    () => ({ accentColor, theme, speed }),
    [accentColor, theme, speed],
  );

  return { values, onChange, showCustomizer, toggleCustomizer };
}
