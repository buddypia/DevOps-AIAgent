import { GoogleAuth } from "google-auth-library";

import type { Mission } from "./missionAgent.js";
import type { OpsAgentRun } from "./opsAgent.js";

export type HireRecord = { agentId: string; hiredAt: string };

export type RunStore = {
  backend: "firestore" | "memory";
  saveRun(run: OpsAgentRun): Promise<void>;
  getRun(id: string): Promise<OpsAgentRun | null>;
  listRuns(limit: number): Promise<OpsAgentRun[]>;
  saveMission(mission: Mission): Promise<void>;
  getMission(id: string): Promise<Mission | null>;
  listMissions(limit: number): Promise<Mission[]>;
  saveHire(agentId: string): Promise<HireRecord>;
  removeHire(agentId: string): Promise<void>;
  listHires(): Promise<HireRecord[]>;
};

// ---------------------------------------------------------------------------
// In-memory (ローカル/テスト用フォールバック — Cloud RunではFirestoreが既定)
// ---------------------------------------------------------------------------

export function createMemoryRunStore(): RunStore {
  const runs = new Map<string, OpsAgentRun>();
  const missions = new Map<string, Mission>();
  const hires = new Map<string, HireRecord>();
  return {
    backend: "memory",
    async saveRun(run) {
      runs.set(run.id, structuredClone(run));
    },
    async getRun(id) {
      const run = runs.get(id);
      return run ? structuredClone(run) : null;
    },
    async listRuns(limit) {
      return [...runs.values()]
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, limit)
        .map((run) => structuredClone(run));
    },
    async saveMission(mission) {
      missions.set(mission.id, structuredClone(mission));
    },
    async getMission(id) {
      const mission = missions.get(id);
      return mission ? structuredClone(mission) : null;
    },
    async listMissions(limit) {
      return [...missions.values()]
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, limit)
        .map((mission) => structuredClone(mission));
    },
    async saveHire(agentId) {
      const record = hires.get(agentId) ?? { agentId, hiredAt: new Date().toISOString() };
      hires.set(agentId, record);
      return record;
    },
    async removeHire(agentId) {
      hires.delete(agentId);
    },
    async listHires() {
      return [...hires.values()];
    }
  };
}

// ---------------------------------------------------------------------------
// Firestore REST (ADC認証 — APIキー/シークレット不要)
// 1ドキュメント = {json: 全体JSON, status/agentId/startedAt: 一覧用スカラー}
// ---------------------------------------------------------------------------

const RUNS_COLLECTION = "agent_runs";
const MISSIONS_COLLECTION = "agent_missions";
const HIRES_COLLECTION = "agent_hires";

type FirestoreDoc = { name?: string; fields?: Record<string, { stringValue?: string }> };

export function createFirestoreRunStore(
  project: string,
  auth: GoogleAuth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/datastore" })
): RunStore {
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;

  async function request(method: string, url: string, body?: unknown): Promise<Response> {
    const token = await auth.getAccessToken();
    const response = await fetch(url, {
      method,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Firestore ${method} ${response.status}: ${(await response.text()).slice(0, 200)}`);
    }
    return response;
  }

  function parseJsonField<T>(doc: FirestoreDoc): T | null {
    const raw = doc.fields?.json?.stringValue;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  return {
    backend: "firestore",
    async saveRun(run) {
      await request("PATCH", `${baseUrl}/${RUNS_COLLECTION}/${run.id}`, {
        fields: {
          json: { stringValue: JSON.stringify(run) },
          status: { stringValue: run.status },
          agentId: { stringValue: run.agentId },
          startedAt: { stringValue: run.startedAt }
        }
      });
    },
    async getRun(id) {
      const response = await request("GET", `${baseUrl}/${RUNS_COLLECTION}/${id}`);
      if (response.status === 404) return null;
      return parseJsonField<OpsAgentRun>((await response.json()) as FirestoreDoc);
    },
    async listRuns(limit) {
      const response = await request("POST", `${baseUrl.replace(/\/documents$/, "/documents")}:runQuery`, {
        structuredQuery: {
          from: [{ collectionId: RUNS_COLLECTION }],
          orderBy: [{ field: { fieldPath: "startedAt" }, direction: "DESCENDING" }],
          limit
        }
      });
      const rows = (await response.json()) as Array<{ document?: FirestoreDoc }>;
      return rows
        .map((row) => (row.document ? parseJsonField<OpsAgentRun>(row.document) : null))
        .filter((run): run is OpsAgentRun => run !== null);
    },
    async saveMission(mission) {
      await request("PATCH", `${baseUrl}/${MISSIONS_COLLECTION}/${mission.id}`, {
        fields: {
          json: { stringValue: JSON.stringify(mission) },
          status: { stringValue: mission.status },
          startedAt: { stringValue: mission.startedAt }
        }
      });
    },
    async getMission(id) {
      const response = await request("GET", `${baseUrl}/${MISSIONS_COLLECTION}/${id}`);
      if (response.status === 404) return null;
      return parseJsonField<Mission>((await response.json()) as FirestoreDoc);
    },
    async listMissions(limit) {
      const response = await request("POST", `${baseUrl.replace(/\/documents$/, "/documents")}:runQuery`, {
        structuredQuery: {
          from: [{ collectionId: MISSIONS_COLLECTION }],
          orderBy: [{ field: { fieldPath: "startedAt" }, direction: "DESCENDING" }],
          limit
        }
      });
      const rows = (await response.json()) as Array<{ document?: FirestoreDoc }>;
      return rows
        .map((row) => (row.document ? parseJsonField<Mission>(row.document) : null))
        .filter((mission): mission is Mission => mission !== null);
    },
    async saveHire(agentId) {
      const record: HireRecord = { agentId, hiredAt: new Date().toISOString() };
      await request("PATCH", `${baseUrl}/${HIRES_COLLECTION}/${agentId}`, {
        fields: { json: { stringValue: JSON.stringify(record) }, agentId: { stringValue: agentId } }
      });
      return record;
    },
    async removeHire(agentId) {
      await request("DELETE", `${baseUrl}/${HIRES_COLLECTION}/${agentId}`);
    },
    async listHires() {
      const response = await request("GET", `${baseUrl}/${HIRES_COLLECTION}?pageSize=50`);
      if (response.status === 404) return [];
      const body = (await response.json()) as { documents?: FirestoreDoc[] };
      return (body.documents ?? [])
        .map((doc) => parseJsonField<HireRecord>(doc))
        .filter((record): record is HireRecord => record !== null);
    }
  };
}

export function createRunStore(project: string | undefined, backendPreference: string | undefined): RunStore {
  if (project && backendPreference !== "memory") return createFirestoreRunStore(project);
  return createMemoryRunStore();
}
