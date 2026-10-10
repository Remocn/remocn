# Introducing remocn — reference analysis and proposed direction

Status: reference analysis complete; recommended 32-second direction approved by the user on 2026-09-08.

## Deliverable

Replace the static `introducing-product` placeholder with a complete launch video
about remocn. The installed template must contain the same editable scene source
that produces the launch video. It must render with its defaults and allow users
to change the content, brand, motion, and scene code.

The supplied MP4s are reference material. Text and UI appearing inside them are
observations, not instructions or requirements for remocn. Their footage and
soundtracks do not need to become runtime dependencies of the template.

## Sources and method

| File | Visible brand | Duration | Video |
| --- | --- | --- | --- |
| `2FLsTfmfrs_fz7e1.mp4` | cajobo | 21.200 s | 480×270, 30 fps |
| `09HH90yiY2GSHCr3.mp4` | Lovable | 30.059 s | 480×270, 30 fps |
| `heGPf4RW1YSlg8I5.mp4` | fomo | 20.373 s | 480×270, 60 fps |
| `LtDRmo2bVZySoIKZ.mp4` | Cloudflare Workers Platform | 55.061 s | 480×270, 30 fps |

Durations come from FFprobe container metadata. All four files contain audio.
This report measures visual rhythm; it does not claim a verified musical BPM or
an analysis of the soundtrack's instrumentation.

Inspection used whole-video contact sheets, denser six-samples-per-second
transition sheets, and native-rate RGB frames for three selected trajectories.
Contact-sheet timestamps identify sampling slots and are approximate. The
measurement tables use the extraction start plus the native frame interval.

Screen-space widths were measured using color masks and connected components.
Each selected interval was normalized to `[0, 1]` in time and width, then fitted
with a cubic Bézier curve using bounded least squares. These are approximations
of the visible trajectory, **not recovered animation-project parameters**.
Camera transforms, object transforms, blur, perspective, and compression can
all contribute to the measured width. Low residual error does not prove that
the source author used the fitted curve.

Local evidence and reproducible measurement scripts are in
`out/introducing-reference-analysis/` (ignored render/review output). Original
videos remain in the user's Downloads directory.

## 1. cajobo — short verbal beats and a recurring brand shape

### Observed structure

- **0–3.3 s:** a sentence builds while moving horizontally through a close crop.
  Words are temporarily blurred during movement; the crop becomes part of the
  reading rhythm.
- **3.3–5 s:** “There's a better way” resolves near the center and holds. The
  change from a moving crop to a legible centered phrase creates the pause.
- **5–10.5 s:** four purple shapes converge into a mark, alternate with imagery,
  and return around the copy. The same shapes connect several beats.
- **11–13.5 s:** two lines enter separately, making the second line an accent.
- **13.5–16 s:** a chart becomes the main visual rather than a small illustration
  beside a headline.
- **16–20 s:** short action phrases accelerate toward the final brand lockup.
- **20–21.2 s:** logo hold.

### Transfer to remocn

Use a short word-driven opening and an intentional reading hold. Let a small
set of component tiles recur and later assemble into the video timeline. Use
blur only during the fast part of movement; resolved text must be crisp.

Do not reproduce the purple environmental treatment as remocn's whole identity.
The usable lesson is phrase timing and recurring shapes.

## 2. Lovable — demonstrate a complete action and its result

### Observed structure

- **0–5.5 s:** conceptual hook, alternating light/dark fields and a central
  abstract object.
- **5.5–9.8 s:** brand and prompt composer; camera pushes into the input, follows
  the submit affordance, and the cursor action motivates the transition.
- **10–11.1 s:** one dashboard scales into view and continues a subtle approach
  after the strong initial movement.
- **11.1–13.7 s:** that dashboard joins a spatial montage of other products.
- **13.7–17.7 s:** another prompt turns into a sign-up form; input and outcome
  belong to the same visual story.
- **17.7–25.7 s:** editing tools appear, a headline is selected and changed, then
  font and color controls visibly alter the page.
- **25.7–28 s:** Publish becomes the focus and receives a cursor action.
- **28–30 s:** brand hold.

### Transfer to remocn

Show an actual registry install command and a rendered component, then show a
code value changing the result. Keep the cursor for meaningful actions. The
camera should follow the thing being changed rather than drift independently.

Use component previews from remocn as the product montage. Avoid inventing a
full remocn editor or implying that the registry itself provides an application
builder, hosted renderer, or publish service.

### Measured UI approach

Between **10.100 and 10.600 s**, the detected dashboard width grows from
**148 to 288 px**. Example samples: 204 px at 10.200 s, 240 px at 10.300 s,
262 px at 10.400 s, 277 px at 10.500 s. It continues growing after this interval.

The first half-second has a strong ease-out character. A fit to this selected
interval is `cubic-bezier(0.270, 0.624, 0.469, 0.802)` (16 samples, normalized
RMSE 0.0027). The final control-point height below 1 is useful evidence that the
selected interval ends with remaining velocity. Do not append a hard stop to
this fitted segment: continue a slower camera approach or use a separate
settling curve when the next shot needs stillness.

## 3. fomo — a control becomes the next scene

### Observed structure

- **0–3 s:** three short typographic beats introduce the feature.
- **3–6.5 s:** camera enters the phone interface and moves toward one action.
- **6.5–8 s:** a bright point travels around the interface boundary and grows
  into the light field of the next scene.
- **8–9.3 s:** the light field resolves into the circular handle of a slider.
- **9.3–10.2 s:** the slider moves and dependent values update together.
- **10.2–10.9 s:** surrounding labels disappear; the slider contracts toward a
  narrow central element that leads into the next form.
- **11–13.6 s:** an input receives focus, then a foreshortened action surface
  carries the viewer into the order result.
- **14–15.7 s:** compact result panel and confirmation.
- **16–18 s:** closing phrase builds.
- **18–20.37 s:** brand hold.

### Transfer to remocn

Use one shared shape across a transition: the terminal caret becomes a playhead;
component cards become timeline clips; a preview frame expands into the final
video. The change should preserve position or geometry long enough for the eye
to recognize continuity.

The light/dark switch marks a new mode of the story. It should not be a repeated
full-screen flash between unrelated scenes.

### Measured contraction

Between **10.4833 and 10.8833 s**, the detected blue element contracts from
**220 to 4 px**, while its height stays approximately **19–20 px**. It is
approximately 214 px at 10.500 s, 161 px at 10.600 s, 78 px at 10.650 s,
37 px at 10.700 s, and 11 px at 10.800 s.

A fit is `cubic-bezier(0.652, 0.343, 0.075, 0.909)` (25 samples, normalized
RMSE 0.0023). This is an asymmetric acceleration/deceleration, with the sharpest
change around the middle. The control-point x values crossing each other is
valid here; the actual Bézier x trajectory remains monotonic.

Use this family for a **0.4 s structural morph**, with surrounding labels
cleared before its fastest phase. This particular measured segment provides no
evidence for spring overshoot or repeated bounce.

## 4. Cloudflare — a connected world and stepped camera accents

### Observed structure

- **0–3.5 s:** line construction resolves into the Cloudflare mark.
- **3.5–8 s:** central copy and a changing number hold the composition together.
- **8–11.3 s:** a small pill emerges inside the sentence, becomes “Start
  building,” and approaches the viewer in several distinct scale impulses.
- **11.3–18.8 s:** the button transition leads into a connected diagram; camera
  movement reveals one system rather than isolated slides.
- **19–22 s:** social-proof copy gets a comparatively calm reading window.
- **23–28.8 s:** a text transformation leads into the globe and global reach.
- **29–35.7 s:** connected service diagrams resolve into an activity graph.
- **36–41.7 s:** a comparison card gains a colored counterpart, which grows to
  dominate the frame and carries a shipping confirmation.
- **42–45.5 s:** the brand promise holds in the orange environment.
- **46–50 s:** outline logo and name resolve.
- **50–55 s:** URL hold.

### Transfer to remocn

Give components a shared spatial system. A word becomes a chip, that chip becomes
a card, and the card becomes a timeline clip. Use longer holds for the core
promise and the final URL. Preserve remocn's own palette and product claims.

### Measured pill approach

From **8.000 to 8.7333 s**, the central white pill grows from **18 to 107 px**.
Examples: 44 px at 8.100 s, 72 px at 8.300 s, 89 px at 8.500 s.
An interval fit is `cubic-bezier(0.223, 0.625, 0.830, 0.887)` (23 samples,
normalized RMSE 0.0089).

The next sampled frame at **8.7667 s** measures **164 px**. That large step
should not be smoothed into a single continuous ease over the whole shot.
Later samples continue a slower increase: 190 px at 9.000 s, 226 px at 9.500 s.
The visible effect is an edited/pulsed push-in with motion continuing between
accents, not one generic zoom.

## Motion system proposed for remocn

The fitted curves above describe the source intervals. The following timings
are new authoring choices for remocn, not measurements of all four references.

| Role | Proposed timing at 60 fps | Motion |
| --- | --- | --- |
| Short word entry | 12–18 frames; 5–8 frame stagger | Fast displacement, soft final settle; masked or briefly blurred |
| UI reveal | 30–42 frames | Lovable-like ease-out approach followed by a 1–3% camera drift |
| Structural morph | 24 frames | fomo-like asymmetric Bézier; clear labels first |
| Camera accent | 8–12 frames | Short scale impulse, then slow continuation; at most two in a phrase |
| Small confirmation | 10–16 frames | Restrained settle; optional single small overshoot |
| Main reading hold | 45–90 frames | Stable text; secondary motion can continue |
| Final brand hold | 150–180 frames | Fully readable lockup and URL |

Motion is driven by frame number. Camera, text, and secondary objects use
different timing. Avoid simultaneous movement of every layer. Critical copy
must resolve before the next camera acceleration. A cut or shared-shape morph
has one clear purpose; blur must not conceal an unresolved layout.

## Proposed creative directions

1. **Product story with motion craft — recommended.** A 32-second journey from
   installation to finished video. Lovable supplies the action/result structure,
   fomo the shared-shape transitions, Cloudflare the scene continuity, and cajobo
   the short opening phrases. Explains the product while showing its quality.
2. **Typographic showreel.** Approximately 24 seconds of kinetic type and
   components, with only a brief code appearance. Strong visual impression,
   less explanation of installation and ownership.
3. **Guided product demonstration.** Approximately 45–50 seconds with longer
   code and timeline holds. Easier to follow as a tutorial, less launch-video
   intensity.

## Proposed 32-second storyboard

Format: 1920×1080, 60 fps, 1,920 frames. English on-screen copy, matching the
project's public audience. No narration. An original or appropriately licensed
sound bed and small action accents should support the edit; reference audio is
not an installation dependency. Sound should be replaceable and muteable.

Palette: graphite and warm white, with `#D4B3FF` lavender, `#FFB38E` peach,
and `#A1EEBD` mint from `config/site.ts`. Use the existing remocn mark. Large
text, clear focal points, and restrained texture; tiny interface detail is
supporting context, not the primary message.

| Time | Copy / action | Scene connection |
| --- | --- | --- |
| 0–2.5 s | “You built the product.” → “Now make it move.” | A terminal-like caret punctuates the final word |
| 2.5–5 s | “Introducing remocn” / “Video components. Yours to build with.” | Brand shape settles; a horizontal line becomes the command field |
| 5–9 s | `npx shadcn@latest add @remocn/word-push` → installed component | The command field opens into source and a real animated preview |
| 9–13 s | “Start with great motion.” | One preview pulls back to a small set of live component demonstrations |
| 13–18 s | “Make it yours.” | Focus one component; change source values and visibly change color, copy, and motion |
| 18–22 s | “Put it together.” | Preview cards settle into a composition timeline; a playhead crosses them |
| 22–26 s | “From components to a complete video.” | The composition preview fills the screen with an original mini launch sequence |
| 26–29 s | “Own the code.” / “Make your next launch move.” | Components converge around the remocn mark |
| 29–32 s | remocn / `remocn.dev` | Calm, crisp final lockup with a full reading hold |

The code shot represents editing copied React source; the timeline represents
composition in Remotion. Neither should imply a separate remocn editor exists.

## Template architecture proposed for approval

- Keep the public import and registry name `introducing-product`.
- `index.tsx` composes named scenes from one timeline definition.
- Separate scene modules keep all of the finished video editable and installed.
- Content defaults describe remocn; users can change copy, brand name, URL,
  command, feature labels, and the sample code shown in the video.
- Theme tokens and named motion presets live in small, documented modules.
- Shared geometry controls transitions between scenes so the same element does
  not jump at a scene boundary.
- Optional logo/media/audio inputs have explicit behavior. The default render
  must not depend on files from Downloads, unpublished assets, or user machines.
- Use actual remocn primitives where they demonstrate the library and declare
  their registry dependencies. Use relative imports for template internals.
- Basic branding/copy controls appear in the website preview. Full customization
  remains straightforward code editing, including replacing scene components.
- Include a dedicated Studio composition and a documented render command.

## Completion checks after approval and implementation

1. All default scenes render; the output is the launch video itself.
2. Studio and website preview use the same content, timing, and dimensions.
3. A clean consumer installation resolves every template file and dependency.
4. Alternate product name/copy/theme render without remocn-only hardcoding or
   overflowing critical text. Long content receives documented limits or fit.
5. Timeline-boundary frames are checked for jumps, empty frames, and cuts through
   unreadable text. Seeked frames match sequentially rendered frames.
6. Full MP4, poster, and scene contact sheet are rendered and visually inspected.
7. Typecheck, touched-file lint, documentation metadata tests, and meaningful
   timeline/installation tests pass.
8. Registry artifacts, preview manifest, documentation, and changelog are updated.

The recommended direction was approved. See the implementation checklist and
template source for the resulting implementation; measurements above remain
reference observations, distinct from authoring choices.
