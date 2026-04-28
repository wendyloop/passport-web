import JSZip from "npm:jszip@3.10.1";
import { createAdminClient, getOpenAiKey } from "./supabase.ts";

const OPENAI_MODEL = "gpt-4o-mini";
const EMBEDDING_MODEL = "text-embedding-3-small";
const PARSER_VERSION = "2026-04-28";
const TALENT_RESUME_BUCKET = "talent-resumes";

export type TalentProfileSeed = {
  full_name: string | null;
  email: string | null;
  linkedin: string | null;
  schools: string[];
  companies: string[];
  most_recent_role: string | null;
  summary: string | null;
  resume_text: string | null;
  search_text: string;
  embedding: number[] | null;
  embedding_model: string | null;
  parser_model: string;
  parser_version: string;
};

type ParsedTalentResume = {
  full_name: string | null;
  email: string | null;
  linkedin: string | null;
  schools: string[];
  companies: string[];
  most_recent_role: string | null;
  summary: string | null;
};

type ParsedCombinedPdf = {
  candidates: Array<
    ParsedTalentResume & {
      page_number: number;
    }
  >;
};

const singleResumeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    full_name: { anyOf: [{ type: "string" }, { type: "null" }] },
    email: { anyOf: [{ type: "string" }, { type: "null" }] },
    linkedin: { anyOf: [{ type: "string" }, { type: "null" }] },
    schools: { type: "array", items: { type: "string" } },
    companies: { type: "array", items: { type: "string" } },
    most_recent_role: { anyOf: [{ type: "string" }, { type: "null" }] },
    summary: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Short two-sentence candidate summary based on the resume.",
    },
  },
  required: [
    "full_name",
    "email",
    "linkedin",
    "schools",
    "companies",
    "most_recent_role",
    "summary",
  ],
};

const combinedPdfSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          page_number: { type: "integer" },
          full_name: { anyOf: [{ type: "string" }, { type: "null" }] },
          email: { anyOf: [{ type: "string" }, { type: "null" }] },
          linkedin: { anyOf: [{ type: "string" }, { type: "null" }] },
          schools: { type: "array", items: { type: "string" } },
          companies: { type: "array", items: { type: "string" } },
          most_recent_role: { anyOf: [{ type: "string" }, { type: "null" }] },
          summary: { anyOf: [{ type: "string" }, { type: "null" }] },
        },
        required: [
          "page_number",
          "full_name",
          "email",
          "linkedin",
          "schools",
          "companies",
          "most_recent_role",
          "summary",
        ],
      },
    },
  },
  required: ["candidates"],
};

export async function parseTalentResumeFromStorage(path: string) {
  const supabase = createAdminClient();
  const { data: fileData, error } = await supabase.storage
    .from(TALENT_RESUME_BUCKET)
    .download(path);

  if (error) {
    throw error;
  }

  const bytes = new Uint8Array(await fileData.arrayBuffer());
  const extension = path.split(".").pop()?.toLowerCase();

  let parsed: ParsedTalentResume;
  let resumeText: string | null = null;

  if (extension === "pdf") {
    parsed = await parseSinglePdf(bytes);
  } else if (extension === "docx") {
    resumeText = await extractDocxText(bytes);
    parsed = await parseTextResume(resumeText);
  } else {
    throw new Error("Unsupported file format. Only PDF and DOCX are supported.");
  }

  return enrichParsedTalentResume(parsed, resumeText);
}

export async function parseCombinedPdfFromStorage(path: string) {
  const supabase = createAdminClient();
  const { data: fileData, error } = await supabase.storage
    .from(TALENT_RESUME_BUCKET)
    .download(path);

  if (error) {
    throw error;
  }

  const bytes = new Uint8Array(await fileData.arrayBuffer());
  const parsed = await callOpenAi<ParsedCombinedPdf>({
    schemaName: "combined_resume_pages",
    schema: combinedPdfSchema,
    content: [
      {
        type: "input_file",
        filename: "combined-resumes.pdf",
        file_data: `data:application/pdf;base64,${toBase64(bytes)}`,
      },
      {
        type: "input_text",
        text: [
          "This PDF contains one candidate resume per page.",
          "Treat each page as a separate candidate record.",
          "Return one candidate object per page using the schema.",
          "Only include pages that actually contain a resume.",
          "Do not merge information across pages.",
        ].join("\n"),
      },
    ],
  });

  const enriched = await Promise.all(
    parsed.candidates.map(async (candidate) => ({
      page_number: candidate.page_number,
      seed: await enrichParsedTalentResume(candidate, null),
    })),
  );

  return enriched;
}

export function buildTalentSearchText(parsed: {
  full_name: string | null;
  schools: string[];
  companies: string[];
  most_recent_role: string | null;
  summary: string | null;
  resume_text: string | null;
}) {
  return [
    parsed.full_name,
    parsed.most_recent_role,
    parsed.schools.join(" "),
    parsed.companies.join(" "),
    parsed.summary,
    parsed.resume_text,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export async function createEmbedding(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAiKey()}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: trimmed,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embeddings request failed with status ${response.status}.`);
  }

  const result = await response.json();
  const vector = result?.data?.[0]?.embedding;

  if (!Array.isArray(vector)) {
    throw new Error("OpenAI embeddings response did not include an embedding.");
  }

  return vector as number[];
}

export function formatEmbedding(vector: number[] | null) {
  if (!vector?.length) {
    return null;
  }

  return `[${vector.join(",")}]`;
}

export async function parseTalentSearchPrompt(query: string) {
  const plan = await callOpenAi<{
    semantic_query: string;
    school_filters: string[];
    company_filters: string[];
    role_filters: string[];
  }>({
    schemaName: "talent_search_plan",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        semantic_query: { type: "string" },
        school_filters: { type: "array", items: { type: "string" } },
        company_filters: { type: "array", items: { type: "string" } },
        role_filters: { type: "array", items: { type: "string" } },
      },
      required: ["semantic_query", "school_filters", "company_filters", "role_filters"],
    },
    content: [
      {
        type: "input_text",
        text: [
          "You are planning search filters for a private recruiting database built from resumes.",
          "Translate the recruiter's natural language query into structured filters.",
          "Only extract schools, companies, and recent-role filters when they are clearly requested.",
          "Keep semantic_query close to the recruiter's intent for vector retrieval.",
          "",
          `Query: ${query}`,
        ].join("\n"),
      },
    ],
  });

  return {
    semantic_query: plan.semantic_query.trim() || query.trim(),
    school_filters: uniqueStrings(plan.school_filters),
    company_filters: uniqueStrings(plan.company_filters),
    role_filters: uniqueStrings(plan.role_filters),
  };
}

async function enrichParsedTalentResume(parsed: ParsedTalentResume, resumeText: string | null) {
  const normalized: ParsedTalentResume = {
    full_name: normalizeOptionalString(parsed.full_name),
    email: normalizeOptionalString(parsed.email),
    linkedin: normalizeOptionalString(parsed.linkedin),
    schools: uniqueStrings(parsed.schools),
    companies: uniqueStrings(parsed.companies),
    most_recent_role: normalizeOptionalString(parsed.most_recent_role),
    summary: normalizeOptionalString(parsed.summary),
  };
  const searchText = buildTalentSearchText({
    ...normalized,
    resume_text: resumeText,
  });

  return {
    ...normalized,
    resume_text: resumeText,
    search_text: searchText,
    embedding: await createEmbedding(searchText),
    embedding_model: searchText ? EMBEDDING_MODEL : null,
    parser_model: OPENAI_MODEL,
    parser_version: PARSER_VERSION,
  } satisfies TalentProfileSeed;
}

async function parseSinglePdf(bytes: Uint8Array) {
  return callOpenAi<ParsedTalentResume>({
    schemaName: "talent_resume",
    schema: singleResumeSchema,
    content: [
      {
        type: "input_file",
        filename: "resume.pdf",
        file_data: `data:application/pdf;base64,${toBase64(bytes)}`,
      },
      {
        type: "input_text",
        text: [
          "Extract candidate profile information from this resume.",
          "Return all schools, all previous companies, and only the most recent role title.",
          "If email or LinkedIn are not present, return null.",
        ].join("\n"),
      },
    ],
  });
}

async function parseTextResume(text: string) {
  if (!text.trim()) {
    throw new Error("DOCX resume text could not be extracted.");
  }

  return callOpenAi<ParsedTalentResume>({
    schemaName: "talent_resume",
    schema: singleResumeSchema,
    content: [
      {
        type: "input_text",
        text: [
          "Extract candidate profile information from this resume.",
          "Return all schools, all previous companies, and only the most recent role title.",
          "If email or LinkedIn are not present, return null.",
          "",
          `Resume text:\n${text}`,
        ].join("\n"),
      },
    ],
  });
}

async function callOpenAi<T>({
  schemaName,
  schema,
  content,
}: {
  schemaName: string;
  schema: Record<string, unknown>;
  content: Array<Record<string, unknown>>;
}) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAiKey()}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: "user",
          content,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const result = await response.json();
  const rawText = getStructuredOutputText(result);

  if (!rawText) {
    throw new Error("OpenAI response did not include structured output text.");
  }

  return JSON.parse(rawText) as T;
}

function getStructuredOutputText(result: unknown) {
  if (!result || typeof result !== "object") {
    return null;
  }

  const maybeResult = result as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ type?: string; text?: unknown }> }>;
  };

  if (typeof maybeResult.output_text === "string" && maybeResult.output_text.trim()) {
    return maybeResult.output_text;
  }

  const outputs = Array.isArray(maybeResult.output) ? maybeResult.output : [];

  for (const item of outputs) {
    const contents = Array.isArray(item.content) ? item.content : [];
    for (const content of contents) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}

async function extractDocxText(bytes: Uint8Array) {
  const zip = await JSZip.loadAsync(bytes);
  const documentFile = zip.file("word/document.xml");

  if (!documentFile) {
    throw new Error("DOCX file is missing word/document.xml.");
  }

  const xml = await documentFile.async("text");

  return xml
    .replace(/<w:p[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => normalizeOptionalString(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function normalizeOptionalString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
