import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ExternalLink, FileCheck2, FlaskConical, Network, Target, Workflow } from "lucide-react";

import AgentRoster from "./AgentRoster.js";
import Callout from "./Callout.js";
import EvidenceDashboard, { EvidenceKpiHighlights } from "./EvidenceDashboard.js";
import IncidentDrillPanel from "./IncidentDrillPanel.js";
import MissionControl from "./MissionControl.js";
import MergeStewardPanel from "./MergeStewardPanel.js";
import OpsAgentConsole from "./OpsAgentConsole.js";
import RosterHighlights from "./RosterHighlights.js";
import WorkflowDiagram from "./WorkflowDiagram.js";
import { MAX_CUSTOM_AGENTS } from "./customAgent.js";
import { SUBMISSION_PROOF } from "./submission.js";


import type { AgentCardImportResult } from "./customAgent.js";
import type { AgentIdentity } from "./MissionControl.js";
import type { AgentTrackRecordView, EvidenceSummaryView } from "./missionTypes.js";
import type { MarketAgent } from "./types.js";

type HealthInfo = {
  geminiMode?: string;
  opsAgent?: { enabled?: boolean; runStore?: string; executableAgents?: number };
  missionControl?: { enabled?: boolean };
  mergeSteward?: { configured?: boolean; repository?: string };
};

type ExternalDelegationResponse =
  | {
      ok: true;
      receipt: {
        status: "accepted" | "completed";
        taskId: string | null;
        taskState: string | null;
        agentName: string;
        skillId: string;
        responseMessage: string | null;
      };
    }
  | { ok: false; error?: string; message?: string };

export default function AppHome() {
  const [agents, setAgents] = useState<AgentIdentity[]>([]);
  const [stats, setStats] = useState<Map<string, AgentTrackRecordView>>(new Map());
  const [evidence, setEvidence] = useState<EvidenceSummaryView | null>(null);
  const [hiredIds, setHiredIds] = useState<Set<string>>(new Set());
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [hireBusy, setHireBusy] = useState(false);
  const [cardUrl, setCardUrl] = useState("");
  const [cardResult, setCardResult] = useState<AgentCardImportResult | null>(null);
  const [importedAgents, setImportedAgents] = useState<MarketAgent[]>([]);
  const [cardLoading, setCardLoading] = useState(false);
  const [delegationMessage, setDelegationMessage] = useState("このAgent Cardが担当できる範囲を証明してください。");
  const [delegationLoading, setDelegationLoading] = useState(false);
  const [delegationResult, setDelegationResult] = useState<ExternalDelegationResponse | null>(null);

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
      const statsBody = (await statsRes.json()) as { stats?: AgentTrackRecordView[]; summary?: EvidenceSummaryView };
      const hiresBody = (await hiresRes.json()) as { hires?: Array<{ agentId: string }> };
      setStats(new Map((statsBody.stats ?? []).map((record) => [record.agentId, record])));
      setEvidence(statsBody.summary ?? null);
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
      setDelegationResult(null);
      if (result.status === "accepted" && importedAgents.length < MAX_CUSTOM_AGENTS) {
        setImportedAgents((prev) => [...prev, result.agent]);
      }
    } catch {
      setCardResult({ status: "rejected", error: "Agent Cardの取得に失敗しました。", warnings: [], signals: [] });
    } finally {
      setCardLoading(false);
    }
  }

  async function delegateAgentCard() {
    if (cardResult?.status !== "accepted" || !delegationMessage.trim()) return;
    setDelegationLoading(true);
    setDelegationResult(null);
    try {
      const response = await fetch("/api/external-agent/delegate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentCardUrl: cardUrl.trim(),
          skillId: cardResult.agent.a2aSkillIds[0],
          message: delegationMessage.trim()
        })
      });
      setDelegationResult((await response.json()) as ExternalDelegationResponse);
    } catch {
      setDelegationResult({ ok: false, error: "external_agent_error", message: "外部エージェントへの接続に失敗しました。" });
    } finally {
      setDelegationLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <img className="brand-mark" src="/assets/agent-guild-icon.png" alt="" width="38" height="38" />
          <div>
            <p className="brand-name">Agent Guild</p>
            <p className="brand-tag">A2A Agent Marketplace / DevOps Mission Control</p>
          </div>
        </div>
        <div className="top-status">
          {health ? (
            <>
              <span className="status-pill">
                <CheckCircle2 size={13} /> 分析: Gemini {health.geminiMode === "none" ? "ローカル動作" : health.geminiMode ?? "未接続"}
              </span>
              <span className="status-pill">履歴保存: {health.opsAgent?.runStore ?? "-"}</span>
              <span className="status-pill">調査役 {health.opsAgent?.executableAgents ?? 9}件</span>
            </>
          ) : null}
          <a
            className="status-pill status-link"
            href="/.well-known/agent-card.json"
            target="_blank"
            rel="noreferrer"
            title="このアプリ自身のAgent Card（A2A標準の公開プロフィールJSON）"
          >
            自分のAgent Card <ExternalLink size={11} />
          </a>
        </div>
      </header>

      <div className="bento" aria-label="状態サマリー">
        <div className="bento-hero">
          <div>
            <span className="bento-hero-kicker">A2A Agent Marketplace for DevOps Mission Control</span>
            <h1>必要なAIを選び、任せて検証する。</h1>
            <p>目標に合う専門エージェントを選抜し、A2Aで実行を委任。Cloud Run、CI、ログの証拠から次の対応を整理します。</p>
          </div>
          <div className="bento-hero-actions">
            <a className="is-primary" href="#mission-control">
              <Target size={16} /> 調査を始める
            </a>
            <a href="#safe-demo">
              <FlaskConical size={16} /> 安全なデモを見る
            </a>
          </div>
        </div>
        <RosterHighlights agents={agents} stats={stats} />
        <div className="bento-kpi-row">
          <EvidenceKpiHighlights summary={evidence} />
        </div>
      </div>

      <EvidenceDashboard summary={evidence} />

      <WorkflowDiagram />

      <section className="how-it-works" aria-labelledby="how-it-works-title">
        <div className="section-head compact-head">

          <p className="section-kicker">この画面で起きること</p>
          <h2 id="how-it-works-title">目的を入力すると、調査から結果まで進みます</h2>
          <p>画面上では、調査の進み具合・見つかったこと・その根拠を順番に確認できます。</p>
        </div>
        <div className="process-rail">
          <div className="process-step">
            <span className="process-ico">
              <span className="process-num">1</span>
              <Target size={18} />
            </span>
            <div><strong>目的を入力</strong><span>確認したいことを1行で書く</span></div>
          </div>
          <div className="process-arrow" aria-hidden="true">
            <ArrowRight size={22} />
          </div>
          <div className="process-step">
            <span className="process-ico">
              <span className="process-num">2</span>
              <Workflow size={18} />
            </span>
            <div><strong>調査を分担</strong><span>内容に合う調査役が自動で動く</span></div>
          </div>
          <div className="process-arrow" aria-hidden="true">
            <ArrowRight size={22} />
          </div>
          <div className="process-step">
            <span className="process-ico">
              <span className="process-num">3</span>
              <FileCheck2 size={18} />
            </span>
            <div><strong>根拠を確認</strong><span>ログと対応案を照らし合わせる</span></div>
          </div>
        </div>
      </section>

      <section id="mission-control" className="surface-section" aria-labelledby="mission-control-title">
        <div className="section-head">
          <p className="section-kicker">まとめて調査</p>
          <h2 id="mission-control-title">確認したいことを入力する</h2>
          <p>Cloud Run、CI、依存パッケージ、配信中のHTMLなど、実際の対象を順に確認します。</p>
        </div>
        <MissionControl agents={agentsById} onMissionSettled={handleActivitySettled} />
      </section>

      <IncidentDrillPanel />

      <section aria-label="調査役一覧">
        <div className="section-head">
          <h2>調査役一覧</h2>
          <p>表示している数字は、実行履歴から計算した実績です。</p>
        </div>
        <Callout tone="help" title="「有効にする」と「採用率」の違い">
          <strong>有効にする</strong>＝この調査役を「まとめて調査」で使う候補に含めるスイッチです（オン/オフはいつでも切替可）。
          <strong>採用率</strong>＝過去の所見のうち、<strong>引用チェックを通り、独立した再確認でも覆らなかった</strong>割合です。実行するたびに自動で記録・再計算され、ランクもここから決まります。
        </Callout>
        <AgentRoster agents={agents} stats={stats} hiredIds={hiredIds} busy={hireBusy} onToggleHire={handleToggleHire} />
      </section>

      <section aria-label="個別調査">
        <div className="section-head">
          <p className="section-kicker">個別実行</p>
          <h2>調査役を個別に使う</h2>
          <p>調査役を選び、入力した対象について、ログ・判断・対応案を確認します。</p>
        </div>
        <OpsAgentConsole refreshSignal={refreshSignal} onRunSettled={handleActivitySettled} />
      </section>

      <MergeStewardPanel configured={health?.mergeSteward?.configured} repository={health?.mergeSteward?.repository} />

      <section className="network" aria-label="外部エージェント連携">
        <div className="section-head">
          <h2>
            <Network size={18} /> 外部エージェント連携
          </h2>
          <p>外部エージェントのAgent Cardを読み込み、対応できる仕事と連携条件を確認します。</p>
        </div>
        <Callout tone="note" title="Agent Card とは？">
          エージェントの<strong>公開プロフィール（A2A標準のJSON）</strong>です。「何ができるか（スキル）」「どこに繋ぐか（URL）」「連携の条件」が書かれています。
          下の欄にそのURLを貼ると、Agent Guildが内容を検証し、<strong>allowlist内なら試験タスクを委任</strong>できます。自分のカードはヘッダーの「自分のAgent Card」から確認できます。
        </Callout>
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
              <CheckCircle2 size={14} /> {cardResult.agent.name} の情報を確認しました。allowlist内なら試験タスクを委任できます。
            </p>
          ) : (
            <p className="import-error">{cardResult.error}</p>
          )
        ) : null}
        {cardResult?.status === "accepted" ? (
          <>
            <div className="import-row">
              <input
                className="import-input"
                value={delegationMessage}
                onChange={(event) => setDelegationMessage(event.target.value)}
                aria-label="外部エージェントへの委任メッセージ"
                maxLength={4000}
              />
              <button type="button" className="btn-secondary" onClick={delegateAgentCard} disabled={delegationLoading || !delegationMessage.trim()}>
                {delegationLoading ? "委任中…" : "試験タスクを委任"}
              </button>
            </div>
            {delegationResult ? (
              delegationResult.ok ? (
                <>
                  <p className="import-ok">
                    <CheckCircle2 size={14} /> {delegationResult.receipt.status === "completed" ? "外部タスクが完了しました" : "外部タスクを受け付けました"}（{delegationResult.receipt.skillId} / task {delegationResult.receipt.taskId ?? "-"}）
                  </p>
                  {delegationResult.receipt.responseMessage ? <p className="import-ok">応答: {delegationResult.receipt.responseMessage}</p> : null}
                </>
              ) : (
                <p className="import-error">{delegationResult.message ?? "外部エージェントから安全に結果を取得できませんでした。"}</p>
              )
            ) : null}
          </>
        ) : null}
        {importedAgents.length > 0 ? (
          <ul className="imported-list">
            {importedAgents.map((agent) => (
              <li key={agent.id}>
                <strong>{agent.name}</strong> - {agent.headline} <span className="imported-tag">外部 / A2Aスキル {agent.a2aSkillIds.length}件 / 委任対応</span>
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
          <span className="proof-note">Cloud Run / Firestore / Cloud Logging / Gemini</span>
        </div>
      </section>
    </main>
  );
}
