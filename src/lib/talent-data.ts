import { getSupabaseClient } from "./supabase";

export type TalentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  linkedin: string | null;
  schools: string[];
  companies: string[];
  most_recent_role: string | null;
  summary: string | null;
  resume_text: string | null;
  search_text: string;
  source_type: "individual_resume" | "combined_pdf_page" | "application_form";
  source_filename: string;
  source_resume_path: string;
  source_page_number: number | null;
  parse_status: "pending" | "completed" | "failed";
  parse_error: string | null;
  created_at: string;
};

export type TalentImportJob = {
  id: string;
  created_by: string;
  source_mode: "individual_resume" | "combined_pdf";
  source_filename: string;
  status: "processing" | "completed" | "failed";
  total_items: number;
  completed_items: number;
  failed_items: number;
  created_at: string;
  updated_at: string;
};

export type TalentSavedSearch = {
  id: string;
  user_id: string;
  title: string;
  query: string;
  created_at: string;
};

export type TalentTag = {
  id: string;
  profile_id: string;
  label: string;
  created_by: string;
  created_at: string;
};

export type TalentNote = {
  id: string;
  profile_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  } | null;
};

export type TalentEmployerAction = {
  id: string;
  employer_user_id: string;
  talent_profile_id: string;
  shortlisted: boolean;
  notes: string | null;
  updated_at: string;
};

export type TalentAdminEmployerAction = TalentEmployerAction & {
  profiles: {
    email: string;
    full_name: string | null;
  } | null;
};

export type TalentSearchPlan = {
  semantic_query: string;
  school_filters: string[];
  company_filters: string[];
  role_filters: string[];
};

export type TalentSearchResult = Pick<
  TalentProfile,
  | "id"
  | "full_name"
  | "email"
  | "linkedin"
  | "schools"
  | "companies"
  | "most_recent_role"
  | "summary"
  | "source_type"
  | "source_filename"
  | "source_resume_path"
  | "source_page_number"
  | "parse_status"
> & {
  similarity: number;
  score: number;
  reasons: string[];
};

export async function fetchTalentProfiles() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("talent_profiles")
    .select(
      "id, full_name, email, linkedin, schools, companies, most_recent_role, summary, resume_text, search_text, source_type, source_filename, source_resume_path, source_page_number, parse_status, parse_error, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as TalentProfile[];
}

export async function fetchTalentProfileById(profileId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("talent_profiles")
    .select(
      "id, full_name, email, linkedin, schools, companies, most_recent_role, summary, resume_text, search_text, source_type, source_filename, source_resume_path, source_page_number, parse_status, parse_error, created_at",
    )
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as TalentProfile | null;
}

export async function fetchTalentImportJobs() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("talent_import_jobs")
    .select(
      "id, created_by, source_mode, source_filename, status, total_items, completed_items, failed_items, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return (data ?? []) as TalentImportJob[];
}

export async function createTalentImportJob(input: {
  createdBy: string;
  sourceMode: TalentImportJob["source_mode"];
  sourceFilename: string;
  totalItems: number;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("talent_import_jobs")
    .insert({
      created_by: input.createdBy,
      source_mode: input.sourceMode,
      source_filename: input.sourceFilename,
      total_items: input.totalItems,
    })
    .select(
      "id, created_by, source_mode, source_filename, status, total_items, completed_items, failed_items, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return data as TalentImportJob;
}

export async function uploadTalentResume(file: File, jobId: string) {
  const supabase = getSupabaseClient();
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !["pdf", "docx"].includes(extension)) {
    throw new Error("Only PDF and DOCX resumes are supported.");
  }

  const safeName = sanitizeFileName(file.name);
  const path = `jobs/${jobId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("talent-resumes").upload(path, file, {
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return path;
}

export async function ingestTalentResume(input: {
  jobId: string;
  mode: TalentImportJob["source_mode"];
  filePath: string;
  sourceFilename: string;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke("ingest-talent", {
    body: {
      jobId: input.jobId,
      mode: input.mode,
      filePath: input.filePath,
      sourceFilename: input.sourceFilename,
    },
  });

  if (error) {
    throw new Error(extractFunctionError(error));
  }

  return data as { createdCount: number; profileId?: string };
}

export async function searchTalent(query: string, limit = 24) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke("search-talent", {
    body: {
      query,
      limit,
    },
  });

  if (error) {
    throw new Error(extractFunctionError(error));
  }

  return data as {
    plan: TalentSearchPlan;
    results: TalentSearchResult[];
  };
}

export async function fetchTalentSavedSearches(userId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("talent_saved_searches")
    .select("id, user_id, title, query, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as TalentSavedSearch[];
}

export async function saveTalentSearch(input: { userId: string; title: string; query: string }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("talent_saved_searches")
    .insert({
      user_id: input.userId,
      title: input.title,
      query: input.query,
    })
    .select("id, user_id, title, query, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data as TalentSavedSearch;
}

export async function deleteTalentSavedSearch(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("talent_saved_searches").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

export async function fetchTalentTags(profileId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("talent_profile_tags")
    .select("id, profile_id, label, created_by, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as TalentTag[];
}

export async function addTalentTag(input: { profileId: string; label: string; createdBy: string }) {
  const supabase = getSupabaseClient();
  const normalizedLabel = input.label.trim();

  if (!normalizedLabel) {
    throw new Error("Tag label is required.");
  }

  const { data, error } = await supabase
    .from("talent_profile_tags")
    .insert({
      profile_id: input.profileId,
      label: normalizedLabel,
      created_by: input.createdBy,
    })
    .select("id, profile_id, label, created_by, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data as TalentTag;
}

export async function removeTalentTag(tagId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("talent_profile_tags").delete().eq("id", tagId);

  if (error) {
    throw error;
  }
}

export async function fetchTalentNotes(profileId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("talent_profile_notes")
    .select(
      "id, profile_id, author_user_id, body, created_at, profiles:author_user_id(email, full_name)",
    )
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as TalentNote[];
}

export async function addTalentNote(input: {
  profileId: string;
  authorUserId: string;
  body: string;
}) {
  const supabase = getSupabaseClient();
  const normalizedBody = input.body.trim();

  if (!normalizedBody) {
    throw new Error("Note body is required.");
  }

  const { data, error } = await supabase
    .from("talent_profile_notes")
    .insert({
      profile_id: input.profileId,
      author_user_id: input.authorUserId,
      body: normalizedBody,
    })
    .select(
      "id, profile_id, author_user_id, body, created_at, profiles:author_user_id(email, full_name)",
    )
    .single();

  if (error) {
    throw error;
  }

  return data as TalentNote;
}

export async function fetchTalentEmployerActionsForCurrentEmployer() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("talent_employer_actions")
    .select("id, employer_user_id, talent_profile_id, shortlisted, notes, updated_at");

  if (error) {
    throw error;
  }

  return (data ?? []) as TalentEmployerAction[];
}

export async function fetchTalentAdminEmployerActions() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("talent_employer_actions")
    .select(
      "id, employer_user_id, talent_profile_id, shortlisted, notes, updated_at, profiles:employer_user_id(email, full_name)",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as TalentAdminEmployerAction[];
}

export async function saveTalentEmployerAction(input: {
  profileId: string;
  employerUserId: string;
  shortlisted: boolean;
  notes: string;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("talent_employer_actions")
    .upsert(
      {
        talent_profile_id: input.profileId,
        employer_user_id: input.employerUserId,
        shortlisted: input.shortlisted,
        notes: input.notes.trim() ? input.notes.trim() : null,
      },
      { onConflict: "employer_user_id,talent_profile_id" },
    )
    .select("id, employer_user_id, talent_profile_id, shortlisted, notes, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data as TalentEmployerAction;
}

export async function createSignedTalentResumeUrl(path: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from("talent-resumes")
    .createSignedUrl(path, 60 * 30);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export function getTalentHome() {
  return "/talent/search";
}

function sanitizeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}

function extractFunctionError(error: Error) {
  const message = error.message || "Edge Function request failed.";

  try {
    const parsed = JSON.parse(message) as { error?: string };
    return parsed.error || message;
  } catch {
    return message;
  }
}
