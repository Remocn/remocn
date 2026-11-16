"use client";

import { useQueryStates } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTrackEvent } from "@/lib/analytics";
import { type ControlConfig, getDefaults } from "@/lib/customizer-config";
import { buildParsers } from "@/lib/ui-preview-internals";
import {
  EMPTY_HISTORY,
  record,
  redo as redoStep,
  undo as undoStep,
  type Values,
} from "@/lib/undo-history";

/**
 * Customizer state shared by the animation and ui previews: URL-synced values
 * (nuqs, one query param per control), reset, undo/redo, and the analytics
 * the docs widgets have always sent. Customize events are debounced per prop so a
 * slider drag reports once, not on every step.
 */
export function useCustomizer(name: string, controls: ControlConfig) {
  const trackEvent = useTrackEvent();
  const { parsers, urlKeys } = useMemo(
    () => buildParsers(name, controls),
    [name, controls],
  );
  const defaults = useMemo(() => getDefaults(controls), [controls]);

  const [values, setValues] = useQueryStates(parsers, {
    urlKeys,
    clearOnDefault: true,
    shallow: true,
  });

  // Read at change time: several changes can land before the next render.
  const current = useRef<Values>(values);
  current.current = values;
  const [history, setHistory] = useState(EMPTY_HISTORY);

  const isDefault = useMemo(
    () => Object.entries(defaults).every(([k, v]) => values[k] === v),
    [defaults, values],
  );

  useEffect(() => {
    trackEvent("docs_component_viewed", { component: name });
  }, [name, trackEvent]);

  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
    };
  }, []);

  const change = (key: string, value: unknown) => {
    if (Object.is(current.current[key], value)) return;
    setHistory((h) => record(h, current.current, key, Date.now()));
    setValues((prev) => ({ ...prev, [key]: value }));
    const existing = timers.current.get(key);
    if (existing) clearTimeout(existing);
    timers.current.set(
      key,
      setTimeout(() => {
        trackEvent("component_customized", { component: name, prop: key });
        timers.current.delete(key);
      }, 500),
    );
  };

  const reset = () => {
    setHistory((h) => record(h, current.current, null, Date.now()));
    setValues(null);
    trackEvent("customizer_reset", { component: name });
  };

  const step = (direction: "undo" | "redo") => {
    const result = (direction === "undo" ? undoStep : redoStep)(
      history,
      current.current,
    );
    if (!result) return;
    setHistory(result.history);
    setValues(result.values);
    trackEvent("customizer_undo", { component: name, direction });
  };

  return {
    values: values as Record<string, unknown>,
    isDefault,
    change,
    reset,
    undo: () => step("undo"),
    redo: () => step("redo"),
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
