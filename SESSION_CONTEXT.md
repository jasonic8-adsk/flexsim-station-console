# Session Context - FlexSim Station Console

## Project Location
`C:\Users\lightfj\OneDrive - Autodesk\Projects\flexsim-station-console\`

## What's Been Done
- **PRD complete** (`prd.md`) - fully specced requirements
- **Frontend** (`frontend/index.html`, `styles.css`, `app.js`, `icons.js`)
  - Factory floor plan layout as SVG
  - Click-to-place interaction
  - Outlined SVG icons, Autodesk dark theme
  - Wired to backend: POST `/sessions`, PUT `/placements/{code}`
  - Pi-compatible timestamp format on commit
- **AWS SAM backend** (`template.yaml`, `backend/src/`)
  - `POST /sessions` - returns `{ code }`
  - `PUT /placements/{code}` - versioned commit to DynamoDB
  - `GET /placements/{code}` - Pi-compatible `{ timestamp, readings }`
  - Input validation, CORS, duplicate-placement checks
- **Local dev** - `docker-compose.yml` (DynamoDB Local), `env.local.json`, `npm run dev`
- **Tests** - `backend/tests/validation.test.ts`

## Key Decisions Made
- **Stack**: AWS SAM, API Gateway + Lambda + DynamoDB, TypeScript backend; vanilla JS frontend
- **Session code**: 6-char alphanumeric (excludes 0/O/1/I/L), from `POST /sessions` on load
- **Versioning**: Each commit creates a new version; GET returns latest
- **No auth** in v1, no expiry on codes
- **JSON format** must exactly match Raspberry Pi output (see prd.md)
- **Local dev first**: SAM Local + DynamoDB Local before AWS deployment

## What's Next
1. Git init & first proper commit
2. AWS deploy — see `DEPLOYMENT.md` (`deploy.env.example`, `npm run deploy:backend`, etc.)
3. Later: UI polish to match concept art quality

## AWS Deployment
- Guide: `DEPLOYMENT.md`
- Config template: `deploy.env.example` → copy to `deploy.env`
- Backend: `npm run deploy:backend` (SAM → API Gateway + Lambda + DynamoDB)
- Frontend infra: `npm run deploy:frontend:stack` (S3 + CloudFront in `infra/frontend.yaml`)
- Frontend publish: `npm run deploy:frontend` (S3 sync + CloudFront invalidation)
- Production API URL injected via staged `config.json` (local `frontend/config.json` stays on localhost)

## Local Development
```bash
npm install
npm run dev
```
- API: http://127.0.0.1:3000
- Frontend: http://127.0.0.1:5173 (use `?api=http://127.0.0.1:3000` if needed)
- GET example: `curl http://127.0.0.1:3000/placements/A3X9K2`

## Key Data References
- **Original JSON examples**: `c:\Users\lightfj\Autodesk\Donny Wong - Flexsim Fusion Ops Demo\Flexsim\Flexsim Data\JSON Reading Examples\Valid\`
- **Autodesk brand guide**: https://brand.autodesk.com/

## Machine/Product ID Mapping
| ID | Name | Category |
|---|---|---|
| Machine_A | Manual Store | Storage |
| Machine_B | Automated Assembly | Assembly |
| Machine_C | Automated Storage | Storage |
| Machine_D | Manual Assembly | Assembly |
| Machine_E | 3D Printer | Plastic Mfg |
| Machine_F | Injection Mould | Plastic Mfg |
| Machine_G | Die Casting | Metal Mfg |
| Machine_H | CNC Milling | Metal Mfg |
| Machine_I | Automated QA | QA |
| Machine_J | Manual QA | QA |
| Product_A | Airfryer | Product |
| Product_B | Utility Knife | Product |
| Product_C | Sim Wheel | Product |
| Product_D | Speaker | Product |

## Slot Layout
```
Row 1: [1] [2] [3]    (reader_1, reader_2, reader_3)
Row 2: [4] [5] [6]    (reader_4, reader_5, reader_6)
Product: reader_0 (outside building)
```
