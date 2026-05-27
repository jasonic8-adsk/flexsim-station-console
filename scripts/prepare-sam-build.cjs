/**
 * Prepares SAM local artifacts without `sam build`.
 * Avoids Windows/OneDrive PermissionError from SAM's temp copy step.
 */
const { spawnSync } = require("node:child_process");
const {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const projectRoot = path.resolve(__dirname, "..");
const backendDir = path.join(projectRoot, "backend");
const backendDist = path.join(backendDir, "dist");
const localRoot = path.join(
  os.homedir(),
  "AppData",
  "Local",
  "flexsim-station-console"
);
const buildRoot = path.join(
  process.env.FLEXSIM_SAM_BUILD_DIR ?? localRoot,
  "sam-build"
);
const buildPathFile = path.join(localRoot, "sam-build-path.txt");

const functionNames = [
  "CreateSessionFunction",
  "PutPlacementsFunction",
  "GetPlacementsFunction"
];

function log(step, message) {
  console.log(`[build] ${step}: ${message}`);
}

function run(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: options.shell ?? false,
    windowsHide: true
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runBackendBundle() {
  if (!existsSync(path.join(backendDir, "node_modules"))) {
    log("1/3", "Installing backend dependencies...");
    run("npm", ["install"], backendDir, { shell: true });
  }

  log("2/3", "Bundling Lambda handlers (esbuild)...");
  run(process.execPath, ["scripts/bundle.mjs"], backendDir, { shell: false });
}

function setCodeUri(template, functionName, codeUri) {
  const pattern = new RegExp(
    `(\\s+${functionName}:[\\s\\S]*?CodeUri:\\s*)([^\\n]+)`,
    "m"
  );
  return template.replace(pattern, `$1${codeUri}`);
}

function prepareTemplate() {
  const sourceTemplate = readFileSync(path.join(projectRoot, "template.yaml"), "utf8");
  let template = sourceTemplate;

  for (const functionName of functionNames) {
    template = setCodeUri(template, functionName, `${functionName}/`);
  }

  return template;
}

function copyDistToBuild() {
  log("3/3", `Copying artifacts to ${buildRoot}`);

  mkdirSync(localRoot, { recursive: true });

  if (existsSync(buildRoot)) {
    rmSync(buildRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
  mkdirSync(buildRoot, { recursive: true });

  if (!existsSync(backendDist)) {
    console.error("Missing backend/dist after bundle.");
    process.exit(1);
  }

  for (const functionName of functionNames) {
    const targetDir = path.join(buildRoot, functionName);
    cpSync(backendDist, targetDir, { recursive: true, force: true });
  }

  writeFileSync(path.join(buildRoot, "template.yaml"), prepareTemplate(), "utf8");
  writeFileSync(buildPathFile, buildRoot, "utf8");

  console.log("\n[build] Done. SAM artifacts ready at:");
  console.log(`  ${buildRoot}`);
}

log("0/3", "Starting local SAM artifact build...");
runBackendBundle();
copyDistToBuild();
