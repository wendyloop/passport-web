const ALLOWED_INTERVIEW_CATEGORIES = new Set(["tech", "consulting", "finance", "investing"]);

const RESUME_BUCKET = "resumes";
const VIDEO_BUCKET = "videos";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export type CreateApplicationPayload = {
  name: string;
  email: string;
  linkedin?: string | null;
  interviewCategories?: string[];
  interviewDetails?: string | null;
  resumeFileName: string;
  resumeContentType: string;
  videoFileName: string;
  videoContentType: string;
};

export function getStorageBuckets() {
  return {
    resumeBucket: RESUME_BUCKET,
    videoBucket: VIDEO_BUCKET,
  };
}

export function normalizeCreatePayload(input: CreateApplicationPayload) {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  const linkedin = input.linkedin?.trim() || null;
  const interviewDetails = input.interviewDetails?.trim() || null;
  const interviewCategories = Array.from(
    new Set((input.interviewCategories ?? []).map((value) => value.trim()).filter(Boolean)),
  );

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new Error("A valid email is required.");
  }

  if (!input.resumeFileName || !input.resumeContentType) {
    throw new Error("Resume file metadata is required.");
  }

  if (!input.videoFileName || !input.videoContentType) {
    throw new Error("Video file metadata is required.");
  }

  for (const category of interviewCategories) {
    if (!ALLOWED_INTERVIEW_CATEGORIES.has(category)) {
      throw new Error(`Unsupported interview category: ${category}`);
    }
  }

  const resumeExtension = getResumeExtension(input.resumeFileName, input.resumeContentType);
  const videoExtension = getVideoExtension(input.videoFileName, input.videoContentType);

  return {
    name,
    email,
    linkedin,
    interviewDetails,
    interviewCategories,
    resumeFileName: input.resumeFileName,
    resumeContentType: input.resumeContentType,
    resumeExtension,
    videoFileName: input.videoFileName,
    videoContentType: input.videoContentType,
    videoExtension,
  };
}

export function buildResumePath(applicationId: string, extension: string) {
  return `applications/${applicationId}/resume.${extension}`;
}

export function buildVideoPath(applicationId: string, extension: string) {
  return `applications/${applicationId}/intro.${extension}`;
}

function getResumeExtension(fileName: string, contentType: string) {
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

function getVideoExtension(fileName: string, contentType: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension && /^[a-z0-9]+$/i.test(extension)) {
    return extension;
  }

  if (contentType.includes("mp4")) {
    return "mp4";
  }

  if (contentType.includes("webm")) {
    return "webm";
  }

  if (contentType.includes("quicktime")) {
    return "mov";
  }

  return "mp4";
}
