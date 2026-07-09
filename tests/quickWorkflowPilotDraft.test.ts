import { describe, expect, test } from "vitest";
import {
  defaultQuickWorkflowPilotDraftState,
  normalizeQuickWorkflowPilotDraftState,
  parseQuickWorkflowPilotDraft,
  quickWorkflowPilotDraftCompletion,
  quickWorkflowPilotDraftHasContent,
  quickWorkflowPilotDraftStorageKey,
  serializeQuickWorkflowPilotDraft
} from "../src/quickWorkflowPilotDraft";

describe("quick workflow pilot draft", () => {
  test("round-trips buyer pilot packet fields with a workflow-scoped storage key", () => {
    const state = normalizeQuickWorkflowPilotDraftState({
      buyerResponseText: " Approved for the 14-day pilot. ",
      kickoffStartDate: "2026-07-03",
      runEvidenceText: " Day 0 kickoff opened. Day 30 value floor checked. ",
      expansion: {
        measuredValueText: " 720000 ",
        ownerName: " Finance owner ",
        ownerDecision: "approved",
        receiptChainAttached: true,
        nextWindow: " Next operating window with value recheck ",
        manualEvidenceText: " Sponsor signed the renewal note. "
      }
    });

    const serialized = serializeQuickWorkflowPilotDraft(state, "2026-07-03T00:00:00.000Z");
    const parsed = parseQuickWorkflowPilotDraft(serialized);

    expect(quickWorkflowPilotDraftStorageKey({ buyer: "Platform release lead", workflow: "Weekly release review" })).toMatch(
      /^quick-workflow-pilot-draft:[0-9a-f]{8}$/
    );
    expect(parsed).toEqual(state);
    expect(quickWorkflowPilotDraftHasContent(state)).toBe(true);
    expect(quickWorkflowPilotDraftCompletion(state)).toMatchObject({
      readyCount: 7,
      totalCount: 7,
      label: "7/7 pilot fields saved"
    });
  });

  test("rejects corrupt, empty, and invalid draft data without throwing", () => {
    expect(parseQuickWorkflowPilotDraft("{not-json")).toBeNull();
    expect(parseQuickWorkflowPilotDraft(null)).toBeNull();
    expect(parseQuickWorkflowPilotDraft(serializeQuickWorkflowPilotDraft(defaultQuickWorkflowPilotDraftState()))).toBeNull();

    const normalized = normalizeQuickWorkflowPilotDraftState({
      kickoffStartDate: "tomorrow",
      expansion: {
        ownerName: "",
        ownerDecision: "maybe" as "approved"
      }
    });

    expect(normalized).toMatchObject({
      kickoffStartDate: "2026-07-01",
      expansion: {
        ownerName: "Finance owner",
        ownerDecision: "not-recorded"
      }
    });
    expect(quickWorkflowPilotDraftHasContent(normalized)).toBe(false);
  });
});
