# Staging checks repair

## Goal

Make the checks defined by `.github/workflows/ci.yml` pass on `staging`, without broad refactors or unrelated behavior changes.

## Approach

Treat existing focused tests as the behavioral contract. Repair production implementations when they diverge from that contract. Change a test only when inspection shows that it encodes an obsolete API or is isolated incorrectly. Keep lint-warning cleanup out of scope because Biome currently exits successfully and those warnings are unrelated to the failing CI checks.

## Verification

Run lint, typecheck, the full Bun test suite, registry consistency, and the production Next.js build. Review the resulting diff, commit the repair, and push the local `staging` branch to `origin/staging`.
