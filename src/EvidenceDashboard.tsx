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

// 実行の成否を実データの積み上げバーで表示する
function OutcomeChart({ completed, failed }: { completed: number; failed: number }) {
  const total = completed + failed;
  const scale = total > 0 ? 420 / total : 0;
  const completedWidth = completed * scale;
  const failedWidth = failed * scale;

  return (
    <div className="evidence-chart-wrap">
      <svg className="evidence-chart" viewBox="0 0 560 150" role="img" aria-labelledby="outcome-chart-title outcome-chart-desc">
        <title id="outcome-chart-title">実行の成否</title>
        <desc id="outcome-chart-desc">
          完了{completed}件、失敗{failed}件。
        </desc>
        <text className="evidence-chart-axis" x="0" y="20">
          {total} runs
        </text>
        <rect className="evidence-chart-track" x="0" y="34" width="420" height="30" rx="10" />
        <rect className="evidence-chart-bar evidence-chart-bar-accent" x="0" y="34" width={completedWidth} height="30" rx="10" />
        <rect className="evidence-chart-bar evidence-chart-bar-gold" x={completedWidth} y="34" width={failedWidth} height="30" rx="10" />
        <text className="evidence-chart-value" x="0" y="94">
          完了 {completed}件（{total > 0 ? Math.round((completed / total) * 100) : 0}%）
        </text>
        {failed > 0 ? (
          <text className="evidence-chart-value" x="0" y="120">
            失敗 {failed}件（{Math.round((failed / total) * 100)}%）
          </text>
        ) : (
          <text className="evidence-chart-success" x="0" y="120">
            失敗 0件
          </text>
        )}
      </svg>
      <p className="evidence-chart-note">runStore の実行履歴から集計したラン成否</p>
    </div>
  );
}

// 所見の質 (総数 / 採用 / 再確認一致) を実データの積み上げバーで表示する
function FindingChart({ total, accepted, confirmed }: { total: number; accepted: number; confirmed: number }) {
  const scale = total > 0 ? 420 / total : 0;
  const acceptedWidth = accepted * scale;
  const restWidth = (total - accepted) * scale;

  return (
    <div className="evidence-chart-wrap">
      <svg className="evidence-chart" viewBox="0 0 560 150" role="img" aria-labelledby="finding-chart-title finding-chart-desc">
        <title id="finding-chart-title">所見の採用状況</title>
        <desc id="finding-chart-desc">
          所見{total}件中、採用{accepted}件、独立チェック一致{confirmed}件。
        </desc>
        <text className="evidence-chart-axis" x="0" y="20">
          {total} findings
        </text>
        <rect className="evidence-chart-track" x="0" y="34" width="420" height="30" rx="10" />
        <rect className="evidence-chart-bar evidence-chart-bar-accent" x="0" y="34" width={acceptedWidth} height="30" rx="10" />
        <rect className="evidence-chart-bar evidence-chart-bar-blue" x={acceptedWidth} y="34" width={restWidth} height="30" rx="10" />
        <text className="evidence-chart-value" x="0" y="94">
          採用 {accepted}件 / 未採用 {total - accepted}件
        </text>
        <text className="evidence-chart-value" x="0" y="120">
          独立チェック一致 {confirmed}件
        </text>
      </svg>
      <p className="evidence-chart-note">引用ゲート通過後、独立 checker で反証されなかった所見のみを採用</p>
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
