/**
 * Checks system tools and project artifacts required for local development.
 * Usage: node scripts/check-local-prereqs.cjs [--json] [--project-only]
 */
const { spawnSync } = require("node:child_process");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const projectRoot = path.resolve(__dirname, "..");
const jsonMode = process.argv.includes("--json");
const projectOnly = process.argv.includes("--project-only");

const MIN_NODE_MAJOR = 18;
const RECOMMENDED_NODE_MAJOR = 20;

const samCandidates = [
  process.env.SAM_CLI_LOCATION,
  "C:\\Program Files\\Amazon\\AWSSAMCLI\\bin\\sam.cmd",
  path.join(process.env.LOCALAPPDATA ?? "", "Programs", "Amazon", "AWSSAMCLI", "bin", "sam.cmd")
].filter(Boolean);

function run(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: options.shell ?? false,
    windowsHide: true,
    ...options
  });
  return {
    ok: result.status === 0,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
    status: result.status ?? 1
  };
}

function commandVersion(command, versionArgs = ["--version"]) {
  let result = run(command, versionArgs);
  if (!result.ok && process.platform === "win32" && !command.endsWith(".cmd")) {
    result = run(`${command}.cmd`, versionArgs);
  }
  if (!result.ok && process.platform === "win32" && command.endsWith(".cmd")) {
    result = run("cmd", ["/c", command, ...versionArgs]);
  }
  if (!result.ok) {
    return null;
  }
  return result.stdout.split(/\r?\n/u)[0] ?? result.stdout;
}

function resolveSamCommand() {
  if (process.platform === "win32") {
    for (const candidate of samCandidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return "sam";
}

function resolveNpmCommand() {
  const nodeDir = path.dirname(process.execPath);
  const npmCmd = path.join(nodeDir, "npm.cmd");
  if (process.platform === "win32" && existsSync(npmCmd)) {
    return npmCmd;
  }
  return "npm";
}

function parseNodeMajor(versionLine) {
  const match = versionLine.match(/v(\d+)/u);
  return match ? Number(match[1]) : 0;
}

function readSamBuildRoot() {
  const pointerFile = path.join(
    os.homedir(),
    "AppData",
    "Local",
    "flexsim-station-console",
    "sam-build-path.txt"
  );
  if (existsSync(pointerFile)) {
    const buildRoot = readFileSync(pointerFile, "utf8").trim();
    if (buildRoot) {
      return buildRoot;
    }
  }
  return path.join(
    os.homedir(),
    "AppData",
    "Local",
    "flexsim-station-console",
    "sam-build"
  );
}

function checkDockerContainer() {
  const result = run("docker", ["ps", "--format", "{{.Names}}"]);
  if (!result.ok) {
    return { running: false, names: [] };
  }
  const names = result.stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  const dynamodb = names.some((name) => /dynamodb/i.test(name));
  return { running: dynamodb, names };
}

function checkDockerNetwork() {
  const result = run("docker", ["network", "ls", "--format", "{{.Name}}"]);
  if (!result.ok) {
    return false;
  }
  return result.stdout.split(/\r?\n/u).some((name) => name.trim() === "flexsim-local");
}

function checkDynamoTable() {
  const verifyScript = path.join(projectRoot, "scripts", "verify-dynamodb.mjs");
  const result = run(process.execPath, [verifyScript], {
    env: {
      ...process.env,
      DYNAMODB_ENDPOINT: "http://127.0.0.1:8000",
      TABLE_NAME: "StationPlacements"
    }
  });
  return result.ok;
}

function makeCheck(definition) {
  return { ...definition };
}

const checks = [];

function addSystemChecks() {
  const nodeVersion = commandVersion(process.execPath, ["--version"]);
  const nodeMajor = nodeVersion ? parseNodeMajor(nodeVersion) : 0;
  checks.push(
    makeCheck({
      id: "node",
      category: "system",
      required: true,
      ok: nodeMajor >= MIN_NODE_MAJOR,
      detail: nodeVersion ?? "not found",
      fix: `Install Node.js ${RECOMMENDED_NODE_MAJOR}+ LTS: winget install OpenJS.NodeJS.LTS`
    })
  );

  const npmVersion = commandVersion(resolveNpmCommand(), ["--version"]);
  checks.push(
    makeCheck({
      id: "npm",
      category: "system",
      required: true,
      ok: Boolean(npmVersion),
      detail: npmVersion ? `v${npmVersion}` : "not found",
      fix: "Comes with Node.js. Reinstall Node.js if npm is missing."
    })
  );

  const gitVersion = commandVersion("git", ["--version"]);
  checks.push(
    makeCheck({
      id: "git",
      category: "system",
      required: false,
      ok: Boolean(gitVersion),
      detail: gitVersion ?? "not found (optional for local dev)",
      fix: "winget install Git.Git"
    })
  );

  const dockerVersion = commandVersion("docker", ["--version"]);
  const dockerInfo = run("docker", ["info"]);
  checks.push(
    makeCheck({
      id: "docker",
      category: "system",
      required: true,
      ok: Boolean(dockerVersion) && dockerInfo.ok,
      detail: dockerVersion
        ? dockerInfo.ok
          ? dockerVersion
          : `${dockerVersion} (daemon not running — start Docker Desktop)`
        : "not found",
      fix: "winget install Docker.DockerDesktop — then start Docker Desktop and wait until it is running."
    })
  );

  const composeVersion = commandVersion("docker", ["compose", "version"]);
  checks.push(
    makeCheck({
      id: "docker-compose",
      category: "system",
      required: true,
      ok: Boolean(composeVersion),
      detail: composeVersion ?? "not found",
      fix: "Included with Docker Desktop. Update Docker Desktop if compose is missing."
    })
  );

  const samCommand = resolveSamCommand();
  const samVersion =
    commandVersion(samCommand, ["--version"]) ??
    (process.platform === "win32" && samCommand.endsWith(".cmd")
      ? commandVersion("cmd", ["/c", samCommand, "--version"])
      : null);
  checks.push(
    makeCheck({
      id: "sam",
      category: "system",
      required: true,
      ok: Boolean(samVersion),
      detail: samVersion ?? "not found",
      fix: "winget install Amazon.SAM-CLI — open a new terminal after install so PATH updates."
    })
  );

  if (process.platform === "win32") {
    const wingetVersion = commandVersion("winget", ["--version"]);
    checks.push(
      makeCheck({
        id: "winget",
        category: "system",
        required: false,
        ok: Boolean(wingetVersion),
        detail: wingetVersion ?? "not found (manual installs required)",
        fix: "winget is built into Windows 11 / recent Windows 10. Install App Installer from the Microsoft Store."
      })
    );
  }
}

function addProjectChecks() {
  const rootModules = path.join(projectRoot, "node_modules");
  checks.push(
    makeCheck({
      id: "root-deps",
      category: "project",
      required: true,
      ok: existsSync(rootModules),
      detail: existsSync(rootModules) ? "installed" : "missing",
      fix: "npm install"
    })
  );

  const backendModules = path.join(projectRoot, "backend", "node_modules");
  checks.push(
    makeCheck({
      id: "backend-deps",
      category: "project",
      required: true,
      ok: existsSync(backendModules),
      detail: existsSync(backendModules) ? "installed" : "missing",
      fix: "npm run install:backend"
    })
  );

  const buildRoot = readSamBuildRoot();
  const templatePath = path.join(buildRoot, "template.yaml");
  checks.push(
    makeCheck({
      id: "sam-build",
      category: "project",
      required: true,
      ok: existsSync(templatePath),
      detail: existsSync(templatePath) ? buildRoot : "missing SAM build artifacts",
      fix: "npm run build"
    })
  );

  const container = checkDockerContainer();
  checks.push(
    makeCheck({
      id: "dynamodb-container",
      category: "project",
      required: true,
      ok: container.running,
      detail: container.running
        ? "DynamoDB Local container is running"
        : "DynamoDB Local container is not running",
      fix: "npm run db:up"
    })
  );

  const networkReady = checkDockerNetwork();
  checks.push(
    makeCheck({
      id: "docker-network",
      category: "project",
      required: true,
      ok: networkReady,
      detail: networkReady ? "flexsim-local network exists" : "flexsim-local network missing",
      fix: "npm run db:up"
    })
  );

  let tableReady = false;
  if (container.running) {
    tableReady = checkDynamoTable();
  }
  checks.push(
    makeCheck({
      id: "dynamodb-table",
      category: "project",
      required: true,
      ok: tableReady,
      detail: tableReady
        ? 'table "StationPlacements" exists'
        : container.running
          ? 'table "StationPlacements" missing or unreachable'
          : "skipped (DynamoDB container not running)",
      fix: "npm run db:create-table"
    })
  );
}

if (!projectOnly) {
  addSystemChecks();
}
addProjectChecks();

const requiredChecks = checks.filter((check) => check.required);
const passedRequired = requiredChecks.filter((check) => check.ok).length;
const allRequiredOk = requiredChecks.every((check) => check.ok);

const summary = {
  projectRoot,
  platform: process.platform,
  checks,
  totals: {
    all: checks.length,
    passed: checks.filter((check) => check.ok).length,
    required: requiredChecks.length,
    requiredPassed: passedRequired,
    ready: allRequiredOk
  }
};

if (jsonMode) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(allRequiredOk ? 0 : 1);
}

console.log("=== FlexSim Station Console — Local Environment Check ===\n");
console.log(`Project: ${projectRoot}\n`);

for (const check of checks) {
  const status = check.ok ? "OK  " : "MISS";
  const required = check.required ? "" : " (optional)";
  console.log(`[${status}] ${check.id}${required}`);
  console.log(`       ${check.detail}`);
  if (!check.ok && check.fix) {
    console.log(`       Fix: ${check.fix}`);
  }
}

console.log(
  `\nSummary: ${summary.totals.passed}/${summary.totals.all} checks passed (${passedRequired}/${requiredChecks.length} required)`
);

if (allRequiredOk) {
  console.log("\nReady for local dev. Run: npm run dev");
  process.exit(0);
}

console.log("\nNot ready yet. Run: npm run setup:local");
process.exit(1);
