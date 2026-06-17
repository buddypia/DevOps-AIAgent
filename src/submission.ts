export const SUBMISSION_PROOF = {
  publicGitHubUrl: "https://github.com/buddypia/DevOps-AIAgent",
  ciWorkflowUrl: "https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml",
  deployedUrl: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
  protopediaUrl: "",
  videoUrl: ""
} as const;

export function hasSubmissionUrl(value: string) {
  return value.startsWith("https://");
}
