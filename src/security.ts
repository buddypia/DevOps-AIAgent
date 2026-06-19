import { MARKET_AGENTS } from "./market.js";
import type { CiProof } from "./proof.js";
import type { WinningStrategy } from "./strategy.js";
import type { MarketAgent, Recommendation } from "./types.js";

export type SecurityStatus = "pass" | "watch" | "fail";
export type SecurityPosture = "guarded" | "watch" | "exposed";

export type SecurityControl = {
  id: string;
  label: string;
  status: SecurityStatus;
  score: number;
  evidence: string;
  judgeValue: string;
  action: string;
};

export type TrustBoundary = {
  id: string;
  from: string;
  to: string;
  risk: string;
  guardrail: string;
  evidence: string;
};

export type ThreatScenario = {
  id: string;
  threat: string;
  severity: "low" | "medium" | "high";
  likelihood: "low" | "medium" | "high";
  mitigation: string;
  proof: string;
};

export type SecurityReview = {
  id: string;
  securityScore: number;
  posture: SecurityPosture;
  verdict: string;
  hardTruth: string;
  controls: SecurityControl[];
  boundaries: TrustBoundary[];
  threats: ThreatScenario[];
  judgeAnswers: Array<{ id: string; question: string; answer: string; evidence: string }>;
  runbookCommands: string[];
  nextSecurityHire: {
    id: string;
    name: string;
    reason: string;
    expectedLift: string;
  } | null;
  a2aPayload: Record<string, unknown>;
};

type AllowlistSummary = {
  mode?: string;
  enforced?: boolean;
  exactIpCount: number;
  localDevelopmentCidrCount: number;
  rakutenMobileCidrCount: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function hasAgent(recommendation: Recommendation, id: string) {
  return recommendation.selected.some((agent) => agent.id === id);
}

function selectedSecurityAverage(recommendation: Recommendation) {
  return average(recommendation.selected.map((agent) => (agent.capabilities.security + agent.capabilities.a2a + agent.capabilities.mcp) / 3));
}

function statusFromScore(score: number): SecurityStatus {
  if (score >= 82) return "pass";
  if (score >= 58) return "watch";
  return "fail";
}

function control(input: Omit<SecurityControl, "status">): SecurityControl {
  return {
    ...input,
    status: statusFromScore(input.score)
  };
}

function securitySentinel(recommendation: Recommendation) {
  const agent = MARKET_AGENTS.find((candidate) => candidate.id === "security-sentinel" && !hasAgent(recommendation, candidate.id));
  if (!agent) return null;
  return {
    id: agent.id,
    name: agent.name,
    reason: "A2A trust boundary、Secret境界、公開デモガードを審査員に説明可能な証拠へ変換するため。",
    expectedLift: agent.outcome
  };
}

function actor(recommendation: Recommendation, id: string, fallback: string) {
  return recommendation.selected.find((agent) => agent.id === id)?.name ?? fallback;
}

function allowlistScore(allowlist: AllowlistSummary) {
  const cidrCount = allowlist.exactIpCount + allowlist.localDevelopmentCidrCount + allowlist.rakutenMobileCidrCount;
  const enforced = allowlist.enforced ?? cidrCount > 0;
  if (!enforced && cidrCount > 0) return 76;
  if (cidrCount >= 3 && allowlist.rakutenMobileCidrCount > 0) return 96;
  if (cidrCount > 0) return 72;
  return 35;
}

function ciScore(ci?: CiProof) {
  if (!ci) return 72;
  if (ci.status === "passed") return 100;
  if (ci.status === "watch") return 72;
  return 36;
}

function absoluteUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildSecurityReview(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  allowlist: AllowlistSummary;
  ci?: CiProof;
  geminiSecretConfigured?: boolean;
}): SecurityReview {
  const { baseUrl, recommendation, strategy, allowlist, ci } = input;
  const broker = actor(recommendation, "market-broker", "A2A Market Broker");
  const sentinel = actor(recommendation, "security-sentinel", "Security Sentinel");
  const sre = actor(recommendation, "cloud-run-sre", "Cloud Run SRE");
  const securityAverage = selectedSecurityAverage(recommendation);
  const hasBroker = hasAgent(recommendation, "market-broker");
  const hasSre = hasAgent(recommendation, "cloud-run-sre");
  const hasSentinel = hasAgent(recommendation, "security-sentinel");
  const secretConfigured = Boolean(input.geminiSecretConfigured);
  const cidrCount = allowlist.exactIpCount + allowlist.localDevelopmentCidrCount + allowlist.rakutenMobileCidrCount;
  const allowlistEnforced = allowlist.enforced ?? cidrCount > 0;
  const allowlistMode = allowlist.mode ?? (allowlistEnforced ? "strict" : "monitor");

  const controls: SecurityControl[] = [
    control({
      id: "secret-boundary",
      label: "Gemini secret boundary",
      score: secretConfigured ? 100 : 72,
      evidence: secretConfigured ? "Cloud Run receives GEMINI_API_KEY through Secret Manager env binding; value is never rendered." : "Local fallback keeps demo alive, but live Gemini secret is not visible in this process.",
      judgeValue: "シークレットをコードや提出物に混ぜず、実行環境の境界として説明できる。",
      action: secretConfigured ? "Judge ProofのGemini live responseを録画する" : "Cloud Run Secret Manager bindingを確認して再デプロイする"
    }),
    control({
      id: "ip-allowlist",
      label: "Public demo IP allowlist",
      score: allowlistScore(allowlist),
      evidence: `${allowlist.exactIpCount} exact IPs, ${allowlist.rakutenMobileCidrCount} Rakuten Mobile CIDRs, ${allowlist.localDevelopmentCidrCount} local CIDRs are available in ${allowlistMode} mode; enforced=${allowlistEnforced}.`,
      judgeValue: allowlistEnforced ? "非公開デモではアクセス範囲を制限できる。" : "提出用公開URLは審査員とGitHub検証が開ける状態を優先し、制限範囲は監査証跡として表示する。",
      action: allowlistEnforced ? "HealthzのipAllowlist summaryを証拠リンクに添える" : "非公開運用に切り替える時だけIP_ALLOWLIST_MODE=strictでenforceする"
    }),
    control({
      id: "input-contract",
      label: "Request validation and payload cap",
      score: 96,
      evidence: "Express JSON body is capped at 256kb; Zod limits projectBrief to 20,000 chars and selectedAgentIds to 8.",
      judgeValue: "審査員の入力やA2A payloadを、そのまま無制限にGemini/内部処理へ流さない。",
      action: "Invalid request 400 responseをJudge Drillの反証に使う"
    }),
    control({
      id: "a2a-trust-boundary",
      label: "A2A trust boundary",
      score: hasBroker ? clamp(84 + (hasSentinel ? 10 : 0) + securityAverage * 0.04) : 58,
      evidence: hasBroker ? "Agent Card is public, but task execution is represented as auditable message/send artifacts instead of arbitrary tool execution." : "A2A Market Broker is not selected, so trust routing is weaker.",
      judgeValue: "AIエージェントが価値の中心でも、外部エージェントへ無制限実行権限を渡していないと説明できる。",
      action: hasSentinel ? "Security Sentinelのa2aPayloadを提出証拠に残す" : "Security Sentinelを追加雇用してtrust.explainを補強する"
    }),
    control({
      id: "ci-quality-gate",
      label: "GitHub Actions quality gate",
      score: ciScore(ci),
      evidence: ci?.evidence ?? "CI status is read by /api/proof and can be attached during final submission.",
      judgeValue: "実装力を、口頭ではなく公開CIの結果で示す。",
      action: ci?.status === "passed" ? "CI run URLをJudge ProofとSubmission Launch Gateに添える" : "mainのCIを通してから提出URLを固定する"
    }),
    control({
      id: "prompt-output-boundary",
      label: "Gemini prompt/output boundary",
      score: 88,
      evidence: "Gemini is asked for strict JSON, parsed as data, and never executed as code or shell commands.",
      judgeValue: "生成AIの出力を運用判断へ使いつつ、コード実行境界は越えない。",
      action: "Prompt-injection質問が来たら、この境界とZod入力制限を答える"
    }),
    control({
      id: "cloud-run-runtime",
      label: "Cloud Run runtime guard",
      score: hasSre ? 92 : 74,
      evidence: `${absoluteUrl(baseUrl, "/api/healthz")} exposes health, model, agent count, and allowlist summary for runtime inspection.`,
      judgeValue: "作った後の運用・停止判断までDevOpsサイクルに含まれている。",
      action: hasSre ? "Ops DrillとSecurity Reviewを連続で見せる" : "Cloud Run SREを選択してrollback runbookを補強する"
    }),
    control({
      id: "submission-data-minimization",
      label: "Submission data minimization",
      score: strategy.submissionItems.every((item) => item.done) ? 90 : 76,
      evidence: "Submission Launch Gate validates external URLs without storing secrets or personal data.",
      judgeValue: "ProtoPedia提出のために必要なURLだけを扱い、不要な個人情報を集めない。",
      action: "実URLを入れたらSubmission Launch Gateを再実行し、submit-readyだけを提出に使う"
    })
  ];

  const failCount = controls.filter((item) => item.status === "fail").length;
  const watchCount = controls.filter((item) => item.status === "watch").length;
  const securityScore = Math.round(
    clamp(
      average(controls.map((item) => item.score)) * 0.72 +
        average([securityAverage, strategy.judgeScore, strategy.moatScore]) * 0.28 +
        (hasSentinel ? 4 : 0)
    )
  );
  const posture: SecurityPosture = failCount > 0 ? "exposed" : watchCount > 2 ? "watch" : "guarded";
  const nextSecurityHire = securitySentinel(recommendation);
  const verdict =
    posture === "guarded"
      ? "Security story is demo-ready"
      : posture === "watch"
        ? "Security story is credible but needs one more guardrail"
        : "Security story is not safe to pitch yet";
  const hardTruth =
    posture === "guarded"
      ? "Secret、IP、入力、A2A、CI、Cloud Runの境界が審査員に見せられる形で揃っています。"
      : posture === "watch"
        ? "MVPとしては説明できますが、Security Sentinelを入れるとA2A信頼境界の説得力が上がります。"
        : "シークレット、許可範囲、CIのいずれかが弱く、公開デモの信頼性を落とします。";

  const boundaries: TrustBoundary[] = [
    {
      id: "browser-to-express",
      from: "Judge browser",
      to: "Express API",
      risk: "Large or malformed requests could degrade the demo.",
      guardrail: "256kb JSON cap and Zod request contracts.",
      evidence: "RecommendSchema, OpsDrillSchema, and LaunchSchema reject invalid payloads before business logic."
    },
    {
      id: "express-to-gemini",
      from: "Express API",
      to: "Gemini API",
      risk: "Secret leakage or prompt output treated as executable authority.",
      guardrail: "Secret Manager env binding, strict JSON prompt, parsed data only.",
      evidence: "GEMINI_API_KEY is read from env and never returned in API payloads."
    },
    {
      id: "a2a-to-agent",
      from: broker,
      to: "A2A skills",
      risk: "Agent-to-agent story could look like arbitrary remote execution.",
      guardrail: "A2A artifacts describe delegated tasks, evidence links, and acceptance checks.",
      evidence: "Agent Card exposes skills; /a2a returns auditable artifacts rather than running external tools."
    },
    {
      id: "cloud-run-to-public",
      from: sre,
      to: "Public Cloud Run URL",
      risk: "Public hackathon URL receives unintended traffic during judging.",
      guardrail: "IP allowlist middleware, healthz proof, rollback runbook.",
      evidence: `${cidrCount} allowlist entries plus Ops Drill release gate.`
    }
  ];

  const threats: ThreatScenario[] = [
    {
      id: "secret-leak",
      threat: "Gemini API key appears in code, logs, or ProtoPedia copy.",
      severity: "high",
      likelihood: secretConfigured ? "low" : "medium",
      mitigation: "Keep the key in Secret Manager/env only and show proof without rendering the value.",
      proof: controls.find((item) => item.id === "secret-boundary")?.evidence ?? ""
    },
    {
      id: "prompt-injection",
      threat: "A project brief attempts to override system behavior or force tool execution.",
      severity: "medium",
      likelihood: "medium",
      mitigation: "Treat Gemini output as JSON data, validate request size, and never execute generated commands.",
      proof: controls.find((item) => item.id === "prompt-output-boundary")?.evidence ?? ""
    },
    {
      id: "a2a-overreach",
      threat: "A2A delegation is mistaken for unbounded third-party execution.",
      severity: "medium",
      likelihood: hasSentinel ? "low" : "medium",
      mitigation: "Use Security Review and Autonomy Ledger to show delegated tasks, evidence, and acceptance criteria.",
      proof: controls.find((item) => item.id === "a2a-trust-boundary")?.evidence ?? ""
    },
    {
      id: "public-demo-abuse",
      threat: "Public endpoint is hammered during the judging window.",
      severity: "high",
      likelihood: allowlist.rakutenMobileCidrCount > 0 ? "low" : "medium",
      mitigation: "Keep app-level allowlist enabled and use Ops Drill rollback commands if runtime signals fail.",
      proof: controls.find((item) => item.id === "ip-allowlist")?.evidence ?? ""
    }
  ];

  const runbookCommands = [
    `curl -s ${absoluteUrl(baseUrl, "/api/healthz")}`,
    `curl -s ${absoluteUrl(baseUrl, "/.well-known/agent-card.json")}`,
    `curl -s -X POST ${absoluteUrl(baseUrl, "/api/security-review")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
    `curl -s -X POST ${absoluteUrl(baseUrl, "/api/proof")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
    "make q.check",
    "make q.build"
  ];

  const judgeAnswers = [
    {
      id: "secret",
      question: "Gemini APIキーはどこで守っていますか？",
      answer: "コードや提出文には置かず、Cloud RunのSecret Manager/env境界から読むだけです。APIレスポンスにも値は返しません。",
      evidence: controls.find((item) => item.id === "secret-boundary")?.evidence ?? ""
    },
    {
      id: "a2a",
      question: "A2Aで外部AIへ危険な権限を渡していませんか？",
      answer: "このデモではAgent Cardとmessage/send artifactで委任・検収を可視化し、外部ツール実行権限は渡していません。",
      evidence: boundaries.find((item) => item.id === "a2a-to-agent")?.evidence ?? ""
    },
    {
      id: "public",
      question: "公開URLを審査中に安全に動かせますか？",
      answer: "IP allowlist、healthz、Ops Drillのrollback runbook、CIを同じ画面で確認できるので、公開後の判断まで説明できます。",
      evidence: controls.find((item) => item.id === "cloud-run-runtime")?.evidence ?? ""
    }
  ];

  return {
    id: `security-${securityScore}-${posture}`,
    securityScore,
    posture,
    verdict,
    hardTruth,
    controls,
    boundaries,
    threats,
    judgeAnswers,
    runbookCommands,
    nextSecurityHire,
    a2aPayload: {
      method: "message/send",
      skill: "security.review",
      actor: sentinel,
      securityScore,
      posture,
      verdict,
      controls: controls.map((item) => ({ id: item.id, status: item.status, score: item.score })),
      boundaries: boundaries.map((item) => ({ id: item.id, guardrail: item.guardrail })),
      threats: threats.map((item) => ({ id: item.id, severity: item.severity, likelihood: item.likelihood })),
      nextSecurityHire: nextSecurityHire?.id ?? null
    }
  };
}
