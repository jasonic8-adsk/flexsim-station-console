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

console.log(`\n[api] Starting SAM local API on http://127.0.0.1:3000`);
console.log(`[api] Template: ${templatePath}`);
console.log(`[api] Docker network: ${dockerNetwork} (DynamoDB at http://dynamodb:8000)\n`);

const samArgs = [
  "local",
  "start-api",
  "-t",
  templatePath,
  "--env-vars",
  envFile,
  "--docker-network",
  dockerNetwork,
  "--port",
  "3000"
];

const result = spawnSync(process.execPath, [path.join(__dirname, "run-sam.cjs"), ...samArgs], {
  stdio: "inherit",
  cwd: projectRoot
});

process.exit(result.status ?? 1);
