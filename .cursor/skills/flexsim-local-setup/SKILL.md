---
name: flexsim-local-setup
description: >-
  Checks and sets up the FlexSim Station Console local dev environment on Windows
  (Node.js, Docker Desktop, AWS SAM CLI, npm deps, DynamoDB Local). Use when the user
  asks to set up local dev, install prerequisites, verify the machine is ready, or
  troubleshoot missing tools for flexsim-station-console.
---

# FlexSim Station Console — Local Setup

## Quick commands

From the project root:

```powershell
npm run setup:check          # audit only — no changes
npm run setup:local          # install missing system tools + project setup
npm run setup:local:install  # winget install Node/Docker/SAM/Git only
npm run setup:local:project  # npm install, build, db:setup only
npm run dev                  # start API + frontend after setup passes
```

## When the user asks to set up or verify local dev

1. `cd` to the flexsim-station-console repo root.
2. Run `npm run setup:check` and read the report.
3. If anything is missing:
   - **System tools missing** → `npm run setup:local:install`, then tell the user to open a **new terminal**, start Docker Desktop if needed, and run `npm run setup:local:project`.
   - **Only project artifacts missing** (node_modules, sam-build, DynamoDB) → `npm run setup:local:project`.
   - **Everything missing on a fresh machine** → `npm run setup:local` (same two-step flow if winget installs run).
4. Re-run `npm run setup:check` until all required checks pass.
5. Start dev with `npm run dev` or separate `npm run api` + `npm run frontend`.

## Required components

| Check | Purpose |
|-------|---------|
| Node.js 18+ | npm scripts, esbuild, serve |
| npm | dependency install |
| Docker Desktop (running) | DynamoDB Local via `docker compose` |
| AWS SAM CLI | `sam local start-api` |
| `npm install` + `install:backend` | project dependencies |
| `npm run build` | SAM artifacts in `%LOCALAPPDATA%\flexsim-station-console\sam-build\` |
| `npm run db:setup` | DynamoDB container + `StationPlacements` table |

Optional: Git, winget (for automated installs).

## Windows / OneDrive rules (do not regress)

- **Never use `sam build`** in the OneDrive project path — use `npm run build` (`prepare-sam-build.cjs`).
- SAM local must use Docker network `flexsim-local` (configured in `scripts/start-api.cjs`).
- After winget installs SAM/Node, PATH updates require a **new terminal**.
- Use `curl.exe` in PowerShell smoke tests, not `curl`.

## Winget package IDs

- `OpenJS.NodeJS.LTS`
- `Docker.DockerDesktop`
- `Amazon.SAM-CLI`
- `Git.Git`

## Smoke test after setup

```powershell
npm run dev
# In another terminal after placing pieces and COMMIT in the UI:
curl.exe http://127.0.0.1:3000/placements/SESSION_CODE
```

## LAN sharing (optional)

After local setup works:

```powershell
npm run api:share
npm run frontend:share
powershell -ExecutionPolicy Bypass -File scripts/open-firewall.ps1
```

## Script locations

- Checker: `scripts/check-local-prereqs.cjs`
- Orchestrator: `scripts/setup-local-env.ps1`

For deeper context see `SESSION_CONTEXT.md`.
