import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BuyerLaunchHandoffComposer from "../src/BuyerLaunchHandoffComposer";
import { buildLaunchRoom } from "../src/launchRoom";
import { defaultWorkspaceDraft } from "../src/workspaceDraft";

describe("BuyerLaunchHandoffComposer", () => {
  it("surfaces the cover sheet and stakeholder brief pack inside the workbench handoff", () => {
    const launchRoom = buildLaunchRoom({
      workspace: defaultWorkspaceDraft("2026-06-20T00:00:00.000Z"),
      baseUrl: "https://launch.example",
      appUrl: "https://launch.example/?workspace=share-token"
    });

    const html = renderToStaticMarkup(createElement(BuyerLaunchHandoffComposer, { launchRoom, onCopyText: async () => true }));

    expect(html).toContain('aria-label="Stakeholder brief forwarding pack"');
    expect(html).toContain("Forwarding pack");
    expect(html).toContain("Cover sheet");
    expect(html).toContain('download="buyer-cover-sheet.md"');
    expect(html).toContain('aria-label="Buyer cover signals"');
    expect(html).toContain('aria-label="Stakeholder briefs"');
    expect(html).toContain("Economic buyer brief");
    expect(html).toContain("Security reviewer brief");
    expect(html).toContain("Pilot operator brief");
    expect(html).toContain("Procurement owner brief");
    expect(html).toContain('download="launch-room-economic-buyer-brief.md"');
    expect(html).toContain('download="launch-room-security-reviewer-brief.md"');
    expect(html).toContain('aria-label="Buyer activity trail"');
    expect(html).toContain("Cover sheet prepared");
    expect(html).toContain("Reply route recorded");
    expect(html).toContain("Decision receipt sealed");
    expect(html).toContain('download="buyer-activity-trail.md"');
    expect(html).toContain('download="buyer-follow-up-crm-note.md"');
    expect(html).toContain('download="buyer-follow-up-slack-update.txt"');
    expect(html).toContain('download="buyer-follow-up-tasks.csv"');
    expect(html).toContain('download="buyer-follow-up-receipt.md"');
    expect(html).toContain('download="buyer-follow-up-replay-payload.json"');
    expect(html).toContain("Follow-up receipt");
    expect(html).not.toContain("[object Object]");
  });
});
