import { getSupabaseClient } from "./supabase";
import type { PortalRole } from "./portal-auth";

export type ApplicationRecord = {
  id: string;
  created_at: string;
  submitted_at: string | null;
  name: string;
  email: string;
  linkedin: string | null;
  interview_categories: string[];
  interview_details: string | null;
  resume_path: string;
  video_path: string;
  status: "draft" | "submitted" | "reviewing" | "archived";
  resume_parse_status: "pending" | "completed" | "failed";
  resume_parse_error: string | null;
  schools: string[];
  companies: string[];
  most_recent_role: string | null;
};

export type EmployerCandidateAction = {
  id: string;
  employer_user_id: string;
  application_id: string;
  shortlisted: boolean;
  notes: string | null;
  updated_at: string;
};

export type AdminEmployerAction = EmployerCandidateAction & {
  profiles: {
    email: string;
    full_name: string | null;
  } | null;
};

const APPLICATION_SELECT = `
  id,
  created_at,
  submitted_at,
  name,
  email,
  linkedin,
  interview_categories,
  interview_details,
  resume_path,
  video_path,
  status,
  resume_parse_status,
  resume_parse_error,
  schools,
  companies,
  most_recent_role
`;

export async function fetchApplications() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("applications")
    .select(APPLICATION_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ApplicationRecord[];
}

export async function fetchApplicationById(applicationId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("applications")
    .select(APPLICATION_SELECT)
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ApplicationRecord | null;
}

export async function fetchEmployerActionsForCurrentEmployer() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("employer_candidate_actions")
    .select("id, employer_user_id, application_id, shortlisted, notes, updated_at");

  if (error) {
    throw error;
  }

  return (data ?? []) as EmployerCandidateAction[];
}

export async function fetchAdminEmployerActions() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("employer_candidate_actions")
    .select(
      "id, employer_user_id, application_id, shortlisted, notes, updated_at, profiles:employer_user_id(email, full_name)",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AdminEmployerAction[];
}

export async function saveEmployerCandidateAction(input: {
  applicationId: string;
  employerUserId: string;
  shortlisted: boolean;
  notes: string;
}) {
  const supabase = getSupabaseClient();
  const payload = {
    application_id: input.applicationId,
    employer_user_id: input.employerUserId,
    shortlisted: input.shortlisted,
    notes: input.notes.trim() ? input.notes.trim() : null,
  };

  const { data, error } = await supabase
    .from("employer_candidate_actions")
    .upsert(payload, { onConflict: "employer_user_id,application_id" })
    .select("id, employer_user_id, application_id, shortlisted, notes, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data as EmployerCandidateAction;
}

export async function createSignedVideoUrl(path: string) {
  return createSignedObjectUrl("videos", path);
}

export async function createSignedResumeUrl(path: string) {
  return createSignedObjectUrl("resumes", path);
}

export function getPortalHome(role: PortalRole) {
  return role === "admin" ? "/portal/admin" : "/portal/employers";
}

async function createSignedObjectUrl(bucket: "resumes" | "videos", path: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
