import { optionsResponse, errorResponse, jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import {
  candidateInviteExpiry,
  createCandidateClaimCode,
  createCandidateInviteToken,
  getPublicAppUrl,
  hashCandidateClaimCode,
  hashCandidateInviteToken,
  sendCandidateInviteEmail,
  sendFounderReferralReceiptEmail,
} from "../_shared/candidate-portal.ts";

const EMAIL_PATTERN = /^[^\s@]{3,}@[^\s@]+\.[^\s@]+$/i;
const COMPANY_SITE_PATTERN =
  /^(https?:\/\/)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(\/.*)?$/i;

type ReferralPayload = {
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed.");
  }

  const supabase = createAdminClient();
  let referralId: string | null = null;
  let inviteId: string | null = null;
  let inviteEmailSent = false;

  try {
    const payload = normalizePayload(await request.json());

    const { data, error } = await supabase
      .from("referrals")
      .insert({
        company_name: payload.companyName,
        company_site: payload.companySite,
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
        candidate_invite_status: "pending",
        candidate_profile_status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    referralId = data.id;

    const rawInviteToken = createCandidateInviteToken();
    const rawClaimCode = createCandidateClaimCode();
    const tokenHash = await hashCandidateInviteToken(rawInviteToken);
    const claimCodeHash = await hashCandidateClaimCode(rawClaimCode);
    const expiresAt = candidateInviteExpiry();

    const { data: inviteData, error: inviteError } = await supabase
      .from("candidate_invites")
      .insert({
        referral_id: referralId,
        candidate_email: payload.candidateEmail,
        candidate_name: payload.candidateName,
        token_hash: tokenHash,
        claim_code_hash: claimCodeHash,
        expires_at: expiresAt,
        status: "pending",
      })
      .select("id")
      .single();

    if (inviteError) {
      throw inviteError;
    }

    inviteId = inviteData.id;

    const claimUrl = `${getPublicAppUrl()}/candidate/claim?token=${encodeURIComponent(rawInviteToken)}`;

    await sendCandidateInviteEmail({
      to: payload.candidateEmail,
      candidateName: payload.candidateName,
      companyName: payload.companyName,
      referrerName: payload.referrerName,
      roleInterviewedFor: payload.roleInterviewedFor,
      claimUrl,
      claimCode: rawClaimCode,
    });

    inviteEmailSent = true;

    try {
      await sendFounderReferralReceiptEmail({
        to: payload.referrerEmail,
        companyName: payload.companyName,
        referrerName: payload.referrerName,
        candidateName: payload.candidateName,
        candidateEmail: payload.candidateEmail,
        roleInterviewedFor: payload.roleInterviewedFor,
      });
    } catch (error) {
      console.error("submit-referral founder receipt warning", { error });
    }

    const [inviteUpdate, referralUpdate] = await Promise.all([
      supabase
        .from("candidate_invites")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", inviteId)
        .select("id")
        .single(),
      supabase
        .from("referrals")
        .update({
          candidate_invite_status: "sent",
          candidate_invited_at: new Date().toISOString(),
        })
        .eq("id", referralId)
        .select("id")
        .single(),
    ]);

    if (inviteUpdate.error || referralUpdate.error) {
      console.error("submit-referral status update warning", {
        inviteUpdateError: inviteUpdate.error,
        referralUpdateError: referralUpdate.error,
      });
    }

    return jsonResponse(200, { referralId: data.id, success: true });
  } catch (error) {
    if (!inviteEmailSent && inviteId) {
      await supabase.from("candidate_invites").delete().eq("id", inviteId);
    }

    if (!inviteEmailSent && referralId) {
      await supabase.from("referrals").delete().eq("id", referralId);
    }

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
  const companySite = maybePayload.companySite?.trim().toLowerCase();
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
  if (!companySite || !COMPANY_SITE_PATTERN.test(companySite)) {
    throw new Error("A valid company site is required.");
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
    companySite,
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
