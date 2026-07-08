# Plan 012: Gate landing-page Remotion Players on viewport visibility

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 361f442..HEAD -- "app/(home)/components"`
> On drift, compare the excerpts below against live code; mismatch = STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (must land BEFORE plans/013 — both touch the same files)
- **Category**: perf
- **Planned at**: commit `361f442`, 2026-07-07

## Why this matters

The landing page mounts ~13 autoplaying `@remotion/player` instances at once (8 in the bento grid, 5 in the UI-registry section, 1 in interactive-code), several rendering WebGL shaders. The shared `useAutoplay` hook starts playback via a rAF retry loop as soon as the component mounts — no viewport check — so below-the-fold players render frames nobody sees, contending for main thread and GPU from first paint. Playing only what's visible (and pausing what scrolls out) removes most of that cost without changing anything the user perceives.

## Current state

`app/(home)/components/use-autoplay.ts` (entire file, 24 lines):

```ts
import type { PlayerRef } from "@remotion/player";
import { type RefObject, useEffect } from "react";

export function useAutoplay(
  playerRef: RefObject<PlayerRef | null>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 120; // ~2s at 60fps, longer on a contended mount
    const tick = () => {
      const player = playerRef.current;
      if (player && !player.isPlaying()) player.play();
      attempts += 1;
      if ((!player || !player.isPlaying()) && attempts < MAX_ATTEMPTS) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playerRef, enabled]);
}
```

CRITICAL context on WHY this hook is shaped this way: `<Player autoPlay>` stalls when the player mounts lazily/contended, so the site mounts players paused and drives `play()` through this rAF retry. Keep the retry mechanism — add visibility on top of it, don't replace it.

Call sites (all pass a `PlayerRef` ref and a boolean):
- `app/(home)/components/sections/bento-registry.tsx:88` — `useAutoplay(playerRef, Boolean(entry));` inside `BentoCard`; the Player at lines 131-145 sits inside a wrapper `<div className={cn("relative w-full overflow-hidden", ...)}>` (lines 121-128) — a natural observation target.
- `app/(home)/components/sections/ui-registry.tsx:71-72` — `ScenePlayer` component: `useAutoplay(ref, Boolean(entry));`, returns a `<Player ...>` directly (no wrapper div inside `ScenePlayer` itself — the wrapper lives at its call sites; put the observed node INSIDE `ScenePlayer` by wrapping the Player in a full-size div).
- `app/(home)/components/sections/interactive-code.tsx` — one Player (~line 363) inside a `<div className="w-full" style={{ aspectRatio }}>`.

In-repo IntersectionObserver precedent: `hooks/use-in-view.ts` wraps `useIntersectionObserver` from `@uidotdev/usehooks` (already a dependency):

```ts
import { useIntersectionObserver } from "@uidotdev/usehooks";
export const useInView = () => {
  const [ref, entry] = useIntersectionObserver({ threshold: 0, root: null, rootMargin: "0px" });
  return { ref, inView: entry?.isIntersecting };
};
```

Repo conventions: bun + biome; NEVER add code comments except functional directives; English only; components must not hardcode backgrounds.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `bunx tsc --noEmit` | no new errors |
| Build | `bun run build` | exit 0 |
| Tests | `bun run test 2>&1 \| tail -3` (or `bun test`) | unchanged |

## Scope

**In scope**:
- `app/(home)/components/use-autoplay.ts` (extend)
- `app/(home)/components/sections/bento-registry.tsx`, `ui-registry.tsx`, `interactive-code.tsx` (attach the observer ref)

**Out of scope**:
- Docs preview components (`components/docs/**`) — different lifecycle (previews are the page content there); Plan 013 territory at most.
- The hero `<video>` (Plan 011).
- Any Player prop changes beyond what's needed to attach the container ref.
- `hooks/use-in-view.ts` — read it as precedent; extending it is unnecessary (its `rootMargin: "0px"`/`once`-less shape differs from what autoplay needs).

## Git workflow

Do NOT run any git write commands. The repo owner handles all git operations.

## Steps

### Step 1: Extend `useAutoplay` with visibility gating

Rework `app/(home)/components/use-autoplay.ts` to return a container ref and gate on visibility, keeping the exact rAF retry behavior when visible:

Target shape (signature — adapt internals as needed):

```ts
export function useAutoplay(
  playerRef: RefObject<PlayerRef | null>,
  enabled = true,
): { containerRef: (node: Element | null) => void }
```

Behavior:
- Use `useIntersectionObserver` from `@uidotdev/usehooks` (match `hooks/use-in-view.ts` usage) with `rootMargin: "200px"` (start slightly before entering) and `threshold: 0`.
- When `enabled && isIntersecting`: run the existing rAF retry loop (unchanged constants) to start playback.
- When leaving the viewport (`isIntersecting` false after having been true): cancel any pending rAF and call `playerRef.current?.pause()`.
- Cleanup on unmount: cancel rAF (as today).
- Preserve backward-compatible behavior if the returned ref is never attached: with `@uidotdev/usehooks`, an unattached observer never intersects — that would silently stop autoplay for any missed call site. Guard against this: if after mount the observer target was never attached (`entry === undefined`), fall back to the old always-play behavior. This makes the change fail-open.

**Verify**: `bunx tsc --noEmit` → errors only at the three call sites (signature change), nowhere else.

### Step 2: Attach the ref at all three call sites

- `bento-registry.tsx` `BentoCard`: `const { containerRef } = useAutoplay(playerRef, Boolean(entry));` and add `ref={containerRef}` to the preview wrapper `<div>` (the one at lines 121-128 with `"relative w-full overflow-hidden"`).
- `ui-registry.tsx` `ScenePlayer`: wrap the returned `<Player>` in `<div ref={containerRef} style={{ width: "100%", height: "100%" }}>` (or className equivalent matching surrounding style idiom) and attach.
- `interactive-code.tsx`: attach to the existing `<div className="w-full" style={{ aspectRatio }}>` wrapping the Player.

Search for any other `useAutoplay(` call sites (`grep -rn "useAutoplay(" app components`) and attach there too.

**Verify**: `bunx tsc --noEmit` → no errors. `grep -c "containerRef" app/\(home\)/components/sections/*.tsx` → ≥3 files.

### Step 3: Build + behavioral check

**Verify**: `bun run build` → exit 0. Owner manual check (record as pending in README): on the landing page, players below the fold don't start until scrolled near; scrolling a player out pauses it (DevTools performance tab shows rAF/GPU work dropping when everything is off-screen).

## Test plan

The hook is browser-API-bound (IntersectionObserver + rAF); the repo has no DOM-test harness — do not introduce one for this plan. Gates: typecheck, build, and the fail-open guard in Step 1 (which ensures a missed attachment degrades to today's behavior, not to a dead player).

## Done criteria

- [ ] `useAutoplay` pauses off-screen players and plays in-view ones, keeping the rAF retry
- [ ] Fail-open guard: unattached container ⇒ old behavior
- [ ] All `useAutoplay` call sites attach `containerRef`
- [ ] `bunx tsc --noEmit` clean vs baseline; `bun run build` exit 0
- [ ] `plans/README.md` status row updated (with "manual scroll check pending" note)

## STOP conditions

- `useIntersectionObserver` from `@uidotdev/usehooks` can't express re-entry (fires once): check its docs/types first — if it only reports the latest entry it's fine; if it disconnects after first intersection, use a raw `IntersectionObserver` in the hook instead (still in scope) and note it.
- A call site's Player has no wrappable container without layout change.
- Pausing/resuming visibly breaks a composition (e.g. a player that must never pause mid-loop for visual reasons) — exclude that one call site with `enabled` and report.

## Maintenance notes

- Plan 013 (lazy registry) touches the same three files — land THIS plan first; 013's diffs assume the containerRef shape exists.
- New landing sections with Players must use `useAutoplay` + attach `containerRef` — the fail-open guard hides forgetting it (players just autoplay eagerly), so reviewers should check for the attachment.
- If Remotion's Player later gains native in-view autoplay, this hook collapses into it.
