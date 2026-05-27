# FlexSim Station Console - Web Version

## Product Requirements Document

### Overview

A web-based version of the physical FlexSim factory simulation configurator console. Users place manufacturing station pieces into a factory floor layout and select a product to manufacture. The web app generates a unique session code, serves the configuration as JSON (matching the original Raspberry Pi NFC reader format), and allows any HTTP client to retrieve it.

---

### Background

The physical console is a board with:
- **10 resin-encased station pieces** (read via NFC on a Raspberry Pi)
- **4 product pieces**
- **6 blue-ringed station slots** arranged in a factory floor plan
- **1 yellow-ringed product slot**
- A Raspberry Pi REST API that responds with a JSON payload of the current board state

The web version replaces the physical board for remote/digital use while producing an identical JSON payload that FlexSim can consume directly.

---

### Station Types & Options

| Machine ID | Display Name | Category |
|---|---|---|
| Machine_A | Manual Store | Storage |
| Machine_B | Automated Assembly | Assembly |
| Machine_C | Automated Storage | Storage |
| Machine_D | Manual Assembly | Assembly |
| Machine_E | 3D Printer | Plastic Manufacturing |
| Machine_F | Injection Mould | Plastic Manufacturing |
| Machine_G | Die Casting | Metal Manufacturing |
| Machine_H | CNC Milling | Metal Manufacturing |
| Machine_I | Automated QA | QA |
| Machine_J | Manual QA | QA |

**5 Categories** (2 options each = 10 total):
1. Plastic Manufacturing: 3D Printer / Injection Mould
2. Metal Manufacturing: CNC Milling / Die Casting
3. QA: Automated QA / Manual QA
4. Assembly: Automated Assembly / Manual Assembly
5. Storage: Automated Storage / Manual Store

### Product Options

| Product ID | Display Name |
|---|---|
| Product_A | Airfryer |
| Product_B | Utility Knife |
| Product_C | Sim Wheel |
| Product_D | Speaker |

---

### Layout

The factory floor plan consists of 3 rooms connected by corridors, with a fixed "Goods In/Out" loading dock at the top-left:

```
┌─────────────────────────────────────────┐
│  🚛 Goods                               │
│  In/Out    ┌───────────────────────┐    │
│            │   Top-Right Room      │    │
│ ┌────────┐ │  [Slot 2]  [Slot 3]  │    │
│ │  Left  │ └───────────────────────┘    │
│ │  Room  │                              │
│ │        │ ┌───────────────────────┐    │
│ │[Slot 1]│ │   Bottom-Right Room   │    │
│ │        │ │  [Slot 5]  [Slot 6]  │    │
│ │[Slot 4]│ └───────────────────────┘    │
│ └────────┘                              │
└─────────────────────────────────────────┘
```

**Slot grid mapping (reader IDs):**
- Row 1 (top, left→right): reader_1, reader_2, reader_3
- Row 2 (bottom, left→right): reader_4, reader_5, reader_6
- Product: reader_0

**Room assignments:**
- Left room: Slots 1 & 4
- Top-right room: Slots 2 & 3
- Bottom-right room: Slots 5 & 6

---

### JSON Payload Format

The output must exactly match the original Raspberry Pi NFC reader format:

```json
{
  "timestamp": "2025-07-22T17:36:56.453012",
  "readings": {
    "reader_0": "Product_A",
    "reader_1": "Machine_J",
    "reader_2": "Machine_D",
    "reader_3": "Machine_B",
    "reader_4": "Machine_A",
    "reader_5": "Machine_H",
    "reader_6": "Machine_F"
  }
}
```

- `reader_0` is always the product (values: `Product_A` through `Product_D`, or `"empty"`)
- `reader_1` through `reader_6` are stations (values: `Machine_A` through `Machine_J`, or `"empty"`)
- `timestamp` is ISO 8601 format with microseconds
- Empty/unoccupied slots have the value `"empty"`

---

### User Workflow

1. User navigates to the web app
2. A unique **6-character alphanumeric session code** is generated immediately and displayed prominently
3. User sees the factory floor plan with 6 empty station slots + 1 product slot
4. User selects a station/product from the palette, then clicks a slot to place it
5. Pieces can be moved between slots or removed
6. User clicks **"Commit"** to save the current configuration
7. Configuration is stored in DynamoDB (versioned - history kept, GET returns latest)
8. User can continue editing and re-commit under the same session code
9. Any HTTP client can GET `/placements/{code}` to retrieve the latest configuration

---

### Interaction Design

- **Click-to-place** (not drag-and-drop):
  1. User clicks a piece in the palette → piece becomes "selected" (highlighted)
  2. User clicks a slot → piece is placed there
  3. If slot is occupied, existing piece returns to the palette
- **Moving a piece**: Click an occupied slot (piece returns to palette as selected), then click new slot
- **Removing a piece**: Click an occupied slot, then click the piece back in the palette (or a "remove" action)
- Only one piece per slot
- Each station option can only be used once (10 options, max 6 placed)
- No placement constraints enforced in the UI (FlexSim validates downstream)
- Partial configurations allowed (not all slots need to be filled)

---

### Technical Architecture

#### Stack
- **Frontend**: TypeScript single-page app (vanilla or lightweight framework)
- **Backend**: TypeScript (Node.js Lambda)
- **Infrastructure**: AWS SAM
  - API Gateway (REST)
  - Lambda functions
  - DynamoDB table

#### API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /sessions | Create a new session, returns generated code |
| PUT | /placements/{code} | Commit current configuration |
| GET | /placements/{code} | Retrieve latest configuration (Pi-compatible JSON) |

#### DynamoDB Schema

**Table: StationPlacements**
- Partition Key: `code` (String) - the 6-char session code
- Sort Key: `version` (Number) - auto-incrementing version
- Attributes:
  - `timestamp` (String) - ISO 8601
  - `readings` (Map) - the reader_0 through reader_6 values
  - `createdAt` (String) - when this version was committed

#### Session Code Format
- 6 characters, alphanumeric (uppercase + digits, excluding ambiguous chars like 0/O, 1/I/L)
- Example: `A3X9K2`
- No expiry

---

### Branding

Follow **Autodesk Brand Guidelines** (https://brand.autodesk.com/):

**Primary Colors:**
- Autodesk Black: `#000000`
- Autodesk White: `#FFFFFF`
- Hello Yellow: `#FFFF00`

**Secondary Colors:**
- Warm Slate: `#D5D5CB`
- Slate: `#666666`

**Tertiary Colors (functional use only):**
- Dawn (orange): `#F09D4F`
- Dusk (red): `#F2520A`
- Twilight (blue): `#1D91D0`
- Morning (teal): `#2AD0A9`

**Usage:**
- Black/White dominate, Hello Yellow as highlight/accent
- Blue rings on station slots (matching physical board: `#1D91D0` Twilight)
- Yellow rings on product slot (matching physical board: `#FFFF00` Hello Yellow)
- Clean, modern digital interface

---

### Non-Functional Requirements

- **Concurrency**: Support 10-100 concurrent sessions
- **CORS**: Enabled for frontend-backend communication
- **Validation**: Input validation on all API endpoints
- **No authentication** in v1
- **No expiry** on session codes
- **Local development**: SAM Local for Lambda + DynamoDB Local
- **Tests**: Basic unit tests for Lambda functions and frontend logic

---

### Local Development

- `sam local start-api` for Lambda + API Gateway emulation
- DynamoDB Local (Docker) for database
- Frontend dev server with hot reload
- Single `npm run dev` or equivalent to start everything

---

### Out of Scope (v1)

- FlexSim simulation triggering
- Fusion Operations work instructions
- Drag-and-drop interaction
- User authentication
- QR code generation
- Deployment pipeline (CI/CD)
- Timer/countdown features

---

### Future Considerations (v2+)

- Fusion Operations work instructions panel
- FlexSim simulation integration
- Drag-and-drop as alternative interaction
- QR code for code sharing
- Results/statistics display after simulation
- User accounts and saved configurations
- Event/session management for facilitators

---

### Reference Assets

- Physical board renders (provided by stakeholder)
- Factory floor plan layout (provided by stakeholder)
- Original NFC JSON examples from Raspberry Pi
- Autodesk brand guidelines: https://brand.autodesk.com/
