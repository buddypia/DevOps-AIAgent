import { describe, expect, it } from "vitest";

import { createGenAiClient, createRun, getOpsConfig } from "../server/opsAgent.js";
import { createMemoryRunStore, createRunStore } from "../server/runStore.js";
import type { OpsAgentRun } from "../server/opsAgent.js";

function makeRun(startedAt: string): OpsAgentRun {
  const config = { ...getOpsConfig({} as NodeJS.ProcessEnv), project: "test-project" };
  const genAi = createGenAiClient(config);
  if (!genAi) throw new Error("test setup: genAi unavailable");
  const run = createRun("cloud-run-sre", "a2a-agent-marketplace", "web", { config, genAi });
  run.startedAt = startedAt;
  return run;
}

describe("createMemoryRunStore", () => {
  it("round-trips runs and lists them newest first", async () => {
    const store = createMemoryRunStore();
    const older = makeRun("2026-07-10T00:00:00.000Z");
    const newer = makeRun("2026-07-10T01:00:00.000Z");
    await store.saveRun(older);
    await store.saveRun(newer);

    const fetched = await store.getRun(older.id);
    expect(fetched?.id).toBe(older.id);
    expect(await store.getRun("missing-id")).toBeNull();

    const listed = await store.listRuns(10);
    expect(listed.map((run) => run.id)).toEqual([newer.id, older.id]);
    expect(await store.listRuns(1)).toHaveLength(1);
  });

  it("updates persisted state on re-save (state survives outside the agent)", async () => {
    const store = createMemoryRunStore();
    const run = makeRun("2026-07-10T00:00:00.000Z");
    await store.saveRun(run);
    run.status = "completed";
    await store.saveRun(run);
    expect((await store.getRun(run.id))?.status).toBe("completed");
  });

  it("manages hire records (hire -> list -> fire)", async () => {
    const store = createMemoryRunStore();
    const hire = await store.saveHire("cloud-run-sre");
    expect(hire.agentId).toBe("cloud-run-sre");
    expect(await store.listHires()).toHaveLength(1);
    await store.saveHire("cloud-run-sre");
    expect(await store.listHires()).toHaveLength(1);
    await store.removeHire("cloud-run-sre");
    expect(await store.listHires()).toHaveLength(0);
  });
});

describe("createRunStore", () => {
  it("falls back to memory when no project is configured or memory is forced", () => {
    expect(createRunStore(undefined, undefined).backend).toBe("memory");
    expect(createRunStore("some-project", "memory").backend).toBe("memory");
  });

  it("selects firestore when a project is configured", () => {
    expect(createRunStore("some-project", undefined).backend).toBe("firestore");
  });
});
