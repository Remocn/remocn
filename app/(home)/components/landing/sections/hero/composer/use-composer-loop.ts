"use client";

import { useInView, usePageInView, useReducedMotion } from "motion/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { publishScenario } from "../scenes/composer-signal";
import { SCENARIOS } from "./scenarios";

/**
 * One prompt's life in the hero composer:
 * typing → hold (picks swap in) → selecting (word by word, like ⌥⇧←) →
 * selected → empty (agent swaps) → next prompt typing.
 */
export type Phase = "typing" | "hold" | "selecting" | "selected" | "empty";

export type ComposerState = {
  /** Scenario whose prompt is in the input. */
  index: number;
  /** Scenario whose agent is shown in the header line. */
  agentIndex: number;
  /** Scenario whose blocks are shown in the Picked row. */
  pickedIndex: number;
  phase: Phase;
  /** Characters of the prompt currently typed. */
  typed: number;
  /** Selection start (selection runs to `typed`); null = no selection. */
  selectionStart: number | null;
};

const HOLD_MS = 2800;
const SELECT_STEP_MS = 55;
const SELECTED_MS = 420;
const EMPTY_MS = 520;
const REDUCED_CYCLE_MS = 6000;

// The server render and the first client frame show the first prompt fully
// typed with its picks, which is also the whole experience without JS.
const INITIAL: ComposerState = {
  index: 0,
  agentIndex: 0,
  pickedIndex: 0,
  phase: "hold",
  typed: SCENARIOS[0].prompt.length,
  selectionStart: null,
};

/** Human-ish typing cadence: a little jitter, a breath after punctuation. */
function typingDelay(char: string | undefined) {
  if (char === "." || char === ",") return 150;
  return 26 + Math.random() * 22;
}

/** Start of the word before `from`, skipping trailing spaces (⌥⇧← jumps). */
function previousWordStart(text: string, from: number) {
  let i = from;
  while (i > 0 && text[i - 1] === " ") i--;
  while (i > 0 && text[i - 1] !== " ") i--;
  return i;
}

function next(state: ComposerState): [ComposerState, number] {
  const prompt = SCENARIOS[state.index].prompt;
  switch (state.phase) {
    case "typing": {
      if (state.typed < prompt.length) {
        return [
          { ...state, typed: state.typed + 1 },
          typingDelay(prompt[state.typed]),
        ];
      }
      // Done typing: the agent "picks" its blocks for this prompt.
      return [{ ...state, phase: "hold", pickedIndex: state.index }, HOLD_MS];
    }
    case "hold":
      return [
        { ...state, phase: "selecting", selectionStart: state.typed },
        SELECT_STEP_MS,
      ];
    case "selecting": {
      const start = previousWordStart(prompt, state.selectionStart ?? 0);
      if (start > 0) {
        return [{ ...state, selectionStart: start }, SELECT_STEP_MS];
      }
      return [{ ...state, selectionStart: 0, phase: "selected" }, SELECTED_MS];
    }
    case "selected": {
      // Backspace over the selection, and the next agent takes over.
      const upcoming = (state.index + 1) % SCENARIOS.length;
      return [
        {
          ...state,
          phase: "empty",
          typed: 0,
          selectionStart: null,
          agentIndex: upcoming,
        },
        EMPTY_MS,
      ];
    }
    case "empty":
      return [
        { ...state, phase: "typing", index: state.agentIndex, typed: 0 },
        typingDelay(undefined),
      ];
  }
}

/**
 * Drives the composer. Runs only while the composer is on screen and the tab
 * is visible; resumes from where it paused. Under reduced motion there is no
 * typing or selecting: whole scenarios swap on a slow timer.
 */
export function useComposerLoop(rootRef: RefObject<HTMLElement | null>) {
  const [state, setState] = useState<ComposerState>(INITIAL);
  const stateRef = useRef(state);
  stateRef.current = state;

  const reducedMotion = useReducedMotion() ?? false;
  const inView = useInView(rootRef, { margin: "100px" });
  const pageInView = usePageInView();
  const playing = inView && pageInView;

  useEffect(() => {
    if (!playing) return;

    if (reducedMotion) {
      const id = setInterval(() => {
        const upcoming = (stateRef.current.index + 1) % SCENARIOS.length;
        setState({
          ...INITIAL,
          index: upcoming,
          agentIndex: upcoming,
          pickedIndex: upcoming,
          typed: SCENARIOS[upcoming].prompt.length,
        });
      }, REDUCED_CYCLE_MS);
      return () => clearInterval(id);
    }

    let timeout: ReturnType<typeof setTimeout>;
    const schedule = (delay: number) => {
      timeout = setTimeout(() => {
        const [nextState, nextDelay] = next(stateRef.current);
        stateRef.current = nextState;
        setState(nextState);
        schedule(nextDelay);
      }, delay);
    };
    // Resuming mid-hold restarts the hold so the prompt is readable again.
    schedule(stateRef.current.phase === "hold" ? HOLD_MS : SELECT_STEP_MS);
    return () => clearTimeout(timeout);
  }, [playing, reducedMotion]);

  useEffect(() => {
    publishScenario(state.pickedIndex);
  }, [state.pickedIndex]);

  return { state, reducedMotion, playing };
}
