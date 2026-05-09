import { getSupabaseClient } from "./supabase";

export type CandidateInvitePreview = {
  inviteId: string;
  referralId: string;
  status: string;
  expiresAt: string;
  claimedAt: string | null;
  completedAt: string | null;
  candidate: {
    name: string;
    email: string;
  };
  referral: {
    companyName: string;
    companySite: string;
    referrerName: string;
    referrerEmail: string;
    ycBatch: string | null;
    roleInterviewedFor: string;
    roundReached: string;
    whyNotHire: string;
    strengths: string[];
  } | null;
  profile: {
    id: string;
    fullName: string;
    email: string;
    linkedin: string | null;
    location: string | null;
    preferredRoles: string[];
    resumePath: string | null;
    introNote: string | null;
    consentConfirmed: boolean;
    profileStatus: string;
  } | null;
};

type CandidateInviteEnvelope = {
  invite: CandidateInvitePreview;
  success: boolean;
};

type CandidateResumeUploadEnvelope = {
  resumeUpload: {
    bucket: string;
    path: string;
    token: string;
  };
  success: boolean;
};

export type CandidateInviteLookup =
  | {
      token: string;
    }
  | {
      code: string;
      email: string;
    };

export type CandidateProfileInput = CandidateInviteLookup & {
  fullName: string;
  linkedin: string;
  location: string;
  preferredRoles: string[];
  resumePath: string;
  introNote: string;
  consentConfirmed: boolean;
};

export async function verifyCandidateInvite(input: CandidateInviteLookup) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke<CandidateInviteEnvelope>(
    "verify-candidate-invite",
    {
      body: input,
    },
  );

  if (error || !data?.invite) {
    throw new Error(await getFunctionErrorMessage(error, "Could not verify this invite."));
  }

  return data.invite;
}

export async function completeCandidateProfile(input: CandidateProfileInput) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke<CandidateInviteEnvelope>(
    "complete-candidate-profile",
    {
      body: input,
    },
  );

  if (error || !data?.invite) {
    throw new Error(
      await getFunctionErrorMessage(error, "Could not complete the candidate profile."),
    );
  }

  return data.invite;
}

export async function uploadCandidateResume(input: CandidateInviteLookup, file: File) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke<CandidateResumeUploadEnvelope>(
    "create-candidate-resume-upload",
    {
      body: {
        ...input,
        resumeFileName: file.name,
        resumeContentType: file.type,
      },
    },
  );

  if (error || !data?.resumeUpload) {
    throw new Error(await getFunctionErrorMessage(error, "Could not prepare the resume upload."));
  }

  const { error: uploadError } = await supabase.storage
    .from(data.resumeUpload.bucket)
    .uploadToSignedUrl(data.resumeUpload.path, data.resumeUpload.token, file, {
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  return data.resumeUpload.path;
}

async function getFunctionErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context;

    if (context instanceof Response) {
      try {
        const payload = await context.clone().json();

        if (payload && typeof payload === "object") {
          if ("error" in payload && typeof payload.error === "string" && payload.error.trim()) {
            return payload.error;
          }
        }
      } catch {
        const text = await context.text();
        if (text.trim()) {
          return text;
        }
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
