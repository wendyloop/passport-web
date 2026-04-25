import { optionsResponse, errorResponse, jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { markParseFailure, parseResumeForApplication } from "../_shared/resume-parser.ts";
import { ensureObjectExists } from "../_shared/storage.ts";

type FinalizePayload = {
  applicationId: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed.");
  }

  try {
    const { applicationId } = (await request.json()) as FinalizePayload;

    if (!applicationId) {
      return errorResponse(400, "applicationId is required.");
    }

    const supabase = createAdminClient();
    const { data: application, error: selectError } = await supabase
      .from("applications")
      .select("id, resume_path, video_path")
      .eq("id", applicationId)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    if (!application) {
      return errorResponse(404, "Application not found.");
    }

    await ensureObjectExists(supabase, "resumes", application.resume_path);
    await ensureObjectExists(supabase, "videos", application.video_path);

    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        resume_parse_status: "pending",
        resume_parse_error: null,
      })
      .eq("id", applicationId);

    if (updateError) {
      throw updateError;
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
      console.error("finalize-application parse failed", {
        applicationId,
        message,
        error,
      });
      await markParseFailure(applicationId, message);

      return jsonResponse(200, {
        success: true,
        parseStatus: "failed",
        parseError: message,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to finalize application.";
    console.error("finalize-application failed", {
      message,
      error,
    });
    return errorResponse(400, message);
  }
});
