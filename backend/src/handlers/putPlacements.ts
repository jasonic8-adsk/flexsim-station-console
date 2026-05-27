import type { APIGatewayProxyHandler } from "aws-lambda";
import { savePlacement } from "../lib/dynamodb.js";
import {
  formatPiTimestamp,
  isValidSessionCode,
  validateReadings
} from "../lib/validation.js";
import { errorResponse, jsonResponse, optionsResponse } from "../lib/response.js";

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return optionsResponse();
  }

  if (event.httpMethod !== "PUT") {
    return errorResponse(405, "Method not allowed");
  }

  const code = event.pathParameters?.code;
  if (!isValidSessionCode(code)) {
    return errorResponse(400, "Invalid session code");
  }

  let body: unknown;
  try {
    body = event.body ? JSON.parse(event.body) : null;
  } catch {
    return errorResponse(400, "Invalid JSON body");
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse(400, "Request body must be an object");
  }

  const payload = body as { readings?: unknown; timestamp?: unknown };
  const readingsResult = validateReadings(payload.readings);
  if (!readingsResult.ok) {
    return errorResponse(400, readingsResult.error);
  }

  const timestamp =
    typeof payload.timestamp === "string" && payload.timestamp.length > 0
      ? payload.timestamp
      : formatPiTimestamp();

  try {
    const record = await savePlacement(code, timestamp, readingsResult.readings);
    return jsonResponse(200, {
      code: record.code,
      version: record.version,
      timestamp: record.timestamp,
      readings: record.readings
    });
  } catch (error) {
    console.error("putPlacements failed:", error);
    return errorResponse(500, "Internal server error");
  }
};
