const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, "deploy.env");

if (!existsSync(envPath)) {
  console.error("Missing deploy.env. Copy deploy.env.example to deploy.env and configure it.");
  process.exit(1);
}

const lines = readFileSync(envPath, "utf8").split(/\r?\n/u);

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.startsWith("#")) {
    continue;
  }

  const separator = trimmed.indexOf("=");
  if (separator === -1) {
    continue;
  }

  const key = trimmed.slice(0, separator).trim();
  const value = trimmed.slice(separator + 1).trim();
  if (key.length > 0 && process.env[key] === undefined) {
    process.env[key] = value;
  }
}

module.exports = { projectRoot, envPath };
