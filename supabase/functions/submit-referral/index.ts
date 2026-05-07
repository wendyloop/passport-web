import { optionsResponse, errorResponse, jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

type ReferralPayload = {
  companyName: string;
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
    const { data, error } = await supabase
      .from("referrals")
      .insert({
        company_name: payload.companyName,
        referrer_name: payload.referrerName,
        referrer_email: payload.referrerEmail,
        yc_batch: payload.ycBatch,
        candidate_name: payload.candidateName,
        candidate_email: payload.candidateEmail,
        role_interviewed_for: payload.roleInterviewedFor,
        round_reached: payload.roundReached,
        why_not_hire: payload.whyNotHire,
        exceptional_why: payload.exceptionalWhy,
        strengths: payload.strengths,
        founders_note: payload.foundersNote,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse(200, { referralId: data.id, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not submit the referral.";
    console.error("submit-referral failed", { message, error });
    return errorResponse(400, message);
  }
});

function normalizePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be an object.");
  }

  const maybePayload = payload as Partial<ReferralPayload>;
  const companyName = maybePayload.companyName?.trim();
  const referrerName = maybePayload.referrerName?.trim();
  const referrerEmail = maybePayload.referrerEmail?.trim().toLowerCase();
  const ycBatch = maybePayload.ycBatch?.trim();
  const candidateName = maybePayload.candidateName?.trim();
  const candidateEmail = maybePayload.candidateEmail?.trim().toLowerCase();
  const roleInterviewedFor = maybePayload.roleInterviewedFor?.trim();
  const roundReached = maybePayload.roundReached?.trim();
  const whyNotHire = maybePayload.whyNotHire?.trim();
  const exceptionalWhy = maybePayload.exceptionalWhy?.trim();
  const foundersNote = maybePayload.foundersNote?.trim();
  const strengths = Array.from(
    new Set((maybePayload.strengths ?? []).map((value) => value.trim()).filter(Boolean)),
  );

  if (!companyName) {
    throw new Error("Company name is required.");
  }
  if (!referrerName) {
    throw new Error("Your name is required.");
  }
  if (!referrerEmail || !EMAIL_PATTERN.test(referrerEmail)) {
    throw new Error("A valid referrer email is required.");
  }
  if (!ycBatch) {
    throw new Error("YC batch is required.");
  }
  if (!candidateName) {
    throw new Error("Candidate name is required.");
  }
  if (!candidateEmail || !EMAIL_PATTERN.test(candidateEmail)) {
    throw new Error("A valid candidate email is required.");
  }
  if (!roleInterviewedFor) {
    throw new Error("Role interviewed for is required.");
  }
  if (!roundReached) {
    throw new Error("Round reached is required.");
  }
  if (!whyNotHire) {
    throw new Error("Why not hire is required.");
  }
  if (!exceptionalWhy) {
    throw new Error("What made them exceptional is required.");
  }
  if (!strengths.length) {
    throw new Error("Add at least one strength.");
  }
  if (!foundersNote) {
    throw new Error("Founder's note is required.");
  }

  return {
    companyName,
    referrerName,
    referrerEmail,
    ycBatch,
    candidateName,
    candidateEmail,
    roleInterviewedFor,
    roundReached,
    whyNotHire,
    exceptionalWhy,
    strengths,
    foundersNote,
  };
}
