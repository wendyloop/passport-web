import { corsHeaders } from "./cors.ts";

export function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export function optionsResponse() {
  return new Response("ok", { headers: corsHeaders });
}

export function errorResponse(status: number, message: string, details?: unknown) {
  return jsonResponse(status, {
    error: message,
    details: details ?? null,
  });
}
