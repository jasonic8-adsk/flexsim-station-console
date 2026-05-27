import {
  CreateTableCommand,
  DynamoDBClient,
  DescribeTableCommand,
  ResourceInUseException
} from "@aws-sdk/client-dynamodb";

const endpoint = process.env.DYNAMODB_ENDPOINT ?? "http://127.0.0.1:8000";
const tableName = process.env.TABLE_NAME ?? "StationPlacements";

const client = new DynamoDBClient({
  endpoint,
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: "local",
    secretAccessKey: "local"
  },
  maxAttempts: 3
});

try {
  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [
        { AttributeName: "code", AttributeType: "S" },
        { AttributeName: "version", AttributeType: "N" }
      ],
      KeySchema: [
        { AttributeName: "code", KeyType: "HASH" },
        { AttributeName: "version", KeyType: "RANGE" }
      ]
    })
  );
  console.log(`Created table: ${tableName}`);
} catch (error) {
  if (error instanceof ResourceInUseException) {
    console.log(`Table already exists: ${tableName}`);
  } else {
    console.error("Failed to create table:", error);
    process.exit(1);
  }
}

await client.send(new DescribeTableCommand({ TableName: tableName }));
console.log(`Verified table: ${tableName} at ${endpoint}`);
