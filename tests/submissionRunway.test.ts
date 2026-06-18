import { describe, expect, test } from "vitest";
import type { SubmissionCloseoutWorkbench } from "../src/submissionCloseout";
import type { SubmissionLaunchGate } from "../src/submissionLaunch";
import { buildFinalSubmissionRunway, HACKATHON_SUBMISSION_DEADLINE } from "../src/submissionRunway";
import type { WinnerProofPacket } from "../src/winnerPacket";

const baseUrl = "https://a2a-agent-marketplace.example.com";
const currentDate = "2026-06-18T12:00:00+09:00";

function fixture(input: { readyUrls?: boolean; blocked?: boolean } = {}) {
  const winnerPacket = {
    packetScore: input.blocked ? 68 : input.readyUrls ? 93 : 87,
    readiness: input.blocked ? "needs-proof" : input.readyUrls ? "winner-packet-ready" : "external-gap-packet",
    criteria: [
      { id: "agent-centrality", status: input.blocked ? "blocked" : "ready" },
      { id: "approach", status: "ready" },
      { id: "usability", status: "ready" },
      { id: "practicality", status: "ready" },
      { id: "implementation", status: "ready" }
    ],
    judgeQuestions: [{ id: "q1", status: input.blocked ? "blocked" : "ready" }],
    recordingOrder: [
      { id: "open-command", timeRange: "0-12s" },
      { id: "competitive-proof", timeRange: "42-58s" }
    ]
  } as WinnerProofPacket;
  const closeout = {
    closeoutScore: input.readyUrls ? 94 : 86,
    readiness: input.readyUrls ? "ready-to-submit" : "needs-closeout",
    copyFields: [{ id: "title" }, { id: "features" }],
    workItems: [
      { id: "paste-protopedia-fields", status: "ready" },
      { id: "attach-architecture", status: "ready" },
      { id: "record-video", status: input.readyUrls ? "ready" : "watch" },
      { id: "publish-protopedia", status: input.readyUrls ? "ready" : "watch" }
    ]
  } as SubmissionCloseoutWorkbench;
  const launchGate = {
    launchScore: input.blocked ? 45 : input.readyUrls ? 96 : 82,
    readiness: input.blocked ? "invalid-urls" : input.readyUrls ? "submit-ready" : "needs-external-urls",
    submitPacket: {
      protopediaUrl: input.readyUrls ? "https://protopedia.net/prototype/123456" : "",
      submitterMemo: "Submit GitHub, Cloud Run, ProtoPedia URLs."
    },
    urlStatuses: [
      {
        id: "protopedia-url",
        status: input.blocked ? "invalid" : input.readyUrls ? "ready" : "missing",
        proof: input.readyUrls ? "ProtoPedia URL ready" : "ProtoPedia URL pending"
      },
      {
        id: "video-url",
        status: input.blocked ? "invalid" : input.readyUrls ? "ready" : "missing",
        proof: input.readyUrls ? "Video URL ready" : "Video URL pending"
      }
    ]
  } as SubmissionLaunchGate;

  return buildFinalSubmissionRunway({ baseUrl, currentDate, winnerPacket, closeout, launchGate });
}

describe("final submission runway", () => {
  test("turns remaining external URLs into a deadline-risk workback plan", () => {
    const runway = fixture();

    expect(runway.deadline).toBe(HACKATHON_SUBMISSION_DEADLINE);
    expect(runway.daysRemaining).toBeGreaterThanOrEqual(22);
    expect(runway.readiness).toBe("deadline-risk");
    expect(runway.nextAction.id).toBe("record-demo-video");
    expect(runway.tracks.map((track) => track.id)).toEqual(["winner-proof", "protopedia-assets", "demo-video", "final-launch"]);
    expect(runway.dailyPlan.join("\n")).toContain("Record 90-second proof video");
    expect(runway.evidenceLocks.map((lock) => lock.id)).toEqual(["winner-packet", "submission-closeout", "submission-launch", "release-drift"]);
    expect(runway.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "submission.runway",
      readiness: "deadline-risk",
      endpoints: {
        submissionRunway: `${baseUrl}/api/submission-runway`
      }
    });
  });

  test("becomes on-track when external URLs and launch gate are ready", () => {
    const runway = fixture({ readyUrls: true });

    expect(runway.readiness).toBe("on-track");
    expect(runway.tracks.find((track) => track.id === "final-launch")?.status).toBe("done");
    expect(runway.dailyPlan.every((item) => !item.includes("Publish video URL"))).toBe(true);
  });

  test("blocks when winner proof or external URL evidence is invalid", () => {
    const runway = fixture({ blocked: true });

    expect(runway.readiness).toBe("blocked");
    expect(runway.nextAction.status).toBe("blocked");
    expect(runway.evidenceLocks.find((lock) => lock.id === "submission-launch")?.status).toBe("blocked");
  });
});
