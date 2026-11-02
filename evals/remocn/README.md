# remocn plugin evals

Run from the repo root with `claude plugin eval .` (Claude Code 2.1.269+). The suite lives outside
`plugins/remocn/` on purpose: the plugin folder is what users install and what Anthropic's directory
scans, so fixtures and scaffold scripts stay out of it. Each case loads the plugin through
`plugins: ["../../../plugins/remocn"]` in its `prompt.md`.

Every case runs in an empty workspace, so cases carry their brief in the prompt and their fixtures in
`resources/`.

| Tag | Cases | What it checks |
|---|---|---|
| `storyboard` | `storyboard-<archetype>`, one per archetype | The plugin's skill fires on a natural brief, a storyboard comes back in the shared table format, the archetype is right, the planned frames land within ±10% of the brief, and nothing is built before the user confirms |
| `trigger` | `remotion-api-question` | A plain Remotion API question does not load any remocn skill (coexistence with the Remotion skills) |
| `review` | `scene-review-fixtures` | The `scene-reviewer` agent catches a clipped headline and an empty frame in two prepared stills. Its scaffold copies them into the workspace, so it needs `--scaffold` |

```bash
# Everything, as CI runs it (.github/workflows/plugin.yml)
claude plugin eval . --trust-plugin --scaffold --runs 1 --ablation none \
  --model sonnet --allow-tools "WebFetch(domain:remocn.dev)"

# The full comparison against no plugin, three runs per case: about $25
claude plugin eval . --scaffold --allow-tools "WebFetch(domain:remocn.dev)"

# One case, one run, no baseline: quick while editing a skill
claude plugin eval . --case storyboard-changelog --runs 1 --ablation none \
  --allow-tools "WebFetch(domain:remocn.dev)"
```

Storyboard cases read the live catalog at remocn.dev, so a component renamed in the registry shows
up here as a failing case. Typechecking and rendering a full project is out of scope for these
cases: a run can't install npm packages inside the eval sandbox in reasonable time. That path is
covered by building a video with `/remocn:video` by hand before a release.
