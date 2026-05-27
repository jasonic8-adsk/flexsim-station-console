import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

const endpoint = process.env.DYNAMODB_ENDPOINT ?? "http://127.0.0.1:8000";
const tableName = process.env.TABLE_NAME ?? "StationPlacements";

const client = new DynamoDBClient({
  endpoint,
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: { accessKeyId: "local", secretAccessKey: "local" }
});

try {
  const result = await client.send(new DescribeTableCommand({ TableName: tableName }));
  console.log(`OK: table "${tableName}" exists at ${endpoint}`);
  console.log(`  Status: ${result.Table?.TableStatus}`);
} catch (error) {
  console.error(`FAILED: cannot reach table "${tableName}" at ${endpoint}`);
  console.error(error.message);
  process.exit(1);
}
