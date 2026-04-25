import JSZip from "npm:jszip@3.10.1";
import { createAdminClient, getOpenAiKey } from "./supabase.ts";

const OPENAI_MODEL = "gpt-4o-mini";
const PARSER_VERSION = "2026-04-25";
const RESUME_BUCKET = "resumes";

type ParsedResume = {
  schools: string[];
  companies: string[];
  most_recent_role: string | null;
};

const structuredOutputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    schools: {
      type: "array",
      items: { type: "string" },
      description: "All schools or universities mentioned in the resume.",
    },
    companies: {
      type: "array",
      items: { type: "string" },
      description: "All employers mentioned in the resume work history.",
    },
    most_recent_role: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description:
        "The candidate's most recent role title from work experience. Return null if uncertain.",
    },
  },
  required: ["schools", "companies", "most_recent_role"],
};

export async function parseResumeForApplication(applicationId: string) {
  const supabase = createAdminClient();
  const { data: application, error } = await supabase
    .from("applications")
    .select("id, resume_path, resume_parse_status")
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!application) {
    throw new Error("Application not found.");
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(RESUME_BUCKET)
    .download(application.resume_path);

  if (downloadError) {
    throw downloadError;
  }

  const bytes = new Uint8Array(await fileData.arrayBuffer());
  const extension = application.resume_path.split(".").pop()?.toLowerCase();

  let parsed: ParsedResume;
  if (extension === "pdf") {
    parsed = await parsePdfWithOpenAi(bytes);
  } else if (extension === "docx") {
    const text = await extractDocxText(bytes);
    parsed = await parseTextWithOpenAi(text);
  } else {
    throw new Error("Unsupported resume format. Only PDF and DOCX can be parsed.");
  }

  const normalized = normalizeParsedResume(parsed);

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      resume_parse_status: "completed",
      resume_parse_error: null,
      schools: normalized.schools,
      companies: normalized.companies,
      most_recent_role: normalized.most_recent_role,
      resume_parser_model: OPENAI_MODEL,
      resume_parser_version: PARSER_VERSION,
      resume_parsed_at: new Date().toISOString(),
      resume_parse_raw: normalized,
    })
    .eq("id", applicationId);

  if (updateError) {
    throw updateError;
  }

  return normalized;
}

export async function markParseFailure(applicationId: string, errorMessage: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("applications")
    .update({
      resume_parse_status: "failed",
      resume_parse_error: errorMessage,
      resume_parser_model: OPENAI_MODEL,
      resume_parser_version: PARSER_VERSION,
      resume_parsed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (error) {
    throw error;
  }
}

async function parsePdfWithOpenAi(bytes: Uint8Array) {
  const base64 = toBase64(bytes);

  return callOpenAi([
    {
      type: "input_file",
      filename: "resume.pdf",
      file_data: `data:application/pdf;base64,${base64}`,
    },
    { type: "input_text", text: resumeParsingInstructions },
  ]);
}

async function parseTextWithOpenAi(text: string) {
  if (!text.trim()) {
    throw new Error("DOCX resume text could not be extracted.");
  }

  return callOpenAi([
    {
      type: "input_text",
      text: `${resumeParsingInstructions}\n\nResume text:\n${text}`,
    },
  ]);
}

async function callOpenAi(content: Array<Record<string, unknown>>) {
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
          name: "resume_entities",
          strict: true,
          schema: structuredOutputSchema,
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

  return JSON.parse(rawText) as ParsedResume;
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

function normalizeParsedResume(parsed: ParsedResume): ParsedResume {
  return {
    schools: uniqueStrings(parsed.schools),
    companies: uniqueStrings(parsed.companies),
    most_recent_role: normalizeOptionalString(parsed.most_recent_role),
  };
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

const resumeParsingInstructions = `
Extract hiring-relevant resume entities.

Return valid JSON only.

Rules:
- schools: include every school or university name mentioned in education history
- companies: include every employer name mentioned in work experience
- most_recent_role: include only the title from the most recent work experience
- do not include dates
- do not include locations
- do not include degree names as schools
- do not include team names or project names as companies
- dedupe arrays
- if the most recent role is unclear, return null
`.trim();
