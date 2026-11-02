"use client";

import { useSyncExternalStore } from "react";

type Signal = { scenario: number; composed: number };

let signal: Signal = { scenario: 0, composed: 6 };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function publishScenario(scenario: number) {
  if (signal.scenario === scenario) return;
  signal = { ...signal, scenario };
  emit();
}

export function publishComposed(composed: number) {
  if (signal.composed === composed) return;
  signal = { ...signal, composed };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => signal;

export function useComposerSignal() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
