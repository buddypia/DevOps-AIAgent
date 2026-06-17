import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildSquadContract } from "../src/contracts";
import { buildFinalistSimulation } from "../src/finalist";
import { buildJudgeDrill } from "../src/judgeDrill";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import { buildProtoPediaPublisher } from "../src/publisher";
import { buildWinningStrategy } from "../src/strategy";

describe("protopedia publisher", () => {
  test("packages paste-ready submission fields while preserving external URL gaps", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const opsDrill = buildOpsDrill(recommendation, strategy);
    const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
    const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
    const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
    const finalist = buildFinalistSimulation({
      baseUrl,
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch,
      judgeDrill,
      squadContract
    });
    const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });

    expect(publisher.publishScore).toBeGreaterThanOrEqual(80);
    expect(publisher.readiness).toBe("needs-external-urls");
    expect(publisher.pasteFields.map((item) => item.id)).toEqual(
      expect.arrayContaining(["title", "one-liner", "problem", "features", "technology", "demo-flow", "judge-proof", "tags"])
    );
    expect(publisher.pasteFields.find((item) => item.id === "tags")?.value).toContain("findy_hackathon");
    expect(publisher.assets.find((item) => item.id === "cloud-run")?.status).toBe("ready");
    expect(publisher.assets.find((item) => item.id === "protopedia")?.status).toBe("watch");
    expect(publisher.missingExternal.map((item) => item.id)).toEqual(expect.arrayContaining(["record-video", "publish-protopedia"]));
    expect(publisher.recordingScript).toContain("AI能力");
    expect(publisher.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "submission.publish"
    });
  });
});
