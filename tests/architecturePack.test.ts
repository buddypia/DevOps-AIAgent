import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildArchitecturePack } from "../src/architecturePack";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildWinningStrategy } from "../src/strategy";

describe("architecture pack", () => {
  test("packages the system diagram as judge-verifiable submission proof", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const pack = buildArchitecturePack({ baseUrl, recommendation, strategy, mission });

    expect(pack.architectureScore).toBeGreaterThanOrEqual(84);
    expect(pack.readiness).toBe("needs-external-urls");
    expect(pack.diagramUrl).toBe(`${baseUrl}/assets/a2a-marketplace-architecture.svg`);
    expect(pack.mermaid).toContain("Cloud Run");
    expect(pack.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining(["react-ui", "express-api", "agent-engines", "gemini", "a2a-card", "a2a-jsonrpc", "cloud-run", "github-actions", "submission-dossier"])
    );
    expect(pack.edges.map((edge) => `${edge.from}->${edge.to}`)).toEqual(expect.arrayContaining(["react-ui->express-api", "a2a-card->a2a-jsonrpc", "github-actions->cloud-run"]));
    expect(pack.requirements.map((requirement) => requirement.id)).toEqual(
      expect.arrayContaining(["cloud-run", "google-ai", "a2a", "devops", "protopedia-architecture", "external-submit"])
    );
    expect(pack.requirements.find((requirement) => requirement.id === "cloud-run")).toMatchObject({ status: "ready" });
    expect(pack.requirements.find((requirement) => requirement.id === "external-submit")).toMatchObject({ status: "watch" });
    expect(pack.protopediaChecklist.join("\n")).toContain("System Architecture");
    expect(pack.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "submission.package",
      architectureScore: pack.architectureScore,
      endpoint: `${baseUrl}/api/architecture-pack`
    });
  });
});
