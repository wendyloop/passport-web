import { formatCandidateInvite, loadCandidateInviteByToken } from "../_shared/candidate-portal.ts";
import { errorResponse, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";

type CandidateProfilePayload = {
  token?: string;
  fullName?: string;
  linkedin?: string;
  location?: string;
  preferredRoles?: string[];
  introNote?: string;
  consentConfirmed?: boolean;
};

const LINKEDIN_PATTERN = /^https?:\/\/(www\.)?linkedin\.com\/.+/i;

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
    const invite = await loadCandidateInviteByToken(supabase, payload.token);

    if (!invite.referrals) {
      throw new Error("This referral record could not be found.");
    }

    const existingProfile = invite.candidate_profiles?.[0] ?? null;

    const { data, error } = await supabase
      .from("candidate_profiles")
      .upsert(
        {
          invite_id: invite.id,
          referral_id: invite.referral_id,
          full_name: payload.fullName,
          email: invite.candidate_email,
          linkedin: payload.linkedin,
          location: payload.location,
          preferred_roles: payload.preferredRoles,
          intro_note: payload.introNote,
          consent_confirmed: payload.consentConfirmed,
          profile_status: "completed",
        },
        {
          onConflict: "invite_id",
        },
      )
      .select(
        "id, full_name, email, linkedin, location, preferred_roles, intro_note, consent_confirmed, profile_status",
      )
      .single();

    if (error) {
      throw error;
    }

    const now = new Date().toISOString();

    await Promise.all([
      supabase
        .from("candidate_invites")
        .update({
          status: "profile_completed",
          claimed_at: invite.claimed_at ?? now,
          completed_at: now,
        })
        .eq("id", invite.id),
      supabase
        .from("referrals")
        .update({
          candidate_invite_status: "claimed",
          candidate_profile_status: "completed",
          candidate_claimed_at: invite.claimed_at ?? now,
          candidate_profile_completed_at: now,
        })
        .eq("id", invite.referral_id),
    ]);

    invite.status = "profile_completed";
    invite.claimed_at = invite.claimed_at ?? now;
    invite.completed_at = now;
    invite.candidate_profiles = [
      {
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        linkedin: data.linkedin,
        location: data.location,
        preferred_roles: data.preferred_roles,
        intro_note: data.intro_note,
        consent_confirmed: data.consent_confirmed,
        profile_status: data.profile_status,
      },
    ];

    return jsonResponse(200, {
      success: true,
      created: !existingProfile,
      invite: formatCandidateInvite(invite),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not complete the candidate profile.";
    console.error("complete-candidate-profile failed", { message, error });
    return errorResponse(400, message);
  }
});

function normalizePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be an object.");
  }

  const input = payload as CandidateProfilePayload;
  const token = input.token?.trim();
  const fullName = input.fullName?.trim();
  const linkedin = input.linkedin?.trim() || null;
  const location = input.location?.trim() || null;
  const introNote = input.introNote?.trim() || null;
  const preferredRoles = Array.from(
    new Set((input.preferredRoles ?? []).map((value) => value.trim()).filter(Boolean)),
  );
  const consentConfirmed = Boolean(input.consentConfirmed);

  if (!token) {
    throw new Error("Invite token is required.");
  }

  if (!fullName) {
    throw new Error("Full name is required.");
  }

  if (linkedin && !LINKEDIN_PATTERN.test(linkedin)) {
    throw new Error("Enter a valid LinkedIn URL.");
  }

  if (!consentConfirmed) {
    throw new Error("Consent is required before submitting your profile.");
  }

  return {
    token,
    fullName,
    linkedin,
    location,
    preferredRoles,
    introNote,
    consentConfirmed,
  };
}
