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
| `icon-menu` | Opening navigation, hamburger-menu beats | 'More options' affordances — use `icon-more-horizontal` | no | 70f |
| `icon-more-horizontal` | Overflow menus, 'more options', typing or thinking beats | Loading states — use `icon-loader` | no | 70f |
| `icon-maximize` | Fullscreen, expand, zoom-into-detail beats | Opening external pages — use `icon-external-link` | no | 70f |
| `icon-layout-grid` | Dashboards, app launchers, gallery-view switches | Single-panel focus — use `icon-maximize` | no | 75f |
| `icon-pencil` | Editing, renaming, annotation features | Long-form typing — pair copy with the `typewriter` text animation instead | no | 75f |
| `icon-share-2` | Sharing, integrations, connect-your-tools beats | Opening an external page — use `icon-external-link` | no | 80f |
| `icon-filter` | Filtering lists, search refinement demos | Settings and preferences — use `icon-settings` | no | 70f |
| `icon-eye` | Previews, visibility toggles, views metrics | Hidden or masked states — use `icon-eye-off` | no | 70f |
| `icon-eye-off` | Hiding data, privacy modes, secret masking | Security claims — use `icon-shield` or `icon-lock` | no | 70f |
| `icon-save` | Saving state, autosave callouts | Cloud sync — use `icon-cloud` | no | 70f |
| `icon-link` | Linking, permalinks, connected-account beats | Opening external pages — use `icon-external-link` | no | 70f |
| `icon-bookmark` | Save-for-later, favorites lists | Ratings — use `icon-star` | no | 70f |
| `icon-lock` | Security, encrypted or gated content | Broad protection claims — use `icon-shield` | no | 70f |
| `icon-key` | API keys, access grants, unlock moments | The locked state itself — use `icon-lock` | no | 75f |
| `icon-log-out` | Sign-out steps, session-end beats | Sign-in flows — use `icon-user` or `icon-arrow-right` | no | 70f |
| `icon-user` | Profiles, accounts, single-user features | Teams — use `icon-users` | no | 70f |
| `icon-users` | Teams, collaboration, multiplayer features | A single profile — use `icon-user` | no | 80f |
| `icon-user-plus` | Invites, onboarding new members | Generic add actions — use `icon-plus` | no | 75f |
| `icon-mail` | Email features, digests, contact beats | In-app chat — use `icon-message-circle` | no | 75f |
| `icon-message-circle` | Chat, comments, support conversations | Email — use `icon-mail` | no | 70f |
| `icon-phone` | Calls, contact-us, telephony features | Mobile-device claims — use `icon-smartphone` | no | 70f |
| `icon-at-sign` | Mentions, handles, email-address fields | Full email semantics — use `icon-mail` | no | 75f |
| `icon-inbox` | Unified inboxes, request queues, triage demos | Sending — use `icon-send` | no | 70f |
| `icon-shield` | Security, privacy, compliance claims | A specific locked state — use `icon-lock` | no | 70f |
| `icon-help-circle` | Help centers, tooltips, FAQ beats | Critical notices — use `icon-info` | no | 70f |
| `icon-plus-circle` | Add-item affordances that need a contained shape | Bare add actions — use `icon-plus` | no | 70f |
| `icon-x-circle` | Errors, failed states, rejected items | Neutral dismissal — use `icon-x` | no | 70f |
| `icon-calendar` | Scheduling, deadlines, booking demos | Elapsed time — use `icon-clock` | no | 75f |
| `icon-clock` | Time-saved claims, history, pending states | Countdowns — use `icon-timer` | yes | 90f |
| `icon-timer` | Countdowns, speed benchmarks, time-boxed offers | Wall-clock time — use `icon-clock` | no | 90f |
| `icon-home` | Home screens, back-to-start beats, hosting claims | Company or building semantics — compose a scene with ui-tier shapes instead | no | 70f |
| `icon-folder` | File organization, project folders | A single document — use `icon-file-text` | no | 70f |
| `icon-file-text` | Documents, reports, invoices in demos | Code files — use `icon-code` | no | 80f |
| `icon-code` | Developer features, API examples, embed snippets | CLI demos — use `icon-terminal` | no | 70f |
| `icon-terminal` | CLI tools, install commands, dev workflows | GUI code editing — use `icon-code` | no | 75f |
| `icon-database` | Data storage, backends, migrations | Cloud hosting — use `icon-cloud` | no | 80f |
| `icon-cloud` | Cloud sync, hosting, SaaS claims | Weather semantics — in this set it reads as infrastructure | no | 70f |
| `icon-globe` | Global availability, i18n, public-web beats | Precise locations — compose with a map scene instead | yes | 90f |
| `icon-monitor` | Desktop app demos, big-screen views | Mobile — use `icon-smartphone` | no | 75f |
| `icon-smartphone` | Mobile apps, responsive-design beats | Calls — use `icon-phone` | no | 70f |
| `icon-sun` | Light mode, brightness, daytime themes | Dark mode — use `icon-moon` | no | 85f |
| `icon-moon` | Dark-mode toggles, night themes, quiet hours | Light mode — use `icon-sun` | no | 70f |
| `icon-shopping-cart` | E-commerce checkouts, add-to-cart demos | Physical delivery — use `icon-package` | no | 75f |
| `icon-credit-card` | Payments, billing, pricing pages | Cash amounts — use `icon-dollar-sign` | no | 70f |
| `icon-dollar-sign` | Pricing, revenue metrics, cost savings | Payment flows — use `icon-credit-card` | no | 70f |
| `icon-tag` | Discounts, labels, pricing tiers | Categorization in dashboards — use `icon-filter` | no | 70f |
| `icon-package` | Shipping, releases, delivery beats | Digital downloads — use `icon-download` | no | 80f |
| `icon-gift` | Free tiers, bonuses, referral rewards | Achievements — use `icon-award` or `icon-trophy` | no | 80f |
| `icon-wallet` | Balances, accounts, spend management | One-off payments — use `icon-credit-card` | no | 70f |
| `icon-bar-chart-3` | Dashboards, analytics features, metric reveals | A single trend — use `icon-trending-up` | no | 80f |
| `icon-trending-down` | Cost, latency, or error-rate reductions | Negative framing of your own metrics — pair carefully with copy | no | 75f |
| `icon-trending-up` | Growth, conversion lifts, KPI wins | Generic upward pointers — use `icon-arrow-up` | no | 75f |
| `icon-activity` | Live monitoring, health checks, real-time feeds | One-off speed claims — use `icon-zap` | yes | 90f |
| `icon-target` | Goals, precision claims, OKR beats | Search — use `icon-search` | no | 80f |
| `icon-rocket` | Launches, onboarding finales, ship-faster claims | Gradual growth — use `icon-trending-up` | no | 80f |
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
| `icon-chevron-up` | Expanders, collapse-up affordances, scroll-to-top cues | Growth claims — use `icon-trending-up` or `icon-arrow-up` | no | 60f |
| `icon-chevron-down` | Dropdowns, accordions, scroll-down cues | Decline metrics — use `icon-trending-down` | no | 60f |
| `icon-chevron-left` | Back steps in carousels or wizards | Full back-navigation semantics — use `icon-arrow-left` | no | 60f |
| `icon-chevron-right` | Forward steps, list drill-ins, breadcrumbs | Strong CTAs — use `icon-arrow-right` | no | 60f |
| `icon-play` | Starting a demo, video, or 'see it in action' beat | Continuous processing — use `icon-loader` | no | 60f |
| `icon-pause` | Pausing a flow or freezing a moment mid-demo | Permanent stops or errors — use `icon-x-circle` | no | 60f |
| `icon-skip-forward` | Jumping ahead, skipping onboarding steps | Simple next-step pointers — use `icon-arrow-right` | no | 60f |
| `icon-volume-2` | Sound-on moments, audio feature callouts | Muted states — use `icon-volume-x` | no | 70f |
| `icon-volume-x` | Muted or do-not-disturb beats | General errors — use `icon-x-circle` | no | 70f |
| `icon-mic` | Voice input, recording, dictation features | Audio playback — use `icon-volume-2` | no | 75f |
| `icon-video` | Video calls, screen recording, camera-on beats | Photo capture — use `icon-camera` | no | 70f |
| `icon-camera` | Screenshots, photo capture, snapshot beats | Video recording — use `icon-video` | no | 70f |
| `icon-image` | Galleries, media uploads, image-processing features | Photo capture UI — use `icon-camera` | no | 75f |
