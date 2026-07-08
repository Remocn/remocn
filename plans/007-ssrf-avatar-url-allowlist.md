# Plan 007: Restrict render avatarUrl to GitHub avatar hosts (close the SSRF window)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 361f442..HEAD -- lib/server/validate-input.ts "app/(home)/stars"`
> On any drift, compare the excerpts below against live code; mismatch = STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/003-port-vitest-tests-to-bun.md
- **Category**: security
- **Planned at**: commit `361f442`, 2026-07-07

## Why this matters

`POST /api/render` accepts up to 60 stargazer objects whose `avatarUrl` is validated only against `/^https?:\/\//i`. Those URLs are passed as inputProps into a server-side headless Chromium render, which fetches each one from the server's network position. An attacker can submit `http://127.0.0.1:<port>/...`, `http://10.x.x.x/...`, `http://[::1]/...`, or `http://169.254.169.254/...` (cloud metadata) and get the render box to issue internal requests — blind SSRF usable for internal port probing and state-changing GETs. The module's own comment claims the http(s) check "narrows the SSRF surface"; it does not block private ranges. In legitimate use these URLs are ALWAYS GitHub avatar URLs (the client tool builds them from the GitHub API), so a strict host allowlist loses nothing.

## Current state

`lib/server/validate-input.ts:52` — `const HTTP_URL = /^https?:\/\//i;`

`lib/server/validate-input.ts:94-103` (inside `parseStargazer`):

```ts
  const avatarUrl = requireString(
    value.avatarUrl,
    `stargazers[${index}].avatarUrl`,
    MAX_AVATAR_URL_LEN,
  );
  if (!HTTP_URL.test(avatarUrl)) {
    throw new RenderInputError(
      `stargazers[${index}].avatarUrl must be an http(s) URL`,
    );
  }
```

Errors throw `RenderInputError` (status 400) — defined at lines 33-39. The file's limit constants live in a `--- Limits ---` block (lines 41-49).

Where legit avatarUrls come from: the stars tool fetches stargazers from the GitHub API (`lib/github-stargazers.ts`); GitHub avatar URLs are `https://avatars.githubusercontent.com/u/<id>?v=4`. Confirm the client payload shape in `app/(home)/stars/` (grep `avatarUrl`) before finalizing the allowlist — if any test fixture or client path uses a different GitHub host, include it.

Consumption path (why this is server-side fetch): `app/api/render/route.ts` → `enqueueRender` → `lib/server/render.ts:64-87` `selectComposition`/`renderMedia` with `inputProps` — the `github-stars` composition renders `<img>`/Remotion `Img` tags with these URLs inside headless Chromium on the server.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Focused tests | `bun test lib/server/__tests__/validate-input.test.ts` | all pass |
| Full suite | `bun run test 2>&1 \| tail -3` | 0 fail |
| Typecheck | `bunx tsc --noEmit` | no new errors |

## Scope

**In scope**:
- `lib/server/validate-input.ts`
- `lib/server/__tests__/validate-input.test.ts` (extend)

**Out of scope**:
- Network-layer egress controls (firewall rules on the box) — recommend to the owner in the PR text, but not code here.
- The stars-tool client (`app/(home)/stars/**`) — it already sends GitHub URLs; read it for confirmation only.
- Generic IP-range denylisting/DNS-rebinding defenses — unnecessary once the host is pinned to GitHub's fixed domain, and easy to get wrong.

## Git workflow

Do NOT run any git write commands. The repo owner handles all git operations.

## Steps

### Step 1: Confirm the legitimate host set

`grep -rn "avatar" app/\(home\)/stars lib/github-stargazers.ts --include='*.ts' --include='*.tsx' | grep -i "url\|githubusercontent"` — identify every host the client can legitimately produce. Expected: only `avatars.githubusercontent.com`. If you find others (e.g. `github.com` redirect forms), add them to the allowlist in Step 2 and record them in the PR notes.

**Verify**: you can name the exact host list with file:line evidence.

### Step 2: Enforce the allowlist in `parseStargazer`

In `lib/server/validate-input.ts`:
- Add a constant in the Limits block: `const ALLOWED_AVATAR_HOSTS = new Set(["avatars.githubusercontent.com"]);` (plus any Step-1 additions).
- Replace the `HTTP_URL.test` check with: parse via `new URL(avatarUrl)` inside try/catch (catch → `RenderInputError` "must be a valid URL"); require `url.protocol === "https:"`; require `ALLOWED_AVATAR_HOSTS.has(url.hostname)`; on failure throw `RenderInputError` with message naming the field and stating only GitHub avatar URLs are accepted.
- Remove the now-unused `HTTP_URL` constant.
- Update the module doc comment's SSRF sentence (lines 7-9) to describe the allowlist instead of the http(s)-only claim.

Note `https:` only — dropping plain `http:` is intentional; GitHub avatars are always https.

**Verify**: `bunx tsc --noEmit` → no new errors; `grep -n "HTTP_URL" lib/server/validate-input.ts` → no matches.

### Step 3: Extend the tests

In `lib/server/__tests__/validate-input.test.ts` add cases (follow the file's existing invalid-input test structure):
- accepts `https://avatars.githubusercontent.com/u/1?v=4`
- rejects `http://avatars.githubusercontent.com/u/1` (http downgrade)
- rejects `https://evil.example.com/a.png`
- rejects `http://127.0.0.1:8080/x`, `http://169.254.169.254/latest/meta-data`, `https://[::1]/x`
- rejects `not a url` and `https://` (URL-parse failures) with a 400 `RenderInputError`
- host check is exact (`https://avatars.githubusercontent.com.evil.com/x` rejected)

**Verify**: `bun test lib/server/__tests__/validate-input.test.ts` → all pass incl. ≥7 new.

### Step 4: Full gate

**Verify**: `bun run test 2>&1 | tail -3` → 0 fail. `bun run build` → exit 0.

## Test plan

Covered in Step 3; model after the existing rejection tests in `validate-input.test.ts` (post-Plan-003 version).

## Done criteria

- [ ] `parseStargazer` rejects any non-GitHub-avatar host with a 400
- [ ] The subdomain-suffix spoof test passes (exact hostname match)
- [ ] Module comment no longer claims http(s)-only "narrows SSRF"
- [ ] `bun run test` → 0 fail; no new tsc errors
- [ ] `plans/README.md` status row updated

## STOP conditions

- Step 1 reveals a legitimate avatar source that is NOT a fixed, enumerable host (e.g. user-supplied custom avatars) — the allowlist design breaks; report instead of shipping a half-open list.
- Existing tests assert that arbitrary http URLs are accepted as valid (a deliberate contract) — report the conflict; do not silently change contract + test together without flagging it.

## Maintenance notes

- If the render tool ever accepts non-GitHub repos/avatars (GitLab support etc.), extend `ALLOWED_AVATAR_HOSTS` — never revert to a protocol-only check.
- Defense in depth the owner should consider at the infra layer: egress firewall on the render box blocking RFC1918 + link-local from the Chromium process.
- Reviewer: confirm the error message doesn't echo the submitted URL back verbatim into the response (keep it generic; the field index is enough).
