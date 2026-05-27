const { spawnSync, execSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

const windowsCandidates = [
  process.env.SAM_CLI_LOCATION,
  "C:\\Program Files\\Amazon\\AWSSAMCLI\\bin\\sam.cmd",
  path.join(process.env.LOCALAPPDATA ?? "", "Programs", "Amazon", "AWSSAMCLI", "bin", "sam.cmd")
].filter(Boolean);

function resolveSamCommand() {
  if (process.platform === "win32") {
    for (const candidate of windowsCandidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return "sam";
}

function quoteForCmd(value) {
  if (!/[\s"]/u.test(value)) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/run-sam.cjs <sam-args...>");
  process.exit(1);
}

const env = { ...process.env };
const samCommand = resolveSamCommand();

try {
  if (process.platform === "win32" && samCommand.endsWith(".cmd")) {
    const commandLine = [quoteForCmd(samCommand), ...args.map(quoteForCmd)].join(" ");
    execSync(commandLine, {
      stdio: "inherit",
      env,
      windowsHide: true
    });
  } else {
    const samDir = path.dirname(samCommand);
    if (samDir && existsSync(samDir)) {
      const prefix = `${samDir};`;
      env.Path = prefix + (env.Path ?? env.PATH ?? "");
      env.PATH = prefix + (env.PATH ?? env.Path ?? "");
    }

    const result = spawnSync(samCommand, args, {
      stdio: "inherit",
      env,
      shell: false,
      windowsHide: true
    });

    if (result.error) {
      throw result.error;
    }

    process.exit(result.status ?? 1);
  }
} catch (error) {
  if (error.status !== undefined) {
    process.exit(error.status);
  }

  console.error(error.message);
  console.error(
    "AWS SAM CLI not found. Install with: winget install Amazon.SAM-CLI"
  );
  process.exit(1);
}
