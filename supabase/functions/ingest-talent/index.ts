import { AuthError, requirePortalUser } from "../_shared/auth.ts";
import { errorResponse, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import {
  formatEmbedding,
  parseCombinedPdfFromStorage,
  parseTalentResumeFromStorage,
} from "../_shared/talent-parser.ts";

type IngestPayload = {
  jobId: string;
  mode: "individual_resume" | "combined_pdf";
  filePath: string;
  sourceFilename: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed.");
  }

  try {
    const { user } = await requirePortalUser(request, ["admin"]);
    const payload = normalizePayload(await request.json());
    const supabase = createAdminClient();
    const job = await getJob(supabase, payload.jobId);

    if (job.created_by !== user.id) {
      throw new AuthError(403, "You can only process your own import jobs.");
    }

    if (payload.mode === "combined_pdf") {
      const pageResults = await parseCombinedPdfFromStorage(payload.filePath);
      const importItems = [];
      let completedCount = 0;

      for (const pageResult of pageResults) {
        const profile = await createTalentProfile({
          supabase,
          jobId: payload.jobId,
          userId: user.id,
          sourceFilename: payload.sourceFilename,
          sourceResumePath: payload.filePath,
          sourceType: "combined_pdf_page",
          sourcePageNumber: pageResult.page_number,
          seed: pageResult.seed,
        });

        importItems.push({
          import_job_id: payload.jobId,
          talent_profile_id: profile.id,
          storage_path: payload.filePath,
          source_filename: payload.sourceFilename,
          source_page_number: pageResult.page_number,
          status: "completed",
        });
        completedCount += 1;
      }

      if (importItems.length > 0) {
        const { error: itemError } = await supabase.from("talent_import_items").insert(importItems);
        if (itemError) {
          throw itemError;
        }
      }

      await updateJobCounts(supabase, job, {
        totalItems: pageResults.length,
        completedDelta: completedCount,
        failedDelta: 0,
      });

      return jsonResponse(200, {
        mode: payload.mode,
        createdCount: completedCount,
      });
    }

    try {
      const parsed = await parseTalentResumeFromStorage(payload.filePath);
      const profile = await createTalentProfile({
        supabase,
        jobId: payload.jobId,
        userId: user.id,
        sourceFilename: payload.sourceFilename,
        sourceResumePath: payload.filePath,
        sourceType: "individual_resume",
        sourcePageNumber: null,
        seed: parsed,
      });

      const { error: itemError } = await supabase.from("talent_import_items").insert({
        import_job_id: payload.jobId,
        talent_profile_id: profile.id,
        storage_path: payload.filePath,
        source_filename: payload.sourceFilename,
        status: "completed",
      });

      if (itemError) {
        throw itemError;
      }

      await updateJobCounts(supabase, job, {
        totalItems: job.total_items,
        completedDelta: 1,
        failedDelta: 0,
      });

      return jsonResponse(200, {
        mode: payload.mode,
        createdCount: 1,
        profileId: profile.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resume parsing failed.";
      const { error: itemError } = await supabase.from("talent_import_items").insert({
        import_job_id: payload.jobId,
        storage_path: payload.filePath,
        source_filename: payload.sourceFilename,
        status: "failed",
        error: message,
      });

      if (itemError) {
        throw itemError;
      }

      await updateJobCounts(supabase, job, {
        totalItems: job.total_items,
        completedDelta: 0,
        failedDelta: 1,
      });

      return errorResponse(400, message);
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.status, error.message);
    }

    const message = error instanceof Error ? error.message : "Talent ingestion failed.";
    console.error("ingest-talent failed", { message, error });
    return errorResponse(400, message);
  }
});

function normalizePayload(payload: unknown): IngestPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be an object.");
  }

  const maybePayload = payload as Partial<IngestPayload>;

  if (!maybePayload.jobId || !maybePayload.filePath || !maybePayload.sourceFilename) {
    throw new Error("jobId, filePath, and sourceFilename are required.");
  }

  if (maybePayload.mode !== "individual_resume" && maybePayload.mode !== "combined_pdf") {
    throw new Error("mode must be individual_resume or combined_pdf.");
  }

  return {
    jobId: maybePayload.jobId,
    mode: maybePayload.mode,
    filePath: maybePayload.filePath,
    sourceFilename: maybePayload.sourceFilename,
  };
}

async function getJob(supabase: ReturnType<typeof createAdminClient>, jobId: string) {
  const { data, error } = await supabase
    .from("talent_import_jobs")
    .select("id, created_by, total_items, completed_items, failed_items")
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Import job not found.");
  }

  return data;
}

async function createTalentProfile({
  supabase,
  jobId,
  userId,
  sourceFilename,
  sourceResumePath,
  sourceType,
  sourcePageNumber,
  seed,
}: {
  supabase: ReturnType<typeof createAdminClient>;
  jobId: string;
  userId: string;
  sourceFilename: string;
  sourceResumePath: string;
  sourceType: "individual_resume" | "combined_pdf_page";
  sourcePageNumber: number | null;
  seed: Awaited<ReturnType<typeof parseTalentResumeFromStorage>>;
}) {
  const { data, error } = await supabase
    .from("talent_profiles")
    .insert({
      import_job_id: jobId,
      created_by: userId,
      full_name: seed.full_name,
      email: seed.email,
      linkedin: seed.linkedin,
      schools: seed.schools,
      companies: seed.companies,
      most_recent_role: seed.most_recent_role,
      summary: seed.summary,
      resume_text: seed.resume_text,
      search_text: seed.search_text,
      source_type: sourceType,
      source_filename: sourceFilename,
      source_resume_path: sourceResumePath,
      source_page_number: sourcePageNumber,
      parse_status: "completed",
      embedding: formatEmbedding(seed.embedding),
      embedding_model: seed.embedding_model,
      parser_model: seed.parser_model,
      parser_version: seed.parser_version,
      parsed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateJobCounts(
  supabase: ReturnType<typeof createAdminClient>,
  job: {
    id: string;
    total_items: number;
    completed_items: number;
    failed_items: number;
  },
  input: {
    totalItems: number;
    completedDelta: number;
    failedDelta: number;
  },
) {
  const totalItems = input.totalItems > 0 ? input.totalItems : job.total_items;
  const completedItems = job.completed_items + input.completedDelta;
  const failedItems = job.failed_items + input.failedDelta;
  const processed = completedItems + failedItems;
  let status: "processing" | "completed" | "failed" = "processing";

  if (processed >= totalItems && totalItems > 0) {
    status = completedItems > 0 ? "completed" : "failed";
  }

  const { error } = await supabase
    .from("talent_import_jobs")
    .update({
      total_items: totalItems,
      completed_items: completedItems,
      failed_items: failedItems,
      status,
    })
    .eq("id", job.id);

  if (error) {
    throw error;
  }
}
