import type { APIGatewayProxyHandler } from "aws-lambda";
import { generateSessionCode } from "../lib/sessionCode.js";
import { errorResponse, jsonResponse, optionsResponse } from "../lib/response.js";

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return optionsResponse();
  }

  if (event.httpMethod !== "POST") {
    return errorResponse(405, "Method not allowed");
  }

  const code = generateSessionCode();
  return jsonResponse(201, { code });
};
