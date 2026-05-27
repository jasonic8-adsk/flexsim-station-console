const { spawnSync } = require("node:child_process");
const { loadDeployEnv } = require("./load-deploy-env.cjs");

const { projectRoot } = loadDeployEnv();

const stackName = process.env.BACKEND_STACK_NAME ?? "flexsim-station-console";
const region = process.env.AWS_REGION ?? "us-east-1";
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "*";

console.log(`[deploy:backend] Building Lambda bundles...`);
const buildResult = spawnSync(process.execPath, ["scripts/prepare-sam-build.cjs"], {
  cwd: projectRoot,
  stdio: "inherit"
});

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

console.log(`[deploy:backend] Deploying stack "${stackName}" to ${region}...`);

const samArgs = [
  "deploy",
  "--no-build",
  "--stack-name",
  stackName,
  "--region",
  region,
  "--capabilities",
  "CAPABILITY_IAM",
  "--resolve-s3",
  "--no-confirm-changeset",
  "--no-fail-on-empty-changeset",
  "--parameter-overrides",
  `AllowedOrigin=${allowedOrigin}`
];

const deployResult = spawnSync(process.execPath, ["scripts/run-sam.cjs", ...samArgs], {
  cwd: projectRoot,
  stdio: "inherit"
});

if (deployResult.status !== 0) {
  process.exit(deployResult.status ?? 1);
}

console.log("\n[deploy:backend] Fetching stack outputs...");
const outputsResult = spawnSync(
  "aws",
  [
    "cloudformation",
    "describe-stacks",
    "--stack-name",
    stackName,
    "--region",
    region,
    "--query",
    "Stacks[0].Outputs",
    "--output",
    "table"
  ],
  { cwd: projectRoot, stdio: "inherit", shell: true }
);

if (outputsResult.status !== 0) {
  process.exit(outputsResult.status ?? 1);
}

console.log(
  "\n[deploy:backend] Done. Copy ApiUrl into deploy.env as API_URL, then set ALLOWED_ORIGIN to your CloudFront URL and redeploy if needed."
);
