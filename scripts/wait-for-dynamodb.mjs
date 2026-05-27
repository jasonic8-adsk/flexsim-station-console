import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

const endpoint = process.env.DYNAMODB_ENDPOINT ?? "http://127.0.0.1:8000";
const maxAttempts = Number(process.env.DYNAMODB_WAIT_ATTEMPTS ?? 30);
const delayMs = Number(process.env.DYNAMODB_WAIT_DELAY_MS ?? 1000);

const client = new DynamoDBClient({
  endpoint,
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
  maxAttempts: 1
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log(`Waiting for DynamoDB Local at ${endpoint} ...`);

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    await client.send(new ListTablesCommand({ Limit: 1 }));
    console.log("DynamoDB Local is ready.");
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (attempt === maxAttempts) {
      console.error(`DynamoDB Local not ready after ${maxAttempts} attempts.`);
      console.error(`Last error: ${message}`);
      console.error("\nCheck:");
      console.error("  docker compose ps");
      console.error("  docker compose logs dynamodb");
      process.exit(1);
    }
    console.log(`  attempt ${attempt}/${maxAttempts} — not ready (${message})`);
    await sleep(delayMs);
  }
}
