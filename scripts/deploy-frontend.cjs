const { spawnSync } = require("node:child_process");
const { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const { loadDeployEnv } = require("./load-deploy-env.cjs");

const { projectRoot } = loadDeployEnv();

const region = process.env.AWS_REGION ?? "us-east-1";
const apiUrl = process.env.API_URL;
const bucket = process.env.FRONTEND_BUCKET;
const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;

if (!apiUrl) {
  console.error("API_URL is required in deploy.env (from backend stack output ApiUrl).");
  process.exit(1);
}

if (!bucket) {
  console.error("FRONTEND_BUCKET is required in deploy.env (from frontend stack output SiteBucketName).");
  process.exit(1);
}

if (!distributionId) {
  console.error(
    "CLOUDFRONT_DISTRIBUTION_ID is required in deploy.env (from frontend stack output DistributionId)."
  );
  process.exit(1);
}

const stagingDir = path.join(projectRoot, ".deploy-frontend");
const apiBase = apiUrl.replace(/\/$/, "");

if (existsSync(stagingDir)) {
  rmSync(stagingDir, { recursive: true, force: true });
}
mkdirSync(stagingDir, { recursive: true });
cpSync(path.join(projectRoot, "frontend"), stagingDir, { recursive: true });
writeFileSync(path.join(stagingDir, "config.json"), `${JSON.stringify({ apiBase }, null, 2)}\n`, "utf8");

console.log(`[deploy:frontend] Staged site with apiBase=${apiBase}`);
console.log(`[deploy:frontend] Syncing to s3://${bucket} ...`);

const syncResult = spawnSync(
  "aws",
  ["s3", "sync", stagingDir, `s3://${bucket}`, "--delete", "--region", region],
  { cwd: projectRoot, stdio: "inherit", shell: true }
);

if (syncResult.status !== 0) {
  process.exit(syncResult.status ?? 1);
}

console.log(`[deploy:frontend] Invalidating CloudFront cache (${distributionId}) ...`);
const invalidateResult = spawnSync(
  "aws",
  [
    "cloudfront",
    "create-invalidation",
    "--distribution-id",
    distributionId,
    "--paths",
    "/*"
  ],
  { cwd: projectRoot, stdio: "inherit", shell: true }
);

if (invalidateResult.status !== 0) {
  process.exit(invalidateResult.status ?? 1);
}

const siteUrl = process.env.FRONTEND_URL ?? "(see CloudFormation WebsiteUrl output)";
console.log(`\n[deploy:frontend] Done. Open: ${siteUrl}`);
