# Vector type

Five typography components built the way a motion designer builds type in
After Effects: trim paths on glyph outlines, a font editor's points and
handles, striped type, text on a path, and a repeater. Two of them work on
real glyph contours; three are DOM text.

| Component | Technique | Source |
| --- | --- | --- |
| `outline-trace` | Trim path on every contour, then a fill wipe | Glyph outlines |
| `glyph-anatomy` | Anchors and Bézier handles pull the curves into shape | Glyph outlines |
| `stripe-type` | IBM-style bands slide in from alternating sides | DOM text |
| `path-ride` | Text rides a self-drawing curve, then straightens | DOM text |
| `type-repeater` | Repeater copies fan, spiral or tunnel out and collapse | DOM text |

## Shared decisions

- **Glyph outlines** come from `opentype.js` and a `fontUrl` (`.ttf`, `.otf`
  or `.woff`; not `.woff2`). The default is the static Inter 800 TTF from
  Google Fonts. Glyphs are looked up per character with `charToGlyph` and
  kerned with `getKerningValue`: `stringToGlyphs` and `getPath` run GSUB
  shaping, and Inter's contextual lookups make `opentype.js` throw. Render is
  held with `delayRender` until the file is parsed, like `stretch-in`.
- **DOM components** load Inter through `@remotion/google-fonts`, as in the
  showreel set.
- **Units and time.** Sizes are reference px at a 720px-tall composition,
  scaled by `height / 720`. `t = frame × 30 / fps × speed`.
- **Pure timelines** exported from each file and asserted by tests. Tests
  never touch the network: glyph math is tested on synthetic path commands.
- **Colors.** House palette defaults (`#fafafa`, accent `#D97757`, selection
  `#0d99ff`); the site previews use the reel's fields through config
  defaults and `previewBackdrop`. Sentence-case default text.

## outline-trace

Every contour draws itself as a stroke, letter by letter. When a letter's
outer contour closes, its fill wipes up from the bottom and the stroke fades
into it.

- Contours per glyph are split from the path commands. A contour whose
  bounding box sits inside another contour of the same glyph is a counter.
- Letter `i` starts at `i × stagger` (3). Outer contours draw over 18
  frames, counters start 4 frames later and draw over 14, ease-in-out cubic,
  via `stroke-dasharray` / `stroke-dashoffset` on the contour length.
- Fill: a clip rect rises over the glyph box from `start + 14` for 12
  frames, ease-out cubic. Unless `keepStroke`, the stroke fades over the same
  window, so the resting letters are the exact glyphs.
- `fill={false}` keeps the drawn outline only.
- Static instances of variable fonts keep overlapping contours (the bar of a
  t crosses its stem). Each letter's stroke is masked by its own fill eroded
  by half the stroke width, so strokes inside the silhouette never show.

Length for the default "Outline": `6 × 3 + 26 = 44`.

Props: `text`, `fontUrl`, `fontSize` (150), `color`, `strokeColor`,
`strokeWidth` (2.5), `stagger` (3), `fill` (true), `keepStroke` (false),
`speed`.

## glyph-anatomy

The word is built as in a font editor. Metric guides draw across, anchors
appear along each contour, handles grow out of them and pull the straight
segments into curves, then the glyph fills and the scaffolding fades.

- TrueType quadratics are converted to cubics
  (`c1 = p0 + ⅔(q − p0)`, `c2 = p2 + ⅔(q − p2)`), so handles read like Figma
  or Glyphs: each curve has one handle on each end.
- Handle position = `anchor + (target − anchor) × k`. At `k = 0` both handles
  sit on their anchors and the curve is its chord; `k` runs to 1 with a
  back-eased overshoot, per segment, staggered along the contour.
- Guides: baseline, x-height and cap height from the font's `OS/2` table,
  each a hairline drawn left to right with a small label.

Timeline, letter offset `o = 2i`:

| Frames | Beat |
| --- | --- |
| 0–12 | Guides draw in, 3 frames apart |
| 8+o – 22+o | Anchors pop along each contour in path order |
| 18+o – 40+o | Handles grow and pull the curves into shape |
| 40+o – 50+o | Fill fades in |
| 46+o – 58+o | Anchors, handles and guides fade out (unless `keepPoints`) |

Length for the default "Glyph": `58 + 8 = 66`.

Props: `text`, `fontUrl`, `fontSize` (200), `color`, `guideColor`,
`guides` (true), `keepPoints` (false), `speed`.

## stripe-type

The word is cut into horizontal bands with gaps, as in the IBM logo. Bands
slide in from alternating sides and lock into the word.

- Bands span the word's ink box (measured on canvas), not the line box.
  With `n` bands and gap share `g`, pitch `p = H / (n − g)` and band height
  `p (1 − g)`, so the first band starts at the ink top and the last ends at
  the ink bottom.
- Each band is a copy of the text clipped with `clip-path: inset()`.
- Entrance: band `k` enters from the left when even and the right when odd,
  2 frames after band `k − 1`, over 16 frames with ease-out expo, from
  fully off the frame.
- `settle: "solid"` closes the gaps over the next 10 frames.
- `exit` lets the bands pass on through in the same staggered order after
  `hold` frames.

Length 30 for 8 bands (entrance); `getStripeTypeDuration` gives the preview.

Props: `text` ("Launch"), `fontSize` (180), `fontWeight` (800), `fontFamily`, `color`,
`stripes` (8), `gap` (0.35), `settle` ("striped"), `exit` (true), `hold`
(30), `speed`.

## path-ride

A line draws itself along a curve and the text rides behind its head,
each letter standing on the curve and turned to its tangent. Then the line
erases from its tail and the letters step off the curve onto a straight,
centered baseline.

- `path` is an SVG path in 1280×720 reference space, centered and scaled by
  `unit`. The default is an S-curve across the frame.
- Head: `L × easeInOutCubic(t / 40)`. Letter `j` sits at arc length
  `head − 0.3em − (T − c_j)`, where `T` is the text width and `c_j` the
  letter's center, so the last letter leads. Letters fade in over their
  first half-em on the curve.
- Letters stand on the curve: the baseline point is lifted along the normal
  by the line width plus 0.08em.
- Straighten: the path itself pulls taut over 50–68. Every point moves
  toward a straight baseline where arc length maps one to one onto x, and
  the tangent blends toward horizontal, so the line and the letters on it
  straighten together and the text keeps its spacing. (Moving each letter
  to its slot on its own made the word fall apart mid-move.) The path is
  sampled once (400 points) and the line is drawn as the pulled polyline.
  The tail erases over 52–70.

Length 70.

Props: `text`, `path`, `fontSize` (44), `fontWeight` (700), `fontFamily`,
`color`, `lineColor`, `lineWidth` (3), `speed`.

## type-repeater

An After Effects repeater on a word: copy `i` gets `i` steps of rotation and
scale. The copies unfold from the word, breathe, then collapse back into it.

- `mode`:
  - `tunnel` (default): `scale(1.2^(i × s))` around the center.
  - `spiral`: `rotate(i × 12° × s)`, `scale(1.1^(i × s))` around the center.
  - `fan`: `rotate(±⌈i/2⌉ × 11° × s)` to alternating sides around a pivot
    2.6em below the word.
  Shrinking copies, as first drafted, hid behind the word or clumped into
  it; growing copies read as depth.
- Spread `s`: 10–34 from 0 to 1, back-eased; 34–70 breathes ±6%; 70–90
  back to 0, ease-in-out cubic.
- Copy 0 is the word in `color`; later copies step toward `accent` and fade
  with their index. `outline` draws the copies with the erode filter from
  `echo-stack`; it is on by default.

Length 90.

Props: `text`, `copies` (12), `mode`, `fontSize` (110), `fontWeight` (800),
`fontFamily`, `color`, `accent`, `outline` (true), `speed`.

## Integration

Pages in `content/docs/typography/`, `meta.json` and a "Vector type" section
on the typography index, `registry.json` entries (`opentype.js` and
`@remotion/paths` where used), preview loaders in `registry/__index__.tsx`,
a config and tests per component, one changelog entry, `registry:build`,
`manifest:build`, and rendered frames checked before pushing.
