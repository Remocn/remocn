---
name: add
description: >
  Install one remocn component into a Remotion project and show how to use it: read its docs page,
  run shadcn add, and place it in a Sequence with the right length. Use when the user names a remocn
  component to add, or asks for a single animation, transition, background or UI primitive rather
  than a whole video.
---

# Add one remocn component

Requested: $ARGUMENTS

Load the `remocn` skill first for the tier conventions and Canvas & timing.

1. **Resolve the name.** If the request is an exact component name, use it. If it's a description
   ("a glitchy title", "a fast cut"), shortlist from `https://remocn.dev/llms-components.txt` and
   offer the best two or three, each with its `Use for` line and length. Wait for the pick.
2. **Read its page.** Fetch the `.md` docs URL the index gives for it. Note the props, the example,
   `Length` and any `Avoid for` note. If the avoid note matches what the user wants, say so and
   suggest the replacement it names.
3. **Prepare the project once.** If `components.json` has no `@remocn` registry, follow the `setup`
   skill first. It says which files it touched and what, if anything, the user has to add by hand.
4. **Install.** `npx shadcn add @remocn/<name>`. Dependencies install transitively; list which
   files landed.
5. **Use it.** Show a usage snippet built from the docs example, sized to the canvas, inside a
   `<Sequence durationInFrames>` of at least its `Length` plus hold time. Transitions go into
   `TransitionSeries.Transition` as `presentation` with `linearTiming`/`springTiming` at their
   `Length`. `Length` is counted at 30 fps: in a 60 fps composition hand Remotion twice that (scale
   by `fps / 30` at other rates); frame counts in the component's own props stay as the docs give
   them. If the user named a place in their code, put it there; otherwise ask where it goes.
6. **Check.** `npx tsc --noEmit`, then a still at the end of its motion
   (`npx remotion still <composition> out/<name>.png --frame=<n>`) and look at it.
