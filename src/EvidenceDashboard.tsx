import { Activity, CircleAlert, CircleCheck, Database, DollarSign, Gauge, ShieldCheck } from "lucide-react";

const COST_ROWS = [
  { label: "agent run", value: 0.017665, tone: "accent" },
  { label: "mission orchestrator", value: 0.003115, tone: "blue" },
  { label: "記録上の合計", value: 0.02078, tone: "gold" }
] as const;

const COST_MAX = Math.max(...COST_ROWS.map((row) => row.value));
const REQUEST_TOTAL = 1398;
const HTTP_200 = 28;
const HTTP_304 = 1370;
const POLLING_REQUESTS = 1340;

function formatUsd(value: number) {
  return `$${value.toFixed(6)}`;
}

function CostChart() {
  return (
    <div className="evidence-chart-wrap">
      <svg className="evidence-chart evidence-cost-chart" viewBox="0 0 560 196" role="img" aria-labelledby="cost-chart-title cost-chart-desc">
        <title id="cost-chart-title">Gemini利用見積りの内訳</title>
        <desc id="cost-chart-desc">agent run、mission orchestrator、記録上の合計の見積りコストを比較しています。実請求額ではありません。</desc>
        {COST_ROWS.map((row, index) => {
          const y = 20 + index * 52;
          const width = 280 * (row.value / COST_MAX);
          return (
            <g key={row.label}>
              <text className="evidence-chart-label" x="0" y={y + 14}>
                {row.label}
              </text>
              <rect className="evidence-chart-track" x="156" y={y} width="280" height="22" rx="7" />
              <rect className={`evidence-chart-bar evidence-chart-bar-${row.tone}`} x="156" y={y} width={width} height="22" rx="7" />
              <text className="evidence-chart-value" x="450" y={y + 15}>
                {formatUsd(row.value)}
              </text>
            </g>
          );
        })}
        <text className="evidence-chart-axis" x="156" y="188">
          $0
        </text>
        <text className="evidence-chart-axis" x="406" y="188">
          $0.016
        </text>
      </svg>
      <p className="evidence-chart-note">入力 $0.30 / 1M tokens、出力 $2.50 / 1M tokens によるアプリ内見積り</p>
    </div>
  );
}

function ResponseMixChart() {
  const http200Width = 420 * (HTTP_200 / REQUEST_TOTAL);
  const http304Width = 420 * (HTTP_304 / REQUEST_TOTAL);

  return (
    <div className="evidence-chart-wrap">
      <svg className="evidence-chart evidence-response-chart" viewBox="0 0 560 160" role="img" aria-labelledby="response-chart-title response-chart-desc">
        <title id="response-chart-title">直近180分のHTTP応答比率</title>
        <desc id="response-chart-desc">HTTP 304が1,370件、HTTP 200が28件、エラーと警告が0件でした。</desc>
        <text className="evidence-chart-axis" x="0" y="20">
          1,398 requests
        </text>
        <rect className="evidence-chart-track" x="0" y="34" width="420" height="30" rx="10" />
        <rect className="evidence-chart-bar evidence-chart-bar-blue" x="0" y="34" width={http304Width} height="30" rx="10" />
        <rect className="evidence-chart-bar evidence-chart-bar-accent" x={http304Width} y="34" width={http200Width} height="30" rx="10" />
        <text className="evidence-chart-value" x="0" y="94">
          HTTP 304  1,370件（98.0%）
        </text>
        <text className="evidence-chart-value" x="0" y="120">
          HTTP 200  28件（2.0%）
        </text>
        <text className="evidence-chart-success" x="0" y="148">
          ERROR / WARNING  0件
        </text>
      </svg>
      <p className="evidence-chart-note">直近180分のCloud Logging実測。キャッシュ応答とアプリ応答を分けて表示</p>
    </div>
  );
}

function LatencyChart() {
  const latencyScale = (value: number) => 14 + (value / 1400) * 430;
  const points = [
    { label: "p50", value: 25.8, display: "25.8 ms", tone: "accent" },
    { label: "p95", value: 53.3, display: "53.3 ms", tone: "blue" },
    { label: "最大", value: 1327, display: "1.327 s", tone: "gold" }
  ] as const;

  return (
    <div className="evidence-chart-wrap">
      <svg className="evidence-chart evidence-latency-chart" viewBox="0 0 560 190" role="img" aria-labelledby="latency-chart-title latency-chart-desc">
        <title id="latency-chart-title">HTTPレイテンシの実測</title>
        <desc id="latency-chart-desc">p50は25.8ミリ秒、p95は53.3ミリ秒、最大は1.327秒でした。</desc>
        <line className="evidence-chart-axis-line" x1="14" y1="28" x2="464" y2="28" />
        <line className="evidence-chart-axis-line" x1="14" y1="160" x2="464" y2="160" />
        <text className="evidence-chart-axis" x="14" y="180">
          0 ms
        </text>
        <text className="evidence-chart-axis" x="424" y="180">
          1.4 s
        </text>
        {points.map((point, index) => {
          const y = 55 + index * 34;
          const x = latencyScale(point.value);
          return (
            <g key={point.label}>
              <text className="evidence-chart-label" x="0" y={y + 4}>
                {point.label}
              </text>
              <line className="evidence-chart-range" x1="14" y1={y} x2="464" y2={y} />
              <circle className={`evidence-chart-point evidence-chart-point-${point.tone}`} cx={x} cy={y} r="6" />
              <text className="evidence-chart-value" x="480" y={y + 4}>
                {point.display}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="evidence-chart-note">p50 / p95 / 最大値。秒単位の最大値だけスケールが大きく異なるため、数値ラベルも併記</p>
    </div>
  );
}

export default function EvidenceDashboard() {
  const pollingRate = (POLLING_REQUESTS / REQUEST_TOTAL) * 100;

  return (
    <section className="evidence-dashboard" aria-labelledby="evidence-dashboard-title">
      <div className="evidence-header">
        <div>
          <p className="section-kicker">審査員向け実証サマリー</p>
          <h2 id="evidence-dashboard-title">AIが動いた証拠と、運用の状態を30秒で確認</h2>
          <p>機能の説明だけでなく、実際の実行・費用・ログを同じ画面で比較できます。</p>
        </div>
        <div className="evidence-source">
          <Database size={15} />
          <span>
            実測データ
            <strong>2026-07-11 / Cloud Run・Firestore・Cloud Logging</strong>
          </span>
        </div>
      </div>

      <div className="evidence-kpis">
        <article className="evidence-kpi evidence-kpi-positive">
          <div className="evidence-kpi-icon"><ShieldCheck size={17} /></div>
          <p>実行証拠</p>
          <strong>8 / 8</strong>
          <span>全調査役に完了run・token usage・checker記録あり</span>
        </article>
        <article className="evidence-kpi evidence-kpi-positive">
          <div className="evidence-kpi-icon"><CircleCheck size={17} /></div>
          <p>直近エラー率</p>
          <strong>0%</strong>
          <span>直近180分 / 1,398 requests / ERROR・WARNING 0件</span>
        </article>
        <article className="evidence-kpi evidence-kpi-neutral">
          <div className="evidence-kpi-icon"><DollarSign size={17} /></div>
          <p>AI利用見積り</p>
          <strong>$0.020780</strong>
          <span>35,289 tokens。実請求額ではありません</span>
        </article>
        <article className="evidence-kpi evidence-kpi-warning">
          <div className="evidence-kpi-icon"><CircleAlert size={17} /></div>
          <p>要修正シグナル</p>
          <strong>{pollingRate.toFixed(1)}%</strong>
          <span>同一ミッションへの不要なpolling。1,340 / 1,398 requests</span>
        </article>
      </div>

      <div className="evidence-grid">
        <article className="evidence-panel evidence-panel-cost">
          <div className="evidence-panel-head">
            <div>
              <p className="evidence-panel-kicker">COST BREAKDOWN</p>
              <h3>AIの利用見積り</h3>
            </div>
            <span className="evidence-note-badge">請求額ではない</span>
          </div>
          <CostChart />
        </article>

        <article className="evidence-panel">
          <div className="evidence-panel-head">
            <div>
              <p className="evidence-panel-kicker">RUNTIME STABILITY</p>
              <h3>HTTP応答とエラー</h3>
            </div>
            <Activity size={17} className="evidence-panel-icon" />
          </div>
          <ResponseMixChart />
        </article>

        <article className="evidence-panel">
          <div className="evidence-panel-head">
            <div>
              <p className="evidence-panel-kicker">LATENCY</p>
              <h3>レスポンス速度</h3>
            </div>
            <Gauge size={17} className="evidence-panel-icon" />
          </div>
          <LatencyChart />
        </article>

        <article className="evidence-panel evidence-panel-signal">
          <div className="evidence-panel-head">
            <div>
              <p className="evidence-panel-kicker">HONEST SIGNAL</p>
              <h3>良い数字だけを見せない</h3>
            </div>
            <CircleAlert size={17} className="evidence-panel-icon evidence-panel-icon-warning" />
          </div>
          <p className="evidence-signal-lede">直近のログは安定しています。一方で、停止したミッションを画面が取り続ける運用課題を検出しました。</p>
          <div className="evidence-signal-number">
            <strong>1,340</strong>
            <span>同一ミッションへのpolling</span>
          </div>
          <div className="evidence-signal-list">
            <div><span>現在のactiveMission</span><strong>null</strong></div>
            <div><span>Firestore上のrunning</span><strong>2件</strong></div>
            <div><span>判定</span><strong className="evidence-warning-text">stale状態を要修正</strong></div>
          </div>
        </article>
      </div>

      <details className="evidence-method">
        <summary>数字の読み方と出所</summary>
        <p>2026-07-11の調査レポートから表示しています。Gemini利用見積りはアプリ設定のトークン単価による計算で、Cloud Run・Firestore・Cloud Logging・Vertex AIの実請求額ではありません。直近180分のエラー率0%と、記録済みagent runの完了9件・失敗2件は観測期間が違うため、別の指標として表示しています。</p>
      </details>
    </section>
  );
}
