import type { APIGatewayProxyResult } from "aws-lambda";

function corsHeaders(): Record<string, string> {
  const origin = process.env.ALLOWED_ORIGIN ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS"
  };
}

export function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    },
    body: JSON.stringify(body)
  };
}

export function errorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return jsonResponse(statusCode, { error: message });
}

export function optionsResponse(): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers: corsHeaders(),
    body: ""
  };
}
