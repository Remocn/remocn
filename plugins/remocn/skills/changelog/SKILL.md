---
name: changelog
description: >
  Turn a release into a short changelog video with remocn: collect what changed from git tags,
  commits or merged pull requests, write it as a few human-readable lines, and build the video with
  the changelog archetype. Use when the user wants a release, version or "what's new" video for a
  repository.
---

# Changelog video

Range or release: $ARGUMENTS

## 1. Collect what changed

Work out the range: the argument if given (`v1.4.0`, `v1.3.0..v1.4.0`, "last 2 weeks"), else from
the latest tag to `HEAD`, else the last 30 days.

- Tags: `git tag --sort=-creatordate | head -5`
- Commits: `git log --no-merges --pretty='%s' <from>..<to>`
- Merged pull requests, when the GitHub CLI is available:
  `gh pr list --state merged --search "merged:>=<date>" --json number,title,labels --limit 50`
- A `CHANGELOG.md` or release notes in the repo beat both. Prefer them when they cover the range.

## 2. Write the lines

The changelog archetype holds a version and a short list of changes. Video copy is not a commit log:

- Pick the 3–5 changes a user would notice. Drop chores, refactors, dependency bumps and CI.
- One line each, sentence case, under about 40 characters, starting with what the user gets
  ("Export to vertical video", not "feat(export): add 9:16 preset").
- Group into New / Improved / Fixed only when there are enough lines to need it.

If you collected the lines from the repo, show the version and the lines and wait for edits before
building. If the user gave the changes themselves, tidy the wording and go straight on: the
storyboard the `video` skill shows next is where they confirm it, so don't stop twice.

## 3. Build

Run the `video` skill with the brief "changelog video for <product> <version>", the archetype
`changelog`, and the approved lines as content. It plans the storyboard, installs, composes, checks the
render and offers the Remocn Studio hand-off.
