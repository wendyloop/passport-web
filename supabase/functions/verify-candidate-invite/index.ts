import { formatCandidateInvite, loadCandidateInviteByToken } from "../_shared/candidate-portal.ts";
import { errorResponse, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed.");
  }

  try {
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();

    if (!token) {
      throw new Error("Invite token is required.");
    }

    const supabase = createAdminClient();
    const invite = await loadCandidateInviteByToken(supabase, token);

    if (!invite.referrals) {
      throw new Error("This referral record could not be found.");
    }

    if (invite.status === "pending" || invite.status === "sent") {
      const claimedAt = invite.claimed_at ?? new Date().toISOString();

      await Promise.all([
        supabase
          .from("candidate_invites")
          .update({
            status: "claimed",
            claimed_at: claimedAt,
          })
          .eq("id", invite.id),
        supabase
          .from("referrals")
          .update({
            candidate_invite_status: "claimed",
            candidate_claimed_at: claimedAt,
          })
          .eq("id", invite.referral_id),
      ]);

      invite.status = "claimed";
      invite.claimed_at = claimedAt;
      invite.referrals.candidate_invite_status = "claimed";
    }

    return jsonResponse(200, {
      success: true,
      invite: formatCandidateInvite(invite),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify the invite.";
    console.error("verify-candidate-invite failed", { message, error });
    return errorResponse(400, message);
  }
});
