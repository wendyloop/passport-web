import { errorResponse, jsonResponse, optionsResponse } from "../_shared/http.ts";
import {
  buildCandidateResumePath,
  getCandidateResumeBucket,
  getCandidateResumeExtension,
  loadCandidateInviteByCode,
  loadCandidateInviteByToken,
} from "../_shared/candidate-portal.ts";
import { createAdminClient } from "../_shared/supabase.ts";

type CandidateResumeUploadPayload = {
  code?: string;
  email?: string;
  resumeContentType?: string;
  resumeFileName?: string;
  token?: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed.");
  }

  try {
    const payload = normalizePayload(await request.json());
    const supabase = createAdminClient();
    const invite = payload.token
      ? await loadCandidateInviteByToken(supabase, payload.token)
      : await loadCandidateInviteByCode(supabase, payload.email, payload.code);

    if (!invite.referrals) {
      throw new Error("This referral record could not be found.");
    }

    const bucket = getCandidateResumeBucket();
    const path = buildCandidateResumePath(invite.id, payload.resumeExtension);
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

    if (error || !data) {
      throw error ?? new Error("Could not prepare the resume upload.");
    }

    return jsonResponse(200, {
      resumeUpload: {
        bucket,
        path,
        token: data.token,
      },
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare the resume upload.";
    console.error("create-candidate-resume-upload failed", { message, error });
    return errorResponse(400, message);
  }
});

function normalizePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be an object.");
  }

  const input = payload as CandidateResumeUploadPayload;
  const token = input.token?.trim();
  const email = input.email?.trim().toLowerCase();
  const code = input.code?.trim();
  const resumeFileName = input.resumeFileName?.trim();
  const resumeContentType = input.resumeContentType?.trim();

  if (!token && !(email && code)) {
    throw new Error("Invite token or email and claim code are required.");
  }

  if (!resumeFileName || !resumeContentType) {
    throw new Error("Resume file metadata is required.");
  }

  const resumeExtension = getCandidateResumeExtension(resumeFileName, resumeContentType);

  return {
    code: code ?? "",
    email: email ?? "",
    resumeContentType,
    resumeExtension,
    resumeFileName,
    token,
  };
}
