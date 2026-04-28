import { AuthError, requirePortalUser } from "../_shared/auth.ts";
import { errorResponse, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import {
  createEmbedding,
  formatEmbedding,
  parseTalentSearchPrompt,
} from "../_shared/talent-parser.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed.");
  }

  try {
    await requirePortalUser(request, ["admin", "employer"]);
    const payload = normalizePayload(await request.json());
    const supabase = createAdminClient();

    if (!payload.query.trim()) {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select(
          "id, full_name, email, linkedin, schools, companies, most_recent_role, summary, source_type, source_filename, source_resume_path, source_page_number, parse_status",
        )
        .eq("parse_status", "completed")
        .order("created_at", { ascending: false })
        .limit(payload.limit);

      if (error) {
        throw error;
      }

      return jsonResponse(200, {
        plan: {
          semantic_query: "",
          school_filters: [],
          company_filters: [],
          role_filters: [],
        },
        results: (data ?? []).map((item) => ({
          ...item,
          similarity: 0,
          score: 0,
          reasons: ["Recent imported candidate"],
        })),
      });
    }

    const plan = await parseTalentSearchPrompt(payload.query);
    const embedding = await createEmbedding(plan.semantic_query || payload.query);
    const { data, error } = await supabase.rpc("search_talent_profiles", {
      query_embedding: formatEmbedding(embedding),
      match_count: payload.limit,
      school_filters: plan.school_filters,
      company_filters: plan.company_filters,
      role_filters: plan.role_filters,
    });

    if (error) {
      throw error;
    }

    return jsonResponse(200, {
      plan,
      results: (data ?? []).map((result) => {
        const reasons = buildReasons({
          schools: result.schools ?? [],
          companies: result.companies ?? [],
          mostRecentRole: result.most_recent_role,
          plan,
        });

        return {
          ...result,
          score: Math.max(0, Math.min(100, Math.round(Number(result.similarity ?? 0) * 100))),
          reasons: reasons.length ? reasons : [`Semantic match for "${plan.semantic_query}"`],
        };
      }),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.status, error.message);
    }

    const message = error instanceof Error ? error.message : "Talent search failed.";
    console.error("search-talent failed", { message, error });
    return errorResponse(400, message);
  }
});

function normalizePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be an object.");
  }

  const maybePayload = payload as { query?: string; limit?: number };

  return {
    query: maybePayload.query ?? "",
    limit:
      typeof maybePayload.limit === "number" && Number.isFinite(maybePayload.limit)
        ? Math.min(Math.max(Math.round(maybePayload.limit), 1), 40)
        : 24,
  };
}

function buildReasons({
  schools,
  companies,
  mostRecentRole,
  plan,
}: {
  schools: string[];
  companies: string[];
  mostRecentRole: string | null;
  plan: {
    school_filters: string[];
    company_filters: string[];
    role_filters: string[];
    semantic_query: string;
  };
}) {
  const reasons: string[] = [];

  for (const school of schools) {
    if (
      plan.school_filters.some((filterValue) =>
        school.toLowerCase().includes(filterValue.toLowerCase()),
      )
    ) {
      reasons.push(`School match: ${school}`);
      break;
    }
  }

  for (const company of companies) {
    if (
      plan.company_filters.some((filterValue) =>
        company.toLowerCase().includes(filterValue.toLowerCase()),
      )
    ) {
      reasons.push(`Company match: ${company}`);
      break;
    }
  }

  if (
    mostRecentRole &&
    plan.role_filters.some((filterValue) =>
      mostRecentRole.toLowerCase().includes(filterValue.toLowerCase()),
    )
  ) {
    reasons.push(`Role match: ${mostRecentRole}`);
  }

  return reasons;
}
