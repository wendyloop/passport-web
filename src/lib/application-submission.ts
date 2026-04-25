import { getSupabaseClient } from "./supabase";

type SubmissionInput = {
  name: string;
  email: string;
  linkedin: string;
  interviewCategories: string[];
  interviewDetails: string;
  resume: File;
  video: File;
};

type CreateApplicationResponse = {
  applicationId: string;
  resumeUpload: {
    bucket: string;
    path: string;
    token: string;
  };
  videoUpload: {
    bucket: string;
    path: string;
    token: string;
  };
};

type FinalizeApplicationResponse = {
  success: boolean;
  parseStatus: "completed" | "failed";
  parseError?: string;
};

export async function submitApplication(input: SubmissionInput) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.functions.invoke<CreateApplicationResponse>(
    "create-application",
    {
      body: {
        name: input.name,
        email: input.email,
        linkedin: input.linkedin || null,
        interviewCategories: input.interviewCategories,
        interviewDetails: input.interviewDetails || null,
        resumeFileName: input.resume.name,
        resumeContentType: input.resume.type,
        videoFileName: input.video.name,
        videoContentType: input.video.type,
      },
    },
  );

  if (error || !data) {
    throw new Error(await getFunctionErrorMessage(error, "Could not create the application."));
  }

  await uploadToSignedUrl(
    data.resumeUpload.bucket,
    data.resumeUpload.path,
    data.resumeUpload.token,
    input.resume,
  );
  await uploadToSignedUrl(
    data.videoUpload.bucket,
    data.videoUpload.path,
    data.videoUpload.token,
    input.video,
  );

  const { data: finalized, error: finalizeError } =
    await supabase.functions.invoke<FinalizeApplicationResponse>("finalize-application", {
      body: {
        applicationId: data.applicationId,
      },
    });

  if (finalizeError || !finalized) {
    throw new Error(
      await getFunctionErrorMessage(finalizeError, "Could not finalize the application."),
    );
  }

  return finalized;
}

async function uploadToSignedUrl(bucket: string, path: string, token: string, file: File) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
    contentType: file.type || undefined,
  });

  if (error) {
    throw new Error(error.message);
  }
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

          if (
            "message" in payload &&
            typeof payload.message === "string" &&
            payload.message.trim()
          ) {
            return payload.message;
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
