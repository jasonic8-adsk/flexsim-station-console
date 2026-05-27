import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";
import type { Readings } from "./constants.js";

const tableName = process.env.TABLE_NAME ?? "StationPlacements";

function createClient(): DynamoDBDocumentClient {
  // SAM local should always target local DynamoDB; this avoids accidental calls
  // to AWS when env var injection is missing or misconfigured.
  const endpoint =
    process.env.DYNAMODB_ENDPOINT ??
    (process.env.AWS_SAM_LOCAL ? "http://dynamodb:8000" : undefined);
  const client = new DynamoDBClient(
    endpoint
      ? {
          endpoint,
          region: process.env.AWS_REGION ?? "us-east-1",
          credentials: {
            accessKeyId: "local",
            secretAccessKey: "local"
          }
        }
      : {}
  );
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true }
  });
}

let docClient: DynamoDBDocumentClient | undefined;

function getDocClient(): DynamoDBDocumentClient {
  if (!docClient) {
    docClient = createClient();
  }
  return docClient;
}

export interface PlacementRecord {
  code: string;
  version: number;
  timestamp: string;
  readings: Readings;
  createdAt: string;
}

export async function getLatestPlacement(code: string): Promise<PlacementRecord | null> {
  const result = await getDocClient().send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "#code = :code",
      ExpressionAttributeNames: { "#code": "code" },
      ExpressionAttributeValues: { ":code": code },
      ScanIndexForward: false,
      Limit: 1
    })
  );

  const item = result.Items?.[0];
  if (!item) {
    return null;
  }

  return item as PlacementRecord;
}

export async function savePlacement(
  code: string,
  timestamp: string,
  readings: Readings
): Promise<PlacementRecord> {
  const latest = await getLatestPlacement(code);
  const version = (latest?.version ?? 0) + 1;
  const createdAt = new Date().toISOString();

  const record: PlacementRecord = {
    code,
    version,
    timestamp,
    readings,
    createdAt
  };

  await getDocClient().send(
    new PutCommand({
      TableName: tableName,
      Item: record
    })
  );

  return record;
}
