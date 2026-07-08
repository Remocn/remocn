# Plan 003: Port the 17 vitest test files to bun:test so the render-pipeline tests actually run

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 361f442..HEAD -- app/api lib registry package.json`
> If any `__tests__` file changed since this plan was written, re-read it
> before porting; on structural mismatch with the excerpts below, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (Plan 002 helps but is not required)
- **Category**: tests
- **Planned at**: commit `361f442`, 2026-07-07

## Why this matters

The repo has 55 test files. 38 use `bun:test` and pass; 17 import from `"vitest"`, which is NOT in `package.json` — under `bun test` they fail or error out (`vi.mocked is not a function`, `importOriginal is not a function`). Current run: `2392 pass, 21 fail, 4 errors` in ~1.8s. The 17 broken files include ALL tests for the server render pipeline (`app/api/render`, `app/api/stargazers`, `lib/server/{rate-limit,validate-input,render-queue}`, `lib/github-stargazers`) — the repo's only stateful subsystem is effectively untested. There is also no `test` script. After this plan: one framework (`bun:test`), `bun test` fully green, `bun run test` exists, and Plans 005/006/007 (render-path changes) have a working safety net.

## Current state

The 17 vitest files:

```
app/api/stargazers/__tests__/route.test.ts
app/api/render/__tests__/route.test.ts
lib/server/__tests__/rate-limit.test.ts
lib/server/__tests__/validate-input.test.ts
lib/server/__tests__/render-queue.test.ts
lib/__tests__/github-stargazers.test.ts
registry/remocn-ui/caret/__tests__/caret.test.ts
registry/remocn/claude-code/__tests__/claude-code.test.ts
registry/remocn/v0/__tests__/v0.test.ts
registry/remocn/a1-product-demo/__tests__/a1-product-demo.test.ts
registry/remocn/chat-gpt/__tests__/chat-gpt.test.ts
registry/remocn/claude-chat/__tests__/claude-chat.test.ts
registry/remocn/confetti/__tests__/confetti.test.ts
registry/remocn/github-stars/__tests__/github-stars.test.ts
registry/remocn/x-followers-overview/__tests__/x-followers-overview.test.ts
registry/remocn/github-sponsors/__tests__/github-sponsors.test.ts
registry/remocn/opencode/__tests__/opencode.test.ts
```

Typical vitest idioms used (from `app/api/render/__tests__/route.test.ts:11-52`):

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/render-queue", () => ({
  enqueueRender: vi.fn(),
  getJob: vi.fn(),
}));
// imports of the module under test come AFTER the mocks
import { POST } from "@/app/api/render/route";
const mockEnqueue = vi.mocked(enqueueRender);
afterEach(() => { vi.clearAllMocks(); });
```

`app/api/stargazers/__tests__/route.test.ts:16` additionally uses the two-arg factory form `vi.mock(path, async (importOriginal) => ...)` (partial mock).

The bun:test house pattern to match — `registry/remocn-ui/tabs/__tests__/tabs.test.ts:1-10`:

```ts
import { describe, expect, it } from "bun:test";
import { type TabsState, tabsStyle, tabsStyleContext } from "../index";
```

vitest → bun:test mapping:

| vitest | bun:test |
|---|---|
| `import {...} from "vitest"` | `import {..., mock, spyOn, jest} from "bun:test"` |
| `vi.fn()` | `mock()` |
| `vi.mock(path, factory)` | `mock.module(path, factory)` — declare the `mock()` instances in module scope first, reference them in the factory, and keep the under-test imports after `mock.module` calls |
| `vi.mocked(x)` | unnecessary — use the module-scope mock instance directly |
| `vi.clearAllMocks()` | call `.mockClear()` on each module-scope mock instance in `afterEach` (bun also ships `jest.clearAllMocks()` from `"bun:test"` if preferred) |
| `vi.mock(path, async (importOriginal) => ({...await importOriginal(), x: mock()}))` | `mock.module(path, () => ({ ...require(path-literal), x: xMock }))` or an async factory with `await import()` — bun supports async factories |
| `vi.spyOn` | `spyOn` |
| `vi.useFakeTimers()/advanceTimersByTime` (check rate-limit/render-queue tests for these) | `jest.useFakeTimers()` from `"bun:test"`, or restructure around injected clocks — see STOP conditions |

Many of the 11 registry test files likely import only `describe/expect/it/vi.fn` — those ports are mechanical (change the import specifier, rename `vi.fn` → `mock`).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Full suite | `bun test 2>&1 \| tail -3` | `0 fail`, `0 errors`, ≥2413 pass |
| One file | `bun test app/api/render/__tests__/route.test.ts` | all pass |
| Baseline | (before starting) `bun test 2>&1 \| tail -3` | `2392 pass, 21 fail, 4 errors` |

## Scope

**In scope**:
- The 17 test files listed above (edit in place; do not rename)
- `package.json`: add `"test": "bun test"` to scripts; add `@types/bun` to devDependencies
- `tsconfig.json`: ONLY if Plan 002 already added the `"**/__tests__/**"` exclude — you may remove it once `bunx tsc --noEmit` is clean with tests included; otherwise leave tsconfig alone

**Out of scope**:
- The 38 existing `bun:test` files — already green; don't touch.
- Source files under test (`app/api/**`, `lib/**`, `registry/**` non-test code). If a test only passes by changing source, the test's expectation is wrong or you found a real bug — STOP and report the bug instead of "fixing" source.
- Adding vitest as a dependency — explicitly rejected; one framework only.

## Git workflow

Do NOT run any git write commands. The repo owner handles all git operations.

## Steps

### Step 1: Add tooling

Add `"test": "bun test"` to `package.json` scripts and `@types/bun` (latest) to devDependencies; run `bun install`.

**Verify**: `bun run test 2>&1 | tail -3` → same as baseline (`21 fail, 4 errors`).

### Step 2: Port the 11 registry test files (mechanical batch)

For each of the 11 `registry/**` files: change the import to `bun:test`, apply the mapping table. Most need only the import line changed.

**Verify after each file**: `bun test <path>` → all pass. After the batch: `bun test registry 2>&1 | tail -3` → 0 fail.

### Step 3: Port the 4 lib test files

`lib/server/__tests__/{rate-limit,validate-input,render-queue}.test.ts` and `lib/__tests__/github-stargazers.test.ts`. `validate-input.test.ts` is likely mock-free (pure parser). `render-queue.test.ts` and `github-stargazers.test.ts` use `vi.mock` module factories — apply the `mock.module` pattern. Watch for fake timers in rate-limit/render-queue.

**Verify**: `bun test lib 2>&1 | tail -3` → 0 fail.

### Step 4: Port the 2 API route test files

`app/api/render/__tests__/route.test.ts` (excerpted above) and `app/api/stargazers/__tests__/route.test.ts` (uses `importOriginal` — partial-mock pattern).

**Verify**: `bun test app/api 2>&1 | tail -3` → 0 fail.

### Step 5: Full-suite gate

**Verify**: `bun run test 2>&1 | tail -3` → `0 fail, 0 errors`, total pass count ≥ 2413 (baseline 2392 passing + the ~21 currently failing). `grep -rln 'from "vitest"' app lib registry components` → no output.

## Test plan

This plan IS the test plan. Additional requirement: no test may be deleted or `.skip`-ed to get green — the ported file must assert the same behaviors as the vitest original. If an assertion cannot be expressed in bun:test, STOP and report it.

## Done criteria

- [ ] `grep -rln 'from "vitest"'` across `app lib registry components` → empty
- [ ] `bun run test` exits 0 with ≥2413 passing, 0 fail, 0 errors
- [ ] No `.skip`/`.todo` introduced (`git diff | grep -c "\.skip\|\.todo"` → 0)
- [ ] No source (non-test) files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- A test needs a vitest capability with no bun:test equivalent after consulting https://bun.com/docs/test/writing (e.g. specific fake-timer semantics `mock.module` can't replicate).
- A ported test fails in a way that indicates a REAL bug in the source under test — report the bug with the failing assertion; do not adjust the expectation to match broken behavior.
- `mock.module` leaks between test FILES (bun isolates per file, but if cross-file interference appears, report rather than reordering tests).

## Maintenance notes

- Plans 005 (rate-limit), 006 (job eviction), and 007 (SSRF allowlist) modify `lib/server/*` and extend these exact test files — land this plan first.
- Plan 010 (CI) runs `bun run test` as a gate — keep the script name `test`.
- Follow-up deferred: once green, remove `"**/__tests__/**"` from tsconfig `exclude` (if Plan 002 added it) so tests are typechecked; requires `@types/bun` (added here).
