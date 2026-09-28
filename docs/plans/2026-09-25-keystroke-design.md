# Keystroke

Direction: an on-screen keystroke overlay for videos of keyboard-first
products: command palettes, shortcuts, editors. It works like a tasteful
KeyCastr. For each shortcut, physical keycaps appear, press in real order,
spring back, and leave after an idle hold. It is the keyboard counterpart of
`simulated-cursor` and lives in Effects (`content/docs/effects/`). Effects are
drop-in overlays composed on top of any scene. The keycaps are the only
artwork: no panel, no labels, no captions. The product UI underneath shows
what the shortcut did.

The timeline mirrors the remocn-ui steps shape. A step is
`{ at, keys, hold? }`, and `at` is the frame the shortcut fires, the frame the
last key bottoms out. A remocn-ui step on the same frame (`{ at, state }`)
reacts exactly on the click, so one frame number drives both the keystroke
and the UI it triggers. Everything that leads up to the click is scheduled
backward from `at`: the caps rising in, the modifiers going down, and the
earlier chords of a sequence.

## Look

Each key is a keycap drawn flat, as a keytop on a base, viewed slightly from
the front:

- Base (side wall): a rounded rectangle in the wall color. It spans the cap
  from `travel` down to the bottom edge, so it only ever shows below the
  keytop.
- Keytop: a rounded rectangle in the cap color with a hairline edge (1px at
  720p, scaled with the frame). It is `size × 0.84` tall and sits on top of
  the base, so a `size × 0.16` wall shows under it at rest. Pressing moves it
  down by up to `travel` (`size × 0.12`), leaving a `size × 0.04` wall.
- Contact shadow: one small, neutral box shadow under the base. It is
  `size × 0.07` down with a `size × 0.11` blur at rest (4.5px and 7px at the
  default size) and tightens to `size × 0.02` down with a `size × 0.03` blur
  at full press. No spread and no color, well inside the house shadow limits.
- Legend: crisp and centered on the keytop. Single characters are uppercase,
  `size × 0.4`, weight 500. Words are `size × 0.26`, weight 500. Mac glyphs are
  lucide icons drawn at `size × 0.36` with stroke 2, so they render the same on
  every machine.
- Corner radius `size × 0.16` on both keytop and base.

No gradients, glows, glass, or blur halos. The root paints no background. The
docs preview puts the overlay on a flat light gray (`#e9e9e5`) via
`previewBackdrop`, and the docs examples use a `<Backdrop>`.

Palettes (`theme`):

| Token | light | dark |
| --- | --- | --- |
| Keytop | `#fcfcfb` off-white | `#38393e` graphite |
| Keytop edge | `#dfdfda` | `#48494f` |
| Wall | `#cfcfca` light gray | `#1f2023` |
| Legend | `#1d1d1f` | `#f5f5f7` |
| Separator | `#8e8e89` | `#9d9da4` |
| Contact shadow | `rgba(20, 20, 16, 0.18)` | `rgba(0, 0, 0, 0.5)` |

One accent (`accent`, default `#0a84ff`, the macOS system blue) marks the
keys that are down. A legend mixes toward the accent in proportion to its
key's depth (`color-mix(in srgb, accent p%, legend)` with
`p = floor(depth × 100)`, so the settling tail of a release stays neutral).
It turns fully accent at the bottom and back to neutral as the key comes up.
The accent never fills a surface. `#0a84ff` reaches about 3.5:1 on the light
keytop and 3.2:1 on the graphite keytop, enough for large legends in both
themes.

Widths come in keyboard units (`u = size`):

| Key | mac | windows |
| --- | --- | --- |
| Letters, digits, punctuation, arrows | 1 | 1 |
| Command, option, control | 1 (⌘ ⌥ ⌃) | word |
| Shift | 1.5 (⇧) | word |
| Return / enter | 1.5 (↩) | word |
| Delete / backspace | 1.25 (⌫) | word |
| Tab | 1.25 (⇥) | word |
| Escape | 1 (⎋) | word |
| Caps lock | 1.5 (⇪) | word |
| Space | 2.5 (␣) | 2.5 |
| Other words (`fn`, `F5`, `Home`) | word, min 1 | word, min 1.25 |

A word key is `ceil_to_quarter(chars × 0.156 + 0.48)` units wide. That is
`chars × 0.6em` of the `size × 0.26` word font plus `size × 0.24` padding on
each side. On windows the minimum is 1.25, so every word-labelled key reads as
wide: Ctrl 1.25, Alt 1.25, Shift 1.5, Enter 1.5, Backspace 2, Space 2.5. Caps
in a chord sit `size × 0.14` apart. Chords in a sequence are joined by a
subtle separator: the word "then" in the separator color, `size × 0.25`,
centered in a `size × 0.95` slot.

## Key grammar

`keys` is a combo (`"mod+k"`, `"shift+mod+p"`, `"enter"`) or a sequence of
chords separated by spaces (`"g i"`: press g, then i). Tokens are
case-insensitive. `"mod++"` or `"mod+plus"` gives a plus key.

- `mod` resolves by `platform`: command on mac, Ctrl on windows.
- `cmd`, `command`, `meta`, `win` are command on mac and Win on windows.
  `ctrl`, `control`, `alt`, `option`, `opt`, `shift`, `fn` are the other
  modifiers.
- `enter`/`return`, `esc`/`escape`, `tab`, `space`, `backspace`,
  `delete`/`del`, `capslock`, `up`/`down`/`left`/`right` (and `arrowup` …),
  `home`, `end`, `pageup`, `pagedown`, `f1`–`f24` are named keys.
  `plus`, `minus`, `comma`, `period`, `slash`, `backslash`, `semicolon`,
  `quote`, `backquote`, `bracketleft`, `bracketright`, `equal` map to their
  characters.
- Anything else is one character (uppercased) or a word legend.
- Modifiers are shown and pressed in the platform's standard order: fn ⌃ ⌥ ⇧ ⌘
  on mac, and Fn Win Ctrl Alt Shift on windows. Duplicates collapse. The other
  keys follow in the order written, and the last key is the trigger.

Mac legends: ⌘ `command`, ⌥ `option`, ⇧ `arrow-big-up`, ⌃ `chevron-up`,
↩ `corner-down-left`, ⌫ `delete`, ⎋ `circle-arrow-out-up-left`,
⇥ `arrow-right-to-line`, ␣ `space`, ⇪ `arrow-big-up-dash`, and the four
`arrow-*` icons. All geometry is copied from the lucide-react `__iconNode`
arrays. Windows legends are words: Ctrl, Alt, Shift, Win, Enter, Esc, Tab,
Space, Backspace, Delete, Caps Lock, Fn. Windows arrows use the same icons.

## Props

| Prop | Default | Range | Meaning |
| --- | --- | --- | --- |
| `steps` | three-step flow | `KeystrokeStep[]` | `{ at, keys, hold? }`; `at` is the Sequence-local frame the shortcut fires |
| `platform` | `mac` | `mac`, `windows` | Resolves `mod` and picks glyph or word legends |
| `theme` | `light` | `light`, `dark` | Off-white caps on a light-gray wall, or graphite caps |
| `accent` | `#0a84ff` | color | Legend color of keys that are down |
| `x` | 0.5 | fraction | Row center, fraction of the composition width |
| `y` | 0.86 | fraction | Row center, fraction of the composition height |
| `size` | 64 | 8–400 ref px | Height of a keycap and width of a 1u key at 720p |
| `linger` | 30 | 0–600 frames | Idle hold after the last key comes up, before the caps leave |
| `speed` | 1 | shared | Scales time; 0 never fires |
| `className` | – | – | Class on the full-frame root |

`hold` on a step is how long the chord stays down: the frames the trigger
stays at the bottom after it fires. The default is 8. `at`, `hold` and
`linger` are composition frames, exactly like remocn-ui `at`. The playhead is
`frame × speed`, so a keystroke and a remocn-ui step with the same `at` and
`speed` always land on the same frame. The internal motion (press, release,
rise) is authored in 30 fps frames and converted with `30 / fps`, so it takes
the same time in seconds at any frame rate.

The docs customizer exposes `platform`, `theme`, `accent`, `x`, `y`, `size`,
`linger` and the shared `speed`. `steps` is an array, so it is not a control.
Number controls carry `hiddenFromList: false`.

## Sizing rule

Every size is in reference px at a 720px-tall composition and is multiplied
by `unit = height / 720`, like confetti and the motion-graphics accents. The
default 64px keycap is 96px at 1080p. Position is a fraction (`x`, `y`), so the
anchor stays put at any aspect ratio. The group anchor is positioned with
percentages of the root, so it also works inside a padded container. In a
9:16 frame, `unit` is 2.67. A four-key windows combo then spans most of the
width, so portrait videos should pass a smaller `size`.

## Timeline (30 fps, speed 1, default content)

Default steps: `{ at: 20, keys: "mod+k" }` (open the command menu),
`{ at: 78, keys: "g i" }` (go to inbox, a two-key sequence), and
`{ at: 114, keys: "shift+mod+p" }` (open the command palette). On mac they
read ⌘K, G then I, ⇧⌘P. On windows they read Ctrl K, G then I,
Ctrl Shift P.

| Frames | Beat |
| --- | --- |
| 0–7 | Empty frame |
| 7–18 | ⌘ rises in on 7 and K on 8; each settles 10 frames later |
| 14–17 | ⌘ goes down |
| 17–20 | K goes down; ⌘K fires on 20 (the command menu opens here) |
| 28–41 | K comes up on 28 and ⌘ on 31, each with a small overshoot; settled by 41 |
| 48–58 | G rises in; ⌘K slides back to the second slot, scales to 0.86 and dims |
| 55–58 | G goes down; fires on 58 |
| 61–69 | ⌘K leaves (its linger ran out) |
| 66–76 | G comes up |
| 68–78 | "then" and I rise in while the row re-centers; G dims to 0.45 over 72–78 |
| 75–78 | I goes down; G then I fires on 78 |
| 86–96 | I comes up |
| 98–110 | ⇧, ⌘, P rise in on 98, 99 and 100; G then I slides back |
| 105–114 | ⇧ down on 105, ⌘ on 108, P on 111; fires on 114 |
| 116–124 | G then I leaves (its brief hold in the second slot ended) |
| 122–138 | P comes up on 122, ⌘ on 125, ⇧ on 128; settled by 138 |
| 158–166 | ⇧⌘P leaves after a 30-frame linger |
| 166–180 | Empty hold (preview only) |

`keystrokeLength` is 166, the frame the last group has left. The preview
duration is `getKeystrokeDuration()`, 180. That is the motion end divided by
`speed` plus a 14-frame tail, all converted to composition frames.

## Signature motion

### Per-chord schedule

For a chord of `n` keys `k0 … k(n−1)` that fires on `F`, with hold `h`:

- Key `i` starts down on `F − 3 − 3 × (n − 1 − i)`, so the keys go down 3
  frames apart, modifiers first. Each press takes 3 frames, and the trigger
  bottoms out exactly on `F`.
- The trigger starts back up on `F + h`. Key `i` starts up on
  `F + h + 3 × (n − 1 − i)`. The keys come up in reverse, last down first up,
  so for ⌘K it is ⌘ down, K down, K up, ⌘ up. The modifiers stay down while
  the letter taps.
- The chord's caps start rising 7 frames before its first key goes down
  (`enter = F − 10 − 3 × (n − 1)`). Cap `i` rises 1 frame after cap `i − 1`,
  for a little overlap.

A sequence chains its chords. The next chord starts rising 2 frames after the
previous chord's last key starts up. The step's `at` is the fire frame of the
last chord, because a sequence shortcut fires on its last key. The lead-in
from the first rise to `at` is
`Σ (10 + 3(n_j − 1)) + Σ_{j<last} (h + 3(n_j − 1) + 2)`: 10 frames for a
single key, 13 for a two-key combo, 16 for three, and 30 for `g i`.

### Depth

`depth(t)` is 0 at rest and 1 at the bottom:

- Press, frames `0–3` after the key's press start: smoothstep
  `u²(3 − 2u)`. Per frame that is 0, 0.26, 0.74, 1. The first and last
  frames ease, and nothing moves linearly.
- Hold: exactly 1.
- Release: `1 − settle(t)`. `settle` is a closed-form underdamped spring step
  response, like `truchet-flip`'s snap, with damping ratio 0.46. Its frequency
  is tuned to first reach rest on frame 3. It overshoots to about 0.196 above
  rest near frame 4.6. From frame 6 a smoothstep taper removes the ringing,
  so it lands exactly on rest on frame 10. Per frame: 1, 0.774, 0.35, 0,
  −0.173, −0.188, −0.12, −0.032, 0.009, 0.006, 0. The overshoot is capped by
  construction. At the default size it lifts the keytop about 1.5px above
  rest.

Depth drives four things at once:

- keytop `translateY = depth × travel`
- visible wall `= wall − depth × travel`, from 10.2px down to 2.6px at 64
- contact shadow offset and blur, which tighten
- legend color, which mixes toward the accent (`clamp(depth, 0, 1)`)

### Enter and leave

- Rise: a cap starts `size × 0.42` below its rest line and follows the same
  spring shape with damping 0.65. It first reaches rest on frame 4, peaks
  6.8% past rest near frame 5.5, and tapers from frame 7 to land exactly on
  frame 10. Per frame: 0, 0.199, 0.549, 0.835, 1, 1.062, 1.064, 1.043,
  1.015, 1.001, 1. Opacity eases in over the first 4 frames.
- Row re-center: a group is centered on its visible width. When a later chord
  of a sequence starts rising, the visible width eases from the old width to
  the new one over 10 frames with an ease-out cubic
  (`cubic-bezier(0.33, 1, 0.68, 1)`, 27% after one frame, 49% after two). The
  earlier caps slide left by half of the new chord's width while the new caps
  rise into the gap. The house EXPO curve covers 49% in the first frame and
  reads as a jump for a layout shift, so it is not used here.
- Dim: the earlier chords of a sequence fade to 0.45 opacity over the 6
  frames before the next chord fires (smoothstep).
- Leave: all caps of a group leave together. Over 8 frames, opacity falls
  with an ease-in (quad), the group drifts `size × 0.22` with an ease-in
  (cubic), and it scales to 0.96. A group still in front sinks down, the
  reverse of its rise. A group already pushed back drifts up, away from the
  newer group.

### Stack

Groups are ordered by the frame they start rising. When a newer group starts
rising, every group still on screen is pushed back one slot over 10 frames
(the same ease-out cubic). A slot is `size × 1.09` higher, the row scales by
0.86 around its center, and the group's opacity drops to 0.55. The pushed row's bottom then
sits `size × 0.16` above the front row. A group leaves at the earliest of:

1. its last key-up plus `linger` (the idle hold),
2. 18 frames after it is first pushed back (it only stacks briefly). If its
   keys are still down at the push, the 18 frames count from its last key-up
   instead, so a long `hold` or a tight pair of steps does not fade a group
   out with its keys held; its release plays in the back slot,
3. the moment a second newer group starts rising.

At most two groups hold the screen, newest in front. When steps are so dense
that a third group arrives, the oldest is already leaving: it fades while it
drifts up to a third slot. With the default content, never more than two are
visible. A group that has already left is never pushed.

## Determinism

Every value is a pure function of the frame, `useVideoConfig()` and the
props. Time is `frame × speed × 30 / fps` in 30 fps frames, and step times are
`at × 30 / fps`. There is no randomness. The parsed timeline (key legends,
chord schedules, stack exits) depends only on `steps`, `platform`, `linger`
and `fps`, and is memoized on them. Nothing accumulates across frames, so any
frame renders the same when seeked to directly. Steps are validated: those
with a non-finite `at` or no parsable key are dropped, `hold` falls back to 8
and is clamped to 0–600, and numeric props fall back to their defaults.

## Handoff and usage

Put `Keystroke` last in the scene, over the product UI. Give each shortcut the
same `at` as the remocn-ui step it triggers, for example
`{ at: 20, keys: "mod+k" }` next to `{ at: 20, state: "opened" }` on
`command-menu`. Leave at least the lead-in (13 frames for a two-key combo)
before the first `at` of a Sequence. For a separate caption or a click, pair
it with `simulated-cursor`.

Files: `registry/remocn/keystroke/index.tsx`, `config.ts`,
`__tests__/keystroke.test.ts`, and `content/docs/effects/keystroke.mdx`. The
lead integrates registry.json, the preview index, the manifest, navigation
and the changelog after the user approves the preview.
