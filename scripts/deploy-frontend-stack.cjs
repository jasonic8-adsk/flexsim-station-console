const { spawnSync } = require("node:child_process");
const { loadDeployEnv } = require("./load-deploy-env.cjs");

const { projectRoot } = loadDeployEnv();

const stackName = process.env.FRONTEND_STACK_NAME ?? "flexsim-station-console-frontend";
const region = process.env.AWS_REGION ?? "us-east-1";
const bucketName = process.env.SITE_BUCKET_NAME;

if (!bucketName) {
  console.error("SITE_BUCKET_NAME is required in deploy.env");
  process.exit(1);
}

const templatePath = `${projectRoot}/infra/frontend.yaml`;

console.log(`[deploy:frontend-stack] Deploying "${stackName}"...`);

const result = spawnSync(
  "aws",
  [
    "cloudformation",
    "deploy",
    "--template-file",
    templatePath,
    "--stack-name",
    stackName,
    "--region",
    region,
    "--capabilities",
    "CAPABILITY_IAM",
    "--parameter-overrides",
    `SiteBucketName=${bucketName}`,
    "--no-fail-on-empty-changeset"
  ],
  { cwd: projectRoot, stdio: "inherit", shell: true }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("\n[deploy:frontend-stack] Stack outputs:");
spawnSync(
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

console.log(
  "\nUpdate deploy.env with WebsiteUrl, DistributionId, and SiteBucketName outputs, then run: npm run deploy:frontend"
);
