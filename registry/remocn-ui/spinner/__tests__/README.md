# `spinner` — determinism note

`Spinner` is a **motion atom**: its only time source is `useCurrentFrame()`.
The rotation formula is `rotation = frame * speed * 6` (degrees), computed
directly from the Remotion playhead — there is no `Date.now()`, no
`requestAnimationFrame`, and no `Math.random()`. This makes it a pure function
of the frame: given the same frame number and the same `speed` prop, `Spinner`
always produces the same transform, making it frame-perfect and scrub-safe on
the Remotion timeline.

Because `useCurrentFrame()` can only be called inside a Remotion render tree,
`Spinner` has no headless unit tests. Its determinism guarantee is structural:
read `registry/remocn-ui/spinner/index.tsx` and verify the single expression
`useCurrentFrame() * speed * 6` is the only quantity that varies between
renders. The grep below must print nothing — any match is a determinism
violation:

```bash
grep -nE "useState|useEffect|Date\.now|Math\.random|requestAnimationFrame" \
  registry/remocn-ui/spinner/index.tsx
```

Expected: no output.
