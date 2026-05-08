import { getSupabaseClient } from "./supabase";

export type ReferralSubmissionInput = {
  companyName: string;
  companySite: string;
  referrerName: string;
  referrerEmail: string;
  ycBatch: string;
  candidateName: string;
  candidateEmail: string;
  roleInterviewedFor: string;
  roundReached: string;
  whyNotHire: string;
  exceptionalWhy: string;
  strengths: string[];
  foundersNote: string;
};

export async function submitReferral(input: ReferralSubmissionInput) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke<{
    referralId: string;
    success: boolean;
  }>("submit-referral", {
    body: input,
  });

  if (error || !data) {
    throw new Error(await getFunctionErrorMessage(error, "Could not submit the referral."));
  }

  return data;
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
