/**
 * End-to-end smoke test against a running local API (SAM local on port 3000).
 * Usage: node scripts/smoke-test-local.cjs [--api http://127.0.0.1:3000]
 */
const API_BASE = (() => {
  const flagIndex = process.argv.indexOf("--api");
  if (flagIndex !== -1 && process.argv[flagIndex + 1]) {
    return process.argv[flagIndex + 1].replace(/\/$/, "");
  }
  return (process.env.API_BASE ?? "http://127.0.0.1:3000").replace(/\/$/, "");
})();

const SESSION_CODE_PATTERN = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/u;
const PI_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}$/u;

const sampleReadings = {
  reader_0: "Product_A",
  reader_1: "Machine_J",
  reader_2: "Machine_D",
  reader_3: "Machine_B",
  reader_4: "Machine_A",
  reader_5: "Machine_H",
  reader_6: "Machine_F"
};

function log(step, message) {
  console.log(`[smoke] ${step}: ${message}`);
}

function fail(step, message) {
  console.error(`[smoke] FAIL ${step}: ${message}`);
  process.exit(1);
}

async function request(method, path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: response.status, data };
}

async function main() {
  console.log(`=== FlexSim Station Console — API Smoke Test ===\nAPI: ${API_BASE}\n`);

  let sessionResponse;
  try {
    sessionResponse = await request("POST", "/sessions");
  } catch (error) {
    fail(
      "connect",
      `Cannot reach ${API_BASE}. Start the API with: npm run api\n(${error.message})`
    );
  }

  if (sessionResponse.status !== 201) {
    fail("POST /sessions", `expected 201, got ${sessionResponse.status}`);
  }
  if (!sessionResponse.data?.code || !SESSION_CODE_PATTERN.test(sessionResponse.data.code)) {
    fail("POST /sessions", `invalid session code: ${JSON.stringify(sessionResponse.data)}`);
  }

  const code = sessionResponse.data.code;
  log("POST /sessions", `created session ${code}`);

  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/u, ".000000");
  const putResponse = await request("PUT", `/placements/${code}`, {
    timestamp,
    readings: sampleReadings
  });

  if (putResponse.status !== 200 && putResponse.status !== 201) {
    fail("PUT /placements", `expected 200/201, got ${putResponse.status}: ${JSON.stringify(putResponse.data)}`);
  }
  log("PUT /placements", "commit accepted");

  const getResponse = await request("GET", `/placements/${code}`);
  if (getResponse.status !== 200) {
    fail("GET /placements", `expected 200, got ${getResponse.status}: ${JSON.stringify(getResponse.data)}`);
  }

  const payload = getResponse.data;
  if (!payload?.timestamp || !PI_TIMESTAMP_PATTERN.test(payload.timestamp)) {
    fail("GET /placements", `invalid Pi timestamp: ${JSON.stringify(payload?.timestamp)}`);
  }
  if (!payload?.readings) {
    fail("GET /placements", "missing readings object");
  }

  for (const [key, value] of Object.entries(sampleReadings)) {
    if (payload.readings[key] !== value) {
      fail("GET /placements", `readings.${key} expected ${value}, got ${payload.readings[key]}`);
    }
  }

  log("GET /placements", "round-trip verified");
  console.log("\n[smoke] PASS — local API is working.");
  console.log(`  Session: ${code}`);
  console.log(`  Timestamp: ${payload.timestamp}`);
}

main().catch((error) => {
  fail("unexpected", error.message);
});
