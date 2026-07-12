import { Activity, CircleAlert, CircleCheck, Database, DollarSign, ShieldCheck } from "lucide-react";

import Callout from "./Callout.js";

import type { EvidenceSummaryView } from "./missionTypes.js";

interface EvidenceProps {
  summary: EvidenceSummaryView | null;
}

// 実データが未取得 / ラン0件のときも同じ形で描けるようにゼロ埋めする (実績が無いことを正直に見せる)
const EMPTY_SUMMARY: EvidenceSummaryView = {
  totalAgents: 0,
  executedAgents: 0,
  sampleRuns: 0,
  completedRuns: 0,
  failedRuns: 0,
  totalFindings: 0,
  acceptedFindings: 0,
  confirmedFindings: 0,
  totalCostUsd: 0,
  totalTokens: 0,
  acceptRate: null,
  lastRunAt: null
};

function formatUsd(value: number) {
  return `$${value.toFixed(6)}`;
}

function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

function completionRateOf(summary: EvidenceSummaryView): number | null {
  return summary.sampleRuns > 0 ? summary.completedRuns / summary.sampleRuns : null;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "実績なし";
  return new Date(iso).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Bento Grid（トップの状態サマリー）用。詳細パネルと同じ実測サマリーを共有する。
export function EvidenceKpiHighlights({ summary }: EvidenceProps) {
  const s = summary ?? EMPTY_SUMMARY;
  return (
    <>
      <article className="bento-kpi is-positive">
        <p className="bento-kpi-label">実行証拠</p>
        <strong className="bento-kpi-value">
          {s.executedAgents} / {s.totalAgents || "—"}
        </strong>
      </article>
      <article className="bento-kpi is-positive">
        <p className="bento-kpi-label">完了率</p>
        <strong className="bento-kpi-value">{formatRate(completionRateOf(s))}</strong>
      </article>
      <article className="bento-kpi">
        <p className="bento-kpi-label">AI利用見積り</p>
        <strong className="bento-kpi-value">{formatUsd(s.totalCostUsd)}</strong>
      </article>
      <article className="bento-kpi is-positive">
        <p className="bento-kpi-label">所見の採用率</p>
        <strong className="bento-kpi-value">{formatRate(s.acceptRate)}</strong>
      </article>
    </>
  );
}

// 実行の成否をドーナツグラフで表示する
function OutcomeChart({ completed, failed }: { completed: number; failed: number }) {
  const total = completed + failed;
  const completedRate = total > 0 ? (completed / total) * 100 : 0;
  const failedRate = total > 0 ? (failed / total) * 100 : 0;
  
  // 円周: r=38 => 2 * PI * 38 = 238.76
  const C = 238.76;
  const completedOffset = C - (completedRate / 100) * C;
  const failedOffset = C - (failedRate / 100) * C;

  return (
    <div className="evidence-chart-wrap" style={{ display: "flex", alignItems: "center", gap: "20px", padding: "12px 16px", background: "var(--panel-2)", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}>
      <svg width="84" height="84" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
        {/* 背景円 */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="var(--line-strong)" strokeWidth="10" opacity="0.3" />
        
        {/* 完了 (Green) */}
        {completed > 0 && (
          <circle 
            cx="50" 
            cy="50" 
            r="38" 
            fill="none" 
            stroke="var(--green)" 
            strokeWidth="10" 
            strokeDasharray={`${C} ${C}`} 
            strokeDashoffset={completedOffset} 
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
            strokeLinecap="round"
          />
        )}
        
        {/* 失敗 (Red) */}
        {failed > 0 && (
          <circle 
            cx="50" 
            cy="50" 
            r="38" 
            fill="none" 
            stroke="var(--red)" 
            strokeWidth="10" 
            strokeDasharray={`${C} ${C}`} 
            strokeDashoffset={C - (failedOffset - completedOffset)} 
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="evidence-chart-legend" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
          <span style={{ fontSize: "13.5px" }}>完了: <strong>{completed}</strong>件 ({Math.round(completedRate)}%)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--red)", display: "inline-block" }} />
          <span style={{ fontSize: "13.5px" }}>失敗: <strong>{failed}</strong>件 ({Math.round(failedRate)}%)</span>
        </div>
        <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px", fontFamily: "var(--mono)" }}>
          総実行数: {total} runs
        </div>
      </div>
    </div>
  );
}

// 所見の質 (総数 / 採用 / 再確認一致) をドーナツグラフで表示する
function FindingChart({ total, accepted, confirmed }: { total: number; accepted: number; confirmed: number }) {
  const acceptRate = total > 0 ? (accepted / total) * 100 : 0;
  const restRate = total > 0 ? ((total - accepted) / total) * 100 : 0;
  
  // 円周: r=38 => 2 * PI * 38 = 238.76
  const C = 238.76;
  const acceptOffset = C - (acceptRate / 100) * C;

  return (
    <div className="evidence-chart-wrap" style={{ display: "flex", alignItems: "center", gap: "20px", padding: "12px 16px", background: "var(--panel-2)", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}>
      <svg width="84" height="84" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
        {/* 背景円 */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="var(--line-strong)" strokeWidth="10" opacity="0.3" />
        
        {/* 採用 (Accent) */}
        {accepted > 0 && (
          <circle 
            cx="50" 
            cy="50" 
            r="38" 
            fill="none" 
            stroke="var(--accent)" 
            strokeWidth="10" 
            strokeDasharray={`${C} ${C}`} 
            strokeDashoffset={acceptOffset} 
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="evidence-chart-legend" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
          <span style={{ fontSize: "13.5px" }}>採用: <strong>{accepted}</strong>件 ({Math.round(acceptRate)}%)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--line-strong)", display: "inline-block" }} />
          <span style={{ fontSize: "13.5px" }}>未採用: <strong>{total - accepted}</strong>件 ({Math.round(restRate)}%)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
          <span style={{ fontSize: "12px", color: "var(--blue)" }}>✓ 独立チェック一致: <strong>{confirmed}</strong>件</span>
        </div>
        <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px", fontFamily: "var(--mono)" }}>
          総所見数: {total} findings
        </div>
      </div>
    </div>
  );
}


export default function EvidenceDashboard({ summary }: EvidenceProps) {
  const s = summary ?? EMPTY_SUMMARY;
  const hasData = s.sampleRuns > 0;
  const avgCost = s.sampleRuns > 0 ? s.totalCostUsd / s.sampleRuns : null;

  return (
    <section className="evidence-dashboard" aria-labelledby="evidence-dashboard-title">
      <div className="evidence-header">
        <div>
          <p className="section-kicker">運用状態サマリー</p>
          <h2 id="evidence-dashboard-title">AIが動いた証拠と、運用の状態を30秒で確認</h2>
          <p>機能の説明だけでなく、実際の実行・費用・受入結果を同じ画面で確認できます。数値は実行履歴からの集計です。</p>
        </div>
        <div className="evidence-source">
          <Database size={15} />
          <span>
            実測データ
            <strong>
              {hasData ? `直近${s.sampleRuns}ラン` : "実績待ち"} / 最終実行 {formatDateTime(s.lastRunAt)}
            </strong>
          </span>
        </div>
      </div>

      {!hasData ? (
        <p className="evidence-empty">
          まだ実行履歴がありません。ミッションや個別実行を動かすと、費用・成否・受入結果がここに実データで記録されます。
        </p>
      ) : null}

      <Callout tone="tip" title="この数字の見方">
        AIの「うまくいきました」という<strong>自己申告ではなく、実行ログの実数</strong>です。目安として、
        <strong>完了率が高い＝安定して動いている</strong>／<strong>採用率が高い＝所見が検証を通っている</strong>／
        コストが想定内なら健全、と読めます。下のカードはこの4指標を分解したものです。
      </Callout>

      <div className="evidence-kpis">
        <article className="evidence-kpi evidence-kpi-positive">
          <div className="evidence-kpi-icon">
            <ShieldCheck size={17} />
          </div>
          <p>実行証拠</p>
          <strong>
            {s.executedAgents} / {s.totalAgents || "—"}
          </strong>
          <span>ラン記録のある調査役 / 実行可能な調査役</span>
        </article>
        <article className="evidence-kpi evidence-kpi-positive">
          <div className="evidence-kpi-icon">
            <CircleCheck size={17} />
          </div>
          <p>完了率</p>
          <strong>{formatRate(completionRateOf(s))}</strong>
          <span>
            直近{s.sampleRuns}ラン中 完了{s.completedRuns}件 / 失敗{s.failedRuns}件
          </span>
        </article>
        <article className="evidence-kpi evidence-kpi-neutral">
          <div className="evidence-kpi-icon">
            <DollarSign size={17} />
          </div>
          <p>AI利用見積り</p>
          <strong>{formatUsd(s.totalCostUsd)}</strong>
          <span>{s.totalTokens.toLocaleString("ja-JP")} tokens。実請求額ではありません</span>
        </article>
        <article className="evidence-kpi evidence-kpi-positive">
          <div className="evidence-kpi-icon">
            <CircleCheck size={17} />
          </div>
          <p>所見の採用率</p>
          <strong>{formatRate(s.acceptRate)}</strong>
          <span>
            所見{s.totalFindings}件中 {s.acceptedFindings}件を採用
          </span>
        </article>
      </div>

      <div className="evidence-grid">
        <article className="evidence-panel evidence-panel-cost">
          <div className="evidence-panel-head">
            <div>
              <p className="evidence-panel-kicker">COST</p>
              <h3>AIの利用見積り</h3>
            </div>
            <span className="evidence-note-badge">請求額ではない</span>
          </div>
          <div className="evidence-signal-list">
            <div>
              <span>累計コスト</span>
              <strong>{formatUsd(s.totalCostUsd)}</strong>
            </div>
            <div>
              <span>累計トークン</span>
              <strong>{s.totalTokens.toLocaleString("ja-JP")}</strong>
            </div>
            <div>
              <span>1ラン平均</span>
              <strong>{avgCost != null ? `~$${avgCost.toFixed(6)}` : "—"}</strong>
            </div>
          </div>
          <p className="evidence-chart-note">入力 $0.30 / 1M tokens、出力 $2.50 / 1M tokens によるアプリ内見積り</p>
        </article>

        <article className="evidence-panel">
          <div className="evidence-panel-head">
            <div>
              <p className="evidence-panel-kicker">RUN OUTCOMES</p>
              <h3>実行の成否</h3>
            </div>
            <Activity size={17} className="evidence-panel-icon" />
          </div>
          <OutcomeChart completed={s.completedRuns} failed={s.failedRuns} />
        </article>

        <article className="evidence-panel">
          <div className="evidence-panel-head">
            <div>
              <p className="evidence-panel-kicker">FINDING QUALITY</p>
              <h3>所見の採用状況</h3>
            </div>
            {s.failedRuns > 0 ? (
              <CircleAlert size={17} className="evidence-panel-icon evidence-panel-icon-warning" />
            ) : (
              <CircleCheck size={17} className="evidence-panel-icon" />
            )}
          </div>
          <FindingChart total={s.totalFindings} accepted={s.acceptedFindings} confirmed={s.confirmedFindings} />
        </article>
      </div>

      <details className="evidence-method">
        <summary>数字の読み方と出所</summary>
        <p>
          直近{s.sampleRuns}件のラン記録（runStore）から集計しています。AI利用見積りはアプリ設定のトークン単価による計算で、Cloud
          Run・Firestore・Cloud Logging・Vertex AI の実請求額ではありません。採用率は、引用ゲートを通過し独立 checker
          で反証されなかった所見の割合です。
        </p>
      </details>
    </section>
  );
}
