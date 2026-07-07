const { readFileSync, existsSync, copyFileSync, mkdirSync } = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const buildPathFile = path.join(
  os.homedir(),
  "AppData",
  "Local",
  "flexsim-station-console",
  "sam-build-path.txt"
);

function readBuildRoot() {
  if (!existsSync(buildPathFile)) {
    return null;
  }
  const buildRoot = readFileSync(buildPathFile, "utf8").trim();
  if (!existsSync(path.join(buildRoot, "template.yaml"))) {
    return null;
  }
  return buildRoot;
}

function ensureBuild() {
  const existing = readBuildRoot();
  if (existing) {
    return existing;
  }

  console.log("Build artifacts missing — running prepare-sam-build...\n");
  const result = spawnSync(process.execPath, ["scripts/prepare-sam-build.cjs"], {
    stdio: "inherit",
    cwd: projectRoot
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  const buildRoot = readBuildRoot();
  if (!buildRoot) {
    console.error("Build finished but sam-build-path.txt was not created.");
    console.error(`Expected: ${buildPathFile}`);
    process.exit(1);
  }

  return buildRoot;
}

const buildRoot = ensureBuild();
const templatePath = path.join(buildRoot, "template.yaml");

const shareMode = process.argv.includes("--share") || process.env.LISTEN_HOST === "0.0.0.0";
const listenHost = shareMode ? "0.0.0.0" : (process.env.LISTEN_HOST ?? "127.0.0.1");
const listenPort = process.env.LISTEN_PORT ?? "3000";

function printLanUrls(port, label) {
  const urls = [];
  for (const interfaces of Object.values(os.networkInterfaces())) {
    if (!interfaces) {
      continue;
    }
    for (const net of interfaces) {
      const isIpv4 = net.family === "IPv4" || net.family === 4;
      if (isIpv4 && !net.internal) {
        urls.push(`http://${net.address}:${port}`);
      }
    }
  }
  if (urls.length === 0) {
    console.log(`[api] No LAN IPv4 address found for ${label}.`);
    return;
  }
  console.log(`[api] ${label}:`);
  for (const url of urls) {
    console.log(`  ${url}`);
  }
}

const localRoot = path.join(
  os.homedir(),
  "AppData",
  "Local",
  "flexsim-station-console"
);
mkdirSync(localRoot, { recursive: true });
const envFile = path.join(localRoot, "env.local.json");
copyFileSync(path.join(projectRoot, "env.local.json"), envFile);

const dockerNetwork = "flexsim-local";

console.log(`\n[api] Starting SAM local API on http://${listenHost}:${listenPort}`);
console.log(`[api] Template: ${templatePath}`);
console.log(`[api] Docker network: ${dockerNetwork} (DynamoDB at http://dynamodb:8000)`);
if (shareMode) {
  printLanUrls(listenPort, "Share this API URL with colleagues");
}
console.log("[api] Note: LAMBDA_RUNTIME 'Failed to get next invocation' after 200/201 is normal for SAM local — ignore if HTTP status is OK.");
console.log("");

const samArgs = [
  "local",
  "start-api",
  "-t",
  templatePath,
  "--env-vars",
  envFile,
  "--docker-network",
  dockerNetwork,
  "--host",
  listenHost,
  "--port",
  listenPort
];

const result = spawnSync(process.execPath, [path.join(__dirname, "run-sam.cjs"), ...samArgs], {
  stdio: "inherit",
  cwd: projectRoot
});

process.exit(result.status ?? 1);
