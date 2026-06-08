# Agent Handoff — FlexSim Station Console

**Read this first.** Compact context for continuing work without prior chat history.

## Project

| Item | Value |
|------|--------|
| **Purpose** | Web station console → Pi-compatible JSON for FlexSim (`reader_0`–`reader_6`) |
| **Path** | `C:\Users\lightfj\OneDrive - Autodesk\Projects\flexsim-station-console` |
| **PRD** | `prd.md` |
| **GitHub** | https://github.com/jasonic8-adsk/flexsim-station-console (private; user account — transfer to `Autodesk-FlexSim` org when available) |
| **Branch** | `main` |
| **Initial commit** | `e59cb0d` |

## Architecture

```
Browser → frontend/ (static) → API Gateway (SAM local or AWS)
  POST /sessions → createSession Lambda
  PUT  /placements/{code} → putPlacements → DynamoDB (versioned)
  GET  /placements/{code} → getPlacements → latest version
```

- **Stack:** TypeScript Lambdas (esbuild bundle), vanilla JS frontend, DynamoDB, SAM.
- **No auth** v1. Session codes: 6 chars, `ABCDEFGHJKMNPQRSTUVWXYZ23456789`.
- **JSON:** `{ timestamp: "YYYY-MM-DDTHH:mm:ss.SSSSSS", readings: { reader_0..6 } }` — see `prd.md`.

## Repo layout (important files)

| Path | Role |
|------|------|
| `template.yaml` | SAM: 3 Lambdas, DynamoDB table, `AllowedOrigin` param |
| `backend/src/handlers/*.ts` | API handlers |
| `backend/src/lib/` | validation, dynamodb, response, sessionCode |
| `backend/scripts/bundle.mjs` | esbuild → `backend/dist/*.js` |
| `scripts/prepare-sam-build.cjs` | **Local “build”** — bundles + copies to `%LOCALAPPDATA%\flexsim-station-console\sam-build\` (avoids `sam build` on OneDrive) |
| `scripts/start-api.cjs` | SAM local; auto-build if missing; uses `flexsim-local` Docker network |
| `scripts/run-sam.cjs` | Windows-safe SAM invocation (quoted paths, `cmd /c` for `sam.cmd`) |
| `frontend/app.js` | UI; loads `config.json` for `apiBase`; `?api=` override |
| `frontend/config.json` | Local default `http://127.0.0.1:3000` (not overwritten by deploy) |
| `env.local.json` | SAM local env: `DYNAMODB_ENDPOINT=http://dynamodb:8000`, `TABLE_NAME=StationPlacements` |
| `docker-compose.yml` | DynamoDB Local on 8000, network `flexsim-local` |
| `infra/frontend.yaml` | S3 + CloudFront for production UI |
| `DEPLOYMENT.md` | Full AWS deploy guide |
| `deploy.env.example` | Copy → `deploy.env` (gitignored) |

## Local dev (verified working May 2026)

**Prerequisites:** Node.js, Docker Desktop, SAM CLI, Git. Refresh PATH in new terminals if commands missing.

```powershell
cd "C:\Users\lightfj\OneDrive - Autodesk\Projects\flexsim-station-console"
npm install
npm run install:backend
npm run db:setup          # docker up + wait + create table
npm run build             # prepare-sam-build (NOT sam build)
npm run api               # terminal 1 — http://127.0.0.1:3000
npm run frontend          # terminal 2 — http://127.0.0.1:5173
# Or: npm run dev
```

**Smoke test:** Place pieces → COMMIT → `curl.exe http://127.0.0.1:3000/placements/CODE` (use header code; refresh creates new session).

**Tests:** `npm test` (7 tests in `backend/tests/validation.test.ts`).

### Windows / OneDrive gotchas (do not regress)

1. **Do not rely on `sam build`** in project dir — PermissionError on OneDrive. Use `npm run build` → `prepare-sam-build.cjs`.
2. **`npm.cmd` with `shell: false`** hangs at esbuild step — bundle via `node scripts/bundle.mjs` directly.
3. **SAM local + DynamoDB:** Lambdas must use `http://dynamodb:8000` on network `flexsim-local` (`start-api.cjs` passes `--docker-network flexsim-local`). Host `host.docker.internal` failed with invalid token (hit real AWS).
4. **`run-sam.cjs`:** Paths with spaces need `execSync` via `cmd /c` quoted command line; `env.local.json` copied to `%LOCALAPPDATA%\flexsim-station-console\` for `--env-vars`.
5. **PowerShell `curl`** → use `curl.exe`. **`gh`/`git`/`sam`** may need new terminal or PATH refresh.
6. **`putPlacements` local fix:** `dynamodb.ts` falls back to `http://dynamodb:8000` when `AWS_SAM_LOCAL` set if `DYNAMODB_ENDPOINT` missing.
7. **SAM log noise:** `LAMBDA_RUNTIME Failed to get next invocation` after 201/200 is common locally — ignore if HTTP status OK.

## AWS deployment (not done yet)

1. `copy deploy.env.example deploy.env` — fill `SITE_BUCKET_NAME`, etc.
2. `npm run deploy:backend` → set `API_URL` from stack output
3. `npm run deploy:frontend:stack` → set `FRONTEND_*` outputs
4. Set `ALLOWED_ORIGIN` to CloudFront URL; redeploy backend
5. `npm run deploy:frontend` — stages UI with production `config.json`, S3 sync, CF invalidation

See `DEPLOYMENT.md`.

## GitHub

- **Remote:** `origin` → `https://github.com/jasonic8-adsk/flexsim-station-console.git`
- **Org `Autodesk-FlexSim`:** 404 for user — not a member; `gh org list` empty. Transfer repo later via Settings → Transfer ownership.
- **Collaborators:** Settings → Collaborators, or `gh repo add-collaborator jasonic8-adsk/flexsim-station-console USER --permission write`

## What's next (priority)

1. ~~Git init + push~~ ✅
2. AWS deploy when credentials/org ready (`DEPLOYMENT.md`)
3. Transfer to `Autodesk-FlexSim` when org access granted
4. UI polish vs concept art (out of scope v1)
5. Optional: CI (GitHub Actions), tighten CORS from `*` to CloudFront URL in prod

## Key references

- JSON examples: `c:\Users\lightfj\Autodesk\Donny Wong - Flexsim Fusion Ops Demo\Flexsim\Flexsim Data\JSON Reading Examples\Valid\`
- Brand: https://brand.autodesk.com/
- Slot map: `reader_0` product; `reader_1`–`reader_6` stations; layout in `prd.md`

## Machine / product IDs

`Product_A`–`D`, `Machine_A`–`J`, or `"empty"` per slot. Validation in `backend/src/lib/validation.ts`. No duplicate placements; product only in `reader_0`.
