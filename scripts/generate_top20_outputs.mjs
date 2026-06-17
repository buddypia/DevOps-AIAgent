import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outputRoot = join(root, "outputs");

const versions = {
  dependencies: {
    "@google/genai": "2.2.0",
    cors: "2.8.6",
    express: "5.2.1",
    zod: "4.4.3",
  },
  devDependencies: {
    "@types/cors": "2.8.19",
    "@types/express": "5.0.6",
    "@types/node": "25.7.0",
    concurrently: "9.2.1",
    tsx: "4.21.0",
    typescript: "6.0.3",
    vite: "8.0.12",
  },
};

const projects = [
  {
    rank: 1,
    ideaNo: "001",
    name: "ShipGuard AI",
    slug: "01-shipguard-ai",
    packageName: "shipguard-ai",
    role: "AI release captain",
    tagline: "Decides Ship, Watch, or Block from PR, CI, and Cloud Run evidence.",
    overview:
      "Reads PR, CI, deployment, and Cloud Run signal fragments to produce a release verdict and next actions.",
    mvp:
      "A web app where a GitHub PR URL, CI summary, and Cloud Run logs become a Gemini-backed release report and PR comment draft.",
    stack: ["Cloud Run", "Gemini API", "Cloud Logging", "GitHub Actions"],
    focusAreas: ["release verdict", "CI failure clustering", "Cloud Run regression signals"],
    metrics: ["Ship risk", "Log anomaly", "Rollback ease"],
    positive: "SHIP",
    caution: "WATCH",
    negative: "BLOCK",
    accent: "#0f766e",
    secondary: "#d97706",
    sampleTarget: "https://github.com/example/checkout/pull/184",
    sampleContext:
      "Checkout API PR changes payment retry handling. Cloud Run service checkout-api in asia-northeast1. Previous revision checkout-api-00152-pak is stable.",
    sampleSignals:
      "CI: unit pass, integration pass, e2e flaky retry passed. Diff: payment/retry.ts +82 lines, checkout controller +31. Logs after preview: 3 timeout warnings, no 5xx, p95 latency +18ms. Rollback: previous revision has 100% traffic snapshot.",
  },
  {
    rank: 2,
    ideaNo: "026",
    name: "Two Minute Triage",
    slug: "02-two-minute-triage",
    packageName: "two-minute-triage",
    role: "incident first-response agent",
    tagline: "Finds the three things worth checking in the first two minutes.",
    overview:
      "Compresses Cloud Logging, Monitoring, and recent PR hints into the smallest useful initial incident plan.",
    mvp:
      "A triage console that ranks evidence, names the likely first owner, and produces a two-minute action script.",
    stack: ["Cloud Run", "Gemini API", "GitHub Actions"],
    focusAreas: ["first signal selection", "owner routing", "noise reduction"],
    metrics: ["Urgency", "Signal clarity", "Owner confidence"],
    positive: "STABILIZE",
    caution: "INVESTIGATE",
    negative: "ESCALATE",
    accent: "#1d4ed8",
    secondary: "#dc2626",
    sampleTarget: "checkout-api incident 2026-05-13T09:42:00+09:00",
    sampleContext:
      "PagerDuty fired for checkout-api. Engineers have two minutes before customer support joins the bridge.",
    sampleSignals:
      "Cloud Logging: 5xx jumped from 0.2% to 4.9% after revision checkout-api-00153. Monitoring: p99 latency 3.8s, CPU 42%, DB connections normal. Recent PRs: retry policy merged 17 minutes ago, feature flag checkout_retry_v2 enabled for 25%.",
  },
  {
    rank: 3,
    ideaNo: "002",
    name: "Canary Diff Judge",
    slug: "03-canary-diff-judge",
    packageName: "canary-diff-judge",
    role: "canary promotion judge",
    tagline: "Compares revisions and decides promote, hold, or rollback.",
    overview:
      "Reads old/new Cloud Run revision data, log deltas, latency changes, and error rates to judge canary promotion.",
    mvp:
      "A dashboard that receives canary evidence and returns a promotion verdict with traffic-shift instructions.",
    stack: ["Cloud Run", "Gemini API", "Cloud Logging", "Cloud Monitoring"],
    focusAreas: ["revision comparison", "traffic split", "rollback threshold"],
    metrics: ["Canary health", "Latency delta", "Error delta"],
    positive: "PROMOTE",
    caution: "HOLD",
    negative: "ROLLBACK",
    accent: "#7c3aed",
    secondary: "#059669",
    sampleTarget: "cloud-run://checkout-api/revisions/00152..00153",
    sampleContext:
      "New revision is serving 10% traffic. Goal is to decide whether to move to 50% or roll back.",
    sampleSignals:
      "Old revision: 0.3% 5xx, p95 280ms, 2 warning patterns. New revision: 0.7% 5xx, p95 318ms, new warning 'payment retry exhausted' 14 times, no customer tickets.",
  },
  {
    rank: 4,
    ideaNo: "004",
    name: "Blast Radius Agent",
    slug: "04-blast-radius-agent",
    packageName: "blast-radius-agent",
    role: "change impact forecaster",
    tagline: "Maps a PR to affected screens, APIs, data, and runbooks.",
    overview:
      "Turns a PR diff and service notes into an operational impact forecast before release.",
    mvp:
      "A PR impact analyzer that groups touched surfaces, test gaps, and watchpoints for reviewers.",
    stack: ["Cloud Run", "Gemini API", "Cloud Logging", "GitHub Actions"],
    focusAreas: ["affected surfaces", "review routing", "test gap hints"],
    metrics: ["Surface count", "Contract risk", "Test coverage"],
    positive: "LOW RADIUS",
    caution: "WATCH RADIUS",
    negative: "HIGH RADIUS",
    accent: "#be123c",
    secondary: "#0f766e",
    sampleTarget: "https://github.com/example/app/pull/211",
    sampleContext:
      "PR touches subscription billing, invoice webhooks, and admin exports. Release owner needs an impact map.",
    sampleSignals:
      "Diff: billing/plan.ts, webhooks/stripe.ts, admin/export.sql, invoice email copy. Tests: unit coverage added for plan upgrade only. Logs: webhook retries are already noisy. Runbook: billing rollback mentions old flag name.",
  },
  {
    rank: 5,
    ideaNo: "226",
    name: "Privacy Impact Diff Agent",
    slug: "05-privacy-impact-diff-agent",
    packageName: "privacy-impact-diff-agent",
    role: "privacy diff reviewer",
    tagline: "Finds personal-data collection, storage, logging, and transfer changes.",
    overview:
      "Reviews PR evidence for privacy-impact changes and creates a concise mitigation checklist.",
    mvp:
      "A web app that flags PII paths, retention questions, log exposure, and external sharing risks.",
    stack: ["Cloud Run", "Gemini API", "GitHub Actions", "Cloud Logging"],
    focusAreas: ["PII detection", "log exposure", "retention review"],
    metrics: ["PII surface", "Logging risk", "Review readiness"],
    positive: "CLEAR",
    caution: "REVIEW",
    negative: "BLOCK PRIVACY",
    accent: "#0e7490",
    secondary: "#b45309",
    sampleTarget: "https://github.com/example/crm/pull/92",
    sampleContext:
      "The PR adds customer success notes and exports support metadata to analytics.",
    sampleSignals:
      "Diff: new fields customer_email, freeform_note, account_health. Logs: debug statement includes customer payload. Destination: analytics topic support-events. Retention doc: not updated. Tests: schema test added.",
  },
  {
    rank: 6,
    ideaNo: "003",
    name: "Deploy Rehearsal Agent",
    slug: "06-deploy-rehearsal-agent",
    packageName: "deploy-rehearsal-agent",
    role: "pre-production rehearsal director",
    tagline: "Dry-runs deployment instructions before they become an outage.",
    overview:
      "Reads README, Actions, environment variables, and release notes to catch deploy holes before production.",
    mvp:
      "A rehearsal checker that produces missing prerequisites, command order, and stop conditions.",
    stack: ["Cloud Run", "Gemini API", "Cloud Logging", "GitHub Actions"],
    focusAreas: ["env readiness", "command sequencing", "stop conditions"],
    metrics: ["Readiness", "Config gap", "Rollback clarity"],
    positive: "READY",
    caution: "REHEARSE",
    negative: "NOT READY",
    accent: "#4f46e5",
    secondary: "#ca8a04",
    sampleTarget: "release/v2.7.0 deploy rehearsal",
    sampleContext:
      "Team wants to deploy a Cloud Run service from source after merging feature flags and DB index migration.",
    sampleSignals:
      "README says set STRIPE_WEBHOOK_SECRET but .env.example lacks it. GitHub Actions deploy job uses node 20 while local package expects node 22. Cloud Run min instances set to zero. Rollback command exists but migration rollback SQL is missing.",
  },
  {
    rank: 7,
    ideaNo: "024",
    name: "Post Deploy Judge",
    slug: "07-post-deploy-judge",
    packageName: "post-deploy-judge",
    role: "post-deployment decision agent",
    tagline: "Judges the first 15 minutes after deploy.",
    overview:
      "Analyzes post-deploy logs and metrics to call success, continued watch, or rollback.",
    mvp:
      "A deployment observation board that explains the verdict and creates the next monitoring window.",
    stack: ["Cloud Run", "Gemini API", "Cloud Logging", "Cloud Monitoring"],
    focusAreas: ["post-deploy window", "success criteria", "rollback trigger"],
    metrics: ["Success confidence", "Metric drift", "User impact"],
    positive: "SUCCESS",
    caution: "WATCH",
    negative: "ROLLBACK",
    accent: "#15803d",
    secondary: "#be123c",
    sampleTarget: "checkout-api deploy 2026-05-13 10:00 JST",
    sampleContext:
      "Revision checkout-api-00153 reached 100% traffic 15 minutes ago. Release owner needs a go/no-go call.",
    sampleSignals:
      "First 15 minutes: requests 42k, 5xx 0.6% vs baseline 0.3%, p95 310ms vs baseline 285ms, warning pattern doubled for retry exhaustion. Support tickets: none. Business metric checkout_success down 0.8%.",
  },
  {
    rank: 8,
    ideaNo: "027",
    name: "Recovery Confidence Meter",
    slug: "08-recovery-confidence-meter",
    packageName: "recovery-confidence-meter",
    role: "recovery verification agent",
    tagline: "Checks whether recovery is real or just temporarily quiet.",
    overview:
      "Compares recovery-period logs and metrics against healthy baselines to determine confidence.",
    mvp:
      "A recovery meter with confidence scoring, residual risk, and evidence to close or continue the incident.",
    stack: ["Cloud Run", "Gemini API", "Cloud Logging", "Cloud Monitoring"],
    focusAreas: ["baseline comparison", "residual symptoms", "closure criteria"],
    metrics: ["Recovery confidence", "Residual noise", "Baseline match"],
    positive: "CLOSE",
    caution: "VERIFY",
    negative: "KEEP INCIDENT OPEN",
    accent: "#0369a1",
    secondary: "#65a30d",
    sampleTarget: "incident INC-1042 recovery review",
    sampleContext:
      "A payment timeout incident was mitigated by rolling back one Cloud Run revision. Team wants to close the incident.",
    sampleSignals:
      "After rollback: 5xx 0.25%, p95 290ms, retry warnings 5/min down from 180/min. Checkout success back to 98.8% baseline. One customer report arrived 6 minutes after rollback. DB latency normal.",
  },
  {
    rank: 9,
    ideaNo: "051",
    name: "Eval Dataset Gardener",
    slug: "09-eval-dataset-gardener",
    packageName: "eval-dataset-gardener",
    role: "AI eval maintenance agent",
    tagline: "Turns failures and low-rated responses into eval cases.",
    overview:
      "Harvests failed AI responses and operational feedback into structured evaluation cases for regression gates.",
    mvp:
      "A dataset workbench that suggests eval cases, expected behavior, and a regression run plan.",
    stack: ["Cloud Run", "Gemini API", "Cloud Logging", "BigQuery"],
    focusAreas: ["failure harvesting", "expected answer drafting", "regression grouping"],
    metrics: ["Eval value", "Coverage gain", "Regression risk"],
    positive: "ADD CASES",
    caution: "CURATE",
    negative: "BLOCK MODEL CHANGE",
    accent: "#a16207",
    secondary: "#2563eb",
    sampleTarget: "support-agent eval refresh",
    sampleContext:
      "AI support agent had low-rated answers after a prompt update. Team needs new regression cases before the next release.",
    sampleSignals:
      "Failed responses: refund policy hallucinated for enterprise plan, ignored Japanese locale, tool timeout turned into confident answer. User ratings: 12 thumbs down. Current eval suite lacks locale and tool-failure cases.",
  },
  {
    rank: 10,
    ideaNo: "123",
    name: "Cloud Run Traffic Mixer",
    slug: "10-cloud-run-traffic-mixer",
    packageName: "cloud-run-traffic-mixer",
    role: "traffic split planning agent",
    tagline: "Plans staged Cloud Run revision traffic shifts from live signals.",
    overview:
      "Uses revision evidence and operational signals to recommend the next Cloud Run traffic allocation.",
    mvp:
      "A traffic mixer that proposes 10/25/50/100 percent stages, waits, and rollback conditions.",
    stack: ["Cloud Run", "Gemini API", "Cloud Logging", "Cloud Monitoring"],
    focusAreas: ["traffic stages", "wait conditions", "revision health"],
    metrics: ["New revision health", "Shift appetite", "Rollback safety"],
    positive: "SHIFT UP",
    caution: "HOLD SPLIT",
    negative: "SHIFT DOWN",
    accent: "#4338ca",
    secondary: "#ea580c",
    sampleTarget: "checkout-api traffic split",
    sampleContext:
      "New revision receives 25% traffic. Team wants an autonomous recommendation for the next split.",
    sampleSignals:
      "Revision stable at 25% for 20 minutes. New revision 5xx 0.42%, old 0.31%. p95 +20ms. Business conversion unchanged. New log pattern appears only when feature flag retry_v2 is on. Rollback command tested.",
  },
  {
    rank: 11,
    ideaNo: "126",
    name: "Runbook Decay Detector",
    slug: "11-runbook-decay-detector",
    packageName: "runbook-decay-detector",
    role: "runbook freshness agent",
    tagline: "Finds stale commands, URLs, env vars, and ownership in runbooks.",
    overview:
      "Compares runbook text with current repo and deployment evidence to generate a repair plan.",
    mvp:
      "A runbook review app that marks decay points and drafts a documentation PR comment.",
    stack: ["Cloud Run", "Gemini API", "GitHub Actions"],
    focusAreas: ["command freshness", "env var drift", "owner drift"],
    metrics: ["Freshness", "Command validity", "Ownership clarity"],
    positive: "FRESH",
    caution: "PATCH DOCS",
    negative: "STALE",
    accent: "#0f766e",
    secondary: "#7c2d12",
    sampleTarget: "docs/runbooks/payment-timeout.md",
    sampleContext:
      "Runbook has not been edited for four months. Service migrated from payment-api to checkout-api.",
    sampleSignals:
      "Runbook command references gcloud run services update payment-api. Current service is checkout-api. Env var PAYMENT_TIMEOUT_MS renamed CHECKOUT_PAYMENT_TIMEOUT_MS. Pager rotation owner listed as old Slack channel #payments-ops.",
  },
  {
    rank: 12,
    ideaNo: "201",
    name: "Data Pipeline Sheriff",
    slug: "12-data-pipeline-sheriff",
    packageName: "data-pipeline-sheriff",
    role: "data pipeline operations agent",
    tagline: "Judges ETL delay, missing data, and rerun safety.",
    overview:
      "Monitors ETL logs, lateness, and missing partitions to decide rerun, hold, or escalate.",
    mvp:
      "A pipeline incident board that recommends data recovery actions and downstream communication.",
    stack: ["Cloud Run", "Gemini API", "Cloud Logging", "BigQuery"],
    focusAreas: ["missing partitions", "rerun safety", "downstream blast radius"],
    metrics: ["Data freshness", "Rerun safety", "Downstream impact"],
    positive: "RERUN",
    caution: "HOLD DATA",
    negative: "ESCALATE",
    accent: "#0e7490",
    secondary: "#9333ea",
    sampleTarget: "daily_revenue_pipeline 2026-05-13",
    sampleContext:
      "The daily revenue BigQuery table is late. Finance dashboard refresh is due in 35 minutes.",
    sampleSignals:
      "ETL logs: extract complete, transform failed on null currency_code, partition 2026-05-12 missing 18% rows. Upstream source emitted schema warning. Last successful run 24h ago. Rerun cost estimate low. Dashboard SLA 11:00 JST.",
  },
  {
    rank: 13,
    ideaNo: "005",
    name: "Rollback Concierge",
    slug: "13-rollback-concierge",
    packageName: "rollback-concierge",
    role: "rollback sequencing agent",
    tagline: "Builds a safer rollback order across revisions and data changes.",
    overview:
      "Looks at Cloud Run revisions, DB changes, and operational state to propose rollback sequencing.",
    mvp:
      "A rollback planner that lists the safest order, verification checks, and irreversible steps.",
    stack: ["Cloud Run", "Gemini API", "Cloud Logging"],
    focusAreas: ["revision rollback", "data compatibility", "verification SQL"],
    metrics: ["Rollback safety", "Data risk", "Verification depth"],
    positive: "ROLLBACK READY",
    caution: "MANUAL CHECK",
    negative: "DO NOT ROLLBACK",
    accent: "#b45309",
    secondary: "#2563eb",
    sampleTarget: "checkout-api rollback plan",
    sampleContext:
      "New release changed retry handling and added nullable DB column payment_attempt_source.",
    sampleSignals:
      "Cloud Run previous revision healthy. DB migration add-column only, no backfill. Feature flag can disable retry_v2. Logs show timeout spike. No irreversible delete migration. Verification SQL exists for failed checkout count.",
  },
  {
    rank: 14,
    ideaNo: "150",
    name: "Deployment Black Box Recorder",
    slug: "14-deployment-black-box-recorder",
    packageName: "deployment-black-box-recorder",
    role: "deployment evidence recorder",
    tagline: "Captures the facts that matter at deploy time.",
    overview:
      "Builds a searchable record of PRs, CI, config, AI judgment, and logs for later incident learning.",
    mvp:
      "A deploy recorder that summarizes the deployment envelope and highlights evidence worth preserving.",
    stack: ["Cloud Run", "Gemini API", "Cloud Logging", "GitHub Actions"],
    focusAreas: ["evidence capture", "timeline anchors", "incident replay"],
    metrics: ["Record completeness", "Replay value", "Config coverage"],
    positive: "RECORD",
    caution: "ENRICH RECORD",
    negative: "MISSING EVIDENCE",
    accent: "#334155",
    secondary: "#0d9488",
    sampleTarget: "deploy record checkout-api 00153",
    sampleContext:
      "Team wants every deployment to leave a forensic capsule for postmortem and release review.",
    sampleSignals:
      "Captured: PR 184, CI run 7721, image digest sha256:abc, env diff with RETRY_LIMIT 2->4, traffic split 10->100, release owner, AI gate verdict WATCH. Missing: final 15-minute log snapshot and feature flag state.",
  },
  {
    rank: 15,
    ideaNo: "011",
    name: "Dark Launch Scout",
    slug: "15-dark-launch-scout",
    packageName: "dark-launch-scout",
    role: "dark launch readiness scout",
    tagline: "Reads hidden-feature signals before public launch.",
    overview:
      "Analyzes internal-only or flag-hidden behavior to judge whether a dark launch is ready for exposure.",
    mvp:
      "A scout dashboard that scores hidden feature health and names what must be watched before launch.",
    stack: ["Cloud Run", "Gemini API", "Cloud Logging", "Cloud Monitoring"],
    focusAreas: ["hidden traffic", "flag readiness", "launch watchpoints"],
    metrics: ["Launch readiness", "Hidden error rate", "Signal maturity"],
    positive: "LAUNCH",
    caution: "KEEP DARK",
    negative: "DISABLE",
    accent: "#155e75",
    secondary: "#c2410c",
    sampleTarget: "feature flag invoice_ai_assist",
    sampleContext:
      "New AI invoice assistant is dark-launched to employees only. Product wants to open beta.",
    sampleSignals:
      "Internal traffic 840 sessions. Error rate 1.1%, p95 620ms, Gemini timeout 0.4%. Manual feedback: useful but sometimes slow. No external users. Logging lacks request category field. Rollback is flag disable.",
  },
  {
    rank: 16,
    ideaNo: "076",
    name: "AI Exploratory Tester",
    slug: "16-ai-exploratory-tester",
    packageName: "ai-exploratory-tester",
    role: "exploratory QA agent",
    tagline: "Turns a target URL and notes into exploration charters and bug reports.",
    overview:
      "Plans exploratory testing routes, identifies likely broken flows, and drafts reproducible issues.",
    mvp:
      "A QA workbench that creates test charters, expected observations, and bug report skeletons.",
    stack: ["Cloud Run", "Gemini API", "ADK"],
    focusAreas: ["exploration route", "bug reproduction", "user-flow coverage"],
    metrics: ["Coverage", "Bug likelihood", "Repro clarity"],
    positive: "TEST NOW",
    caution: "EXPLORE MORE",
    negative: "BLOCK RELEASE",
    accent: "#6d28d9",
    secondary: "#16a34a",
    sampleTarget: "https://staging.example.com/signup",
    sampleContext:
      "New onboarding flow includes plan selection, team invite, and billing setup. Release candidate is ready for exploratory QA.",
    sampleSignals:
      "Known risk: long organization names, Japanese locale, failed card, back button from invite step. Existing e2e only covers happy path. Recent UI diff changed validation and empty states.",
  },
  {
    rank: 17,
    ideaNo: "179",
    name: "Decision Fatigue Reducer",
    slug: "17-decision-fatigue-reducer",
    packageName: "decision-fatigue-reducer",
    role: "decision prioritization agent",
    tagline: "Chooses the three decisions humans should make now.",
    overview:
      "Reads crowded PR and issue context to rank the decisions that unblock delivery.",
    mvp:
      "A decision queue that groups noisy work into now, later, and delegate recommendations.",
    stack: ["Cloud Run", "Gemini API", "GitHub Actions"],
    focusAreas: ["decision ranking", "delegation", "unblock sequence"],
    metrics: ["Decision pressure", "Unblock value", "Delegation fit"],
    positive: "DECIDE THREE",
    caution: "DEFER",
    negative: "ESCALATE",
    accent: "#854d0e",
    secondary: "#0284c7",
    sampleTarget: "sprint release queue",
    sampleContext:
      "Team has 18 open PRs, 9 release questions, and two hours before branch freeze.",
    sampleSignals:
      "PRs: billing copy, retry policy, mobile deep link, analytics schema. CI failures on retry policy. Product question about beta scope. Security question about logging customer email. Two reviewers overloaded.",
  },
  {
    rank: 18,
    ideaNo: "209",
    name: "Model Rollback Agent",
    slug: "18-model-rollback-agent",
    packageName: "model-rollback-agent",
    role: "AI model rollback judge",
    tagline: "Decides when a model or prompt change should be rolled back.",
    overview:
      "Compares model evaluation, production feedback, and logs to judge rollback for AI features.",
    mvp:
      "A model operations board that recommends keep, canary, or rollback with evidence.",
    stack: ["Cloud Run", "Gemini API", "Cloud Logging", "Cloud Monitoring"],
    focusAreas: ["model comparison", "eval regression", "production feedback"],
    metrics: ["Model health", "Eval regression", "User correction rate"],
    positive: "KEEP MODEL",
    caution: "CANARY",
    negative: "ROLLBACK MODEL",
    accent: "#2563eb",
    secondary: "#c026d3",
    sampleTarget: "support-agent model update",
    sampleContext:
      "Support agent moved from previous model to Gemini Flash 3.1 variant. Team needs rollback decision after one hour.",
    sampleSignals:
      "Eval pass rate 93% -> 90%, tool-call success 96% -> 91%, Japanese answers improved, refund hallucination reports increased from 1 to 7. Latency down 24%. Human override rate up 3.5 points.",
  },
  {
    rank: 19,
    ideaNo: "401",
    name: "Chaos Drill Agent",
    slug: "19-chaos-drill-agent",
    packageName: "chaos-drill-agent",
    role: "chaos exercise conductor",
    tagline: "Designs a safe drill and scores detection, judgment, and recovery.",
    overview:
      "Creates controlled failure drills, expected signals, scoring rubrics, and recovery evaluation.",
    mvp:
      "A chaos drill planner that outputs scenario, guardrails, scoring, and post-drill improvements.",
    stack: ["Cloud Run", "Gemini API", "ADK"],
    focusAreas: ["failure injection", "safety guardrails", "response scoring"],
    metrics: ["Drill safety", "Detection quality", "Recovery score"],
    positive: "RUN DRILL",
    caution: "TIGHTEN GUARDRAILS",
    negative: "DO NOT RUN",
    accent: "#991b1b",
    secondary: "#0f766e",
    sampleTarget: "checkout timeout chaos drill",
    sampleContext:
      "Team wants a 10-minute staging drill that simulates payment provider latency without affecting production.",
    sampleSignals:
      "Staging only. Proposed injection: add 900ms latency to payment sandbox for 20% requests. Monitors: checkout p95, retry warnings, synthetic checkout. Guardrails: stop at 2% 5xx or p95 > 2s. Runbook owner available.",
  },
  {
    rank: 20,
    ideaNo: "424",
    name: "Incident Commander Karaoke",
    slug: "20-incident-commander-karaoke",
    packageName: "incident-commander-karaoke",
    role: "incident command rehearsal coach",
    tagline: "Scores spoken incident commands for clarity and operational fit.",
    overview:
      "Evaluates incident commander instructions from transcript-like input and returns coaching feedback.",
    mvp:
      "A rehearsal console that scores a command transcript, identifies missing facts, and drafts a better command.",
    stack: ["Cloud Run", "Gemini API", "Speech-to-Text"],
    focusAreas: ["command clarity", "role assignment", "communication cadence"],
    metrics: ["Clarity", "Actionability", "Cadence"],
    positive: "GOOD COMMAND",
    caution: "COACH",
    negative: "RETRY COMMAND",
    accent: "#9333ea",
    secondary: "#f97316",
    sampleTarget: "incident commander transcript",
    sampleContext:
      "A practice incident bridge is running. The commander reads a short instruction and wants scoring.",
    sampleSignals:
      "Transcript: 'Everyone look at logs and tell me if it is bad. Maybe roll back if needed. Someone update support.' Missing: named owners, time box, user impact, rollback criteria, next update time. Situation: checkout 5xx at 4.8%.",
  },
];

function writeText(path, text) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text.replace(/\n+$/, "\n"), "utf8");
}

function json(value) {
  return JSON.stringify(value, null, 2);
}

function packageJson(project) {
  return json({
    name: project.packageName,
    version: "0.1.0",
    private: true,
    type: "module",
    description: `${project.name}: ${project.tagline}`,
    scripts: {
      dev: "concurrently \"npm:dev:api\" \"npm:dev:web\"",
      "dev:api": "tsx watch src/server.ts",
      "dev:web": "vite --host 0.0.0.0",
      build: "tsc --noEmit && vite build && vite build --config vite.server.config.ts",
      start: "node dist/server/server.js",
      preview: "vite preview --host 0.0.0.0",
      typecheck: "tsc --noEmit",
    },
    dependencies: versions.dependencies,
    devDependencies: versions.devDependencies,
    engines: {
      node: ">=22",
    },
  });
}

function projectTs(project) {
  return `export const project = ${json(project)} as const;

export type ProjectConfig = typeof project;
`;
}

function agentTs() {
  return `import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { project } from "./project";

export const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

export const AnalyzeInputSchema = z.object({
  target: z.string().trim().max(4000).default(""),
  context: z.string().trim().max(20000).default(""),
  signals: z.string().trim().max(30000).default(""),
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

const ActionSchema = z.object({
  title: z.string(),
  owner: z.string(),
  priority: z.string(),
});

const EvidenceSchema = z.object({
  label: z.string(),
  value: z.string(),
  weight: z.number().min(0).max(100),
});

export const AnalysisSchema = z.object({
  decision: z.string(),
  confidence: z.number().min(0).max(100),
  summary: z.string(),
  risks: z.array(z.string()),
  actions: z.array(ActionSchema),
  evidence: z.array(EvidenceSchema),
  automationPlan: z.array(z.string()),
  commentDraft: z.string(),
  source: z.enum(["gemini", "local-fallback"]),
  model: z.string(),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

const riskyPatterns = [
  /5xx|error|exception|panic|timeout|failed|failure|critical|sev|incident/i,
  /latency|p95|p99|slow|degraded|spike|drop|missing|stale|late/i,
  /rollback|irreversible|migration|schema|secret|token|pii|email|privacy|leak/i,
  /unknown|manual|flaky|warning|retry|overloaded|unowned|not updated/i,
];

function riskScore(input: AnalyzeInput) {
  const text = [input.target, input.context, input.signals].join("\\n");
  const lengthSignal = Math.min(18, Math.floor(text.length / 420));
  const patternScore = riskyPatterns.reduce((score, pattern) => {
    const matches = text.match(new RegExp(pattern.source, "gi"));
    return score + Math.min(18, (matches?.length || 0) * 5);
  }, 0);
  const focusScore = project.focusAreas.reduce((score, focus) => {
    const word = focus.split(" ")[0] || focus;
    return score + (new RegExp(word, "i").test(text) ? 4 : 0);
  }, 0);
  return Math.max(12, Math.min(92, 20 + lengthSignal + patternScore + focusScore));
}

function fallbackAnalysis(input: AnalyzeInput, reason: string): Analysis {
  const score = riskScore(input);
  const decision = score >= 67 ? project.negative : score >= 42 ? project.caution : project.positive;
  const confidence = Math.max(52, Math.min(88, 92 - Math.abs(55 - score)));
  const evidence = project.metrics.map((label, index) => {
    const weight = Math.max(18, Math.min(96, score + index * 9 - 10));
    return {
      label,
      value: weight >= 70 ? "high attention" : weight >= 45 ? "watch" : "healthy",
      weight,
    };
  });

  return AnalysisSchema.parse({
    decision,
    confidence,
    summary: \`\${project.name} used deterministic local analysis because \${reason}. The current evidence points to "\${decision}" with the strongest signal around \${evidence[0]?.label || "operational risk"}.\`,
    risks: [
      \`Validate \${project.focusAreas[0]} before changing production state.\`,
      \`Check whether the sample evidence includes fresh Cloud Run or CI timestamps.\`,
      \`Keep a human owner attached to the next irreversible step.\`,
    ],
    actions: [
      {
        title: \`Review \${project.metrics[0]} evidence\`,
        owner: "release owner",
        priority: score >= 67 ? "P0" : "P1",
      },
      {
        title: \`Collect one more signal for \${project.focusAreas[1] || "the next decision"}\`,
        owner: "on-call engineer",
        priority: "P1",
      },
      {
        title: "Publish the decision note and rollback/stop condition",
        owner: "incident commander",
        priority: "P2",
      },
    ],
    evidence,
    automationPlan: [
      \`Fetch current Cloud Run revision and log window for \${input.target || project.name}.\`,
      "Re-run the same scoring prompt after the next deploy or incident window.",
      "Write the final decision into the PR, runbook, or incident timeline.",
    ],
    commentDraft: \`Decision: \${decision}. Confidence: \${confidence}%. Main check: \${project.focusAreas.join(", ")}. Next step: confirm owner and stop condition before proceeding.\`,
    source: "local-fallback",
    model: DEFAULT_MODEL,
  });
}

function buildPrompt(input: AnalyzeInput) {
  return \`You are \${project.name}, a \${project.role} for a DevOps x AI Agent hackathon.
Use Google Gemini Flash 3.1 style fast operational judgment.

Project objective:
\${project.overview}

MVP behavior:
\${project.mvp}

Focus areas:
\${project.focusAreas.map((item) => \`- \${item}\`).join("\\n")}

Return strict JSON only with this schema:
{
  "decision": "one of: \${project.positive}, \${project.caution}, \${project.negative}",
  "confidence": 0-100,
  "summary": "short operational judgment",
  "risks": ["risk"],
  "actions": [{"title":"action","owner":"role","priority":"P0/P1/P2"}],
  "evidence": [{"label":"metric","value":"short value","weight":0-100}],
  "automationPlan": ["step"],
  "commentDraft": "PR, runbook, or incident comment"
}

Target:
\${input.target || "(not supplied)"}

Context:
\${input.context || "(not supplied)"}

Signals:
\${input.signals || "(not supplied)"}\`;
}

function parseJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^\`\`\`(?:json)?\\s*([\\s\\S]*?)\\s*\`\`\`$/i);
  const candidate = fenced?.[1] || trimmed;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return JSON.parse(candidate.slice(first, last + 1));
  }
  return JSON.parse(candidate);
}

export async function analyze(input: AnalyzeInput): Promise<Analysis> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return fallbackAnalysis(input, "no Gemini API key is configured");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: buildPrompt(input),
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });
    const parsed = parseJson(response.text || "{}");
    return AnalysisSchema.parse({
      ...parsed,
      source: "gemini",
      model: DEFAULT_MODEL,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown Gemini error";
    return fallbackAnalysis(input, \`Gemini call failed: \${message}\`);
  }
}
`;
}

function serverTs() {
  return `import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AnalyzeInputSchema, DEFAULT_MODEL, analyze } from "./agent";
import { project } from "./project";

const app = express();
const port = Number(process.env.PORT || 8080);
const host = "0.0.0.0";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    project: project.name,
    rank: project.rank,
    model: DEFAULT_MODEL,
    geminiConfigured: Boolean(
      process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    ),
  });
});

app.get("/api/project", (_req, res) => {
  res.json({
    ...project,
    defaultModel: DEFAULT_MODEL,
  });
});

app.post("/api/analyze", async (req, res) => {
  const parsed = AnalyzeInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid input",
      details: parsed.error.flatten(),
    });
    return;
  }

  const result = await analyze(parsed.data);
  res.json(result);
});

const currentDir = dirname(fileURLToPath(import.meta.url));
const clientDirs = [
  resolve(currentDir, "../client"),
  resolve(process.cwd(), "dist/client"),
  resolve(process.cwd(), "public"),
];
const clientDir = clientDirs.find((dir) => existsSync(resolve(dir, "index.html")));

if (clientDir) {
  app.use(express.static(clientDir));
}

app.use((req, res) => {
  if (req.method === "GET" && clientDir) {
    res.sendFile(resolve(clientDir, "index.html"));
    return;
  }
  res.status(404).json({ error: "Not found" });
});

app.listen(port, host, () => {
  console.log(\`\${project.name} listening on http://\${host}:\${port}\`);
});
`;
}

function mainTs() {
  return `import "./styles.css";

type ProjectPayload = {
  rank: number;
  ideaNo: string;
  name: string;
  tagline: string;
  overview: string;
  mvp: string;
  stack: string[];
  focusAreas: string[];
  metrics: string[];
  positive: string;
  caution: string;
  negative: string;
  accent: string;
  secondary: string;
  sampleTarget: string;
  sampleContext: string;
  sampleSignals: string;
  defaultModel: string;
};

type Analysis = {
  decision: string;
  confidence: number;
  summary: string;
  risks: string[];
  actions: Array<{ title: string; owner: string; priority: string }>;
  evidence: Array<{ label: string; value: string; weight: number }>;
  automationPlan: string[];
  commentDraft: string;
  source: string;
  model: string;
};

const app = document.querySelector<HTMLDivElement>("#app")!;

if (!app) {
  throw new Error("Missing #app");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function list(items: string[]) {
  return items.map((item) => \`<li>\${escapeHtml(item)}</li>\`).join("");
}

function actionRows(actions: Analysis["actions"]) {
  return actions
    .map(
      (action) => \`
        <tr>
          <td><span class="priority">\${escapeHtml(action.priority)}</span></td>
          <td>\${escapeHtml(action.title)}</td>
          <td>\${escapeHtml(action.owner)}</td>
        </tr>\`,
    )
    .join("");
}

function evidenceBars(evidence: Analysis["evidence"]) {
  return evidence
    .map(
      (item) => \`
        <div class="evidence">
          <div class="evidence-row">
            <span>\${escapeHtml(item.label)}</span>
            <strong>\${escapeHtml(item.value)}</strong>
          </div>
          <div class="bar" aria-label="\${escapeHtml(item.label)} \${item.weight}%">
            <span style="width: \${Math.max(0, Math.min(100, item.weight))}%"></span>
          </div>
        </div>\`,
    )
    .join("");
}

function resultMarkup(result?: Analysis) {
  if (!result) {
    return \`
      <div class="empty-state">
        <p>Awaiting evidence.</p>
      </div>\`;
  }

  return \`
    <div class="decision-strip">
      <div>
        <span class="eyebrow">Decision</span>
        <strong>\${escapeHtml(result.decision)}</strong>
      </div>
      <div>
        <span class="eyebrow">Confidence</span>
        <strong>\${result.confidence}%</strong>
      </div>
      <div>
        <span class="eyebrow">Source</span>
        <strong>\${escapeHtml(result.source)}</strong>
      </div>
    </div>
    <p class="summary">\${escapeHtml(result.summary)}</p>
    <section class="result-section">
      <h2>Evidence</h2>
      \${evidenceBars(result.evidence)}
    </section>
    <section class="result-section">
      <h2>Actions</h2>
      <table>
        <thead><tr><th>Priority</th><th>Action</th><th>Owner</th></tr></thead>
        <tbody>\${actionRows(result.actions)}</tbody>
      </table>
    </section>
    <section class="result-grid">
      <div>
        <h2>Risks</h2>
        <ul>\${list(result.risks)}</ul>
      </div>
      <div>
        <h2>Automation</h2>
        <ol>\${list(result.automationPlan)}</ol>
      </div>
    </section>
    <section class="result-section">
      <h2>Comment Draft</h2>
      <pre>\${escapeHtml(result.commentDraft)}</pre>
    </section>\`;
}

async function postAnalysis(project: ProjectPayload) {
  const form = document.querySelector<HTMLFormElement>("#analysis-form");
  const output = document.querySelector<HTMLElement>("#result");
  const button = document.querySelector<HTMLButtonElement>("#run-button");
  if (!form || !output || !button) return;

  button.disabled = true;
  button.textContent = "Running";
  output.innerHTML = '<div class="empty-state"><p>Analyzing operational evidence.</p></div>';

  const data = new FormData(form);
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target: data.get("target"),
      context: data.get("context"),
      signals: data.get("signals"),
    }),
  });

  if (!response.ok) {
    output.innerHTML = '<div class="empty-state error"><p>Analysis failed. Check the API server and input.</p></div>';
  } else {
    const result = (await response.json()) as Analysis;
    output.innerHTML = resultMarkup(result);
  }

  button.disabled = false;
  button.textContent = \`Run \${project.name}\`;
}

function render(project: ProjectPayload) {
  document.documentElement.style.setProperty("--accent", project.accent);
  document.documentElement.style.setProperty("--secondary", project.secondary);
  document.title = project.name;

  app.innerHTML = \`
    <div class="shell">
      <header class="topbar">
        <div>
          <span class="eyebrow">Rank \${project.rank} / Idea \${escapeHtml(project.ideaNo)}</span>
          <h1>\${escapeHtml(project.name)}</h1>
          <p>\${escapeHtml(project.tagline)}</p>
        </div>
        <div class="model-pill">
          <span>Gemini</span>
          <strong>\${escapeHtml(project.defaultModel)}</strong>
        </div>
      </header>

      <main class="workspace">
        <section class="panel input-panel">
          <div class="panel-heading">
            <h2>Evidence Intake</h2>
            <button class="ghost" type="button" id="sample-button">Load Sample</button>
          </div>
          <form id="analysis-form">
            <label>
              <span>Target</span>
              <input name="target" value="\${escapeHtml(project.sampleTarget)}" />
            </label>
            <label>
              <span>Context</span>
              <textarea name="context" rows="7">\${escapeHtml(project.sampleContext)}</textarea>
            </label>
            <label>
              <span>Signals</span>
              <textarea name="signals" rows="11">\${escapeHtml(project.sampleSignals)}</textarea>
            </label>
            <button id="run-button" type="submit">Run \${escapeHtml(project.name)}</button>
          </form>
        </section>

        <section class="panel result-panel">
          <div class="panel-heading">
            <h2>Agent Output</h2>
            <span class="status-chip">\${escapeHtml(project.positive)} / \${escapeHtml(project.caution)} / \${escapeHtml(project.negative)}</span>
          </div>
          <div id="result">\${resultMarkup()}</div>
        </section>

        <aside class="rail">
          <section>
            <h2>Focus</h2>
            <ul>\${list(project.focusAreas)}</ul>
          </section>
          <section>
            <h2>Metrics</h2>
            <ul>\${list(project.metrics)}</ul>
          </section>
          <section>
            <h2>Stack</h2>
            <ul>\${list(project.stack)}</ul>
          </section>
        </aside>
      </main>
    </div>\`;

  document.querySelector("#analysis-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    void postAnalysis(project);
  });

  document.querySelector("#sample-button")?.addEventListener("click", () => {
    const form = document.querySelector<HTMLFormElement>("#analysis-form");
    if (!form) return;
    (form.elements.namedItem("target") as HTMLInputElement).value = project.sampleTarget;
    (form.elements.namedItem("context") as HTMLTextAreaElement).value = project.sampleContext;
    (form.elements.namedItem("signals") as HTMLTextAreaElement).value = project.sampleSignals;
  });
}

async function boot() {
  const response = await fetch("/api/project");
  const project = (await response.json()) as ProjectPayload;
  render(project);
}

void boot().catch((error) => {
  app.innerHTML = \`<main class="fatal"><h1>Startup failed</h1><p>\${escapeHtml(String(error))}</p></main>\`;
});
`;
}

function stylesCss() {
  return `:root {
  --accent: #0f766e;
  --secondary: #d97706;
  --ink: #172126;
  --muted: #617179;
  --line: #d8e1e4;
  --paper: #f6f8f5;
  --panel: #ffffff;
  --danger: #b42318;
  font-family: Aptos, "Segoe UI", sans-serif;
  color: var(--ink);
  background: var(--paper);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    linear-gradient(90deg, rgba(23, 33, 38, 0.045) 1px, transparent 1px),
    linear-gradient(180deg, rgba(23, 33, 38, 0.045) 1px, transparent 1px),
    var(--paper);
  background-size: 32px 32px;
}

button,
input,
textarea {
  font: inherit;
}

button {
  border: 0;
  cursor: pointer;
}

button:disabled {
  cursor: progress;
  opacity: 0.65;
}

.shell {
  width: min(1480px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 24px 0 40px;
}

.topbar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: end;
  border-bottom: 3px solid var(--ink);
  padding-bottom: 20px;
}

.topbar h1 {
  margin: 6px 0 8px;
  font-size: clamp(2rem, 5vw, 4.8rem);
  line-height: 0.95;
  letter-spacing: 0;
}

.topbar p {
  max-width: 780px;
  margin: 0;
  color: var(--muted);
  font-size: 1.02rem;
}

.eyebrow {
  display: block;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.model-pill,
.status-chip,
.priority {
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--panel);
}

.model-pill {
  min-width: 230px;
  padding: 14px 16px;
  box-shadow: 6px 6px 0 var(--secondary);
}

.model-pill span,
.model-pill strong {
  display: block;
}

.model-pill strong {
  margin-top: 4px;
  overflow-wrap: anywhere;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(320px, 0.92fr) minmax(360px, 1.28fr) minmax(220px, 0.52fr);
  gap: 16px;
  margin-top: 18px;
  align-items: start;
}

.panel,
.rail section {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
}

.panel {
  min-height: 680px;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--line);
}

h2 {
  margin: 0;
  font-size: 0.94rem;
  letter-spacing: 0;
  text-transform: uppercase;
}

.ghost,
form button {
  min-height: 42px;
  border-radius: 6px;
  padding: 0 14px;
  font-weight: 800;
}

.ghost {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 9%, white);
}

form {
  display: grid;
  gap: 14px;
  padding: 16px;
}

label {
  display: grid;
  gap: 7px;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
}

input,
textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 12px;
  color: var(--ink);
  background: #fbfcfb;
  resize: vertical;
}

input:focus,
textarea:focus {
  outline: 3px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-color: var(--accent);
}

form button {
  color: white;
  background: var(--accent);
  box-shadow: 4px 4px 0 var(--ink);
}

.status-chip {
  padding: 7px 10px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
}

#result {
  padding: 16px;
}

.empty-state {
  display: grid;
  min-height: 560px;
  place-items: center;
  border: 1px dashed var(--line);
  border-radius: 8px;
  color: var(--muted);
}

.empty-state.error {
  color: var(--danger);
}

.decision-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.decision-strip > div {
  border-left: 4px solid var(--accent);
  background: #f8faf9;
  padding: 12px;
}

.decision-strip strong {
  display: block;
  margin-top: 4px;
  font-size: 1.18rem;
  overflow-wrap: anywhere;
}

.summary {
  margin: 16px 0;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: color-mix(in srgb, var(--secondary) 8%, white);
  line-height: 1.6;
}

.result-section,
.result-grid {
  margin-top: 16px;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.result-grid > div {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
}

.result-section h2,
.result-grid h2 {
  margin-bottom: 10px;
}

.evidence {
  display: grid;
  gap: 7px;
  margin-bottom: 12px;
}

.evidence-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.9rem;
}

.bar {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e8eef0;
}

.bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), var(--secondary));
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th,
td {
  border-bottom: 1px solid var(--line);
  padding: 10px 8px;
  text-align: left;
  vertical-align: top;
}

th {
  color: var(--muted);
  font-size: 0.75rem;
  text-transform: uppercase;
}

.priority {
  display: inline-block;
  min-width: 36px;
  padding: 4px 6px;
  color: var(--accent);
  font-weight: 900;
  text-align: center;
}

ul,
ol {
  margin: 0;
  padding-left: 18px;
  line-height: 1.55;
}

pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
  background: #111827;
  color: #f8fafc;
}

.rail {
  display: grid;
  gap: 12px;
}

.rail section {
  padding: 14px;
}

.rail h2 {
  margin-bottom: 10px;
  color: var(--accent);
}

.fatal {
  width: min(720px, calc(100vw - 32px));
  margin: 12vh auto;
  padding: 24px;
  background: white;
  border: 1px solid var(--line);
  border-radius: 8px;
}

@media (max-width: 1120px) {
  .workspace {
    grid-template-columns: 1fr 1fr;
  }

  .rail {
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 760px) {
  .shell {
    width: min(100vw - 20px, 720px);
    padding-top: 12px;
  }

  .topbar,
  .workspace,
  .rail,
  .result-grid,
  .decision-strip {
    grid-template-columns: 1fr;
  }

  .panel {
    min-height: auto;
  }

  .empty-state {
    min-height: 240px;
  }
}
`;
}

function viteEnvDts() {
  return `/// <reference types="vite/client" />
`;
}

function indexHtml(project) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${project.name}: ${project.tagline}" />
    <title>${project.name}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
}

function viteConfig() {
  return `import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
`;
}

function viteServerConfig() {
  return `import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: "src/server.ts",
    outDir: "dist/server",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: "server.js",
      },
    },
  },
});
`;
}

function tsconfig() {
  return json({
    compilerOptions: {
      target: "ES2022",
      useDefineForClassFields: true,
      module: "ESNext",
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      types: ["node"],
      skipLibCheck: true,
      moduleResolution: "Bundler",
      allowImportingTsExtensions: false,
      isolatedModules: true,
      moduleDetection: "force",
      noEmit: true,
      strict: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
    },
    include: ["src", "vite.config.ts", "vite.server.config.ts"],
  });
}

function envExample() {
  return `# Google AI Studio / Gemini API
GEMINI_API_KEY=

# The user request asks for Google Gemini Flash 3.1.
# Override this if your Google Cloud or AI Studio project exposes a different 3.1 Flash model ID.
GEMINI_MODEL=gemini-3.1-flash-lite

# Cloud Run injects PORT automatically. Local API defaults to 8080.
PORT=8080
`;
}

function markdownList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function readme(project) {
  const focusList = markdownList(project.focusAreas);
  const metricList = markdownList(project.metrics);
  const stackList = markdownList(project.stack);
  const valueList = markdownList([
    `人間の担当者は、曖昧な要約ではなく \`${project.positive}\` / \`${project.caution}\` / \`${project.negative}\` の具体的な判断を受け取れます。`,
    "判断理由が summary、risks、evidence、actions、automationPlan に分解されるため、レビューや引き継ぎで説明しやすくなります。",
    "Gemini API が使える本番モードと、APIキーなしでも動く deterministic fallback の両方を備えているため、デモや審査時の不確実性を下げられます。",
    "最初から Cloud Run に載せやすい構成にしているため、ハッカソン提出用URLから実運用プロトタイプまで発展させやすいです。",
  ]);

  return `# ${project.name}

${project.tagline}

## 概要

${project.name} は、DevOps x AI Agent Hackathon 向けの \`${project.role}\` です。${project.overview}

MVPでは、スコープを絞って次の体験を作ります。${project.mvp}

## ハッカソン上の位置づけ

- Rank: ${project.rank}
- Idea No: ${project.ideaNo}
- Role: ${project.role}
- Source: \`docs/01_hackathon/idea_recommendations_500_scored.md\`
- 判断ラベル: \`${project.positive}\` / \`${project.caution}\` / \`${project.negative}\`

## 解決する課題

現代のDevOpsチームには、判断に必要な情報自体は存在しています。しかし実際には、Pull Request、CIログ、Cloud Run revision、Cloud Logging、Monitoring、Runbook、障害対応メモ、リリース判断の会話などに分散しています。問題は「情報がないこと」ではなく、限られた時間の中で、それらを読み解いて次の一手に変えることです。

${project.name} は、その中でも次の運用判断にフォーカスします。

${focusList}

AIエージェントがない場合、これらの確認は「詳しい人がたまたまオンラインか」「Runbookが古くなっていないか」「レビュー担当者が文脈を覚えているか」に依存しがちです。このプロジェクトは、散らばった運用シグナルを、再現性のある判断ワークフローに変換します。

## なぜ必要なのか

\`${project.role}\` の仕事は影響範囲が大きく、ひとつの誤ったデプロイ判断、ロールバック判断、初動対応、確認漏れが、数時間の調査やユーザー信頼の低下につながります。チームには、次のような軽量な支援役が必要です。

- 雑多な運用情報を素早く読む
- 判断を \`${project.positive}\` / \`${project.caution}\` / \`${project.negative}\` のように明確化する
- 判断の根拠を提示する
- PRコメント、障害対応メモ、Runbook更新案など、人間がそのまま使える文面を作る
- リリースや障害対応ごとに判断基準がぶれないようにする

目的は運用担当者を置き換えることではありません。繰り返し発生する情報整理をAIに任せ、人間は最終判断、責任分担、コミュニケーションに集中できるようにすることです。

## 提供価値

${valueList}

## どのように動くのか

1. ユーザーが、PR URL、Cloud Run revision、障害名、Runbookパス、Feature Flag、音声文字起こしなどの対象を入力します。
2. CI結果、ログ、メトリクス差分、Runbook、スキーマ変更、問い合わせ、リリース制約などの文脈を貼り付けます。
3. Express API が Zod で入力を検証し、プロジェクト固有の Gemini プロンプトを組み立てます。
4. Gemini に、decision、confidence、summary、risks、actions、evidence、automationPlan、commentDraft を含む厳密なJSONを返させます。
5. フロントエンドは、判断、信頼度、根拠、次アクション、担当者、コメント案をダッシュボードとして表示します。
6. Gemini APIキーがない場合でも、 deterministic fallback により同じUIで判定フローを確認できます。

## エージェント設計

エージェントの人格は \`${project.role}\` です。プロンプトは、プロジェクトの目的と次のフォーカス領域に制約しています。

${focusList}

エージェントは常に次の構造化レスポンスを返します。

- \`decision\`: \`${project.positive}\` / \`${project.caution}\` / \`${project.negative}\` のいずれか
- \`confidence\`: 0から100の信頼度
- \`summary\`: 短い運用判断
- \`risks\`: 確認すべきリスク
- \`actions\`: owner と priority つきの次アクション
- \`evidence\`: ダッシュボードに表示する重み付き根拠
- \`automationPlan\`: 本番連携時に自動化できる手順
- \`commentDraft\`: PR、障害対応、Runbook、リリース判断に貼れる文面

## インフラ構成

\`\`\`text
Browser UI
  |
  | HTTPS
  v
Cloud Run service
  |
  | Express API: /api/project, /api/health, /api/analyze
  v
Gemini API via @google/genai
  |
  v
Structured decision JSON
\`\`\`

Cloud Run service の1コンテナで、Viteでビルドした静的フロントエンドと Express API の両方を配信します。サーバーは \`0.0.0.0\` で待ち受け、Cloud Run が注入する \`PORT\` を読み取るため、Cloud Run のコンテナ要件にそのまま合います。

## 技術選定

${stackList}
- Node.js 22: Cloud Run と相性がよく、現在のJavaScript実行環境として扱いやすい
- TypeScript 6: project data、server、UIを型でつなぎ、20個の実装を安定させる
- Vite 8: 小さく高速なフロントエンドビルドを実現する
- Express 5: ローカルでもCloud Runでも動かしやすいシンプルなHTTP APIを作る
- Zod 4: 入力とAIレスポンスのスキーマ検証に使う
- \`@google/genai\`: Gemini API 連携に使う
- Dockerfile: Cloud Run デプロイ時の再現性を高める

MVPは小さく保ちつつ、GitHub、Cloud Logging、Cloud Monitoring、BigQuery、Secret Manager、各サービスAPIへ拡張しやすい構成にしています。

## 入力と出力

### サンプル入力

- Target: \`${project.sampleTarget}\`
- Context: ${project.sampleContext}
- Signals: ${project.sampleSignals}

### 判断指標

${metricList}

### 期待される出力

アプリは次の要素を含む判断ダッシュボードを返します。

- 最上位の判断
- 信頼度スコア
- 根拠と重み
- リスク一覧
- 優先度つきアクション
- 自動化プラン
- そのまま貼れるコメント案

## ローカル開発

\`\`\`bash
npm install
cp .env.example .env
npm run dev
\`\`\`

ターミナルに表示される Vite URL を開きます。フロントエンドは \`/api\` をローカルの Express API \`PORT=8080\` にプロキシします。

## ビルドと起動

\`\`\`bash
npm run build
npm start
\`\`\`

本番サーバーは \`dist/client\` の静的ファイルを配信し、\`dist/server/server.js\` からAPIを提供します。

## 環境変数

詳細は \`docs/environment.md\` を参照してください。

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| \`GEMINI_API_KEY\` | live AIでは必須 | empty | Google Gemini APIキー |
| \`GEMINI_MODEL\` | 任意 | \`gemini-3.1-flash-lite\` | Gemini Flash 3.1のモデルID。利用環境に別IDがある場合は差し替えます |
| \`PORT\` | 任意 | \`8080\` | HTTP port。Cloud Runでは自動注入されます |

## Cloud Run デプロイ

\`\`\`bash
gcloud run deploy ${project.packageName} \\
  --source . \\
  --region asia-northeast1 \\
  --allow-unauthenticated \\
  --set-env-vars GEMINI_MODEL=gemini-3.1-flash-lite
\`\`\`

本番運用では、\`GEMINI_API_KEY\` を Secret Manager に保存し、\`--set-secrets\` で渡す構成を推奨します。

## デモシナリオ

1. アプリを開き、サンプル入力を読み込んだ状態にします。
2. Runボタンで分析を実行します。
3. 生の運用情報が、どのように \`${project.positive}\` / \`${project.caution}\` / \`${project.negative}\` の判断へ変換されるか説明します。
4. evidence bar、リスク、action owner を見せます。
5. 生成された comment draft を、PR、障害対応チャンネル、Runbook、リリースノートなどに貼る流れを見せます。

## 本番拡張アイデア

- GitHub APIから実PR、差分、CI結果を取得する
- Cloud LoggingからCloud Run revisionごとのログを読む
- Cloud Monitoringからlatency、error rate、saturation、ビジネスKPIを取得する
- 判断履歴をBigQueryに保存し、リリースや障害対応の振り返りに使う
- Slack、Google Chat、GitHub commentへの投稿を追加する
- 自動実行してよい判断と人間承認が必要な判断をポリシーで分ける

## リポジトリ構成

\`\`\`text
.
├── docs/environment.md
├── src/agent.ts
├── src/main.ts
├── src/project.ts
├── src/server.ts
├── src/styles.css
├── Dockerfile
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vite.server.config.ts
\`\`\`
`;
}

function envDoc(project) {
  return `# Environment Setup: ${project.name}

## Required

- Node.js 22 or newer
- npm 10 or newer
- Gemini API key in \`GEMINI_API_KEY\`

## Variables

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| \`GEMINI_API_KEY\` | Yes for live AI | empty | Google Gemini API key. |
| \`GEMINI_MODEL\` | No | \`gemini-3.1-flash-lite\` | Gemini Flash 3.1 model ID. Override when your Google project exposes a different 3.1 Flash ID. |
| \`PORT\` | No | \`8080\` | HTTP port. Cloud Run injects this for services. |

## Google Cloud Notes

- Deploy as a Cloud Run service.
- The server listens on \`0.0.0.0\` and reads \`PORT\`, matching the Cloud Run container contract.
- Store \`GEMINI_API_KEY\` in Secret Manager for production deployment.

## Project-Specific Inputs

- Target: ${project.sampleTarget}
- Focus: ${project.focusAreas.join(", ")}
- Decisions: ${project.positive} / ${project.caution} / ${project.negative}
`;
}

function dockerfile() {
  return `FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "start"]
`;
}

function dockerignore() {
  return `node_modules
dist
.env
.DS_Store
npm-debug.log
`;
}

function rootReadme() {
  const rows = projects
    .map((project) => `| ${project.rank} | ${project.ideaNo} | [${project.name}](./${project.slug}/) | ${project.packageName} |`)
    .join("\n");

  return `# DevOps x AI Agent Hackathon Outputs

This folder contains 20 independent projects generated from the recalculated top 20 ideas in \`docs/01_hackathon/idea_recommendations_500_scored.md\`.

| Rank | No | Project | Package |
| ---: | ---: | --- | --- |
${rows}

Each project has its own \`package.json\`, \`.env.example\`, \`Dockerfile\`, source tree, and environment document.

## Quick Start

\`\`\`bash
cd outputs/01-shipguard-ai
npm install
cp .env.example .env
npm run dev
\`\`\`

## Shared Environment

See \`ENVIRONMENT_SETUP.md\` for common Gemini and Cloud Run setup. See each project's \`docs/environment.md\` for project-specific details.
`;
}

function environmentSetup() {
  return `# Shared Environment Setup

## Runtime

- Node.js: 22 or newer
- npm: 10 or newer
- Deployment target: Cloud Run service

Cloud Run requires the ingress container to listen on \`0.0.0.0\` and the \`PORT\` environment variable. All 20 apps implement that contract.

## Gemini

All apps use \`@google/genai\` and default to:

\`\`\`bash
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_API_KEY=your_api_key
\`\`\`

If your Google AI Studio or Vertex AI project exposes a preview or region-specific Gemini Flash 3.1 model ID, set \`GEMINI_MODEL\` to that ID without changing code.

The apps also accept \`GOOGLE_API_KEY\` and \`GOOGLE_GENERATIVE_AI_API_KEY\` for local compatibility.

## Local Workflow

\`\`\`bash
cd outputs/<project-folder>
npm install
cp .env.example .env
npm run dev
\`\`\`

\`npm run dev\` starts:

- Express API on \`http://localhost:8080\`
- Vite web UI on the printed Vite URL with \`/api\` proxied to port 8080

## Production Workflow

\`\`\`bash
cd outputs/<project-folder>
npm install
npm run build
npm start
\`\`\`

## Cloud Run Deployment

\`\`\`bash
gcloud run deploy <service-name> \\
  --source . \\
  --region asia-northeast1 \\
  --allow-unauthenticated \\
  --set-env-vars GEMINI_MODEL=gemini-3.1-flash-lite
\`\`\`

For production, store \`GEMINI_API_KEY\` in Secret Manager and attach it with \`--set-secrets\`.
`;
}

function packageVersionsDoc() {
  return `# Package Versions

Checked with \`npm view <package> version\` on 2026-05-13.

## Dependencies

| Package | Version |
| --- | ---: |
${Object.entries(versions.dependencies)
  .map(([name, version]) => `| \`${name}\` | \`${version}\` |`)
  .join("\n")}

## Development Dependencies

| Package | Version |
| --- | ---: |
${Object.entries(versions.devDependencies)
  .map(([name, version]) => `| \`${name}\` | \`${version}\` |`)
  .join("\n")}

## API Sources Used

- Gemini API JavaScript usage: https://ai.google.dev/gemini-api/docs
- Cloud Run container runtime contract: https://docs.cloud.google.com/run/docs/container-contract
- Cloud Run Node.js runtime support: https://docs.cloud.google.com/run/docs/runtimes/nodejs
`;
}

function manifest() {
  return json({
    generatedAt: "2026-05-13",
    source: "docs/01_hackathon/idea_recommendations_500_scored.md recalculated top 20",
    packageVersions: versions,
    projects: projects.map((project) => ({
      rank: project.rank,
      ideaNo: project.ideaNo,
      name: project.name,
      slug: project.slug,
      packageName: project.packageName,
      modelDefault: "gemini-3.1-flash-lite",
      path: `outputs/${project.slug}`,
    })),
  });
}

mkdirSync(outputRoot, { recursive: true });
writeText(join(outputRoot, "README.md"), rootReadme());
writeText(join(outputRoot, "ENVIRONMENT_SETUP.md"), environmentSetup());
writeText(join(outputRoot, "PACKAGE_VERSIONS.md"), packageVersionsDoc());
writeText(join(outputRoot, "manifest.json"), manifest());

for (const project of projects) {
  const projectDir = join(outputRoot, project.slug);
  mkdirSync(join(projectDir, "src"), { recursive: true });
  mkdirSync(join(projectDir, "docs"), { recursive: true });

  writeText(join(projectDir, "package.json"), packageJson(project));
  writeText(join(projectDir, "tsconfig.json"), tsconfig());
  writeText(join(projectDir, "vite.config.ts"), viteConfig());
  writeText(join(projectDir, "vite.server.config.ts"), viteServerConfig());
  writeText(join(projectDir, "index.html"), indexHtml(project));
  writeText(join(projectDir, ".env.example"), envExample());
  writeText(join(projectDir, "README.md"), readme(project));
  writeText(join(projectDir, "docs/environment.md"), envDoc(project));
  writeText(join(projectDir, "Dockerfile"), dockerfile());
  writeText(join(projectDir, ".dockerignore"), dockerignore());
  writeText(join(projectDir, "src/project.ts"), projectTs(project));
  writeText(join(projectDir, "src/agent.ts"), agentTs());
  writeText(join(projectDir, "src/server.ts"), serverTs());
  writeText(join(projectDir, "src/main.ts"), mainTs());
  writeText(join(projectDir, "src/styles.css"), stylesCss());
  writeText(join(projectDir, "src/vite-env.d.ts"), viteEnvDts());
}

console.log(`Generated ${projects.length} projects in ${outputRoot}`);
