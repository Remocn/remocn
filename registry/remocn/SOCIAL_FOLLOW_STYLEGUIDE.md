# Social Follow-Card Style Guide

**Status:** Author-facing contract for the `*-follow-card` family. Never shipped to users; lives beside sources as the reference implementation. New cards reference this guide + copy the folder structure.

---

## 1. Shared Anatomy

All follow-card variants render 9 layers in this fixed order:

1. **Cover** — full-width background image (fallback: accent-color gradient)
2. **Avatar** — square profile picture, overlaid bottom-left
3. **Name + Verified** — large text, with optional verification badge
4. **@Handle** — smaller secondary text, muted color
5. **Bio** — multi-line description, muted color
6. **Meta Row** — location · website · joined, small gray text
7. **Button Row** — two buttons: Follow + Message (custom 2-state Follow, standard Message)
8. **Tabs** — Posts (active), Media, Likes (inactive tabs, no interaction in v1)
9. **Sample Post** — hardcoded single post with avatar, timestamp, text (no fetch in v1)

Each layer has an entrance animation (see timeline below). The card is centered in the viewport with a spring bounce-in transform.

---

## 2. Timeline Budget

**Total duration:** 165 frames @ 30fps (5.5 seconds).

| Phase | Frames | Action |
|-------|--------|--------|
| Bounce-in | 0–25 | Card enters: `translateY` +60→0, `scale` 0.9→1 (spring overshoot) |
| Staggered blur-in | 20–70 | 9 layers enter with staggered blur + opacity + translateY (each group offset ~5–6 frames) |
| Cursor travel | 75–~110 | Cursor pointer moves to Follow button, no interaction |
| Click + Flip | ~110 | Cursor clicks; button flips from "Follow" (solid accent) → "Following" (white bg, gray border, black text) |
| Hold | 130–165 | Card holds in final state |

**Critical rule: Click must fit the budget**

The follow state transition (click → flip) must complete **before** frame 165. To guarantee this:
- Define a shared `CLICK_FRAME ≈ 110` constant (exact frame where cursor clicks and button state flips)
- Cap `speed` slider to `min: 1` in `registry/__index__.tsx`
- Verify at build time: `CLICK_FRAME / speed_min ≤ durationInFrames` → `110 / 1 ≤ 165` ✓

At `speed < 1`, the animation slows but `frame * speed` may never reach `CLICK_FRAME`, leaving the button stuck as "Follow". Always enforce `min: 1`.

---

## 3. Control-Naming Contract

All follow-card variants expose **identical control keys** for portability across networks:

**Profile data (all string except verified):**
- `name` — display name
- `handle` — @username (without @)
- `bio` — multi-line description
- `location` — city/region (optional)
- `website` — link URL (optional)
- `joined` — date string (e.g. "Joined March 2023")
- `avatarUrl` — image URL (defaults to `""` → gradient fallback)
- `coverUrl` — image URL (defaults to `""` → gradient fallback)
- `verified` — boolean (default: `true`)

**Theming & interaction:**
- `accentColor` — brand color (hex, default per network; e.g. `"#1d9bf0"` for X)
- `theme` — `"light"` | `"dark"` (default: `"light"`)
- `background` — `"surface"` | `"transparent"` (default: `"surface"`)
- `orientation` — `"horizontal"` | `"vertical"` (default: `"horizontal"`)

**Animation (shared across all compositions):**
- `speed` — speed multiplier (default: `1`, min: `1`)

**NOT controls:**
- Sample post content is **hardcoded** — do not expose as controls in v1. The post text, timestamp, and engagement counts are baked into the component.

---

## 4. Theming Tokens

Define a `THEMES` object mapping theme name → token set:

```typescript
type Theme = {
  cardBg: string;        // Background of the card itself
  cardBorder: string;    // Border color (1px)
  fg: string;            // Foreground (primary text)
  fgMuted: string;       // Secondary text (handle, bio, meta)
  divider: string;       // Horizontal lines
};

const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    cardBg: "#ffffff",
    cardBorder: "#e1e8ed",
    fg: "#000000",
    fgMuted: "#657786",
    divider: "#e1e8ed",
  },
  dark: {
    cardBg: "#15202b",
    cardBorder: "#38444d",
    fg: "#ffffff",
    fgMuted: "#8899a6",
    divider: "#38444d",
  },
};
```

**`accentColor` is a separate axis** — it does NOT depend on theme. Pass it independently and apply it to:
- Follow button fill (solid, before click)
- Verification badge (if present)
- Links (optional)
- Cover gradient (if no image)
- Cursor ripple (render `rippleColor={accentColor}`)

---

## 5. Cursor + Custom Button Interaction

The follow card is the first remocn composition using an interactive cursor and custom button state.

### Cursor placement & coordinate space
- Mount the `<Cursor>` component **inside the scaled card ref-stage** (same parent as the `Card`, both children of a centered transform container)
- Both the card and cursor share the same coordinate space: ref-stage pixels
- Do NOT use unscaled pixels (avoid signup-flow's pattern); instead, derive the cursor's target from a shared `BUTTON_LAYOUT` constant
- `BUTTON_LAYOUT` contains the button center in ref-pixels for each orientation

### Button interaction
- Define a pure helper `followStateAt(frame: number, speed: number): boolean` that returns `true` once `frame * speed >= CLICK_FRAME`
- Before the click: button text = "Follow", background = `accentColor` (solid), text = white
- After the click: button text = "Following", background = white, border = 1px gray, text = black
- **No chevron, no checkmark** — state is text-only

### Cursor styling
- Render: `<Cursor variant="pointer" mode={theme} rippleColor={accentColor} style={useCursorPath(...)} />`
- The ripple animates at the exact `CLICK_FRAME` and should land **on the Follow button** in both horizontal and vertical orientations
- Use a shared `buildFollowWaypoints()` helper to compute cursor waypoints, ensuring the click waypoint targets the button center

---

## 6. Per-Network Reference Table

**Author-time verification note:** The values below are starting points extracted from each platform's public profiles. Before shipping a new *-follow-card, confirm accent color, badge style, button labels, and secondary action against a live profile on the target network.

| Network | Accent | Badge | Primary Button | Secondary |
|---------|--------|-------|---|---|
| **X** | `#1d9bf0` | Seal (✓) | Follow→Following | Message |
| **Instagram** | `#E1306C` | Seal (✓) | Follow→Following (chevron) | Message |
| **LinkedIn** | `#0A66C2` | None | Connect→Pending¹ | Message |
| **GitHub** | `#1f2328` or accent | None | Follow→Following | Sponsor |
| **YouTube** | `#FF0000` | Check (✓) | Subscribe→Subscribed | Join |
| **TikTok** | `#FE2C55` | Check (✓) | Follow→Following | Message |

¹ **LinkedIn footnote:** "Connect→Pending" applies to personal profiles. Creator and company profiles use "Follow→Following" instead. Confirm against the target profile type at authoring time.

---

## 7. Offline-Default Rule

The card must render **without network requests**. Define these fallbacks:

- **`avatarUrl` default:** empty string `""` → render a gradient block (e.g. linear-gradient using accentColor)
- **`coverUrl` default:** empty string `""` → render a solid gradient or pattern
- **Provided URLs:** render via `<Img src={url} crossOrigin="anonymous" onError={fallback} />`

This ensures:
1. The docs preview works on page load (no CORS, no async fetch)
2. Headless MP4 export via `@remotion/renderer` works without external resources
3. Users can test offline in development

---

## 8. Registry Dependencies & Import Constraints

The follow-card imports two remocn primitives:

```typescript
import { Cursor } from "@/components/remocn/cursor";
import { useCursorPath } from "@/components/remocn/use-cursor-path";
```

**In `registry/remocn/registry.json`:**
```json
{
  "dependencies": ["remotion", "@remotion/google-fonts"],
  "registryDependencies": ["@remocn/cursor"],
  "files": [{ "path": "x-follow-card/index.tsx", "target": "components/remocn/x-follow-card.tsx" }]
}
```

The cursor primitive is a **registryDependency** (shipped via `npx shadcn add`). The `useCursorPath` hook resolves transitively via the cursor's own registry definition.

**Constraint:** The tsconfig.json `@/components/remocn/*` glob matches single-segment paths only. Do NOT import deeper siblings like `use-cursor-path/helpers`. Instead, `useCursorPath` and `Cursor` are the public API surfaces; anything deeper belongs inside their modules, not in the follow-card's source.

---

## 9. Architecture & Extraction Seam ADR

**Decision:** v1 ships as a single-file `index.tsx` with 5 exported helper functions and a shared `CLICK_FRAME` constant. This is the designated **extraction seam** for the follow-card family.

**Exported pure helpers (unit-testable):**
1. `cardBounceIn(frame: number, fps: number)` → `{ translateY: number; scale: number }` — spring entrance over frames 0–25
2. `blurInSchedule()` → `BlurInStep[]` — returns 9 ordered groups (one per anatomy layer) with entry frame ranges within [20, 70]
3. `blurInAt(step: BlurInStep, frame: number)` → `{ blur: number; opacity: number; translateY: number }` — interpolates a single layer's entrance
4. `followStateAt(frame: number, speed: number)` → `boolean` — true once `frame * speed >= CLICK_FRAME`
5. `buildFollowWaypoints(opts: { buttonCenter: { x: number; y: number }; orientation: "horizontal" | "vertical" })` → `CursorWaypoint[]` — cursor path to the button

**Shared constant:**
- `CLICK_FRAME: number ≈ 110` — frame at which cursor clicks and button state flips; used by helpers 4 & 5

**Why extract at card #2 (not v1):**
- v1 lowest risk: proven pattern from github-stars, single source of truth in Markdown (this guide)
- Extraction is pre-declared, so when Instagram (card #2) is built, the seam is explicit: copy-paste the folder, then move the 5 helpers + `CLICK_FRAME` to a new `@/lib/remocn-ui/social/index.ts` module
- Until extraction, the 6 author-events (name, handle, bio, etc.) cannot be enforced by TypeScript — Markdown documents the invariants, but only a shared module can make them unbreakable

---

## 10. Copy-Paste Checklist for the Next Follow-Card

When building a new *-follow-card variant (e.g., Instagram):

1. **STOP if card #2 (Instagram):** extract the 5 helpers + `CLICK_FRAME` from X's `index.tsx` into `@/lib/remocn-ui/social/index.ts` **first**. Then proceed with step 2 using the extracted module.

2. **Copy the folder:** duplicate `registry/remocn/x-follow-card/` → `registry/remocn/<network>-follow-card/`.

3. **Update component metadata:**
   - Rename `XFollowCard` → `{Network}FollowCard` (e.g., `InstagramFollowCard`)
   - Update `componentName` in `config.ts`
   - Update imports in `registry/__index__.tsx`

4. **Apply network-specific theming:**
   - Swap `accentColor` default (e.g., `#E1306C` for Instagram)
   - Update verification badge style (seal vs. check vs. none)
   - Update button labels (e.g., Instagram's Follow button shows a chevron in the "Following" state)
   - Update secondary action label

5. **Mount cursor inside scaled stage:** Ensure `<CursorLayer>` renders as a sibling of `<Card>` inside the same scaled ref-stage parent, **not** elsewhere.

6. **Derive buttonCenter from shared BUTTON_LAYOUT:** Define a `BUTTON_LAYOUT` constant per orientation and pass it to `buildFollowWaypoints()`. Verify the ripple lands on the button in both orientations before shipping.

7. **Add speed min:1 override:** Mirror the `github-stars` pattern in `registry/__index__.tsx`.

8. **Keep control keys identical:** Do NOT rename or reorder the 13 control keys (name, handle, bio, avatarUrl, coverUrl, location, website, joined, verified, accentColor, theme, background, orientation). Network-specific differences (like button labels) go in the helper text or component comments, not in the control shape.

9. **Registry dependencies:** `registryDependencies: ["@remocn/cursor"]`, `dependencies: ["remotion", "@remotion/google-fonts"]`. Ship only `index.tsx` in files[].

10. **Avoid deeper sibling imports:** Do not import `use-cursor-path/helpers` or other `@/components/remocn/*` modules at a depth > 1 segment. The tsconfig glob does not resolve them.

11. **Timeline budget:** Preserve the 165-frame, 0–110 CLICK_FRAME timeline. If a network requires a different animation pace, adjust via the exported helpers or phase offsets, but keep `CLICK_FRAME` and the envelope (0–165f) fixed.

12. **Offline defaults:** Test that avatarUrl="" and coverUrl="" render gradient fallbacks, not network errors. Verify headless MP4 export works.

13. **Documentation:** Create `content/docs/social/<network>-follow-card.mdx` (unquoted YAML frontmatter, no colon-space in title/description), add to `content/docs/social/meta.json`, add to grid in `content/docs/social/index.mdx`, add to `NEW_BADGE_PATHS` in `config/site.ts`.

14. **Unit tests:** If extraction happened at step 1, add tests for the shared helpers (cardBounceIn, blurInSchedule, etc.). v1 tests are optional; v2+ tests are load-bearing.

---

## Reference Implementation

See `registry/remocn/x-follow-card/index.tsx` for the canonical example of:
- The 5 exported helpers and `CLICK_FRAME` constant
- `THEMES` and per-orientation `BUTTON_LAYOUT` definitions
- Cursor mounted inside the scaled ref-stage
- Offline-default fallbacks for avatarUrl and coverUrl
- No deeper sibling imports (only `Cursor` and `useCursorPath` from remocn-ui)
