import { optionsResponse, errorResponse, jsonResponse } from "../_shared/http.ts";
import { markParseFailure, parseResumeForApplication } from "../_shared/resume-parser.ts";

type ParsePayload = {
  applicationId: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed.");
  }

  const authorization = request.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authorization || !serviceRoleKey || authorization !== `Bearer ${serviceRoleKey}`) {
    return errorResponse(401, "Unauthorized.");
  }

  try {
    const { applicationId } = (await request.json()) as ParsePayload;

    if (!applicationId) {
      return errorResponse(400, "applicationId is required.");
    }

    try {
      const parsed = await parseResumeForApplication(applicationId);
      return jsonResponse(200, {
        success: true,
        parseStatus: "completed",
        parsed,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resume parsing failed.";
      console.error("parse-application failed", {
        applicationId,
        message,
        error,
      });
      await markParseFailure(applicationId, message);

      return errorResponse(500, message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to parse application.";
    console.error("parse-application request failed", {
      message,
      error,
    });
    return errorResponse(400, message);
  }
});
