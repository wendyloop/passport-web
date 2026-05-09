import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";
import { requireEnv } from "./supabase.ts";

type CandidateInviteRecord = {
  id: string;
  referral_id: string;
  candidate_email: string;
  candidate_name: string;
  status: string;
  token_hash: string;
  claim_code_hash: string;
  expires_at: string;
  claimed_at: string | null;
  completed_at: string | null;
  referrals: {
    id: string;
    company_name: string;
    company_site: string;
    referrer_name: string;
    referrer_email: string;
    yc_batch: string | null;
    candidate_name: string;
    candidate_email: string;
    role_interviewed_for: string;
    round_reached: string;
    why_not_hire: string;
    exceptional_why: string;
    strengths: string[];
    founders_note: string;
    candidate_invite_status: string;
    candidate_profile_status: string;
  } | null;
  candidate_profiles:
    | {
        id: string;
        full_name: string;
        email: string;
        linkedin: string | null;
        location: string | null;
        preferred_roles: string[];
        resume_path: string | null;
        intro_note: string | null;
        consent_confirmed: boolean;
        profile_status: string;
      }[]
    | null;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const CANDIDATE_RESUME_BUCKET = "candidate-resumes";

export function createCandidateInviteToken() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

export function createCandidateClaimCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashCandidateInviteToken(token: string) {
  const input = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", input);

  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashCandidateClaimCode(code: string) {
  return hashCandidateInviteToken(code);
}

export function candidateInviteExpiry(days = 7) {
  return new Date(Date.now() + days * DAY_IN_MS).toISOString();
}

export function getCandidateResumeBucket() {
  return CANDIDATE_RESUME_BUCKET;
}

export function buildCandidateResumePath(inviteId: string, extension: string) {
  return `candidate-profiles/${inviteId}/resume.${extension}`;
}

export function getCandidateResumeExtension(fileName: string, contentType: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (contentType === "application/pdf" || extension === "pdf") {
    return "pdf";
  }

  if (
    contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx"
  ) {
    return "docx";
  }

  throw new Error("Resume must be a PDF or DOCX file.");
}

export function getPublicAppUrl() {
  return requireEnv("PUBLIC_APP_URL").replace(/\/$/, "");
}

export async function sendCandidateInviteEmail(input: {
  to: string;
  candidateName: string;
  companyName: string;
  referrerName: string;
  roleInterviewedFor: string;
  claimUrl: string;
  claimCode: string;
}) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("RESEND_FROM_EMAIL");

  const firstName = input.candidateName.split(" ")[0] || input.candidateName;

  const html = `
    <div style="font-family: Syne, Arial, sans-serif; background:#fbf9f4; padding:32px; color:#171a22;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #dbe2e7; border-radius:20px; overflow:hidden;">
        <div style="padding:24px 28px; border-bottom:1px solid #e7edf2;">
          <div style="font-family:'DM Serif Display', Georgia, serif; font-size:28px; font-weight:700;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:999px; background:#1d9e75; margin-right:8px; vertical-align:middle;"></span>
            Passport
          </div>
          <div style="margin-top:10px; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#667085;">
            Peer Referral Network
          </div>
        </div>
        <div style="padding:28px;">
          <h1 style="font-family:'DM Serif Display', Georgia, serif; font-size:34px; line-height:1.05; margin:0 0 16px;">
            ${escapeHtml(firstName)}, you've been referred.
          </h1>
          <p style="font-size:16px; line-height:1.7; color:#667085; margin:0 0 18px;">
            ${escapeHtml(input.referrerName)} at ${escapeHtml(input.companyName)} referred you to Passport after interviewing you for ${escapeHtml(input.roleInterviewedFor)}.
          </p>
          <p style="font-size:16px; line-height:1.7; color:#667085; margin:0 0 24px;">
            Create your profile so other verified founders can discover you with the right context.
          </p>
          <div style="margin:0 0 22px; padding:16px 18px; border:1px solid #dbe2e7; border-radius:14px; background:#fbfcfd;">
            <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#667085; margin-bottom:8px;">
              Claim code
            </div>
            <div style="font-family:'DM Mono', monospace; font-size:28px; color:#171a22;">
              ${escapeHtml(input.claimCode)}
            </div>
          </div>
          <a href="${input.claimUrl}" style="display:inline-block; background:#1d9e75; color:#ffffff; text-decoration:none; padding:14px 22px; border-radius:12px; font-weight:600;">
            Create my profile
          </a>
          <p style="margin:22px 0 0; font-size:13px; line-height:1.7; color:#667085;">
            If the button doesn't work, you can also open Passport and enter your email with the code above. Or copy and paste this link into your browser:<br />
            <span style="word-break:break-all;">${escapeHtml(input.claimUrl)}</span>
          </p>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Hi ${firstName},`,
    "",
    `${input.referrerName} at ${input.companyName} referred you to Passport after interviewing you for ${input.roleInterviewedFor}.`,
    "",
    `Claim code: ${input.claimCode}`,
    "",
    "Create your profile here:",
    input.claimUrl,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `${input.referrerName} referred you to Passport`,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    throw new Error(
      `Could not send candidate invite email.${payload ? ` ${JSON.stringify(payload)}` : ""}`,
    );
  }
}

export async function sendFounderReferralReceiptEmail(input: {
  to: string;
  companyName: string;
  referrerName: string;
  candidateName: string;
  candidateEmail: string;
  roleInterviewedFor: string;
}) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("RESEND_FROM_EMAIL");

  const firstName = input.referrerName.split(" ")[0] || input.referrerName;

  const html = `
    <div style="font-family: Syne, Arial, sans-serif; background:#fbf9f4; padding:32px; color:#171a22;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #dbe2e7; border-radius:20px; overflow:hidden;">
        <div style="padding:24px 28px; border-bottom:1px solid #e7edf2;">
          <div style="font-family:'DM Serif Display', Georgia, serif; font-size:28px; font-weight:700;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:999px; background:#1d9e75; margin-right:8px; vertical-align:middle;"></span>
            Passport
          </div>
          <div style="margin-top:10px; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#667085;">
            Peer Referral Network
          </div>
        </div>
        <div style="padding:28px;">
          <h1 style="font-family:'DM Serif Display', Georgia, serif; font-size:34px; line-height:1.05; margin:0 0 16px;">
            Referral received.
          </h1>
          <p style="font-size:16px; line-height:1.7; color:#667085; margin:0 0 18px;">
            Thanks ${escapeHtml(firstName)}. We received your Passport referral from ${escapeHtml(
              input.companyName,
            )} for ${escapeHtml(input.candidateName)}.
          </p>
          <div style="margin:0 0 22px; padding:16px 18px; border:1px solid #dbe2e7; border-radius:14px; background:#fbfcfd;">
            <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#667085; margin-bottom:10px;">
              Referral summary
            </div>
            <div style="font-size:15px; line-height:1.8; color:#171a22;">
              <div><strong>Candidate:</strong> ${escapeHtml(input.candidateName)}</div>
              <div><strong>Email:</strong> ${escapeHtml(input.candidateEmail)}</div>
              <div><strong>Role:</strong> ${escapeHtml(input.roleInterviewedFor)}</div>
            </div>
          </div>
          <p style="font-size:15px; line-height:1.7; color:#667085; margin:0;">
            We’ve emailed the candidate with their private claim link and code so they can opt in and create their Passport profile.
          </p>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Hi ${firstName},`,
    "",
    `We received your Passport referral from ${input.companyName}.`,
    "",
    `Candidate: ${input.candidateName}`,
    `Email: ${input.candidateEmail}`,
    `Role: ${input.roleInterviewedFor}`,
    "",
    "We have emailed the candidate with their private claim link and code so they can opt in and create their Passport profile.",
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Passport received your referral for ${input.candidateName}`,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    throw new Error(
      `Could not send founder confirmation email.${payload ? ` ${JSON.stringify(payload)}` : ""}`,
    );
  }
}

export async function loadCandidateInviteByToken(
  supabase: SupabaseClient,
  token: string,
): Promise<CandidateInviteRecord> {
  const tokenHash = await hashCandidateInviteToken(token);
  return loadInviteByFilters(supabase, { token_hash: tokenHash }, "This invite link is invalid.");
}

export async function loadCandidateInviteByCode(
  supabase: SupabaseClient,
  candidateEmail: string,
  code: string,
): Promise<CandidateInviteRecord> {
  const claimCodeHash = await hashCandidateClaimCode(code);
  return loadInviteByFilters(
    supabase,
    {
      candidate_email: candidateEmail.toLowerCase(),
      claim_code_hash: claimCodeHash,
    },
    "That email and claim code do not match an active invite.",
  );
}

async function loadInviteByFilters(
  supabase: SupabaseClient,
  filters: Record<string, string>,
  notFoundMessage: string,
) {
  let query = supabase.from("candidate_invites").select(
    `id, referral_id, candidate_email, candidate_name, status, token_hash, claim_code_hash, expires_at, claimed_at, completed_at,
       referrals (
         id, company_name, company_site, referrer_name, referrer_email, yc_batch,
         candidate_name, candidate_email, role_interviewed_for, round_reached,
         why_not_hire, exceptional_why, strengths,
         candidate_invite_status, candidate_profile_status
       ),
       candidate_profiles (
         id, full_name, email, linkedin, location, preferred_roles, resume_path, intro_note, consent_confirmed, profile_status
       )`,
  );

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const result = await query.maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    throw new Error(notFoundMessage);
  }

  const expiresAt = new Date(result.data.expires_at).getTime();

  if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
    throw new Error("This invite link has expired.");
  }

  return result.data as CandidateInviteRecord;
}

export function formatCandidateInvite(input: CandidateInviteRecord) {
  const profile = input.candidate_profiles?.[0] ?? null;

  return {
    inviteId: input.id,
    referralId: input.referral_id,
    status: input.status,
    expiresAt: input.expires_at,
    claimedAt: input.claimed_at,
    completedAt: input.completed_at,
    candidate: {
      name: input.candidate_name,
      email: input.candidate_email,
    },
    referral: input.referrals
      ? {
          companyName: input.referrals.company_name,
          companySite: input.referrals.company_site,
          referrerName: input.referrals.referrer_name,
          referrerEmail: input.referrals.referrer_email,
          ycBatch: input.referrals.yc_batch,
          roleInterviewedFor: input.referrals.role_interviewed_for,
          roundReached: input.referrals.round_reached,
          whyNotHire: input.referrals.why_not_hire,
          strengths: input.referrals.strengths ?? [],
        }
      : null,
    profile: profile
      ? {
          id: profile.id,
          fullName: profile.full_name,
          email: profile.email,
          linkedin: profile.linkedin,
          location: profile.location,
          preferredRoles: profile.preferred_roles ?? [],
          resumePath: profile.resume_path,
          introNote: profile.intro_note,
          consentConfirmed: profile.consent_confirmed,
          profileStatus: profile.profile_status,
        }
      : null,
  };
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
