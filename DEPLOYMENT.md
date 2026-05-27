# Deploying FlexSim Station Console to AWS

This guide deploys:

| Component | AWS services |
|-----------|----------------|
| **API** | API Gateway + Lambda + DynamoDB (SAM) |
| **Web UI** | S3 + CloudFront (CloudFormation) |

Local development is unchanged — see `SESSION_CONTEXT.md`.

---

## Prerequisites

1. **AWS account** with permissions for CloudFormation, Lambda, API Gateway, DynamoDB, S3, CloudFront, IAM.
2. **AWS CLI v2** configured:
   ```powershell
   aws configure
   # or: aws sso login --profile your-profile
   ```
3. **SAM CLI** installed (`winget install Amazon.SAM-CLI`).
4. **Node.js** and project dependencies:
   ```powershell
   npm install
   npm run install:backend
   ```

Verify:

```powershell
aws sts get-caller-identity
sam --version
```

---

## One-time configuration

```powershell
cd "C:\Users\lightfj\OneDrive - Autodesk\Projects\flexsim-station-console"
copy deploy.env.example deploy.env
```

Edit `deploy.env`:

| Variable | Example | Notes |
|----------|---------|--------|
| `AWS_REGION` | `us-east-1` | Same region for all stacks |
| `BACKEND_STACK_NAME` | `flexsim-station-console` | SAM stack name |
| `FRONTEND_STACK_NAME` | `flexsim-station-console-frontend` | Static hosting stack |
| `SITE_BUCKET_NAME` | `flexsim-console-site-123456789012` | **Globally unique** S3 name |
| `ALLOWED_ORIGIN` | `*` initially | Set to CloudFront URL after frontend deploy |

---

## Deployment order

### Step 1 — Deploy the API (backend)

```powershell
npm run deploy:backend
```

This will:

- Bundle Lambda code (`backend/dist/`)
- Deploy `template.yaml` via SAM (no `sam build` — avoids Windows/OneDrive issues)
- Create DynamoDB table with point-in-time recovery
- Output **ApiUrl**

Copy **ApiUrl** into `deploy.env`:

```env
API_URL=https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/Prod
```

Test the live API:

```powershell
curl.exe -X POST %API_URL%/sessions
```

---

### Step 2 — Deploy frontend infrastructure (S3 + CloudFront)

```powershell
npm run deploy:frontend:stack
```

Copy stack outputs into `deploy.env`:

```env
FRONTEND_URL=https://d111111.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
FRONTEND_BUCKET=flexsim-console-site-123456789012
```

---

### Step 3 — Lock down CORS (recommended)

Set `ALLOWED_ORIGIN` in `deploy.env` to your CloudFront URL (no trailing slash):

```env
ALLOWED_ORIGIN=https://d111111.cloudfront.net
```

Redeploy the API so Lambda and API Gateway use the new origin:

```powershell
npm run deploy:backend
```

---

### Step 4 — Publish the web app

```powershell
npm run deploy:frontend
```

This will:

- Stage `frontend/` with production `config.json` (`apiBase` = your `API_URL`)
- `aws s3 sync` to the site bucket
- Invalidate CloudFront cache

Open `FRONTEND_URL` in a browser, place pieces, **COMMIT**, then verify:

```powershell
curl.exe %API_URL%/placements/YOURCODE
```

---

## Repeat deployments

After code changes:

| What changed | Command |
|--------------|---------|
| API / Lambda only | `npm run deploy:backend` |
| UI only | `npm run deploy:frontend` |
| Both | `npm run deploy:backend` then `npm run deploy:frontend` |

`npm run deploy:all` runs backend + frontend stack + frontend sync (stack step is safe to re-run).

---

## How configuration works

- **Local:** `frontend/config.json` → `"apiBase": "http://127.0.0.1:3000"`
- **Production:** deploy script injects `apiBase` into a staging copy only (your local `config.json` stays unchanged).
- **Override:** `https://your-site.cloudfront.net?api=https://your-api.execute-api.../Prod`

---

## Architecture diagram

```text
Browser
   │
   ▼
CloudFront ──► S3 (static: index.html, app.js, config.json)
   │
   │  fetch(apiBase + /sessions | /placements/...)
   ▼
API Gateway ──► Lambda (createSession | putPlacements | getPlacements)
                      │
                      ▼
                 DynamoDB (versioned placements per session code)
```

---

## Cost and operations (pilot scale)

- **Lambda + API Gateway + DynamoDB on-demand:** typically low cost at demo traffic.
- **S3 + CloudFront:** pennies to low dollars/month for static hosting.
- Enable **AWS Budgets** alerts in the console.
- Monitor **CloudWatch** for Lambda errors and API Gateway 5xx.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `Unable to locate credentials` | `aws configure` or SSO login |
| `sam` not found | Restart terminal; use `node scripts/run-sam.cjs` via npm scripts |
| CORS error in browser | `ALLOWED_ORIGIN` matches CloudFront URL; redeploy backend |
| Commit works locally, not in cloud | `API_URL` in deployed `config.json`; CloudFront cache invalidated |
| 404 on GET placement | Commit under the **current** session code (refresh creates a new code) |

---

## Optional: first-time guided SAM deploy

Instead of `npm run deploy:backend`, you can run:

```powershell
npm run build
sam deploy --guided --no-build
```

Then copy `ApiUrl` from stack outputs into `deploy.env`.

---

## Security notes (v1)

- No end-user authentication (per PRD).
- Session codes are unguessable but public if shared.
- Restrict `ALLOWED_ORIGIN` in production.
- Do not commit `deploy.env`.
