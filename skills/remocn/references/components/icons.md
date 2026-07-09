# icons

**Tier:** `remocn` (icons) · **Deps:** `@remocn/icons-core` (auto-installed)

Animated [Lucide](https://lucide.dev) line icons re-authored for Remotion. Each one draws itself on, then performs a small icon-specific action — frame-driven and deterministic (same frame → same pixels). One reference file for the whole set; there are no per-icon files.

## Install

```bash
shadcn add @remocn/icon-<name>
```

Lands at `components/remocn/icon-<name>.tsx`; the shared library installs to `lib/remocn-icons/` via the registry dependency.

## Motion system

Two phases, chosen by the `animation` prop:

- **Draw** — strokes trace on, staggered by path, while the glyph springs into place.
- **Action** — a short gesture that reads the icon's meaning (a check stamps, a bell rings, a heart beats).

`animation="both"` (default) draws then acts; `"draw"` is a calm entrance with no action; `"action"` skips the draw and performs the action from frame 0 (icon starts fully drawn).

There is no `delay` prop — offset an icon in time with `<Sequence from={n}>` and scale its tempo with `speed` (`frame * speed`), the same idiom as the text animations.

Every icon also exports a static variant `<Pascal>IconStatic` (e.g. `CheckIconStatic`) — the fully-drawn SVG with no Remotion hooks, for non-animated use.

## Props

Shared `IconAnimationProps` across every icon:

| Prop | Type | Default |
|---|---|---|
| `animation` | `"draw" \| "action" \| "both"` | `"both"` |
| `loop` | `boolean` | per icon |
| `speed` | `number` | `1` |
| `size` | `number` | `48` |
| `color` | `string` | `"currentColor"` |
| `strokeWidth` | `number` | `2` |
| `className` | `string` | — |

Loops by default (pass `loop={false}` to play once): `loader`, `refresh-cw`, `sparkles`, `flame`, `clock`, `globe`, `activity`.

## Example

```tsx
import { AbsoluteFill, Sequence } from "remotion";
import { CheckIcon } from "@/components/remocn/icon-check";
import { SoftBlurIn } from "@/components/remocn/soft-blur-in";

export const Scene = () => (
  <AbsoluteFill className="items-center justify-center gap-6">
    <Sequence from={0}>
      <CheckIcon size={64} color="#22c55e" />
    </Sequence>
    <Sequence from={12}>
      <SoftBlurIn text="Done" />
    </Sequence>
  </AbsoluteFill>
);
```

## Pick an icon

| Icon | Use for | Avoid for | Loop | Length |
|---|---|---|---|---|
| `icon-check` | Marking a step, task, or claim as done in a demo scene | A success state that needs a container — compose with a circle or badge from the ui tier instead | no | 60f |
| `icon-check-circle` | A completed checklist row or success confirmation moment | A bare inline tick next to text — use `icon-check` | no | 75f |
| `icon-x` | An error, removal, or dismissal beat | A warning that is not a hard failure — use `icon-alert-triangle` | no | 60f |
| `icon-alert-triangle` | Highlighting a risk, warning, or "before" pain point | A fatal error or rejection — use `icon-x` | no | 75f |
| `icon-info` | Introducing a tip, note, or neutral callout in a scene | Anything alarming — use `icon-alert-triangle` | no | 75f |
| `icon-loader` | A loading or processing beat between two states | A finished state — swap to `icon-check` when the wait resolves | yes | 90f |
| `icon-refresh-cw` | Sync, retry, or "always up to date" messaging | An indeterminate wait — use `icon-loader` | yes | 90f |
| `icon-search` | A search or discovery beat in a product walkthrough | Zoom semantics — pair with `zoom-blur` transitions instead | no | 75f |
| `icon-bell` | A notification or alert arriving in a demo | Warnings about problems — use `icon-alert-triangle` | no | 75f |
| `icon-download` | A download, export, or "get it now" beat | Sending data away — use `icon-upload` or `icon-send` | no | 70f |
| `icon-upload` | An upload, publish, or submission beat | Receiving data — use `icon-download` | no | 70f |
| `icon-copy` | Copy-to-clipboard or duplication moments (install commands, snippets) | Sharing to another surface — use `icon-external-link` | no | 70f |
| `icon-settings` | Settings, configuration, or customization beats | Continuous background processing — use `icon-loader` | no | 75f |
| `icon-trash` | Delete or cleanup beats in a workflow demo | Reversible dismissal — use `icon-x` | no | 75f |
| `icon-plus` | Adding an item, feature, or integration in a build-up scene | Medical or positivity semantics — it is strictly an "add" affordance here | no | 60f |
| `icon-send` | Sending a message, form, or request in a flow | File transfer semantics — use `icon-upload` | no | 75f |
| `icon-heart` | Likes, favorites, testimonials, or "built with love" moments | Ratings — use `icon-star` | no | 75f |
| `icon-star` | Ratings, favorites, GitHub-star callouts | Sparkle/magic semantics — use `icon-sparkles` | no | 70f |
| `icon-sparkles` | AI features, magic moments, premium highlights | A single award or rating — use `icon-star` | yes | 90f |
| `icon-zap` | Speed, performance, or instant-result claims | Gradual improvement narratives — pair metrics with `number-wheel` instead | no | 60f |
| `icon-flame` | Hot features, trending items, streaks | Literal fire/danger warnings — use `icon-alert-triangle` | yes | 90f |
| `icon-thumbs-up` | Approval, positive review, social-proof beats | Love/favorite semantics — use `icon-heart` | no | 70f |
| `icon-party-popper` | Launch, milestone, or celebration finales | Subtle success — use `icon-check-circle` | no | 75f |
| `icon-arrow-right` | CTAs, next-step pointers, flow direction | Leaving the product — use `icon-external-link` | no | 60f |
| `icon-arrow-left` | Back navigation, "previously" callbacks | Undo semantics — use `icon-refresh-cw` spun counter-clockwise via `speed` | no | 60f |
| `icon-arrow-up` | Growth, improvement, upward-trend beats | File upload — use `icon-upload` | no | 60f |
| `icon-arrow-down` | Cost/latency reduction beats, scroll cues | File download — use `icon-download` | no | 60f |
| `icon-external-link` | "View on GitHub", external docs, open-in-new-tab beats | In-product navigation — use `icon-arrow-right` | no | 70f |
| `icon-play` | Starting a demo, video, or 'see it in action' beat | Continuous processing — use `icon-loader` | no | 60f |
| `icon-pause` | Pausing a flow or freezing a moment mid-demo | Permanent stops or errors — use `icon-x-circle` | no | 60f |
| `icon-skip-forward` | Jumping ahead, skipping onboarding steps | Simple next-step pointers — use `icon-arrow-right` | no | 60f |
| `icon-volume-2` | Sound-on moments, audio feature callouts | Muted states — use `icon-volume-x` | no | 70f |
| `icon-volume-x` | Muted or do-not-disturb beats | General errors — use `icon-x-circle` | no | 70f |
| `icon-mic` | Voice input, recording, dictation features | Audio playback — use `icon-volume-2` | no | 75f |
| `icon-video` | Video calls, screen recording, camera-on beats | Photo capture — use `icon-camera` | no | 70f |
