# Agent working agreement

## Read first

- Read `docs/production/status.md`, then the assigned task. Use `docs/README.md` to load relevant documents only.
- Product source of truth: `docs/product/plan.md` (v0.3); implementation decisions: `docs/decisions/README.md`.
- Latest explicit user direction overrides repository guidance. Do not revive superseded requirements.

## Product priorities

- Make a fun Korean PC-bang owner experience with believable investment and service decisions.
- Preserve real product/game names and the 2026-01-01 Korean price reference; label unverified values.
- Do not require exhaustive SKU archives, BIOS accuracy, photogrammetry, or real game execution before gameplay.
- Target realistic materials, scale, lighting and motion with measured browser performance.
- Start from zero seats and no owned equipment; buy and install the first counter/seat. Grow the same game: 0→12→24 seats / seven days first; 60 seats later.

## Current commands

- `python3 scripts/check_docs.py`: local documentation and JSON checks; Python 3.10+, standard library only.
- `git diff --check`: whitespace check.
- Node 24.19.0 (`.nvmrc`), `npm ci` installs the exact lockfile.
- `npm run dev`: Vite; open `/pc-cafe-simulator/`.
- `npm run build`: TypeScript check and production build; `npm run preview`: serve that build.
- `npm run lint`: ESLint including sim dependency restrictions; `npm test`: clock/state/collision/customer/settlement checks.
- `npx playwright install --with-deps chromium`, then `npm run test:e2e`: BASIC-12 and FIRST-SALE production browser checks.
- `?debug=1` exposes read-only `window.__cafe.read()` and scene reset. See current status for actual browser results.
- Do not report planned commands, CI, remote upload, browser tests, FPS, or playtests as completed.

## Architecture

- `src/sim` will own serializable game state and rules. No Three.js, React, DOM, wall clock, or unseeded randomness there.
- Renderer/UI submit commands; they do not directly edit money, seats, orders or customer decisions.
- Save data has a version and explicit migration path. Graphics settings must not change economic outcomes.
- Prefer a small modular monolith. Add dependencies or abstraction only for an actual feature.
- Exact contracts and performance targets live in architecture and quality docs.

## Work and evidence

- Inspect Git status before editing. Preserve unrelated user changes.
- Use a task branch. Own one reviewable player-facing change at a time.
- A task may proceed autonomously within existing authorization; do not add routine confirmation gates.
- Do not start or assign additional agents unless explicitly authorized. Roles in the workflow are responsibilities, not a command to spawn agents.
- Prefer risk-based tests: money, seats, orders, time and saves need meaningful checks. Reversible copy/art adjustments do not need implementation-mirroring tests.
- For visible changes, run the game in a browser, exercise the flow and inspect screenshots. Automated interaction cannot certify fun.
- Keep implementation and review findings distinct. If only self-review happened, say so.
- Do not weaken acceptance criteria or skip a failing check to call a task done; record a reasoned scope change openly.
- Finish with actual changes, checks, limitations and the next actionable step. Update status and the affected canonical document only.

## GitHub and assets

- Use available authenticated GitHub operations. Missing tools are a capability limit, not permission to extract credentials or bypass controls.
- Create PRs when authorized by the task. Merge/publish according to session authorization and configured repository rules; never force-push shared history or change visibility by assumption.
- Never put credentials in source, screenshots or logs. The shipped game needs no AI API key.
- Use original or appropriately licensed runtime assets; references are not redistribution rights.
- Store large art sources and reproducible export metadata according to `docs/art/pipeline.md`.
