import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { BLUEPRINT_TEMPLATES, DEFAULT_BLUEPRINT_TEMPLATE, getBlueprintTemplate } from "../src/blueprintTemplates";
import { buildValueBlueprint } from "../src/valueBlueprint";

describe("blueprint templates", () => {
  test("ships curated first-run templates that stay inside the budget", () => {
    expect(BLUEPRINT_TEMPLATES.map((template) => template.id)).toEqual(["platform-launch", "security-review", "buyer-roi", "quality-proof"]);

    for (const template of BLUEPRINT_TEMPLATES) {
      const recommendation = recommendSquad(template.brief, template.selectedAgentIds, 140);
      const blueprint = buildValueBlueprint(recommendation, template.brief);

      expect(recommendation.budgetUsed).toBeLessThanOrEqual(140);
      expect(blueprint.jobs.length).toBeGreaterThanOrEqual(3);
      expect(blueprint.boardScore).toBeGreaterThanOrEqual(50);
      expect(template.brief.length).toBeGreaterThan(120);
      expect(template.buyerScenario.teamSize).toBeGreaterThanOrEqual(6);
      expect(template.buyerScenario.manualHoursPerCycle).toBeGreaterThanOrEqual(18);
      expect(template.pilotRun.observedManualMinutes).toBeGreaterThan(template.pilotRun.observedAssistedMinutes);
      expect(template.pilotRun.notes).toContain("benchmark");
      expect(template.buyerWorkOrder.request.length).toBeGreaterThan(90);
      expect(template.buyerWorkOrder.successMetric.length).toBeGreaterThan(40);
      expect(["public", "internal", "restricted"]).toContain(template.buyerWorkOrder.dataSensitivity);
    }
  });

  test("security and buyer templates produce different value reads", () => {
    const security = getBlueprintTemplate("security-review");
    const buyer = getBlueprintTemplate("buyer-roi");
    const securityBlueprint = buildValueBlueprint(recommendSquad(security.brief, security.selectedAgentIds, 140), security.brief);
    const buyerBlueprint = buildValueBlueprint(recommendSquad(buyer.brief, buyer.selectedAgentIds, 140), buyer.brief);

    expect(securityBlueprint.primaryUser).toBe("Security-conscious Engineering Lead");
    expect(buyerBlueprint.primaryUser).toBe("AI product buyer");
    expect(securityBlueprint.jobs.map((job) => job.id)).toContain("security-sentinel");
    expect(buyerBlueprint.jobs.map((job) => job.id)).toContain("ux-guildmaster");
  });

  test("falls back to the default template for unknown ids", () => {
    expect(getBlueprintTemplate("missing")).toEqual(DEFAULT_BLUEPRINT_TEMPLATE);
  });
});
