import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, FileCheck2, FlaskConical, Network, Target, Workflow } from "lucide-react";

import AgentRoster from "./AgentRoster.js";
import IncidentDrillPanel from "./IncidentDrillPanel.js";
import MissionControl from "./MissionControl.js";
import OpsAgentConsole from "./OpsAgentConsole.js";
import { MAX_CUSTOM_AGENTS } from "./customAgent.js";
import { SUBMISSION_PROOF } from "./submission.js";

import type { AgentCardImportResult } from "./customAgent.js";
import type { AgentIdentity } from "./MissionControl.js";
import type { AgentTrackRecordView } from "./missionTypes.js";
import type { MarketAgent } from "./types.js";

type HealthInfo = {
  geminiMode?: string;
  opsAgent?: { enabled?: boolean; runStore?: string; executableAgents?: number };
  missionControl?: { enabled?: boolean };
};

export default function AppHome() {
  const [agents, setAgents] = useState<AgentIdentity[]>([]);
  const [stats, setStats] = useState<Map<string, AgentTrackRecordView>>(new Map());
  const [hiredIds, setHiredIds] = useState<Set<string>>(new Set());
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [hireBusy, setHireBusy] = useState(false);
  const [cardUrl, setCardUrl] = useState("");
  const [cardResult, setCardResult] = useState<AgentCardImportResult | null>(null);
  const [importedAgents, setImportedAgents] = useState<MarketAgent[]>([]);
  const [cardLoading, setCardLoading] = useState(false);

  const agentsById = useMemo(() => new Map(agents.map((agent) => [agent.agentId, agent])), [agents]);

  useEffect(() => {
    void (async () => {
      try {
        const [jobsRes, healthRes] = await Promise.all([fetch("/api/agent-jobs"), fetch("/api/healthz")]);
        const jobs = (await jobsRes.json()) as { jobs?: Array<AgentIdentity & { title: string }> };
        setAgents((jobs.jobs ?? []).map(({ agentId, name, handle, color }) => ({ agentId, name, handle, color })));
        setHealth((await healthRes.json()) as HealthInfo);
      } catch {
        // 初期ロード失敗時は各セクションが空表示のまま (サーバー復帰後のリロードで回復)
      }
    })();
  }, []);

  const refreshRecords = useCallback(async () => {
    try {
      const [statsRes, hiresRes] = await Promise.all([fetch("/api/agent-stats"), fetch("/api/hires")]);
      const statsBody = (await statsRes.json()) as { stats?: AgentTrackRecordView[] };
      const hiresBody = (await hiresRes.json()) as { hires?: Array<{ agentId: string }> };
      setStats(new Map((statsBody.stats ?? []).map((record) => [record.agentId, record])));
      setHiredIds(new Set((hiresBody.hires ?? []).map((hire) => hire.agentId)));
    } catch {
      // 統計取得失敗は次のrefreshで回復
    }
  }, []);

  useEffect(() => {
    void refreshRecords();
  }, [refreshRecords, refreshSignal]);

  const handleActivitySettled = useCallback(() => {
    setRefreshSignal((value) => value + 1);
  }, []);

  async function handleToggleHire(agentId: string) {
    setHireBusy(true);
    try {
      if (hiredIds.has(agentId)) {
        await fetch(`/api/hires/${agentId}`, { method: "DELETE" });
      } else {
        await fetch("/api/hires", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ agentId })
        });
      }
      await refreshRecords();
    } finally {
      setHireBusy(false);
    }
  }

  async function importAgentCard() {
    if (!cardUrl.trim()) return;
    setCardLoading(true);
    try {
      const response = await fetch("/api/agent-card/discover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: cardUrl.trim() })
      });
      const result = (await response.json()) as AgentCardImportResult;
      setCardResult(result);
      if (result.status === "accepted" && importedAgents.length < MAX_CUSTOM_AGENTS) {
        setImportedAgents((prev) => [...prev, result.agent]);
      }
    } catch {
      setCardResult({ status: "rejected", error: "Agent Cardの取得に失敗しました。", warnings: [], signals: [] });
    } finally {
      setCardLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◆
          </span>
          <div>
            <p className="brand-name">Agent Guild</p>
            <p className="brand-tag">A2A Agent Marketplace / Mission Control</p>
          </div>
        </div>
        <div className="top-status">
          {health ? (
            <>
              <span className="status-pill">
                <CheckCircle2 size={13} /> Gemini {health.geminiMode ?? "none"}
              </span>
              <span className="status-pill">store: {health.opsAgent?.runStore ?? "-"}</span>
              <span className="status-pill">{health.opsAgent?.executableAgents ?? 8}体 実行可能</span>
            </>
          ) : null}
          <a className="status-pill status-link" href="/.well-known/agent-card.json" target="_blank" rel="noreferrer">
            Agent Card <ExternalLink size={11} />
          </a>
        </div>
      </header>

      <section className="hero-copy">
        <div className="hero-text">
          <p className="hero-kicker">審査員向けの実演コマンドセンター</p>
          <h1>
            実データで、<span className="hero-accent">答え</span>を出す。
          </h1>
          <p>
            1つの目標からGeminiが専門エージェントを選び、実システムの証拠を集めてレポートします。
          </p>
          <div className="hero-actions">
            <a className="btn-primary" href="#mission-control">
              <Target size={16} /> 本番監査を試す
            </a>
            <a className="btn-secondary" href="#safe-demo">
              <FlaskConical size={16} /> 安全デモを見る
            </a>
          </div>
        </div>
        <img
          className="hero-image"
          src="/assets/agent-marketplace-hero.webp"
          alt="8体の専門エージェントがコマンドコンソールを囲むエンブレムネットワーク"
          width={1200}
          height={669}
          loading="eager"
          fetchPriority="high"
        />
      </section>

      <section className="how-it-works" aria-labelledby="how-it-works-title">
        <div className="section-head compact-head">
          <p className="section-kicker">この画面で起きること</p>
          <h2 id="how-it-works-title">見る順番は、目標 → 実行 → 根拠</h2>
          <p>最初は本番監査を開始してください。模擬インシデントは下の安全なデモ実験から別に試せます。</p>
        </div>
        <div className="process-rail">
          <div className="process-step">
            <Target size={18} />
            <div><strong>1. 目標を書く</strong><span>何を確認したいかを入力</span></div>
          </div>
          <div className="process-connector" aria-hidden="true" />
          <div className="process-step">
            <Workflow size={18} />
            <div><strong>2. AIが分担する</strong><span>専門エージェントを自律選抜</span></div>
          </div>
          <div className="process-connector" aria-hidden="true" />
          <div className="process-step">
            <FileCheck2 size={18} />
            <div><strong>3. 根拠で判断する</strong><span>引用ゲートとcheckerで検証</span></div>
          </div>
        </div>
      </section>

      <section id="mission-control" className="surface-section" aria-labelledby="mission-control-title">
        <div className="section-head">
          <p className="section-kicker">本番監査</p>
          <h2 id="mission-control-title">実システムに目標を渡す</h2>
          <p>Cloud Run、CI、依存パッケージ、配信HTMLなど、実際の対象へミッションを実行します。</p>
        </div>
        <MissionControl agents={agentsById} onMissionSettled={handleActivitySettled} />
      </section>

      <IncidentDrillPanel />

      <section aria-label="ギルド名鑑">
        <div className="section-head">
          <h2>ギルド名鑑</h2>
          <p>能力値の演出はありません。数字とランクはFirestoreの実行履歴から自動算出されます。</p>
        </div>
        <AgentRoster agents={agents} stats={stats} hiredIds={hiredIds} busy={hireBusy} onToggleHire={handleToggleHire} />
      </section>

      <section aria-label="個別エージェント実行">
        <div className="section-head">
          <p className="section-kicker">個別実行</p>
          <h2>エージェントを1体ずつ試す</h2>
          <p>雇用したエージェントを指名して、証拠収集からcheckerまでの実行履歴を確認します。</p>
        </div>
        <OpsAgentConsole refreshSignal={refreshSignal} onRunSettled={handleActivitySettled} />
      </section>

      <section className="network" aria-label="A2Aネットワーク">
        <div className="section-head">
          <h2>
            <Network size={18} /> A2Aネットワーク
          </h2>
          <p>このギルド自身もA2Aエージェント。外部エージェントのAgent Cardを検証付きで取り込み、A2A委任の相手として評価できる。</p>
        </div>
        <div className="import-row">
          <input
            className="import-input"
            placeholder="https://example.com/.well-known/agent-card.json"
            value={cardUrl}
            onChange={(event) => setCardUrl(event.target.value)}
            aria-label="Agent Card URL"
          />
          <button type="button" className="btn-secondary" onClick={importAgentCard} disabled={cardLoading}>
            {cardLoading ? "取込中…" : "Agent Cardを取り込む"}
          </button>
        </div>
        {cardResult ? (
          cardResult.status === "accepted" ? (
            <p className="import-ok">
              <CheckCircle2 size={14} /> {cardResult.agent.name} を検証して取り込みました（評価のみ・実行対象は自ギルドの8体）。
            </p>
          ) : (
            <p className="import-error">{cardResult.error}</p>
          )
        ) : null}
        {importedAgents.length > 0 ? (
          <ul className="imported-list">
            {importedAgents.map((agent) => (
              <li key={agent.id}>
                <strong>{agent.name}</strong> - {agent.headline} <span className="imported-tag">外部 / A2Aスキル {agent.a2aSkillIds.length}件</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="proof-row">
          <a href={SUBMISSION_PROOF.publicGitHubUrl} target="_blank" rel="noreferrer">
            GitHub <ExternalLink size={11} />
          </a>
          <a href={SUBMISSION_PROOF.ciWorkflowUrl} target="_blank" rel="noreferrer">
            CI <ExternalLink size={11} />
          </a>
          <a href="/api/healthz" target="_blank" rel="noreferrer">
            healthz <ExternalLink size={11} />
          </a>
          <a href="/api/agent-stats" target="_blank" rel="noreferrer">
            実績API <ExternalLink size={11} />
          </a>
          <span className="proof-note">Cloud Run + Firestore + Cloud Logging + Gemini で稼働中</span>
        </div>
      </section>
    </main>
  );
}
