import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { discoverAgentCardFromUrl } from "./agentCardDiscovery.js";
import { redactSensitiveText, resolveTarget } from "./opsAgent.js";

import { SUBMISSION_PROOF } from "../src/submission.js";

import type { EvidenceBundle, EvidenceFetcher, LogEvidence, LogLister, OpsAgentRun, OpsConfig } from "./opsAgent.js";

// ---------------------------------------------------------------------------
// JobContext — 各エージェントが実世界へアクセスするための依存 (すべてDI可能)
// ---------------------------------------------------------------------------

export type JobContext = {
  config: OpsConfig;
  baseUrl: string;
  fetchImpl: typeof fetch;
  fetchLoggingEvidence: EvidenceFetcher | null;
  listLogEntries: LogLister | null;
  listRuns: (limit: number) => Promise<OpsAgentRun[]>;
  readTextFile: (relPath: string) => string | null;
  discoverCard: typeof discoverAgentCardFromUrl;
};

export function createDefaultReadTextFile(): (relPath: string) => string | null {
  return (relPath) => {
    try {
      return readFileSync(resolve(process.cwd(), relPath), "utf8");
    } catch {
      return null;
    }
  };
}

export type AgentJobDef = {
  agentId: string;
  skillId: string;
  skillDescription: string;
  title: string;
  inputKind: "none" | "text" | "url" | "service";
  inputLabel: string;
  inputPlaceholder: string;
  findingNoun: string;
  runTarget: (config: OpsConfig, input: string) => string;
  emptyNote: string;
  makerRole: string;
  checkerRole: string;
  collectEvidence: (ctx: JobContext, input: string) => Promise<EvidenceBundle>;
};

function item(id: string, message: string, severity = "INFO", service = "", timestamp = ""): LogEvidence {
  return { id, timestamp, severity, service, message: redactSensitiveText(message).slice(0, 240) };
}

const FETCH_TIMEOUT_MS = 6000;
const GITHUB_REPO = process.env.OPS_GITHUB_REPO || SUBMISSION_PROOF.publicGitHubUrl.replace(/^https:\/\/github\.com\//, "");

async function fetchJson(fetchImpl: typeof fetch, url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; body: unknown }> {
  const response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { ok: response.ok, status: response.status, body };
}

// ---------------------------------------------------------------------------
// ① cloud-run-sre — 実Cloud Loggingの障害トリアージ (既存実装をjob化)
// ---------------------------------------------------------------------------

const cloudRunSre: AgentJobDef = {
  agentId: "cloud-run-sre",
  skillId: "ops.triage.execute",
  skillDescription: "実Cloud RunサービスのログをCloud Logging APIから取得し、maker→引用ゲート→独立checkerでトリアージする。",
  title: "実ログSREトリアージ",
  inputKind: "service",
  inputLabel: "対象Cloud Runサービス (allowlist内)",
  inputPlaceholder: "agent-guild",
  findingNoun: "所見",
  runTarget: (config, input) => resolveTarget(config, input || undefined).service,
  emptyNote: "対象サービスのログが直近24時間に存在しないため、トリアージ対象がありません。",
  makerRole: "You are an SRE triage agent for a Cloud Run service. Analyze ONLY the log evidence below.",
  checkerRole: "You are an INDEPENDENT SRE reviewer.",
  async collectEvidence(ctx, input) {
    if (!ctx.fetchLoggingEvidence) throw new Error("Cloud Logging未構成 (GOOGLE_CLOUD_PROJECT未設定)");
    const target = resolveTarget(ctx.config, input || undefined);
    let windowMinutes = ctx.config.lookbackMinutes;
    let evidence = await ctx.fetchLoggingEvidence({ service: target.service, project: target.project, lookbackMinutes: windowMinutes });
    if (evidence.length === 0) {
      windowMinutes = 1440;
      evidence = await ctx.fetchLoggingEvidence({ service: target.service, project: target.project, lookbackMinutes: windowMinutes });
    }
    return {
      evidence,
      windowMinutes,
      note: `Cloud Loggingから実ログ ${evidence.length} 件を取得 (project: ${target.project ?? "-"}, ${windowMinutes}分窓, redaction適用)`
    };
  }
};

// ---------------------------------------------------------------------------
// ② brief-cartographer — 実ブリーフの要件分解 (引用ゲートでspan接地を強制)
// ---------------------------------------------------------------------------

const briefCartographer: AgentJobDef = {
  agentId: "brief-cartographer",
  skillId: "brief.analyze",
  skillDescription: "プロジェクトブリーフをspan分割し、各実装単位が実際のbrief記述に引用接地された分解計画を生成する。",
  title: "要件分解プランナー",
  inputKind: "text",
  inputLabel: "プロジェクトブリーフ",
  inputPlaceholder: "解きたい課題・作りたいものを書く",
  findingNoun: "実装単位",
  runTarget: () => "project-brief",
  emptyNote: "ブリーフが空のため分解対象がありません。ブリーフを入力して再実行してください。",
  makerRole:
    "You are a requirements decomposition planner. Break the user's brief into at most 5 implementation work items. Each finding = one work item: title=作業項目, hypothesis=なぜ必要か(引用spanに基づく), recommendedAction=受入条件と最初の一歩, severity=優先度(critical=P0, high=P1, medium=P2, low=P3).",
  checkerRole: "You are an INDEPENDENT requirements reviewer. Refute work items not grounded in the quoted brief spans.",
  async collectEvidence(_ctx, input) {
    const spans = input
      .split(/(?<=[。．.!?！？\n])/)
      .map((span) => span.trim())
      .filter((span) => span.length >= 6)
      .slice(0, 40);
    return {
      evidence: spans.map((span, i) => item(`brief-${i + 1}`, span, "INFO", "user-brief")),
      note: `ブリーフを ${spans.length} spanに分割 (各実装単位はspan引用が必須)`
    };
  }
};

// ---------------------------------------------------------------------------
// ③ market-broker — 実Agent Card取得 + 実A2A委任 (同一オリジン限定)
// ---------------------------------------------------------------------------

const marketBroker: AgentJobDef = {
  agentId: "market-broker",
  skillId: "task.delegate.execute",
  skillDescription: "Agent CardをSSRFガード付きで実取得し、能力評価のうえ同一オリジンのA2Aエンドポイントへ実際にタスクを委任する。",
  title: "A2A委任ブローカー",
  inputKind: "url",
  inputLabel: "Agent Card URL (空なら自マーケット)",
  inputPlaceholder: "https://.../.well-known/agent-card.json",
  findingNoun: "委任判断",
  runTarget: () => "agent-card",
  emptyNote: "Agent Cardを取得できなかったため、委任判断の対象がありません。",
  makerRole:
    "You are an A2A delegation broker. Using ONLY the evidence (fetched agent card facts and the real delegation response), evaluate capability fit and report the delegation outcome. Each finding = one delegation judgement.",
  checkerRole: "You are an INDEPENDENT delegation auditor.",
  async collectEvidence(ctx, input) {
    const url = input.trim() || `${ctx.baseUrl}/.well-known/agent-card.json`;
    const result = await ctx.discoverCard(url, { fetchImpl: ctx.fetchImpl });
    const evidence: LogEvidence[] = [];
    if (result.status !== "accepted") {
      evidence.push(item("card-error", `Agent Card取得失敗: ${result.error ?? "unknown"}`, "ERROR", "agent-card"));
      return { evidence, note: "Agent Card取得に失敗 (SSRFガード/形式検証で棄却の可能性)" };
    }
    evidence.push(item("card-name", `${result.agent.name} — ${result.agent.headline}`, "INFO", "agent-card"));
    for (const skillId of result.agent.a2aSkillIds.slice(0, 10)) {
      evidence.push(item(`card-skill-${skillId}`, `提供スキル: ${skillId}`, "INFO", "agent-card"));
    }
    // 実委任: SSRF面を最小化するため同一オリジンのA2Aエンドポイントのみ実POST
    const selfOrigin = new URL(ctx.baseUrl).origin;
    const cardOrigin = result.discoveredUrl ? new URL(result.discoveredUrl).origin : "";
    if (cardOrigin === selfOrigin) {
      try {
        const delegated = await fetchJson(ctx.fetchImpl, `${selfOrigin}/a2a`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "broker-delegation",
            method: "message/send",
            params: { message: { role: "user", parts: [{ kind: "text", text: "ops.triage: brokerからの委任実行" }], metadata: { skillId: "ops.triage.execute" } } }
          })
        });
        const task = (delegated.body as { result?: { id?: string; status?: { state?: string } } } | null)?.result;
        evidence.push(
          task?.id
            ? item("delegate-task", `実A2A委任成功: task ${task.id} state=${task.status?.state ?? "?"} (SREエージェントが実起動)`, "NOTICE", "a2a")
            : item("delegate-task", `A2A委任応答が不正: HTTP ${delegated.status}`, "WARNING", "a2a")
        );
      } catch (error) {
        evidence.push(item("delegate-task", `A2A委任失敗: ${error instanceof Error ? error.message : "unknown"}`, "WARNING", "a2a"));
      }
    } else {
      evidence.push(item("delegate-policy", "外部オリジンへの自動委任はポリシーで停止 (能力評価のみ実施)。実委任は同一オリジン限定。", "NOTICE", "policy"));
    }
    return { evidence, note: `Agent Card実取得 + ${cardOrigin === selfOrigin ? "実A2A委任を実行" : "外部カードは評価のみ"} (${evidence.length}件の証拠)` };
  }
};

// ---------------------------------------------------------------------------
// ④ gemini-strategist — 実稼働状態と実行実績に基づく戦略立案
// ---------------------------------------------------------------------------

const JUDGING_CRITERIA = [
  "①AIエージェントが価値の中心 (自律的判断・実行、必然性)",
  "②課題アプローチ力 (ストーリーの一貫性・新規性)",
  "③ユーザビリティ",
  "④実用性・体験価値",
  "⑤実装力 (技術選定・拡張性・実運用配慮)"
];

const geminiStrategist: AgentJobDef = {
  agentId: "gemini-strategist",
  skillId: "gemini.review.execute",
  skillDescription: "デプロイ済みサービスの実healthzとFirestoreの実行実績を証拠に、審査5項目に沿った戦略・リスク・ピッチを生成する。",
  title: "実測ベース戦略参謀",
  inputKind: "text",
  inputLabel: "プロジェクトブリーフ",
  inputPlaceholder: "現在のプロダクト方針",
  findingNoun: "戦略提言",
  runTarget: () => "live-product",
  emptyNote: "稼働状態も実行実績も取得できないため、戦略立案の証拠がありません。",
  makerRole:
    "You are a hackathon strategy agent. Using ONLY the evidence (live health, real run statistics, judging criteria, brief spans), produce strategy findings. Each finding = one strategic recommendation: title=提言, hypothesis=根拠(証拠引用), recommendedAction=具体アクション, severity=インパクト.",
  checkerRole: "You are an INDEPENDENT strategy reviewer. Refute recommendations not supported by the measured evidence.",
  async collectEvidence(ctx, input) {
    const evidence: LogEvidence[] = [];
    try {
      const hz = await fetchJson(ctx.fetchImpl, `${ctx.baseUrl}/api/healthz`);
      const body = hz.body as { ok?: boolean; model?: string; geminiMode?: string; opsAgent?: { enabled?: boolean; runStore?: string } } | null;
      if (body) {
        evidence.push(item("live-health", `実稼働: ok=${body.ok} model=${body.model} gemini=${body.geminiMode} 実行基盤=${body.opsAgent?.enabled} store=${body.opsAgent?.runStore}`, "INFO", "healthz"));
      }
    } catch {
      evidence.push(item("live-health", "healthz取得失敗 (稼働状態不明)", "WARNING", "healthz"));
    }
    try {
      const runs = await ctx.listRuns(20);
      const completed = runs.filter((r) => r.status === "completed");
      const accepted = runs.reduce((sum, r) => sum + r.findings.filter((f) => f.accepted).length, 0);
      const cost = runs.reduce((sum, r) => sum + (r.usage?.estimatedCostUsd ?? 0), 0);
      const agents = new Set(runs.map((r) => r.agentId));
      evidence.push(item("run-stats", `実行実績: ラン${runs.length}件(完了${completed.length}) / 受入${accepted}件 / 概算$${cost.toFixed(4)} / 稼働エージェント${agents.size}種`, "INFO", "firestore"));
    } catch {
      evidence.push(item("run-stats", "実行実績の取得失敗", "WARNING", "firestore"));
    }
    JUDGING_CRITERIA.forEach((criteria, i) => evidence.push(item(`criteria-${i + 1}`, `審査基準: ${criteria}`, "INFO", "hackathon")));
    input
      .split(/(?<=[。．.!?！？\n])/)
      .map((span) => span.trim())
      .filter((span) => span.length >= 6)
      .slice(0, 8)
      .forEach((span, i) => evidence.push(item(`brief-${i + 1}`, span, "INFO", "user-brief")));
    return { evidence, note: `実healthz + Firestore実行実績 + 審査基準 + ブリーフ = ${evidence.length}件の証拠` };
  }
};

// ---------------------------------------------------------------------------
// ⑤ test-forge — 実GitHub Actions CI + ライブ契約プローブ
// ---------------------------------------------------------------------------

const testForge: AgentJobDef = {
  agentId: "test-forge",
  skillId: "test.contract.execute",
  skillDescription: "GitHub Actionsの実CI結果とデプロイ済みAPIへのライブ契約プローブ(healthz/A2A/agent-card)を検証しトリアージする。",
  title: "CI+契約検証",
  inputKind: "none",
  inputLabel: "",
  inputPlaceholder: "",
  findingNoun: "検証所見",
  runTarget: () => "github-ci+live-api",
  emptyNote: "CI結果もライブプローブも取得できないため、検証対象がありません。",
  makerRole:
    "You are a QA verification agent. Using ONLY the evidence (real GitHub Actions runs and live API contract probes), triage quality state. Each finding = one verification issue or confirmation: title=所見, hypothesis=根拠, recommendedAction=次アクション, severity=品質リスク.",
  checkerRole: "You are an INDEPENDENT QA auditor.",
  async collectEvidence(ctx) {
    const evidence: LogEvidence[] = [];
    try {
      const ci = await fetchJson(ctx.fetchImpl, `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=8`, {
        headers: { accept: "application/vnd.github+json", "user-agent": "agent-market-test-forge" }
      });
      if (ci.ok) {
        const runs = (ci.body as { workflow_runs?: Array<{ id: number; name?: string; head_branch?: string; status?: string; conclusion?: string | null; display_title?: string; created_at?: string }> })?.workflow_runs ?? [];
        for (const w of runs) {
          const conclusion = w.conclusion ?? "in_progress";
          evidence.push(
            item(`ci-${w.id}`, `${w.name} [${w.head_branch}] ${w.status}/${conclusion} — ${w.display_title}`, conclusion === "success" ? "INFO" : conclusion === "in_progress" ? "NOTICE" : "ERROR", "github-actions", w.created_at ?? "")
          );
        }
      } else {
        evidence.push(item("ci-error", `GitHub API応答 ${ci.status} (レート制限の可能性)`, "WARNING", "github-actions"));
      }
    } catch (error) {
      evidence.push(item("ci-error", `GitHub API取得失敗: ${error instanceof Error ? error.message : "unknown"}`, "WARNING", "github-actions"));
    }
    // ライブ契約プローブ (実HTTP)
    try {
      const hz = await fetchJson(ctx.fetchImpl, `${ctx.baseUrl}/api/healthz`);
      evidence.push(item("probe-healthz", `GET /api/healthz -> HTTP ${hz.status} ok=${(hz.body as { ok?: boolean } | null)?.ok}`, hz.ok ? "INFO" : "ERROR", "live-probe"));
    } catch {
      evidence.push(item("probe-healthz", "healthzプローブ失敗", "ERROR", "live-probe"));
    }
    try {
      const card = await fetchJson(ctx.fetchImpl, `${ctx.baseUrl}/.well-known/agent-card.json`);
      const skills = (card.body as { skills?: unknown[] } | null)?.skills;
      evidence.push(item("probe-card", `GET /.well-known/agent-card.json -> HTTP ${card.status} skills=${Array.isArray(skills) ? skills.length : "?"}`, card.ok ? "INFO" : "ERROR", "live-probe"));
    } catch {
      evidence.push(item("probe-card", "agent-cardプローブ失敗", "ERROR", "live-probe"));
    }
    try {
      const a2a = await fetchJson(ctx.fetchImpl, `${ctx.baseUrl}/a2a`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: "probe", method: "message/send", params: { message: { role: "user", parts: [{ kind: "text", text: "contract probe" }] } } })
      });
      const jsonrpcOk = (a2a.body as { jsonrpc?: string; result?: unknown } | null)?.jsonrpc === "2.0";
      evidence.push(item("probe-a2a", `POST /a2a message/send -> HTTP ${a2a.status} jsonrpc契約=${jsonrpcOk ? "適合" : "違反"}`, jsonrpcOk ? "INFO" : "ERROR", "live-probe"));
    } catch {
      evidence.push(item("probe-a2a", "A2A契約プローブ失敗", "ERROR", "live-probe"));
    }
    return { evidence, note: `実CI ${evidence.filter((e) => e.id.startsWith("ci-")).length}件 + ライブ契約プローブ3種 = ${evidence.length}件の証拠` };
  }
};

// ---------------------------------------------------------------------------
// ⑥ security-sentinel — OSV.dev実脆弱性照会 + 実HTTPヘッダー監査
// ---------------------------------------------------------------------------

const securitySentinel: AgentJobDef = {
  agentId: "security-sentinel",
  skillId: "security.scan.execute",
  skillDescription: "実際の依存パッケージをOSV.dev脆弱性DBに照会し、デプロイ済みURLのHTTP応答ヘッダーを実監査する。",
  title: "実脆弱性スキャン",
  inputKind: "none",
  inputLabel: "",
  inputPlaceholder: "",
  findingNoun: "セキュリティ所見",
  runTarget: () => "deps+headers",
  emptyNote: "依存情報もヘッダープローブも取得できないため、監査対象がありません。",
  makerRole:
    "You are a security audit agent. Using ONLY the evidence (real OSV.dev vulnerability lookups for the actual dependencies and live HTTP header probes), report security findings. severity: critical=既知脆弱性で即対応, high=脆弱性あり, medium=設定改善, low=情報.",
  checkerRole: "You are an INDEPENDENT security auditor.",
  async collectEvidence(ctx) {
    const evidence: LogEvidence[] = [];
    const pkgText = ctx.readTextFile("package.json");
    const lockText = ctx.readTextFile("package-lock.json");
    if (pkgText) {
      let deps: Array<{ name: string; version: string }> = [];
      try {
        const pkg = JSON.parse(pkgText) as { dependencies?: Record<string, string> };
        const lock = lockText ? (JSON.parse(lockText) as { packages?: Record<string, { version?: string }> }) : null;
        deps = Object.entries(pkg.dependencies ?? {}).map(([name, range]) => ({
          name,
          version: lock?.packages?.[`node_modules/${name}`]?.version ?? range.replace(/^[\^~]/, "")
        }));
      } catch {
        evidence.push(item("deps-parse-error", "package.jsonの解析に失敗", "WARNING", "deps"));
      }
      if (deps.length > 0) {
        evidence.push(item("deps-count", `直接依存 ${deps.length}件: ${deps.map((d) => `${d.name}@${d.version}`).join(", ")}`, "INFO", "deps"));
        try {
          const osv = await fetchJson(ctx.fetchImpl, "https://api.osv.dev/v1/querybatch", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ queries: deps.map((d) => ({ package: { name: d.name, ecosystem: "npm" }, version: d.version })) })
          });
          const results = (osv.body as { results?: Array<{ vulns?: Array<{ id: string }> }> } | null)?.results ?? [];
          let vulnCount = 0;
          results.forEach((result, i) => {
            const vulns = result.vulns ?? [];
            if (vulns.length > 0 && vulnCount < 10) {
              vulnCount += vulns.length;
              evidence.push(item(`osv-${deps[i].name}`, `${deps[i].name}@${deps[i].version}: 既知脆弱性 ${vulns.map((v) => v.id).join(", ")}`, "ERROR", "osv.dev"));
            }
          });
          if (vulnCount === 0) {
            evidence.push(item("osv-clean", `OSV.dev照会 ${deps.length}パッケージ: 既知脆弱性 0件`, "INFO", "osv.dev"));
          }
        } catch (error) {
          evidence.push(item("osv-error", `OSV.dev照会失敗: ${error instanceof Error ? error.message : "unknown"}`, "WARNING", "osv.dev"));
        }
      }
    }
    // 実HTTPヘッダー監査
    try {
      const response = await ctx.fetchImpl(ctx.baseUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      const powered = response.headers.get("x-powered-by");
      evidence.push(item("hdr-powered", powered ? `x-powered-by が露出: ${powered}` : "x-powered-by ヘッダーは無効化済み", powered ? "WARNING" : "INFO", "headers"));
      const hsts = response.headers.get("strict-transport-security");
      evidence.push(item("hdr-hsts", hsts ? `HSTS有効: ${hsts}` : "HSTSヘッダーなし (Cloud Run前段でTLS終端)", hsts ? "INFO" : "NOTICE", "headers"));
      evidence.push(item("hdr-content-type", `content-type: ${response.headers.get("content-type") ?? "-"}`, "INFO", "headers"));
    } catch {
      evidence.push(item("hdr-error", "ライブヘッダープローブ失敗", "WARNING", "headers"));
    }
    return { evidence, note: `OSV.dev実照会 + ライブヘッダー監査 = ${evidence.length}件の証拠` };
  }
};

// ---------------------------------------------------------------------------
// ⑦ ux-guildmaster — 配信中の実HTMLを監査
// ---------------------------------------------------------------------------

const uxGuildmaster: AgentJobDef = {
  agentId: "ux-guildmaster",
  skillId: "ux.audit.execute",
  skillDescription: "デプロイ済みURLから実際に配信されているHTMLを取得し、メタ情報・アクセシビリティ・構造を実監査する。",
  title: "実HTML UX監査",
  inputKind: "none",
  inputLabel: "",
  inputPlaceholder: "",
  findingNoun: "UX所見",
  runTarget: () => "live-html",
  emptyNote: "配信HTMLを取得できなかったため、監査対象がありません。",
  makerRole:
    "You are a UX/accessibility audit agent. Using ONLY the evidence (facts extracted from the actually served HTML), report UX findings. severity: high=アクセシビリティ欠陥, medium=改善推奨, low=良好確認.",
  checkerRole: "You are an INDEPENDENT UX auditor.",
  async collectEvidence(ctx) {
    const evidence: LogEvidence[] = [];
    try {
      const response = await ctx.fetchImpl(`${ctx.baseUrl}/`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      const html = (await response.text()).slice(0, 300_000);
      const pick = (re: RegExp) => re.exec(html)?.[1]?.trim() ?? "";
      evidence.push(item("html-status", `GET / -> HTTP ${response.status} (${html.length}バイト走査)`, response.ok ? "INFO" : "ERROR", "live-html"));
      const title = pick(/<title>([^<]*)<\/title>/i);
      evidence.push(item("html-title", title ? `<title>: ${title}` : "<title>が空", title ? "INFO" : "ERROR", "live-html"));
      const lang = pick(/<html[^>]*\blang="([^"]*)"/i);
      evidence.push(item("html-lang", lang ? `lang属性: ${lang}` : "lang属性なし (スクリーンリーダー言語判定に影響)", lang ? "INFO" : "WARNING", "live-html"));
      const desc = pick(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
      evidence.push(item("html-desc", desc ? `meta description: ${desc.slice(0, 100)}` : "meta descriptionなし", desc ? "INFO" : "WARNING", "live-html"));
      const viewport = /<meta[^>]*name="viewport"/i.test(html);
      evidence.push(item("html-viewport", viewport ? "viewport meta あり (モバイル対応)" : "viewport metaなし", viewport ? "INFO" : "WARNING", "live-html"));
      const ogTitle = /<meta[^>]*property="og:title"/i.test(html);
      evidence.push(item("html-og", ogTitle ? "OGPメタあり (共有プレビュー対応)" : "OGPメタなし", ogTitle ? "INFO" : "NOTICE", "live-html"));
      const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
      const missingAlt = imgs.filter((tag) => !/\balt="/i.test(tag)).length;
      evidence.push(item("html-imgalt", `img ${imgs.length}枚中 alt欠落 ${missingAlt}枚`, missingAlt > 0 ? "WARNING" : "INFO", "live-html"));
      const h1Count = (html.match(/<h1\b/gi) ?? []).length;
      evidence.push(item("html-h1", `h1見出し ${h1Count}個 (SPAシェルのため描画後は異なる場合あり)`, "INFO", "live-html"));
    } catch (error) {
      evidence.push(item("html-error", `HTML取得失敗: ${error instanceof Error ? error.message : "unknown"}`, "ERROR", "live-html"));
    }
    return { evidence, note: `配信中HTMLから ${evidence.length}件の実ファクトを抽出` };
  }
};

// ---------------------------------------------------------------------------
// ⑧ observability-oracle — 実リクエストログのメトリクス + 改善ループ提案
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

const observabilityOracle: AgentJobDef = {
  agentId: "observability-oracle",
  skillId: "ops.observe.execute",
  skillDescription: "実Cloud Runリクエストログからレイテンシ/ステータス分布を計測し、実行実績と合わせて次の改善候補と次に任せるべきエージェントを提案する。",
  title: "実測改善ループ",
  inputKind: "service",
  inputLabel: "対象Cloud Runサービス (allowlist内)",
  inputPlaceholder: "agent-guild",
  findingNoun: "改善候補",
  runTarget: (config, input) => resolveTarget(config, input || undefined).service,
  emptyNote: "リクエストログが直近24時間に存在しないため、計測対象がありません。",
  makerRole:
    "You are an observability agent driving an improvement loop. Using ONLY the evidence (real request-log metrics and real agent-run statistics), propose improvement candidates. Each finding may also recommend which marketplace agent to hire next. severity=改善インパクト.",
  checkerRole: "You are an INDEPENDENT observability reviewer.",
  async collectEvidence(ctx, input) {
    if (!ctx.listLogEntries) throw new Error("Cloud Logging未構成 (GOOGLE_CLOUD_PROJECT未設定)");
    const target = resolveTarget(ctx.config, input || undefined);
    const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const filter = `resource.type="cloud_run_revision" AND resource.labels.service_name="${target.service}" AND logName="projects/${target.project}/logs/run.googleapis.com%2Frequests" AND timestamp>="${since}"`;
    const entries = await ctx.listLogEntries(target.project, filter, 60);
    const evidence: LogEvidence[] = [];
    const latencies: number[] = [];
    const statusCount = new Map<string, number>();
    const pathCount = new Map<string, number>();
    for (const entry of entries) {
      const request = entry.httpRequest;
      if (!request) continue;
      const latencyMs = request.latency ? Number.parseFloat(request.latency) * 1000 : Number.NaN;
      if (Number.isFinite(latencyMs)) latencies.push(latencyMs);
      const statusClass = `${Math.floor((request.status ?? 0) / 100)}xx`;
      statusCount.set(statusClass, (statusCount.get(statusClass) ?? 0) + 1);
      try {
        const path = new URL(request.requestUrl ?? "").pathname.slice(0, 60);
        pathCount.set(path, (pathCount.get(path) ?? 0) + 1);
      } catch {
        // requestUrl欠落はスキップ
      }
    }
    if (entries.length > 0) {
      latencies.sort((a, b) => a - b);
      evidence.push(item("met-requests", `直近24hの実リクエスト ${entries.length}件 (取得上限60)`, "INFO", target.service));
      evidence.push(item("met-status", `ステータス分布: ${[...statusCount.entries()].map(([k, v]) => `${k}=${v}`).join(" ")}`, statusCount.has("5xx") ? "WARNING" : "INFO", target.service));
      evidence.push(item("met-latency", `レイテンシ実測: p50=${Math.round(percentile(latencies, 50))}ms p95=${Math.round(percentile(latencies, 95))}ms`, "INFO", target.service));
      [...pathCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([path, count], i) => evidence.push(item(`path-${i + 1}`, `頻出パス: ${path} (${count}回)`, "INFO", target.service)));
    }
    try {
      const runs = await ctx.listRuns(20);
      const total = runs.reduce((sum, r) => sum + r.findings.length, 0);
      const accepted = runs.reduce((sum, r) => sum + r.findings.filter((f) => f.accepted).length, 0);
      const cost = runs.reduce((sum, r) => sum + (r.usage?.estimatedCostUsd ?? 0), 0);
      evidence.push(item("loop-stats", `エージェント実行ループ実績: 所見${total}件中受入${accepted}件 / 概算$${cost.toFixed(4)} / 受入単価$${accepted > 0 ? (cost / accepted).toFixed(4) : "-"}`, "INFO", "firestore"));
    } catch {
      evidence.push(item("loop-stats", "実行実績の取得失敗", "WARNING", "firestore"));
    }
    return { evidence, note: `実リクエストログ${entries.length}件から計測 + ループ実績 (project: ${target.project ?? "-"})` };
  }
};

// ---------------------------------------------------------------------------
// ⑨ release-guardian — CI・healthz・revision別実リクエストで人のリリース判断を支える
// ---------------------------------------------------------------------------

const releaseGuardian: AgentJobDef = {
  agentId: "release-guardian",
  skillId: "release.gate.execute",
  skillDescription: "実healthz、GitHub Actionsの直近CI、Cloud Run revision別リクエストログを引用し、カナリア継続・停止・復旧の判断材料を生成する。トラフィック変更は実行せず人の承認へ委ねる。",
  title: "リリース安全判定",
  inputKind: "service",
  inputLabel: "対象Cloud Runサービス (allowlist内)",
  inputPlaceholder: "agent-guild",
  findingNoun: "リリース判定",
  runTarget: (config, input) => resolveTarget(config, input || undefined).service,
  emptyNote: "リリース判断に必要な稼働証拠を取得できませんでした。CI、healthz、Cloud Loggingを確認してください。",
  makerRole:
    "You are a Cloud Run release gate agent. Use ONLY the cited CI, health, and revision-request evidence. Decide whether to continue, hold, or recommend rollback. Never claim that traffic was changed. Every traffic change recommendation must explicitly require human approval.",
  checkerRole:
    "You are an INDEPENDENT release safety reviewer. Refute any decision that lacks cited evidence or claims an unexecuted traffic change. Confirm only recommendations that keep Cloud Run traffic changes behind human approval.",
  async collectEvidence(ctx, input) {
    const target = resolveTarget(ctx.config, input || undefined);
    const evidence: LogEvidence[] = [];

    try {
      const health = await fetchJson(ctx.fetchImpl, `${ctx.baseUrl}/api/healthz`);
      const body = health.body as { ok?: boolean; geminiMode?: string } | null;
      evidence.push(item("release-health", `GET /api/healthz -> HTTP ${health.status} ok=${body?.ok ?? false} gemini=${body?.geminiMode ?? "unknown"}`, health.ok && body?.ok ? "INFO" : "ERROR", "live-health"));
    } catch (error) {
      evidence.push(item("release-health", `healthz取得失敗: ${error instanceof Error ? error.message : "unknown"}`, "ERROR", "live-health"));
    }

    try {
      const ci = await fetchJson(ctx.fetchImpl, `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=1`, {
        headers: { accept: "application/vnd.github+json", "user-agent": "agent-market-release-guardian" }
      });
      const latest = (ci.body as { workflow_runs?: Array<{ id: number; name?: string; status?: string; conclusion?: string | null; head_sha?: string }> } | null)?.workflow_runs?.[0];
      if (latest) {
        const conclusion = latest.conclusion ?? latest.status ?? "unknown";
        evidence.push(item("release-ci", `直近CI: ${latest.name ?? "workflow"} #${latest.id} ${conclusion} sha=${latest.head_sha?.slice(0, 12) ?? "unknown"}`, conclusion === "success" ? "INFO" : "WARNING", "github-actions"));
      } else {
        evidence.push(item("release-ci", `直近CIを取得できませんでした (HTTP ${ci.status})`, "WARNING", "github-actions"));
      }
    } catch (error) {
      evidence.push(item("release-ci", `GitHub Actions取得失敗: ${error instanceof Error ? error.message : "unknown"}`, "WARNING", "github-actions"));
    }

    if (!ctx.listLogEntries) {
      evidence.push(item("release-logs", "Cloud Logging未構成のため、revision別リクエスト証拠は未取得", "WARNING", target.service));
    } else {
      const since = new Date(Date.now() - ctx.config.lookbackMinutes * 60_000).toISOString();
      const filter = `resource.type="cloud_run_revision" AND resource.labels.service_name="${target.service}" AND logName="projects/${target.project}/logs/run.googleapis.com%2Frequests" AND timestamp>="${since}"`;
      try {
        const entries = await ctx.listLogEntries(target.project, filter, 100);
        const requests = entries.filter((entry) => entry.httpRequest);
        if (requests.length === 0) {
          evidence.push(item("release-logs", `直近${ctx.config.lookbackMinutes}分のCloud Runリクエストログは0件`, "WARNING", target.service));
        } else {
          const revisionCounts = new Map<string, number>();
          const failures = requests.filter((entry) => (entry.httpRequest?.status ?? 0) >= 500).length;
          for (const entry of requests) {
            const revision = entry.resource?.labels?.revision_name ?? "unknown-revision";
            revisionCounts.set(revision, (revisionCounts.get(revision) ?? 0) + 1);
          }
          evidence.push(item("release-traffic", `観測リクエスト ${requests.length}件、${revisionCounts.size} revision: ${[...revisionCounts.entries()].map(([revision, count]) => `${revision}=${count}`).join(" ")}`, revisionCounts.size > 1 ? "NOTICE" : "INFO", target.service));
          evidence.push(item("release-errors", `revision別観測窓の5xx=${failures}/${requests.length}`, failures > 0 ? "WARNING" : "INFO", target.service));
        }
      } catch (error) {
        evidence.push(item("release-logs", `Cloud Logging取得失敗: ${error instanceof Error ? error.message : "unknown"}`, "WARNING", target.service));
      }
    }

    evidence.push(item("release-action", "安全境界: 本エージェントはCloud Runのトラフィックを変更しません。継続・停止・ロールバックは、引用済み証拠を確認した人の承認後に実行してください。", "NOTICE", "policy"));
    return { evidence, windowMinutes: ctx.config.lookbackMinutes, note: `healthz・直近CI・Cloud Loggingを収集し、${target.service} のリリース判断を人へ提示 (${evidence.length}件の証拠)` };
  }
};

// ---------------------------------------------------------------------------
// レジストリ
// ---------------------------------------------------------------------------

export const AGENT_JOBS: Record<string, AgentJobDef> = Object.fromEntries(
  [cloudRunSre, briefCartographer, marketBroker, geminiStrategist, testForge, securitySentinel, uxGuildmaster, observabilityOracle, releaseGuardian].map((job) => [job.agentId, job])
);

export const A2A_SKILL_TO_AGENT: Record<string, string> = Object.fromEntries(Object.values(AGENT_JOBS).map((job) => [job.skillId, job.agentId]));
