import { optionsResponse, errorResponse, jsonResponse } from "../_shared/http.ts";
import {
  buildResumePath,
  buildVideoPath,
  getStorageBuckets,
  normalizeCreatePayload,
} from "../_shared/application.ts";
import { createAdminClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed.");
  }

  try {
    const payload = normalizeCreatePayload(await request.json());
    const supabase = createAdminClient();

    const { data: inserted, error: insertError } = await supabase
      .from("applications")
      .insert({
        name: payload.name,
        email: payload.email,
        linkedin: payload.linkedin,
        interview_categories: payload.interviewCategories,
        interview_details: payload.interviewDetails,
        resume_path: "pending",
        video_path: "pending",
        status: "draft",
        resume_parse_status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      throw insertError;
    }

    const resumePath = buildResumePath(inserted.id, payload.resumeExtension);
    const videoPath = buildVideoPath(inserted.id, payload.videoExtension);

    const { resumeBucket, videoBucket } = getStorageBuckets();

    const [
      { data: resumeUpload, error: resumeUploadError },
      { data: videoUpload, error: videoUploadError },
    ] = await Promise.all([
      supabase.storage.from(resumeBucket).createSignedUploadUrl(resumePath),
      supabase.storage.from(videoBucket).createSignedUploadUrl(videoPath),
    ]);

    if (resumeUploadError) {
      throw resumeUploadError;
    }

    if (videoUploadError) {
      throw videoUploadError;
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update({
        resume_path: resumePath,
        video_path: videoPath,
      })
      .eq("id", inserted.id);

    if (updateError) {
      throw updateError;
    }

    return jsonResponse(200, {
      applicationId: inserted.id,
      resumeUpload: {
        bucket: resumeBucket,
        path: resumePath,
        token: resumeUpload.token,
      },
      videoUpload: {
        bucket: videoBucket,
        path: videoPath,
        token: videoUpload.token,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create application.";
    return errorResponse(400, message);
  }
});
