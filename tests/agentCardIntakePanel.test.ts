import { describe, expect, test } from "vitest";
import { AGENT_TRIAL_RESPONSE_ARTIFACT_PLACEHOLDER, buildAgentTrialResponsePlaceholder } from "../src/AgentCardIntakePanel";
import type { AgentTrialReceipt } from "../src/agentTrialReceipt";

describe("Agent Card intake panel", () => {
  test("uses a required public artifact token instead of a fake proof host in the trial response template", () => {
    const template = buildAgentTrialResponsePlaceholder({
      id: "buyer-trial-cloud-run-sre-cloud-run-release-proof",
      jsonRpcPayload: {
        params: {
          skillId: "cloud-run.release-proof"
        }
      }
    } as AgentTrialReceipt);

    expect(template).not.toContain("proof.your-company.com");
    expect(template).not.toContain("your-service");
    expect(template).toContain(AGENT_TRIAL_RESPONSE_ARTIFACT_PLACEHOLDER);
    expect(JSON.parse(template)).toMatchObject({
      receiptId: "buyer-trial-cloud-run-sre-cloud-run-release-proof",
      skillId: "cloud-run.release-proof",
      artifactUrl: AGENT_TRIAL_RESPONSE_ARTIFACT_PLACEHOLDER
    });
  });
});
