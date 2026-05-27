import type { APIGatewayProxyHandler } from "aws-lambda";
import { getLatestPlacement } from "../lib/dynamodb.js";
import { isValidSessionCode } from "../lib/validation.js";
import { errorResponse, jsonResponse, optionsResponse } from "../lib/response.js";

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return optionsResponse();
  }

  if (event.httpMethod !== "GET") {
    return errorResponse(405, "Method not allowed");
  }

  const code = event.pathParameters?.code;
  if (!isValidSessionCode(code)) {
    return errorResponse(400, "Invalid session code");
  }

  try {
    const record = await getLatestPlacement(code);
    if (!record) {
      return errorResponse(404, "No configuration found for this session code");
    }

    return jsonResponse(200, {
      timestamp: record.timestamp,
      readings: record.readings
    });
  } catch (error) {
    console.error("getPlacements failed:", error);
    return errorResponse(500, "Internal server error");
  }
};
