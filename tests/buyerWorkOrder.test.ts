import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerWorkOrderBrief, renderBuyerWorkOrderBriefHtml } from "../src/buyerWorkOrder";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildValueBlueprint } from "../src/valueBlueprint";

const WORK_ORDER_PROOF_URL = "https://storage.googleapis.com/a2a-agent-marketplace-proof/release-readiness/work-order.json";

function buildInput(overrides: { weak?: boolean; restricted?: boolean; evidenceUrl?: string; request?: string } = {}) {
  const projectBrief = overrides.weak
    ? "Short internal AI demo"
    : `${DEFAULT_PROJECT_BRIEF}\nA global platform team wants to delegate release-readiness proof work to an A2A squad and show a buyer-ready artifact.`;
  const recommendation = overrides.weak
    ? recommendSquad(projectBrief, ["brief-cartographer"], 140)
    : recommendSquad(projectBrief, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
  const valueBlueprint = buildValueBlueprint(recommendation, projectBrief);
  const buyerScenario = buildBuyerValueScenario(
    recommendation,
    overrides.weak
      ? {
          teamSize: 2,
          hourlyCostYen: 3500,
          cyclesPerMonth: 1,
          manualHoursPerCycle: 5,
          adoptionRatePercent: 15,
          incidentRiskYenPerMonth: 0
        }
      : {
          teamSize: 8,
          hourlyCostYen: 12000,
          cyclesPerMonth: 5,
          manualHoursPerCycle: 28,
          adoptionRatePercent: 75,
          incidentRiskYenPerMonth: 240000
        }
  );

  return {
    recommendation,
    valueBlueprint,
    buyerScenario,
    workOrder: {
      request:
        overrides.request ??
        "Convert our weekly release-readiness review into a public buyer proof packet with named owners, launch evidence, A2A receipt, and a continue or stop decision.",
      targetUser: "Platform sponsor",
      successMetric: "Close four proof gaps and save at least eight hours per release review",
      currentBaseline: "Release evidence is collected manually from scattered docs, CI runs, and review notes",
      dataSensitivity: overrides.restricted ? ("restricted" as const) : ("public" as const),
      evidenceUrl: overrides.evidenceUrl ?? WORK_ORDER_PROOF_URL
    }
  };
}

describe("buyer work order brief", () => {
  test("turns a real work order into a ready buyer pilot artifact", () => {
    const brief = buildBuyerWorkOrderBrief(buildInput());

    expect(brief.readiness).toBe("ready-to-run");
    expect(brief.workOrderScore).toBeGreaterThanOrEqual(80);
    expect(brief.assignments.map((assignment) => assignment.role)).toEqual(["intake", "execute", "prove", "decide"]);
    expect(brief.checks.every((check) => check.status === "clear")).toBe(true);
    expect(brief.a2aPayload).toMatchObject({
      jsonrpc: "2.0",
      method: "message/send"
    });
    expect(brief.exportMarkdown).toContain("Convert our weekly release-readiness review");
  });

  test("keeps useful work orders in proof mode when public evidence is missing", () => {
    const brief = buildBuyerWorkOrderBrief(
      buildInput({
        evidenceUrl: ""
      })
    );

    expect(brief.readiness).toBe("needs-proof");
    expect(brief.checks.find((check) => check.id === "public-proof")).toMatchObject({
      status: "watch"
    });
    expect(brief.nextAction).toContain("Attach a public");
  });

  test("does not count plain HTTP evidence as public work-order proof", () => {
    const brief = buildBuyerWorkOrderBrief(
      buildInput({
        evidenceUrl: "http://proof.example.com/release-readiness/work-order"
      })
    );

    expect(brief.readiness).toBe("needs-proof");
    expect(brief.checks.find((check) => check.id === "public-proof")).toMatchObject({
      status: "watch"
    });
  });

  test("blocks restricted data before external sharing", () => {
    const brief = buildBuyerWorkOrderBrief(
      buildInput({
        restricted: true
      })
    );

    expect(brief.readiness).toBe("blocked");
    expect(brief.checks.find((check) => check.id === "data-boundary")).toMatchObject({
      status: "blocked"
    });
    expect(brief.stopRule).toContain("data boundary");
  });

  test("renders escaped public HTML with export links", () => {
    const brief = buildBuyerWorkOrderBrief({
      ...buildInput(),
      workOrder: {
        ...buildInput().workOrder,
        request: "Review <script>alert(1)</script> safely"
      }
    });
    const html = renderBuyerWorkOrderBriefHtml(brief, {
      jsonUrl: "https://example.com/api/work-order-brief",
      markdownUrl: "https://example.com/work-order-brief.md"
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Buyer Work Order Brief");
    expect(html).toContain("https://example.com/api/work-order-brief");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Review &lt;script&gt;alert(1)&lt;/script&gt; safely");
  });
});
