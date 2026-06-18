export const SUBMISSION_PROOF = {
  publicGitHubUrl: "https://github.com/buddypia/DevOps-AIAgent",
  ciWorkflowUrl: "https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml",
  deployedUrl: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
  protopediaUrl: "",
  videoUrl: ""
} as const;

export const HACKATHON_SUBMISSION_DEADLINE = "2026-07-10T23:59:00+09:00";

export type SubmissionUrlEvidence = {
  protopediaUrl?: string;
  videoUrl?: string;
};

export function hasSubmissionUrl(value: string) {
  return value.startsWith("https://");
}

export function normalizeSubmissionUrl(value: string | undefined) {
  return value?.trim() ?? "";
}

function parsedHttpsUrl(value: string | undefined) {
  const trimmed = normalizeSubmissionUrl(value);
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

export function validProtoPediaUrl(value: string | undefined) {
  const parsed = parsedHttpsUrl(value);
  if (!parsed) return false;
  return parsed.hostname === "protopedia.net" || parsed.hostname.endsWith(".protopedia.net");
}

export function validVideoUrl(value: string | undefined) {
  const parsed = parsedHttpsUrl(value);
  if (!parsed) return false;
  const host = parsed.hostname.replace(/^www\./, "");
  return host === "youtube.com" || host === "youtu.be" || host === "vimeo.com";
}
