export const SUBMISSION_PROOF = {
  publicGitHubUrl: "https://github.com/buddypia/DevOps-AIAgent",
  deployedUrl: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
  protopediaUrl: "",
  videoUrl: ""
} as const;

export function hasSubmissionUrl(value: string) {
  return value.startsWith("https://");
}
