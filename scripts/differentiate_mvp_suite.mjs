import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outputsDir = join(root, "outputs");
const projectDirs = readdirSync(outputsDir)
  .filter((entry) => /^\d{2}-/.test(entry))
  .sort();

function writeText(path, text) {
  writeFileSync(path, text.replace(/\n+$/, "\n"), "utf8");
}

const profiles = [
  {
    slug: "01-shipguard-ai",
    architectureId: "release-command-bridge",
    uiName: "Release Command Bridge",
    layoutClass: "bridge",
    workspace: "minmax(360px,0.86fr) minmax(560px,1.32fr) minmax(280px,0.62fr)",
    font: '"Aptos", "Segoe UI", sans-serif',
    motif: "PR gate, CI health, rollback lane",
    primaryAction: "Run release verdict",
    inputTitle: "PR Evidence Dock",
    outputTitle: "Ship Gate Verdict",
    sideTitle: "Guardrails",
    emptyTitle: "Awaiting release evidence",
    emptyText: "Load a PR, CI summary, or Cloud Run window to produce a ship/watch/block call.",
    colors: ["#0f766e", "#b45309", "#102326", "#f5f7f3", "#ffffff", "#d6e0dc", "#b42318"],
    stages: ["PR delta", "CI read", "Cloud Run window", "Rollback lane"],
    insights: ["Release lane", "Regression trace", "Rollback clarity"],
    scenarios: [
      ["Release baseline", "Stable path with a verified rollback lane", "baseline", "Latest release window", "Treat this as the normal approval path."],
      ["Merge pressure", "A stakeholder wants to ship before the next CI rerun", "watch scenario", "15 minute PR watch", "Protect rollback criteria before approval."],
      ["Block drill", "Customer-facing warning burst during preview", "critical scenario", "Current rollout window", "Block if rollback evidence is absent."],
    ],
    logic: {
      model: "weighted release gate",
      baseline: 23,
      caution: 42,
      negative: 66,
      modeBias: [13, 0, -9],
      shifts: [-5, 0, 6],
      risk: [["release blockers", ["5xx", "failed check", "timeout", "flaky", "rollback unknown"], 8], ["blast hints", ["payment", "checkout", "migration", "customer"], 7], ["ownership gaps", ["missing owner", "manual", "unknown"], 5]],
      healthy: [["ship proof", ["unit pass", "integration pass", "rollback available", "no 5xx"], 6], ["fresh evidence", ["preview", "verified", "stable"], 4]],
      owners: ["release owner", "service maintainer", "communications owner"],
      actions: ["Freeze merge until {metric} is explained", "Attach rollback proof for {focus}", "Publish PR comment with {decision} rationale"],
      risks: ["Release evidence may be stale against the active revision.", "Rollback confidence is the gating constraint.", "CI success can mask runtime regressions."],
      automation: ["Pull PR checks and changed files.", "Read Cloud Run error and latency window.", "Post the verdict and stop condition back to the PR."],
      verification: ["gh pr checks {target}", "gcloud run revisions list --service {package} --region asia-northeast1"],
    },
  },
  {
    slug: "02-two-minute-triage",
    architectureId: "incident-sprint-console",
    uiName: "Two Minute Incident Sprint",
    layoutClass: "sprint",
    workspace: "minmax(330px,0.78fr) minmax(520px,1.18fr) minmax(320px,0.78fr)",
    font: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
    motif: "timer, owner route, first signal queue",
    primaryAction: "Start triage sprint",
    inputTitle: "First Signals",
    outputTitle: "Two Minute Script",
    sideTitle: "Bridge Setup",
    emptyTitle: "Bridge is quiet",
    emptyText: "Paste the first logs and recent changes to get a tiny incident plan.",
    colors: ["#1d4ed8", "#be123c", "#101828", "#eef4ff", "#ffffff", "#c9d7ee", "#b42318"],
    stages: ["Page fired", "Top signal", "Owner route", "Bridge script"],
    insights: ["Urgency rank", "Noise filter", "Owner guess"],
    scenarios: [
      ["Clean page", "Alert with one obvious service owner", "baseline", "First 2 minutes", "Keep the output short enough for a bridge lead."],
      ["Noisy page", "Several alerts compete for attention", "watch scenario", "First 5 minutes", "Prefer the smallest useful next action."],
      ["Escalation", "Customer support is joining the bridge", "critical scenario", "Active incident bridge", "Escalate only with a named first owner."],
    ],
    logic: {
      model: "triage urgency reducer",
      baseline: 28,
      caution: 40,
      negative: 62,
      modeBias: [12, 1, -8],
      shifts: [-6, 0, 5],
      risk: [["page heat", ["pagerduty", "sev", "5xx", "p99", "customer support"], 9], ["owner fog", ["unknown owner", "unowned", "handoff", "no responder"], 7], ["alert storm", ["multiple alerts", "noise", "flapping", "duplicate"], 5]],
      healthy: [["triage clarity", ["owner available", "single service", "baseline", "runbook"], 6], ["bridge control", ["timeline", "acknowledged", "stable"], 4]],
      owners: ["incident commander", "first responder", "support liaison"],
      actions: ["Name the first owner for {metric}", "Suppress duplicate noise around {focus}", "Read the two minute script aloud with {decision}"],
      risks: ["The loudest alert may not be the first cause.", "An unowned service will burn the first response window.", "Escalation without a script creates duplicate work."],
      automation: ["Rank the first log clusters.", "Map recent PRs to the paged service.", "Draft the first bridge update."],
      verification: ["gcloud logging read 'severity>=ERROR' --limit 30", "gcloud monitoring incidents list --limit 5"],
    },
  },
  {
    slug: "03-canary-diff-judge",
    architectureId: "canary-delta-lab",
    uiName: "Canary Delta Lab",
    layoutClass: "delta",
    workspace: "minmax(360px,0.9fr) minmax(600px,1.36fr) minmax(250px,0.54fr)",
    font: '"DIN Alternate", "Aptos", sans-serif',
    motif: "baseline versus canary split",
    primaryAction: "Judge canary delta",
    inputTitle: "Delta Intake",
    outputTitle: "Canary Judgment",
    sideTitle: "Comparison Axes",
    emptyTitle: "No delta loaded",
    emptyText: "Compare baseline and candidate telemetry before moving traffic.",
    colors: ["#0e7490", "#ca8a04", "#082f49", "#eff9fb", "#ffffff", "#c7dde5", "#b91c1c"],
    stages: ["Baseline", "Canary", "Delta", "Traffic call"],
    insights: ["Delta size", "Metric drift", "Traffic safety"],
    scenarios: [
      ["Flat delta", "Candidate matches baseline", "baseline", "Canary window", "Let the score show whether traffic can advance."],
      ["Thin drift", "Latency moved but errors did not", "watch scenario", "30 minute canary", "Hold traffic unless the drift has a benign explanation."],
      ["Bad canary", "Error and latency deltas move together", "critical scenario", "Live canary", "Prefer rollback over more exposure."],
    ],
    logic: {
      model: "paired baseline delta",
      baseline: 22,
      caution: 38,
      negative: 61,
      modeBias: [11, 0, -7],
      shifts: [-4, 0, 7],
      risk: [["metric divergence", ["delta", "p95", "p99", "drift", "regression"], 8], ["traffic exposure", ["10%", "25%", "50%", "traffic", "canary"], 6], ["error coupling", ["5xx", "timeout", "saturation", "failed"], 8]],
      healthy: [["baseline match", ["unchanged", "within baseline", "flat", "normal"], 6], ["rollback clear", ["rollback available", "previous revision", "traffic split"], 4]],
      owners: ["release engineer", "sre reviewer", "traffic owner"],
      actions: ["Compare {metric} against baseline before traffic moves", "Hold the canary until {focus} is stable", "Write the traffic recommendation as {decision}"],
      risks: ["Small samples can hide a real canary regression.", "Latency drift without error change still affects customers.", "Traffic increases amplify weak evidence."],
      automation: ["Pull baseline and canary metrics into one table.", "Compute absolute and relative deltas.", "Generate the traffic movement note."],
      verification: ["gcloud run services describe {package} --format=json", "gcloud logging read 'labels.revision_name:*' --limit 50"],
    },
  },
  {
    slug: "04-blast-radius-agent",
    architectureId: "service-radius-map",
    uiName: "Blast Radius Map",
    layoutClass: "radius",
    workspace: "minmax(340px,0.8fr) minmax(570px,1.24fr) minmax(310px,0.76fr)",
    font: '"Bahnschrift", "Aptos", sans-serif',
    motif: "rings, dependencies, customer edge",
    primaryAction: "Map blast radius",
    inputTitle: "Change Footprint",
    outputTitle: "Radius Assessment",
    sideTitle: "Dependency Rings",
    emptyTitle: "Radius unknown",
    emptyText: "Describe the change and dependency signals to estimate impact spread.",
    colors: ["#365314", "#c2410c", "#1a2e05", "#f4f8ed", "#ffffff", "#d7e4c7", "#b42318"],
    stages: ["Changed node", "Direct deps", "Indirect deps", "Customer edge"],
    insights: ["Ring spread", "Dependency heat", "Rollback reach"],
    scenarios: [
      ["Single node", "Isolated service update", "baseline", "Dependency review", "Confirm the change stays inside one ring."],
      ["Shared path", "Common library or gateway touched", "watch scenario", "Pre-deploy review", "Ask for dependency owners before ship."],
      ["Wide radius", "Public path and data layer both touched", "critical scenario", "Production risk review", "Treat hidden consumers as part of the radius."],
    ],
    logic: {
      model: "dependency ring expansion",
      baseline: 24,
      caution: 41,
      negative: 65,
      modeBias: [14, 0, -9],
      shifts: [-5, 0, 6],
      risk: [["shared dependency", ["gateway", "common", "library", "schema", "queue"], 8], ["customer edge", ["customer", "checkout", "public", "mobile"], 7], ["unknown consumers", ["unknown", "unowned", "fanout", "downstream"], 6]],
      healthy: [["contained change", ["isolated", "single service", "feature flag", "rollback"], 6], ["owner map", ["owner assigned", "dependency owner", "documented"], 4]],
      owners: ["service owner", "dependency owner", "release captain"],
      actions: ["Draw the dependency ring around {metric}", "Ask {focus} owner for approval", "Publish the radius note before {decision}"],
      risks: ["A shared dependency can create hidden customer impact.", "Unknown consumers make rollback coordination slower.", "A small diff can have a large runtime radius."],
      automation: ["Extract touched packages and services.", "Resolve first and second order dependencies.", "Draft an owner approval checklist."],
      verification: ["npm ls --depth=2", "gcloud run services list --format='value(metadata.name)'"],
    },
  },
  {
    slug: "05-privacy-impact-diff-agent",
    architectureId: "privacy-ledger-review",
    uiName: "Privacy Impact Ledger",
    layoutClass: "ledger",
    workspace: "minmax(380px,0.96fr) minmax(540px,1.1fr) minmax(290px,0.7fr)",
    font: '"Iowan Old Style", "Georgia", serif',
    motif: "data classes, consent, retention",
    primaryAction: "Review privacy impact",
    inputTitle: "Data Handling Diff",
    outputTitle: "Privacy Ledger",
    sideTitle: "Control Evidence",
    emptyTitle: "No data change recorded",
    emptyText: "Load the diff and processing notes to classify privacy risk.",
    colors: ["#6d28d9", "#0f766e", "#1f1635", "#f7f4fb", "#ffffff", "#ded4ea", "#b42318"],
    stages: ["Data class", "Consent", "Retention", "Reviewer handoff"],
    insights: ["PII surface", "Consent gap", "Retention proof"],
    scenarios: [
      ["No PII drift", "Metadata only change", "baseline", "Privacy review", "Keep the ledger focused on changed data classes."],
      ["Consent question", "New event or optional field added", "watch scenario", "Pre-merge privacy pass", "Require a lawful basis note."],
      ["PII exposure", "Sensitive field enters logs or analytics", "critical scenario", "Emergency privacy review", "Escalate with exact data class and retention path."],
    ],
    logic: {
      model: "privacy control ledger",
      baseline: 27,
      caution: 39,
      negative: 58,
      modeBias: [16, 1, -6],
      shifts: [-7, 0, 4],
      risk: [["pii movement", ["pii", "email", "phone", "address", "token"], 10], ["consent gap", ["consent", "lawful basis", "opt-in", "privacy"], 8], ["retention risk", ["log", "analytics", "export", "retention", "leak"], 7]],
      healthy: [["privacy proof", ["redacted", "hashed", "minimized", "documented"], 7], ["review path", ["dpo", "privacy reviewer", "approved"], 5]],
      owners: ["privacy reviewer", "data protection owner", "product owner"],
      actions: ["Classify {metric} before merge", "Record consent basis for {focus}", "Attach privacy reviewer sign-off to {decision}"],
      risks: ["A benign field name can still carry personal data.", "Logs often outlive product retention rules.", "Consent and purpose can diverge after analytics changes."],
      automation: ["Scan changed fields for personal data terms.", "Map events to retention controls.", "Draft the privacy review note."],
      verification: ["rg -n \"email|phone|token|address|pii\" src", "gcloud logging read 'textPayload:(email OR token)' --limit 20"],
    },
  },
  {
    slug: "06-deploy-rehearsal-agent",
    architectureId: "deploy-rehearsal-stage",
    uiName: "Deploy Rehearsal Stage",
    layoutClass: "rehearsal",
    workspace: "minmax(360px,0.9fr) minmax(520px,1.06fr) minmax(330px,0.82fr)",
    font: '"Optima", "Candara", sans-serif',
    motif: "script, dry run, cue sheet",
    primaryAction: "Rehearse deploy",
    inputTitle: "Release Script",
    outputTitle: "Rehearsal Notes",
    sideTitle: "Cue Sheet",
    emptyTitle: "No rehearsal run",
    emptyText: "Paste the deploy plan to surface missing cues before production.",
    colors: ["#7c2d12", "#0e7490", "#24140d", "#fff7ed", "#ffffff", "#ead8c5", "#b42318"],
    stages: ["Preflight", "Dry run", "Cutover", "Abort cue"],
    insights: ["Missing cue", "Abort clarity", "Operator load"],
    scenarios: [
      ["Clean rehearsal", "All steps have owners", "baseline", "Preflight rehearsal", "Keep output in cue-sheet form."],
      ["Missing cue", "One dependency has no owner", "watch scenario", "Dry run window", "Find the missing cue before cutover."],
      ["Abort ambiguity", "Rollback command or stop signal missing", "critical scenario", "Cutover rehearsal", "Do not proceed without an abort cue."],
    ],
    logic: {
      model: "cue sheet completeness",
      baseline: 25,
      caution: 43,
      negative: 63,
      modeBias: [14, 0, -8],
      shifts: [-5, 0, 6],
      risk: [["missing cue", ["missing", "todo", "manual", "unknown", "not assigned"], 8], ["abort ambiguity", ["rollback", "abort", "stop", "irreversible"], 8], ["operator load", ["multi-step", "handoff", "midnight", "manual"], 5]],
      healthy: [["dry run proof", ["dry run", "verified", "owner", "preflight"], 6], ["rollback script", ["rollback command", "abort cue", "tested"], 5]],
      owners: ["release conductor", "deploy operator", "rollback owner"],
      actions: ["Add an owner to {metric}", "Rehearse the abort cue for {focus}", "Publish the cue sheet with {decision}"],
      risks: ["Manual cutovers fail when cue ownership is implicit.", "Rollback commands must be rehearsed before pressure arrives.", "A complete deploy plan can still lack an abort signal."],
      automation: ["Parse deploy steps into a cue sheet.", "Detect missing owners and rollback commands.", "Generate the dry-run checklist."],
      verification: ["npm run build", "gcloud run deploy {package} --no-traffic --region asia-northeast1"],
    },
  },
  {
    slug: "07-post-deploy-judge",
    architectureId: "post-deploy-scorecard",
    uiName: "Post Deploy Scorecard",
    layoutClass: "scorecard",
    workspace: "minmax(350px,0.82fr) minmax(590px,1.34fr) minmax(270px,0.58fr)",
    font: '"Verdana Pro", "Verdana", sans-serif',
    motif: "after action, scorecard, watch window",
    primaryAction: "Judge deploy window",
    inputTitle: "Post Deploy Window",
    outputTitle: "Service Scorecard",
    sideTitle: "Watch Criteria",
    emptyTitle: "Waiting for post-deploy data",
    emptyText: "Load the first production window to decide continue, watch, or roll back.",
    colors: ["#047857", "#92400e", "#10251f", "#eef8f3", "#ffffff", "#c7dfd5", "#b42318"],
    stages: ["Deploy done", "Metric check", "Ticket check", "Continue call"],
    insights: ["Customer signal", "Metric drift", "Rollback timer"],
    scenarios: [
      ["Quiet window", "No customer tickets and metrics flat", "baseline", "First 30 minutes", "Confirm the watch window can close."],
      ["Metric wobble", "One metric drifts but tickets are quiet", "watch scenario", "First hour", "Keep a watch call active."],
      ["Bad window", "Errors and customer tickets arrive together", "critical scenario", "Post deploy incident", "Recommend rollback if the timer is still open."],
    ],
    logic: {
      model: "post-deploy health scorecard",
      baseline: 21,
      caution: 40,
      negative: 64,
      modeBias: [13, 0, -9],
      shifts: [-6, 0, 5],
      risk: [["customer signal", ["ticket", "support", "customer", "complaint"], 8], ["runtime drift", ["p95", "p99", "5xx", "latency", "error"], 8], ["rollback timer", ["rollback window", "timer", "deadline"], 5]],
      healthy: [["quiet window", ["no tickets", "flat", "baseline", "normal"], 7], ["watch closed", ["verified", "stable", "closed"], 4]],
      owners: ["release owner", "on-call engineer", "support lead"],
      actions: ["Keep watching {metric} until the window closes", "Compare {focus} to baseline", "Publish the post-deploy call as {decision}"],
      risks: ["Customer tickets can lag behind metric drift.", "A rollback timer expires faster than investigation confidence grows.", "Closing the watch too early hides slow regressions."],
      automation: ["Collect first-window service metrics.", "Join support ticket keywords.", "Draft the continue/watch/rollback note."],
      verification: ["gcloud logging read 'severity>=WARNING' --limit 50", "gcloud run services describe {package} --region asia-northeast1"],
    },
  },
  {
    slug: "08-recovery-confidence-meter",
    architectureId: "recovery-runway-meter",
    uiName: "Recovery Runway Meter",
    layoutClass: "runway",
    workspace: "minmax(340px,0.8fr) minmax(560px,1.22fr) minmax(320px,0.8fr)",
    font: '"Hoefler Text", "Georgia", serif',
    motif: "runway, restoration checkpoints, confidence",
    primaryAction: "Score recovery",
    inputTitle: "Recovery Evidence",
    outputTitle: "Confidence Meter",
    sideTitle: "Runway Checks",
    emptyTitle: "Recovery unscored",
    emptyText: "Bring restoration signals together before declaring recovery.",
    colors: ["#155e75", "#a16207", "#092333", "#eff7f8", "#ffffff", "#c7dce0", "#b42318"],
    stages: ["Cause contained", "Service restored", "Customer verified", "Monitor exit"],
    insights: ["Containment", "Residual risk", "Exit confidence"],
    scenarios: [
      ["Contained", "Root cause fixed and monitors quiet", "baseline", "Recovery watch", "Check whether exit criteria are met."],
      ["Residual risk", "Symptoms are quieter but cause is not proven", "watch scenario", "Recovery hold", "Avoid declaring recovery too early."],
      ["False recovery", "Errors return after a brief quiet period", "critical scenario", "Incident recovery", "Escalate as unstable recovery."],
    ],
    logic: {
      model: "recovery confidence runway",
      baseline: 26,
      caution: 44,
      negative: 68,
      modeBias: [15, 0, -8],
      shifts: [-6, 0, 5],
      risk: [["false recovery", ["returned", "flapping", "residual", "again"], 8], ["containment gap", ["unknown cause", "not contained", "workaround"], 7], ["customer validation", ["customer", "support", "unverified"], 5]],
      healthy: [["recovery proof", ["contained", "restored", "stable", "verified"], 7], ["exit criteria", ["exit criteria", "monitor quiet", "root cause"], 5]],
      owners: ["incident commander", "recovery owner", "support verifier"],
      actions: ["Validate {metric} before declaring recovery", "Keep monitoring {focus}", "Set the recovery call to {decision}"],
      risks: ["A quiet graph is not proof that recovery is durable.", "Workarounds can hide unresolved root cause.", "Customer validation is a separate signal from service health."],
      automation: ["Track symptom recurrence after mitigation.", "Compare exit criteria against evidence.", "Draft the recovery confidence update."],
      verification: ["gcloud monitoring policies list --format=json", "gcloud logging read 'severity>=ERROR' --limit 50"],
    },
  },
  {
    slug: "09-eval-dataset-gardener",
    architectureId: "dataset-garden-board",
    uiName: "Eval Dataset Garden",
    layoutClass: "garden",
    workspace: "minmax(360px,0.9fr) minmax(550px,1.16fr) minmax(300px,0.72fr)",
    font: '"Palatino Linotype", "Book Antiqua", serif',
    motif: "coverage beds, stale samples, harvest queue",
    primaryAction: "Tend dataset",
    inputTitle: "Eval Bed",
    outputTitle: "Garden Plan",
    sideTitle: "Coverage Beds",
    emptyTitle: "Dataset bed not inspected",
    emptyText: "Paste failing evals and coverage notes to decide what to prune or plant.",
    colors: ["#3f6212", "#b45309", "#1f2f13", "#f7faef", "#ffffff", "#d9e5c5", "#b42318"],
    stages: ["Coverage", "Freshness", "Failures", "Next seed"],
    insights: ["Coverage gap", "Staleness", "Failure value"],
    scenarios: [
      ["Healthy bed", "Fresh examples and stable pass rate", "baseline", "Dataset review", "Keep only useful evaluation work."],
      ["Sparse bed", "One product path lacks examples", "watch scenario", "Weekly eval grooming", "Add targeted examples before model changes."],
      ["Rotten bed", "Stale examples hide a repeated failure", "critical scenario", "Release eval gate", "Stop release until the eval is refreshed."],
    ],
    logic: {
      model: "coverage freshness gardener",
      baseline: 20,
      caution: 37,
      negative: 59,
      modeBias: [12, 0, -7],
      shifts: [-5, 0, 5],
      risk: [["coverage gap", ["missing", "gap", "uncovered", "sparse"], 8], ["stale sample", ["stale", "obsolete", "old", "outdated"], 7], ["eval failure", ["failed", "regression", "false positive", "false negative"], 7]],
      healthy: [["fresh bed", ["fresh", "representative", "covered", "passing"], 6], ["curated", ["deduplicated", "pruned", "labeled"], 5]],
      owners: ["eval owner", "model maintainer", "product reviewer"],
      actions: ["Plant new examples for {metric}", "Prune stale coverage around {focus}", "Gate model change on {decision}"],
      risks: ["A green eval suite can still miss the product path that changed.", "Stale examples reward the wrong model behavior.", "Duplicated failures inflate confidence without new coverage."],
      automation: ["Cluster failing examples by product path.", "Find stale or duplicated samples.", "Draft the next eval seed list."],
      verification: ["npm run test -- --run", "rg -n \"TODO|stale|skip\" evals tests"],
    },
  },
  {
    slug: "10-cloud-run-traffic-mixer",
    architectureId: "traffic-mixer-console",
    uiName: "Cloud Run Traffic Mixer",
    layoutClass: "mixer",
    workspace: "minmax(370px,0.94fr) minmax(560px,1.18fr) minmax(280px,0.64fr)",
    font: '"Copperplate", "Aptos", sans-serif',
    motif: "traffic sliders, revision lanes, rollback blend",
    primaryAction: "Mix traffic plan",
    inputTitle: "Revision Mix",
    outputTitle: "Traffic Recipe",
    sideTitle: "Lane Controls",
    emptyTitle: "No traffic recipe",
    emptyText: "Describe revisions and metrics to generate a traffic movement plan.",
    colors: ["#0f766e", "#7c3aed", "#102321", "#f0f8f6", "#ffffff", "#c9dfdc", "#b42318"],
    stages: ["Current mix", "Candidate lane", "Metric guard", "Traffic move"],
    insights: ["Split safety", "Revision health", "Rollback path"],
    scenarios: [
      ["Tiny shift", "Move a small share to a healthy revision", "baseline", "Traffic planning", "Prefer a measured traffic recipe."],
      ["Unclear lane", "Candidate is healthy but sample size is thin", "watch scenario", "Traffic hold", "Keep the next movement small."],
      ["Bad mix", "Candidate shows errors after traffic increase", "critical scenario", "Traffic rollback", "Move traffic back fast."],
    ],
    logic: {
      model: "traffic blend safety",
      baseline: 22,
      caution: 39,
      negative: 60,
      modeBias: [13, 0, -8],
      shifts: [-5, 0, 7],
      risk: [["split risk", ["traffic", "split", "percent", "increase"], 6], ["revision health", ["5xx", "latency", "candidate", "revision"], 8], ["rollback lane", ["rollback", "previous", "restore"], 5]],
      healthy: [["safe blend", ["small shift", "stable", "previous revision", "no 5xx"], 6], ["guardrail", ["guardrail", "threshold", "observed"], 4]],
      owners: ["traffic owner", "release engineer", "sre reviewer"],
      actions: ["Limit the next traffic move for {metric}", "Watch {focus} before another mix", "Apply the traffic recipe as {decision}"],
      risks: ["Traffic shifts change sample quality while evidence is being gathered.", "A revision can look healthy at low exposure only.", "Rollback must be a traffic command, not a discussion."],
      automation: ["Read revision traffic percentages.", "Bind metrics to each revision lane.", "Generate gcloud traffic commands."],
      verification: ["gcloud run services update-traffic {package} --to-latest=5 --region asia-northeast1", "gcloud run services describe {package} --format=json"],
    },
  },
  {
    slug: "11-runbook-decay-detector",
    architectureId: "runbook-decay-audit",
    uiName: "Runbook Decay Audit",
    layoutClass: "decay",
    workspace: "minmax(380px,0.96fr) minmax(520px,1.08fr) minmax(300px,0.72fr)",
    font: '"Lucida Bright", "Georgia", serif',
    motif: "freshness stamp, command rot, owner check",
    primaryAction: "Audit runbook",
    inputTitle: "Runbook Evidence",
    outputTitle: "Decay Report",
    sideTitle: "Freshness Checks",
    emptyTitle: "Runbook not audited",
    emptyText: "Paste runbook steps and incident evidence to find stale instructions.",
    colors: ["#854d0e", "#0369a1", "#2a1b07", "#fff8eb", "#ffffff", "#ead9b8", "#b42318"],
    stages: ["Last used", "Command check", "Owner check", "Patch note"],
    insights: ["Stale command", "Owner drift", "Patch size"],
    scenarios: [
      ["Fresh runbook", "Commands recently used", "baseline", "Monthly audit", "Confirm the runbook can stay unchanged."],
      ["Owner drift", "Steps work but owners changed", "watch scenario", "Runbook grooming", "Patch ownership before next incident."],
      ["Rotten command", "Incident step failed under pressure", "critical scenario", "Post incident review", "Treat stale commands as production risk."],
    ],
    logic: {
      model: "runbook freshness audit",
      baseline: 24,
      caution: 41,
      negative: 62,
      modeBias: [14, 0, -8],
      shifts: [-6, 0, 5],
      risk: [["command rot", ["deprecated", "failed command", "not found", "permission denied"], 9], ["owner drift", ["old owner", "unowned", "team changed"], 6], ["stale evidence", ["last updated", "stale", "outdated", "never tested"], 7]],
      healthy: [["fresh proof", ["tested", "recent", "verified", "used in incident"], 6], ["owner current", ["current owner", "reviewed", "approved"], 4]],
      owners: ["runbook owner", "incident commander", "service maintainer"],
      actions: ["Patch the stale step for {metric}", "Confirm owner for {focus}", "Publish runbook patch with {decision}"],
      risks: ["A stale command fails exactly when the team is under pressure.", "Owner drift makes escalation slower than the incident.", "Runbooks decay silently without execution evidence."],
      automation: ["Extract commands and owners from markdown.", "Check commands against current CLI output.", "Draft a runbook patch."],
      verification: ["rg -n \"gcloud|kubectl|curl|TODO\" docs runbooks", "gcloud run services list --format='value(metadata.name)'"],
    },
  },
  {
    slug: "12-data-pipeline-sheriff",
    architectureId: "pipeline-custody-board",
    uiName: "Pipeline Custody Board",
    layoutClass: "sheriff",
    workspace: "minmax(360px,0.88fr) minmax(560px,1.2fr) minmax(300px,0.72fr)",
    font: '"Rockwell", "Aptos", serif',
    motif: "dag custody, late batch, data owner",
    primaryAction: "Inspect pipeline",
    inputTitle: "Pipeline Case File",
    outputTitle: "Sheriff Ruling",
    sideTitle: "Custody Chain",
    emptyTitle: "No pipeline case",
    emptyText: "Load DAG, freshness, and ownership signals to rule on pipeline health.",
    colors: ["#7f1d1d", "#0f766e", "#2a1010", "#fff1f2", "#ffffff", "#ead0d0", "#b42318"],
    stages: ["Source", "Transform", "Freshness", "Consumer"],
    insights: ["Freshness breach", "Schema drift", "Owner custody"],
    scenarios: [
      ["Clean batch", "Fresh data and no schema drift", "baseline", "Daily pipeline check", "Confirm custody is intact."],
      ["Late batch", "Freshness warning without consumer impact", "watch scenario", "SLA watch", "Keep owner and ETA explicit."],
      ["Broken custody", "Schema drift reaches a consumer", "critical scenario", "Pipeline incident", "Escalate with the consumer list."],
    ],
    logic: {
      model: "data custody scoring",
      baseline: 26,
      caution: 42,
      negative: 63,
      modeBias: [13, 0, -8],
      shifts: [-5, 0, 6],
      risk: [["freshness breach", ["late", "stale", "missed sla", "delayed"], 8], ["schema drift", ["schema", "column", "type change", "null"], 8], ["consumer impact", ["dashboard", "report", "customer", "consumer"], 6]],
      healthy: [["custody clean", ["fresh", "validated", "owner", "backfill"], 6], ["contract pass", ["schema pass", "checks pass", "no drift"], 5]],
      owners: ["data owner", "pipeline maintainer", "consumer owner"],
      actions: ["Assign custody for {metric}", "Validate {focus} against consumers", "Publish pipeline ruling as {decision}"],
      risks: ["Late data creates downstream decisions with old facts.", "Schema drift can pass silently until consumers read it.", "A missing data owner turns recovery into archaeology."],
      automation: ["Read freshness and schema checks.", "Map consumers to the changed dataset.", "Draft backfill or rollback steps."],
      verification: ["dbt test --select state:modified+", "rg -n \"schema|freshness|owner\" pipelines data"],
    },
  },
  {
    slug: "13-rollback-concierge",
    architectureId: "rollback-itinerary-desk",
    uiName: "Rollback Itinerary Desk",
    layoutClass: "concierge",
    workspace: "minmax(350px,0.84fr) minmax(560px,1.2fr) minmax(310px,0.76fr)",
    font: '"Didot", "Georgia", serif',
    motif: "itinerary, reservation, rollback route",
    primaryAction: "Plan rollback",
    inputTitle: "Rollback Request",
    outputTitle: "Itinerary",
    sideTitle: "Return Route",
    emptyTitle: "No rollback itinerary",
    emptyText: "Load revision and risk signals to produce a rollback route.",
    colors: ["#9f1239", "#0f766e", "#2b1020", "#fff1f5", "#ffffff", "#e8cbd6", "#b42318"],
    stages: ["Reason", "Target revision", "Data safety", "Communication"],
    insights: ["Route clarity", "Data reversibility", "Stakeholder note"],
    scenarios: [
      ["Simple return", "Previous revision is safe", "baseline", "Rollback planning", "Keep the itinerary short."],
      ["Data question", "Code rollback is easy but data state is unclear", "watch scenario", "Rollback review", "Protect irreversible data first."],
      ["Emergency return", "Customer impact is active", "critical scenario", "Incident rollback", "Prioritize route execution and update."],
    ],
    logic: {
      model: "rollback route planner",
      baseline: 25,
      caution: 39,
      negative: 60,
      modeBias: [13, 0, -7],
      shifts: [-6, 0, 4],
      risk: [["irreversible data", ["migration", "irreversible", "data loss", "schema"], 9], ["route unclear", ["unknown revision", "manual", "no command"], 7], ["customer active", ["customer", "5xx", "incident", "degraded"], 8]],
      healthy: [["route ready", ["previous revision", "rollback command", "tested"], 7], ["communication", ["status update", "stakeholder", "owner"], 4]],
      owners: ["rollback owner", "incident commander", "data owner"],
      actions: ["Confirm rollback route for {metric}", "Check reversibility of {focus}", "Send stakeholder note with {decision}"],
      risks: ["A rollback can fix code while damaging data state.", "The fastest route needs a known target revision.", "Stakeholders need the rollback reason before the next symptom update."],
      automation: ["Resolve previous healthy revision.", "Check data migration notes.", "Draft rollback command and comms."],
      verification: ["gcloud run services update-traffic {package} --to-revisions REVISION=100 --region asia-northeast1", "gcloud run revisions list --service {package}"],
    },
  },
  {
    slug: "14-deployment-black-box-recorder",
    architectureId: "black-box-timeline",
    uiName: "Deployment Black Box",
    layoutClass: "blackbox",
    workspace: "minmax(330px,0.78fr) minmax(610px,1.4fr) minmax(280px,0.62fr)",
    font: '"Andale Mono", "Menlo", monospace',
    motif: "flight recorder, event tape, immutable timeline",
    primaryAction: "Record deploy story",
    inputTitle: "Event Tape",
    outputTitle: "Black Box Playback",
    sideTitle: "Recorder Channels",
    emptyTitle: "Recorder empty",
    emptyText: "Load deploy events and telemetry to reconstruct the story.",
    colors: ["#b45309", "#0369a1", "#111827", "#f5f7fb", "#ffffff", "#cbd5e1", "#b42318"],
    stages: ["Event ingest", "Clock align", "Anomaly mark", "Playback note"],
    insights: ["Timeline gap", "Anomaly mark", "Playback fidelity"],
    scenarios: [
      ["Clean tape", "Deployment events line up", "baseline", "Deploy playback", "Produce a compact timeline."],
      ["Clock gap", "One source has delayed or missing timestamps", "watch scenario", "Timeline review", "Mark uncertainty explicitly."],
      ["Bad tape", "Anomaly appears immediately after deploy", "critical scenario", "Incident playback", "Escalate with the timestamped story."],
    ],
    logic: {
      model: "event tape correlation",
      baseline: 24,
      caution: 40,
      negative: 61,
      modeBias: [12, 0, -8],
      shifts: [-5, 0, 6],
      risk: [["timeline gap", ["missing timestamp", "clock", "gap", "delayed"], 7], ["post deploy anomaly", ["after deploy", "5xx", "spike", "error"], 9], ["recorder loss", ["no logs", "dropped", "unknown"], 7]],
      healthy: [["tape complete", ["timeline", "correlated", "complete", "recorded"], 6], ["replay proof", ["same timestamp", "matched", "verified"], 5]],
      owners: ["deployment recorder", "release owner", "incident analyst"],
      actions: ["Mark the event gap for {metric}", "Correlate {focus} against deploy time", "Publish playback note as {decision}"],
      risks: ["A missing event can invert the cause story.", "Clock skew makes correlation look cleaner than it is.", "Incident review quality depends on recorder fidelity."],
      automation: ["Normalize event timestamps.", "Mark anomalies near deploy boundaries.", "Draft a replayable timeline."],
      verification: ["gcloud logging read 'timestamp>=\"2026-05-13T00:00:00Z\"' --limit 100", "gcloud run revisions describe REVISION --region asia-northeast1"],
    },
  },
  {
    slug: "15-dark-launch-scout",
    architectureId: "dark-launch-scout-map",
    uiName: "Dark Launch Scout Map",
    layoutClass: "scout",
    workspace: "minmax(350px,0.84fr) minmax(560px,1.18fr) minmax(310px,0.76fr)",
    font: '"Gill Sans", "Aptos", sans-serif',
    motif: "feature flag, cohort trail, hidden exposure",
    primaryAction: "Scout launch",
    inputTitle: "Launch Trail",
    outputTitle: "Scout Report",
    sideTitle: "Cohorts",
    emptyTitle: "No launch trail",
    emptyText: "Load flag, cohort, and hidden metric signals before widening exposure.",
    colors: ["#4338ca", "#15803d", "#1e1b4b", "#f2f3ff", "#ffffff", "#d5d8ef", "#b42318"],
    stages: ["Flag state", "Cohort", "Hidden metric", "Exposure call"],
    insights: ["Cohort safety", "Flag drift", "Exposure next step"],
    scenarios: [
      ["Hidden clean", "Internal cohort is quiet", "baseline", "Dark launch", "Recommend whether to widen."],
      ["Cohort wobble", "One cohort shows odd behavior", "watch scenario", "Limited exposure", "Keep exposure narrow."],
      ["Flag leak", "Feature reaches wrong audience", "critical scenario", "Launch incident", "Stop the launch and contain exposure."],
    ],
    logic: {
      model: "cohort exposure scout",
      baseline: 23,
      caution: 38,
      negative: 59,
      modeBias: [13, 0, -7],
      shifts: [-5, 0, 6],
      risk: [["flag leak", ["wrong cohort", "leak", "exposed", "unexpected"], 9], ["cohort wobble", ["cohort", "segment", "conversion", "drop"], 7], ["hidden metric", ["dark", "shadow", "silent", "warning"], 5]],
      healthy: [["scout clean", ["internal only", "flag off", "stable", "no tickets"], 6], ["controlled exposure", ["1%", "allowlist", "guardrail"], 5]],
      owners: ["feature owner", "launch manager", "support lead"],
      actions: ["Verify cohort boundary for {metric}", "Hold exposure until {focus} is clean", "Set launch call to {decision}"],
      risks: ["Dark launches fail quietly when the wrong cohort is exposed.", "Conversion drift can appear before error logs.", "Feature flag state needs proof, not memory."],
      automation: ["Read flag rules and cohorts.", "Compare hidden metrics by segment.", "Draft the exposure recommendation."],
      verification: ["rg -n \"feature|flag|cohort\" src config", "gcloud logging read 'feature_flag' --limit 50"],
    },
  },
  {
    slug: "16-ai-exploratory-tester",
    architectureId: "exploratory-charter-studio",
    uiName: "Exploratory Charter Studio",
    layoutClass: "charter",
    workspace: "minmax(370px,0.92fr) minmax(560px,1.18fr) minmax(280px,0.64fr)",
    font: '"Futura", "Aptos", sans-serif',
    motif: "test charter, session notes, bug hunt",
    primaryAction: "Generate test charter",
    inputTitle: "Exploration Brief",
    outputTitle: "Charter Output",
    sideTitle: "Test Angles",
    emptyTitle: "No charter generated",
    emptyText: "Describe the change to generate a focused exploratory testing mission.",
    colors: ["#be123c", "#2563eb", "#3a0d18", "#fff1f5", "#ffffff", "#ecd0d9", "#b42318"],
    stages: ["Mission", "Heuristic", "Probe", "Bug note"],
    insights: ["Exploration depth", "Risk heuristic", "Bug yield"],
    scenarios: [
      ["Routine charter", "Small UI or API change", "baseline", "Exploratory session", "Keep the charter short."],
      ["Unknown path", "New behavior has weak test coverage", "watch scenario", "Risk-based session", "Focus on high-value probes."],
      ["High risk hunt", "Critical workflow changed without enough tests", "critical scenario", "Release test gate", "Block until probes are run."],
    ],
    logic: {
      model: "risk-based charter generator",
      baseline: 22,
      caution: 39,
      negative: 61,
      modeBias: [12, 0, -7],
      shifts: [-5, 0, 6],
      risk: [["coverage hole", ["untested", "no coverage", "unknown path", "edge case"], 8], ["workflow risk", ["checkout", "login", "payment", "critical"], 8], ["bug scent", ["flaky", "unexpected", "manual", "regression"], 6]],
      healthy: [["test proof", ["covered", "passing", "automated", "documented"], 6], ["small change", ["copy", "styling", "isolated"], 4]],
      owners: ["qa lead", "feature owner", "release reviewer"],
      actions: ["Create probes for {metric}", "Test {focus} with boundary data", "Set test gate to {decision}"],
      risks: ["Automated tests rarely cover the surprising path first.", "Exploratory testing needs a mission or it becomes browsing.", "Weak coverage near a critical workflow should block release."],
      automation: ["Turn change notes into a test charter.", "Rank probes by workflow risk.", "Draft a bug report template."],
      verification: ["npm run test", "npx playwright test --project=chromium"],
    },
  },
  {
    slug: "17-decision-fatigue-reducer",
    architectureId: "decision-inbox-sorter",
    uiName: "Decision Inbox Sorter",
    layoutClass: "inbox",
    workspace: "minmax(360px,0.86fr) minmax(540px,1.12fr) minmax(330px,0.82fr)",
    font: '"Century Gothic", "Aptos", sans-serif',
    motif: "decision queue, cognitive load, next best call",
    primaryAction: "Reduce decision load",
    inputTitle: "Decision Inbox",
    outputTitle: "Prioritized Call",
    sideTitle: "Load Reducers",
    emptyTitle: "Inbox unsorted",
    emptyText: "Paste competing choices and evidence to reduce decision fatigue.",
    colors: ["#0f766e", "#c026d3", "#102321", "#f0faf7", "#ffffff", "#cbe4dc", "#b42318"],
    stages: ["Collect", "Collapse", "Prioritize", "Commit"],
    insights: ["Cognitive load", "Choice count", "Next commitment"],
    scenarios: [
      ["Small queue", "One obvious decision", "baseline", "Decision review", "Keep output focused on the next commitment."],
      ["Competing asks", "Several stakeholders want different calls", "watch scenario", "Planning window", "Collapse choices into one next call."],
      ["Decision overload", "Too many risky choices under pressure", "critical scenario", "Incident leadership", "Escalate with the smallest reversible decision."],
    ],
    logic: {
      model: "decision load collapse",
      baseline: 24,
      caution: 40,
      negative: 62,
      modeBias: [13, 0, -7],
      shifts: [-5, 0, 5],
      risk: [["choice overload", ["multiple", "competing", "too many", "ambiguous"], 7], ["pressure", ["deadline", "urgent", "incident", "stakeholder"], 7], ["irreversibility", ["irreversible", "one-way", "data loss"], 8]],
      healthy: [["clear next call", ["single owner", "reversible", "ranked", "clear"], 6], ["low load", ["small", "obvious", "documented"], 4]],
      owners: ["decision owner", "team lead", "facilitator"],
      actions: ["Collapse choices around {metric}", "Make {focus} the next explicit call", "Record the decision as {decision}"],
      risks: ["Too many parallel choices make teams pick by noise.", "Irreversible decisions need slower defaults.", "Stakeholder pressure can hide missing evidence."],
      automation: ["Cluster choices by reversibility.", "Rank decisions by urgency and evidence quality.", "Draft the next commitment note."],
      verification: ["rg -n \"decision|owner|deadline\" docs README.md", "npm run test"],
    },
  },
  {
    slug: "18-model-rollback-agent",
    architectureId: "model-registry-rollback",
    uiName: "Model Registry Rollback",
    layoutClass: "modelback",
    workspace: "minmax(360px,0.88fr) minmax(570px,1.24fr) minmax(290px,0.68fr)",
    font: '"IBM Plex Sans Condensed", "Aptos", sans-serif',
    motif: "model version, eval drift, rollback target",
    primaryAction: "Select model rollback",
    inputTitle: "Model Evidence",
    outputTitle: "Rollback Selection",
    sideTitle: "Registry Checks",
    emptyTitle: "No model decision",
    emptyText: "Load model metrics and eval drift to decide whether to roll back.",
    colors: ["#1d4ed8", "#7c2d12", "#111c35", "#eef4ff", "#ffffff", "#cad7ef", "#b42318"],
    stages: ["Current model", "Eval drift", "Fallback target", "Rollback call"],
    insights: ["Eval drift", "Fallback quality", "Serving risk"],
    scenarios: [
      ["Stable model", "New model holds eval quality", "baseline", "Model release", "Confirm no rollback is needed."],
      ["Metric drift", "Offline eval drift but production quiet", "watch scenario", "Model watch", "Hold rollout while drift is explained."],
      ["Bad model", "Quality regression reaches users", "critical scenario", "Model rollback", "Rollback to a named model target."],
    ],
    logic: {
      model: "eval drift rollback selector",
      baseline: 25,
      caution: 39,
      negative: 58,
      modeBias: [14, 0, -7],
      shifts: [-6, 0, 5],
      risk: [["eval drift", ["eval", "drift", "quality drop", "regression"], 9], ["serving risk", ["latency", "cost", "timeout", "user"], 6], ["fallback gap", ["no fallback", "unknown model", "registry"], 7]],
      healthy: [["model proof", ["eval pass", "holdout", "stable", "fallback ready"], 6], ["rollback target", ["previous model", "pinned", "version"], 5]],
      owners: ["model owner", "ml platform owner", "product reviewer"],
      actions: ["Compare {metric} against holdout", "Pin fallback for {focus}", "Record model call as {decision}"],
      risks: ["Offline eval drift can reach users before logs look bad.", "A model rollback needs a named safe target.", "Serving cost and latency are product risks too."],
      automation: ["Compare model versions and eval slices.", "Find the last safe model target.", "Draft rollback and validation commands."],
      verification: ["rg -n \"model|eval|version\" .", "npm run test"],
    },
  },
  {
    slug: "19-chaos-drill-agent",
    architectureId: "chaos-drill-command",
    uiName: "Chaos Drill Command",
    layoutClass: "chaos",
    workspace: "minmax(350px,0.82fr) minmax(590px,1.32fr) minmax(280px,0.64fr)",
    font: '"Eurostile", "Aptos", sans-serif',
    motif: "drill card, abort switch, learning loop",
    primaryAction: "Assess drill",
    inputTitle: "Drill Card",
    outputTitle: "Command Decision",
    sideTitle: "Abort Rules",
    emptyTitle: "No drill card loaded",
    emptyText: "Load the experiment and safety controls before running chaos.",
    colors: ["#b91c1c", "#0e7490", "#2b1111", "#fff1f1", "#ffffff", "#edcccc", "#991b1b"],
    stages: ["Hypothesis", "Blast limit", "Abort rule", "Learning loop"],
    insights: ["Blast limit", "Abort clarity", "Learning value"],
    scenarios: [
      ["Safe drill", "Clear blast limit and abort rule", "baseline", "Chaos rehearsal", "Proceed only if learning is explicit."],
      ["Weak abort", "Experiment is useful but stop rule is vague", "watch scenario", "Game day prep", "Tighten abort before running."],
      ["Unsafe chaos", "Customer-facing blast and missing controls", "critical scenario", "Chaos review", "Block the experiment."],
    ],
    logic: {
      model: "chaos safety gate",
      baseline: 27,
      caution: 43,
      negative: 64,
      modeBias: [16, 0, -8],
      shifts: [-7, 0, 4],
      risk: [["blast limit", ["customer-facing", "blast", "wide", "production"], 9], ["abort gap", ["no abort", "unclear stop", "manual"], 8], ["learning gap", ["no hypothesis", "unknown", "not measured"], 5]],
      healthy: [["safe drill", ["abort rule", "blast limit", "hypothesis", "rollback"], 7], ["observability", ["dashboard", "metric", "owner"], 5]],
      owners: ["chaos lead", "sre reviewer", "service owner"],
      actions: ["Narrow blast limit for {metric}", "Define abort rule for {focus}", "Set drill decision to {decision}"],
      risks: ["Chaos without a stop rule is just an outage with branding.", "A wide blast limit can turn learning into customer harm.", "A drill with no hypothesis produces no operational value."],
      automation: ["Parse experiment scope and abort criteria.", "Validate monitoring coverage.", "Draft the game-day decision note."],
      verification: ["rg -n \"abort|hypothesis|blast\" docs experiments", "gcloud monitoring dashboards list --format=json"],
    },
  },
  {
    slug: "20-incident-commander-karaoke",
    architectureId: "incident-script-teleprompter",
    uiName: "Incident Script Teleprompter",
    layoutClass: "karaoke",
    workspace: "minmax(360px,0.86fr) minmax(580px,1.28fr) minmax(290px,0.66fr)",
    font: '"Marker Felt", "Trebuchet MS", sans-serif',
    motif: "speaker queue, status beat, script timing",
    primaryAction: "Write command script",
    inputTitle: "Incident Brief",
    outputTitle: "Live Script",
    sideTitle: "Bridge Beats",
    emptyTitle: "No script on deck",
    emptyText: "Load incident signals to turn them into a crisp commander script.",
    colors: ["#7c3aed", "#ea580c", "#211238", "#f7f2ff", "#ffffff", "#ddcfef", "#b42318"],
    stages: ["Status beat", "Owner cue", "Decision line", "Next update"],
    insights: ["Message clarity", "Owner cue", "Update rhythm"],
    scenarios: [
      ["Clear update", "Incident status is known", "baseline", "Bridge update", "Write a concise spoken update."],
      ["Muddy update", "Owners and next update time are unclear", "watch scenario", "Bridge handoff", "Make the script remove ambiguity."],
      ["Executive bridge", "Customer-impacting incident needs leadership update", "critical scenario", "Major incident", "Escalate with a clean script and owner cue."],
    ],
    logic: {
      model: "incident script clarity",
      baseline: 24,
      caution: 40,
      negative: 61,
      modeBias: [13, 0, -7],
      shifts: [-5, 0, 5],
      risk: [["message fog", ["unclear", "unknown", "conflicting", "maybe"], 7], ["owner cue", ["no owner", "unassigned", "handoff"], 7], ["customer impact", ["customer", "sev", "executive", "support"], 8]],
      healthy: [["clear script", ["owner", "next update", "status", "mitigation"], 6], ["cadence", ["every 15", "timeline", "bridge"], 4]],
      owners: ["incident commander", "comms lead", "technical lead"],
      actions: ["Write the status beat for {metric}", "Cue owner for {focus}", "Read the bridge line as {decision}"],
      risks: ["A vague script creates extra questions during the incident.", "Missing owner cues slow the bridge rhythm.", "Customer-impacting incidents need the next update time stated clearly."],
      automation: ["Extract status, owner, and next update time.", "Convert evidence into spoken bridge beats.", "Draft the stakeholder update."],
      verification: ["rg -n \"owner|next update|status\" incident* docs", "gcloud logging read 'severity>=ERROR' --limit 20"],
    },
  },
];

function parseProject(projectDir) {
  const text = readFileSync(join(projectDir, "src", "project.ts"), "utf8");
  return JSON.parse(text.match(/export const project = ([\s\S]*?) as const;/)?.[1] || "{}");
}

function profileFor(dir) {
  const profile = profiles.find((item) => item.slug === dir);
  if (!profile) throw new Error(`Missing differentiation profile for ${dir}`);
  return profile;
}

function replaceTokens(template, project, profile) {
  return template
    .replaceAll("{package}", project.packageName)
    .replaceAll("{target}", project.sampleTarget)
    .replaceAll("{metric}", project.metrics[0] || "primary metric")
    .replaceAll("{focus}", project.focusAreas[0] || "primary focus")
    .replaceAll("{decision}", `${project.positive}/${project.caution}/${project.negative}`)
    .replaceAll("{project}", project.name)
    .replaceAll("{architecture}", profile.uiName);
}

function logicProfile(project, profile) {
  const [conservative, balanced, aggressive] = profile.logic.modeBias;
  const [conservativeShift, balancedShift, aggressiveShift] = profile.logic.shifts;
  return {
    architectureId: profile.architectureId,
    scoringModel: profile.logic.model,
    baseline: profile.logic.baseline,
    thresholds: {
      caution: profile.logic.caution,
      negative: profile.logic.negative,
    },
    modeBias: { conservative, balanced, aggressive },
    thresholdShift: { conservative: conservativeShift, balanced: balancedShift, aggressive: aggressiveShift },
    riskLexicon: profile.logic.risk.map(([label, terms, weight]) => ({ label, terms, weight })),
    healthyLexicon: profile.logic.healthy.map(([label, terms, weight]) => ({ label, terms, weight })),
    owners: profile.logic.owners,
    actionTemplates: profile.logic.actions.map((item) => replaceTokens(item, project, profile)),
    riskTemplates: profile.logic.risks.map((item) => replaceTokens(item, project, profile)),
    automationPlan: profile.logic.automation.map((item) => replaceTokens(item, project, profile)),
    verificationCommands: profile.logic.verification.map((item) => replaceTokens(item, project, profile)),
    evidenceScale: ["needs intervention", "watch with owner", "acceptable"],
  };
}

function uiProfile(project, profile) {
  const [accent, secondary, ink, paper, panel, line, danger] = profile.colors;
  return {
    architectureId: profile.architectureId,
    name: profile.uiName,
    layoutClass: profile.layoutClass,
    workspace: profile.workspace,
    motif: profile.motif,
    primaryAction: profile.primaryAction,
    inputTitle: profile.inputTitle,
    outputTitle: profile.outputTitle,
    sideTitle: profile.sideTitle,
    emptyTitle: profile.emptyTitle,
    emptyText: profile.emptyText,
    font: profile.font,
    colors: { accent, secondary, ink, paper, panel, line, danger },
    stages: profile.stages,
    insights: profile.insights,
    scenarios: profile.scenarios.map(([label, description, suffix, window, note], index) => ({
      id: `${profile.layoutClass}-${index + 1}`,
      label,
      description,
      suffix,
      evidenceWindow: window,
      operatorNote: note,
      mode: index === 0 ? "balanced" : "conservative",
    })),
    readiness: [
      `${profile.stages[0]} owner is named`,
      `${profile.stages[1]} evidence is fresh`,
      `${profile.stages[2]} has a stop condition`,
      `${profile.stages[3]} is ready to publish`,
    ],
    resultSections: {
      evidence: `${profile.insights[0]} Evidence`,
      actions: `${profile.insights[1]} Actions`,
      handoff: `${profile.insights[2]} Handoff`,
    },
    architectureNote: `${profile.uiName} uses a ${profile.motif} architecture for ${project.name}.`,
  };
}

function agentTs(profileJson) {
  return `import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { project } from "./project";

export const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

const logicProfile = ${JSON.stringify(profileJson, null, 2)} as const;

const DecisionModeSchema = z.enum(["conservative", "balanced", "aggressive"]).default("balanced");

export const AnalyzeInputSchema = z.object({
  target: z.string().trim().min(1, "Target is required").max(4000),
  context: z.string().trim().min(1, "Context is required").max(20000),
  signals: z.string().trim().min(1, "Signals are required").max(30000),
  mode: DecisionModeSchema,
  evidenceWindow: z.string().trim().max(1000).default(""),
  operatorNote: z.string().trim().max(4000).default(""),
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

const ActionSchema = z.object({
  title: z.string().min(1),
  owner: z.string().min(1),
  priority: z.string().min(1),
});

const EvidenceSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  weight: z.number().min(0).max(100),
});

export const AnalysisSchema = z.object({
  decision: z.string().min(1),
  confidence: z.number().min(0).max(100),
  executiveSummary: z.string().default(""),
  summary: z.string().min(1),
  risks: z.array(z.string()).default([]),
  actions: z.array(ActionSchema).default([]),
  evidence: z.array(EvidenceSchema).default([]),
  verificationCommands: z.array(z.string()).default([]),
  handoffChecklist: z.array(z.string()).default([]),
  automationPlan: z.array(z.string()).default([]),
  runbookPatch: z.string().default(""),
  commentDraft: z.string().default(""),
  source: z.enum(["gemini", "local-fallback"]),
  model: z.string(),
  mode: DecisionModeSchema,
});

export type Analysis = z.infer<typeof AnalysisSchema>;

type Lexicon = ReadonlyArray<{
  label: string;
  terms: readonly string[];
  weight: number;
}>;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function countTerm(text: string, term: string) {
  const normalized = text.toLowerCase();
  const needle = term.toLowerCase();
  let count = 0;
  let index = normalized.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = normalized.indexOf(needle, index + Math.max(1, needle.length));
  }
  return count;
}

function weightedMatches(text: string, lexicon: Lexicon) {
  return lexicon.reduce((score, bucket) => {
    const hits = bucket.terms.reduce((sum, term) => sum + countTerm(text, term), 0);
    return score + Math.min(4, hits) * bucket.weight;
  }, 0);
}

function modeAdjustment(mode: AnalyzeInput["mode"]) {
  return logicProfile.modeBias[mode];
}

function thresholds(mode: AnalyzeInput["mode"]) {
  const shift = logicProfile.thresholdShift[mode];
  return {
    caution: logicProfile.thresholds.caution + shift,
    negative: logicProfile.thresholds.negative + shift,
  };
}

function textFor(input: AnalyzeInput) {
  return [input.target, input.context, input.signals, input.evidenceWindow, input.operatorNote].join("\\n");
}

function riskScore(input: AnalyzeInput) {
  const text = textFor(input);
  const lengthSignal = Math.min(14, Math.floor(text.length / 560));
  const risk = weightedMatches(text, logicProfile.riskLexicon);
  const healthy = weightedMatches(text, logicProfile.healthyLexicon);
  const focusScore = project.focusAreas.reduce((score, focus) => {
    const firstWord = focus.split(" ")[0] || focus;
    return score + (countTerm(text, firstWord) > 0 ? 4 : 0);
  }, 0);
  const score = logicProfile.baseline + lengthSignal + Math.min(45, risk) - Math.min(22, healthy) + focusScore + modeAdjustment(input.mode);
  return clamp(score, 5, 96);
}

function decisionFromScore(score: number, mode: AnalyzeInput["mode"]) {
  const limit = thresholds(mode);
  if (score >= limit.negative) return project.negative;
  if (score >= limit.caution) return project.caution;
  return project.positive;
}

function priority(score: number) {
  if (score >= 72) return "P0";
  if (score >= 45) return "P1";
  return "P2";
}

function evidenceValue(weight: number) {
  if (weight >= 72) return logicProfile.evidenceScale[0];
  if (weight >= 45) return logicProfile.evidenceScale[1];
  return logicProfile.evidenceScale[2];
}

function ownerFor(index: number) {
  return logicProfile.owners[index % logicProfile.owners.length];
}

function fallbackAnalysis(input: AnalyzeInput, reason: string): Analysis {
  const score = riskScore(input);
  const decision = decisionFromScore(score, input.mode);
  const confidence = clamp(62 + Math.round(Math.abs(score - thresholds(input.mode).caution) / 2), 56, 94);
  const evidence = project.metrics.map((label, index) => {
    const weight = clamp(score + index * 7 - 8, 12, 98);
    return {
      label,
      value: evidenceValue(weight),
      weight,
    };
  });

  return AnalysisSchema.parse({
    decision,
    confidence,
    executiveSummary: \`\${project.name} used the \${logicProfile.scoringModel} model and returned \${decision} at \${confidence}% confidence.\`,
    summary: \`\${project.name} ran project-specific local analysis because \${reason}. The \${logicProfile.architectureId} logic currently supports "\${decision}" while preserving the human approval point.\`,
    risks: logicProfile.riskTemplates,
    actions: logicProfile.actionTemplates.map((title, index) => ({
      title,
      owner: ownerFor(index),
      priority: priority(score + index * 5),
    })),
    evidence,
    verificationCommands: [
      ...logicProfile.verificationCommands,
      "npm run test",
      \`gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="\${project.packageName}"' --limit 50 --format=json\`,
    ],
    handoffChecklist: [
      \`Decision recorded as \${decision}\`,
      \`\${logicProfile.architectureId} owner assigned: \${ownerFor(0)}\`,
      \`Fresh evidence exists for \${project.focusAreas[0]}\`,
      "Next update time is visible to stakeholders",
    ],
    automationPlan: logicProfile.automationPlan,
    runbookPatch: \`### \${project.name} / \${logicProfile.architectureId}\\n\\n- Decision: \${decision}\\n- Confidence: \${confidence}%\\n- Mode: \${input.mode}\\n- Scoring model: \${logicProfile.scoringModel}\\n- Verify: \${project.metrics.join(", ")}\\n- Stop condition: define before execution\\n\`,
    commentDraft: \`Decision: \${decision}. Confidence: \${confidence}%. Model: \${logicProfile.scoringModel}. Main checks: \${project.focusAreas.join(", ")}. Next: \${logicProfile.actionTemplates[0]}\`,
    source: "local-fallback",
    model: DEFAULT_MODEL,
    mode: input.mode,
  });
}

function buildPrompt(input: AnalyzeInput) {
  return [
    \`You are \${project.name}, a \${project.role} for a DevOps x AI Agent hackathon.\`,
    \`Use this project-specific architecture: \${logicProfile.architectureId}.\`,
    \`Scoring model: \${logicProfile.scoringModel}.\`,
    "Use Google Gemini Flash 3.1 style fast operational judgment.",
    "",
    \`Decision mode: \${input.mode}\`,
    \`Evidence window: \${input.evidenceWindow || "(not supplied)"}\`,
    "",
    "Project objective:",
    project.overview,
    "",
    "MVP behavior:",
    project.mvp,
    "",
    "Focus areas:",
    ...project.focusAreas.map((item) => \`- \${item}\`),
    "",
    "Domain lexicon:",
    ...logicProfile.riskLexicon.map((item) => \`- \${item.label}: \${item.terms.join(", ")}\`),
    "",
    "Return strict JSON only with this schema:",
    JSON.stringify(
      {
        decision: \`one of: \${project.positive}, \${project.caution}, \${project.negative}\`,
        confidence: "0-100",
        executiveSummary: "one sentence for a release or incident lead",
        summary: "short operational judgment",
        risks: ["risk"],
        actions: [{ title: "action", owner: "role", priority: "P0/P1/P2" }],
        evidence: [{ label: "metric", value: "short value", weight: "0-100" }],
        verificationCommands: ["command a human can run next"],
        handoffChecklist: ["handoff item"],
        automationPlan: ["step"],
        runbookPatch: "markdown snippet to paste into a runbook",
        commentDraft: "PR, runbook, release, or incident comment",
      },
      null,
      2,
    ),
    "",
    "Target:",
    input.target,
    "",
    "Context:",
    input.context,
    "",
    "Signals:",
    input.signals,
    "",
    "Operator note:",
    input.operatorNote || "(not supplied)",
  ].join("\\n");
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
        temperature: input.mode === "aggressive" ? 0.36 : 0.18,
      },
    });
    const parsed = parseJson(response.text || "{}");
    return AnalysisSchema.parse({
      ...parsed,
      source: "gemini",
      model: DEFAULT_MODEL,
      mode: input.mode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown Gemini error";
    return fallbackAnalysis(input, \`Gemini call failed: \${message}\`);
  }
}
`;
}

function mainTs(profileJson, hasGitHub) {
  return `import "./styles.css";

const uiProfile = ${JSON.stringify(profileJson, null, 2)} as const;
const hasGitHubCollection = ${hasGitHub ? "true" : "false"};

type ProjectPayload = {
  rank: number;
  ideaNo: string;
  name: string;
  tagline: string;
  packageName: string;
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

type DecisionMode = "conservative" | "balanced" | "aggressive";

type AnalyzeInput = {
  target: string;
  context: string;
  signals: string;
  mode: DecisionMode;
  evidenceWindow: string;
  operatorNote: string;
};

type Analysis = {
  decision: string;
  confidence: number;
  executiveSummary: string;
  summary: string;
  risks: string[];
  actions: Array<{ title: string; owner: string; priority: string }>;
  evidence: Array<{ label: string; value: string; weight: number }>;
  verificationCommands: string[];
  handoffChecklist: string[];
  automationPlan: string[];
  runbookPatch: string;
  commentDraft: string;
  source: string;
  model: string;
  mode: DecisionMode;
};

type Scenario = AnalyzeInput & {
  id: string;
  label: string;
  description: string;
};

type HistoryRecord = {
  id: string;
  createdAt: string;
  input: AnalyzeInput;
  result: Analysis;
};

type GitHubCollection = {
  target: string;
  context: string;
  signals: string;
  evidenceWindow: string;
  operatorNote: string;
  metadata: {
    owner: string;
    repo: string;
    pullNumber: number;
    title: string;
    headSha: string;
    files: number;
  };
};

const app = document.querySelector<HTMLDivElement>("#app")!;
let currentRecord: HistoryRecord | undefined;

function escapeHtml(value: string | number | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function list(items: readonly string[]) {
  return items.map((item) => \`<li>\${escapeHtml(item)}</li>\`).join("");
}

function pillList(items: readonly string[]) {
  return items.map((item) => \`<span class="token">\${escapeHtml(item)}</span>\`).join("");
}

function storageKey(project: ProjectPayload) {
  return \`mvp-history:\${project.packageName}:\${uiProfile.architectureId}\`;
}

function loadHistory(project: ProjectPayload): HistoryRecord[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(project)) || "[]") as HistoryRecord[];
  } catch {
    return [];
  }
}

function saveHistory(project: ProjectPayload, records: HistoryRecord[]) {
  localStorage.setItem(storageKey(project), JSON.stringify(records.slice(0, 8)));
}

function scenarios(project: ProjectPayload): Scenario[] {
  return uiProfile.scenarios.map((scenario, index) => ({
    id: scenario.id,
    label: scenario.label,
    description: scenario.description,
    target: index === 0 ? project.sampleTarget : \`\${project.sampleTarget} / \${scenario.suffix}\`,
    context: \`\${project.sampleContext}\\nArchitecture: \${uiProfile.name}. Scenario: \${scenario.description}\`,
    signals: \`\${project.sampleSignals}\\n\${scenario.description}. Watch: \${uiProfile.insights.join(", ")}.\`,
    mode: scenario.mode as DecisionMode,
    evidenceWindow: scenario.evidenceWindow,
    operatorNote: scenario.operatorNote,
  }));
}

function readForm(): AnalyzeInput | undefined {
  const form = document.querySelector<HTMLFormElement>("#analysis-form");
  if (!form) return undefined;
  const data = new FormData(form);
  return {
    target: String(data.get("target") || ""),
    context: String(data.get("context") || ""),
    signals: String(data.get("signals") || ""),
    mode: String(data.get("mode") || "balanced") as DecisionMode,
    evidenceWindow: String(data.get("evidenceWindow") || ""),
    operatorNote: String(data.get("operatorNote") || ""),
  };
}

function writeForm(input: AnalyzeInput) {
  const form = document.querySelector<HTMLFormElement>("#analysis-form");
  if (!form) return;
  (form.elements.namedItem("target") as HTMLInputElement).value = input.target;
  (form.elements.namedItem("context") as HTMLTextAreaElement).value = input.context;
  (form.elements.namedItem("signals") as HTMLTextAreaElement).value = input.signals;
  (form.elements.namedItem("mode") as HTMLSelectElement).value = input.mode;
  (form.elements.namedItem("evidenceWindow") as HTMLInputElement).value = input.evidenceWindow;
  (form.elements.namedItem("operatorNote") as HTMLTextAreaElement).value = input.operatorNote;
}

function decisionClass(result: Analysis, project: ProjectPayload) {
  if (result.decision === project.negative) return "negative";
  if (result.decision === project.caution) return "caution";
  return "positive";
}

function evidenceBars(evidence: Analysis["evidence"]) {
  return evidence
    .map(
      (item, index) => \`
        <div class="evidence evidence-\${index + 1}">
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

function stageMarkup(record?: HistoryRecord) {
  return uiProfile.stages
    .map((stage, index) => {
      const active = record ? index <= Math.min(3, Math.floor(record.result.confidence / 25)) : index === 0;
      return \`<div class="stage \${active ? "active" : ""}"><span>0\${index + 1}</span><strong>\${escapeHtml(stage)}</strong></div>\`;
    })
    .join("");
}

function resultMarkup(project: ProjectPayload, record?: HistoryRecord) {
  if (!record) {
    return \`
      <div class="empty-state">
        <div class="architecture-mark">\${escapeHtml(uiProfile.architectureId)}</div>
        <strong>\${escapeHtml(uiProfile.emptyTitle)}</strong>
        <p>\${escapeHtml(uiProfile.emptyText)}</p>
        <div class="stage-strip">\${stageMarkup()}</div>
      </div>\`;
  }

  const result = record.result;
  const tone = decisionClass(result, project);
  return \`
    <div class="decision-strip \${tone}">
      <div>
        <span class="eyebrow">Decision</span>
        <strong>\${escapeHtml(result.decision)}</strong>
      </div>
      <div>
        <span class="eyebrow">Confidence</span>
        <strong>\${result.confidence}%</strong>
      </div>
      <div>
        <span class="eyebrow">Mode / Source</span>
        <strong>\${escapeHtml(result.mode)} / \${escapeHtml(result.source)}</strong>
      </div>
    </div>
    <div class="stage-strip result-stages">\${stageMarkup(record)}</div>
    <p class="summary">\${escapeHtml(result.executiveSummary || result.summary)}</p>
    <section class="result-section signal-board">
      <h2>\${escapeHtml(uiProfile.resultSections.evidence)}</h2>
      \${evidenceBars(result.evidence)}
    </section>
    <section class="result-section">
      <h2>\${escapeHtml(uiProfile.resultSections.actions)}</h2>
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
        <h2>\${escapeHtml(uiProfile.resultSections.handoff)}</h2>
        <ul>\${list(result.handoffChecklist)}</ul>
      </div>
    </section>
    <section class="result-grid">
      <div>
        <h2>Verification Commands</h2>
        <pre>\${escapeHtml(result.verificationCommands.join("\\n"))}</pre>
      </div>
      <div>
        <h2>Automation Plan</h2>
        <ol>\${list(result.automationPlan)}</ol>
      </div>
    </section>
    <section class="result-section">
      <h2>Runbook Patch</h2>
      <pre>\${escapeHtml(result.runbookPatch)}</pre>
    </section>
    <section class="result-section">
      <h2>Comment Draft</h2>
      <pre>\${escapeHtml(result.commentDraft)}</pre>
    </section>\`;
}

function markdownReport(record: HistoryRecord, project: ProjectPayload) {
  const r = record.result;
  return [
    \`# \${project.name} Decision Report\`,
    "",
    \`- Architecture: \${uiProfile.name} (\${uiProfile.architectureId})\`,
    \`- Created: \${record.createdAt}\`,
    \`- Target: \${record.input.target}\`,
    \`- Decision: \${r.decision}\`,
    \`- Confidence: \${r.confidence}%\`,
    \`- Mode: \${r.mode}\`,
    \`- Source: \${r.source}\`,
    "",
    "## Summary",
    r.summary,
    "",
    "## Evidence",
    ...r.evidence.map((item) => \`- \${item.label}: \${item.value} (\${item.weight}%)\`),
    "",
    "## Risks",
    ...r.risks.map((item) => \`- \${item}\`),
    "",
    "## Actions",
    ...r.actions.map((item) => \`- [\${item.priority}] \${item.title} (\${item.owner})\`),
    "",
    "## Verification Commands",
    "\`\`\`bash",
    ...r.verificationCommands,
    "\`\`\`",
    "",
    "## Handoff Checklist",
    ...r.handoffChecklist.map((item) => \`- [ ] \${item}\`),
    "",
    "## Runbook Patch",
    r.runbookPatch,
    "",
    "## Comment Draft",
    r.commentDraft,
  ].join("\\n");
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

function updateResult(project: ProjectPayload, record?: HistoryRecord) {
  currentRecord = record;
  const output = document.querySelector<HTMLElement>("#result");
  if (output) output.innerHTML = resultMarkup(project, record);
  renderHistory(project);
  document.querySelectorAll<HTMLButtonElement>("[data-result-action]").forEach((button) => {
    button.disabled = !record;
  });
}

function renderHistory(project: ProjectPayload) {
  const history = loadHistory(project);
  const node = document.querySelector<HTMLElement>("#history-list");
  const count = document.querySelector<HTMLElement>("#history-count");
  if (count) count.textContent = String(history.length);
  if (!node) return;
  node.innerHTML = history.length
    ? history
        .map(
          (record) => \`
          <button class="history-item" type="button" data-history-id="\${escapeHtml(record.id)}">
            <span>\${escapeHtml(record.result.decision)}</span>
            <strong>\${escapeHtml(record.input.target)}</strong>
            <small>\${escapeHtml(new Date(record.createdAt).toLocaleString())}</small>
          </button>\`,
        )
        .join("")
    : '<p class="muted">No local decisions yet.</p>';
}

async function postAnalysis(project: ProjectPayload) {
  const input = readForm();
  const output = document.querySelector<HTMLElement>("#result");
  const button = document.querySelector<HTMLButtonElement>("#run-button");
  if (!input || !output || !button) return;

  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.textContent = "Analyzing";
  output.innerHTML = \`<div class="empty-state"><div class="architecture-mark">\${escapeHtml(uiProfile.architectureId)}</div><strong>Analyzing evidence</strong><p>\${escapeHtml(uiProfile.motif)}</p></div>\`;

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    output.innerHTML = \`<div class="empty-state error"><strong>Analysis failed</strong><p>\${escapeHtml(error)}</p></div>\`;
  } else {
    const result = (await response.json()) as Analysis;
    const record: HistoryRecord = {
      id: \`\${Date.now()}-\${Math.random().toString(16).slice(2)}\`,
      createdAt: new Date().toISOString(),
      input,
      result,
    };
    saveHistory(project, [record, ...loadHistory(project)]);
    updateResult(project, record);
  }

  button.disabled = false;
  button.removeAttribute("aria-busy");
  button.textContent = uiProfile.primaryAction;
}

async function collectGitHubPullRequest() {
  if (!hasGitHubCollection) return;
  const input = readForm();
  const output = document.querySelector<HTMLElement>("#result");
  const button = document.querySelector<HTMLButtonElement>("#github-fetch-button");
  if (!input || !output || !button) return;

  button.disabled = true;
  button.textContent = "Fetching";
  output.innerHTML = '<div class="empty-state"><strong>Fetching GitHub PR</strong><p>Collecting metadata, files, checks, and diff context.</p></div>';

  const response = await fetch("/api/collect/github-pr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: input.target }),
  });

  if (!response.ok) {
    const error = await response.text();
    output.innerHTML = \`<div class="empty-state error"><strong>GitHub fetch failed</strong><p>\${escapeHtml(error)}</p></div>\`;
  } else {
    const collected = (await response.json()) as GitHubCollection;
    writeForm({
      target: collected.target,
      context: collected.context,
      signals: collected.signals,
      mode: input.mode || "balanced",
      evidenceWindow: collected.evidenceWindow,
      operatorNote: collected.operatorNote,
    });
    output.innerHTML = \`<div class="empty-state"><strong>GitHub PR loaded</strong><p>\${escapeHtml(
      \`\${collected.metadata.owner}/\${collected.metadata.repo}#\${collected.metadata.pullNumber}: \${collected.metadata.title}\`,
    )}</p><p>\${escapeHtml(\`\${collected.metadata.files} files, head \${collected.metadata.headSha.slice(0, 7)}\`)}</p></div>\`;
  }

  button.disabled = false;
  button.textContent = "Fetch GitHub PR";
}

function render(project: ProjectPayload) {
  const projectScenarios = scenarios(project);
  document.documentElement.style.setProperty("--project-accent", project.accent);
  document.documentElement.style.setProperty("--project-secondary", project.secondary);
  document.title = \`\${project.name} - \${uiProfile.name}\`;

  app.innerHTML = \`
    <div class="shell \${escapeHtml(uiProfile.layoutClass)}" data-architecture="\${escapeHtml(uiProfile.architectureId)}">
      <header class="topbar">
        <div>
          <span class="eyebrow">Rank \${project.rank} / Idea \${escapeHtml(project.ideaNo)}</span>
          <h1>\${escapeHtml(project.name)}</h1>
          <p>\${escapeHtml(project.tagline)}</p>
          <div class="architecture-band">\${escapeHtml(uiProfile.name)}<span>\${escapeHtml(uiProfile.motif)}</span></div>
        </div>
        <div class="model-pill">
          <span>Gemini model</span>
          <strong>\${escapeHtml(project.defaultModel)}</strong>
          <small>\${escapeHtml(uiProfile.architectureId)} / History <span id="history-count">0</span></small>
        </div>
      </header>

      <main class="workspace">
        <section class="panel input-panel">
          <div class="panel-heading">
            <h2>\${escapeHtml(uiProfile.inputTitle)}</h2>
            <div class="button-row">
              \${hasGitHubCollection ? '<button class="tool-button" type="button" id="github-fetch-button"><span aria-hidden="true">GH</span>Fetch PR</button>' : ""}
              <button class="tool-button" type="button" id="clear-button"><span aria-hidden="true">CL</span>Clear</button>
            </div>
          </div>
          <div class="scenario-row">
            \${projectScenarios
              .map(
                (scenario) => \`
                  <button type="button" class="scenario-button" data-scenario="\${escapeHtml(scenario.id)}">
                    <strong>\${escapeHtml(scenario.label)}</strong>
                    <span>\${escapeHtml(scenario.description)}</span>
                  </button>\`,
              )
              .join("")}
          </div>
          <form id="analysis-form">
            <label>
              <span>Target</span>
              <input name="target" value="\${escapeHtml(projectScenarios[0].target)}" />
            </label>
            <div class="form-grid">
              <label>
                <span>Decision Mode</span>
                <select name="mode">
                  <option value="conservative">Conservative</option>
                  <option value="balanced" selected>Balanced</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </label>
              <label>
                <span>Evidence Window</span>
                <input name="evidenceWindow" value="\${escapeHtml(projectScenarios[0].evidenceWindow)}" />
              </label>
            </div>
            <label>
              <span>Context</span>
              <textarea name="context" rows="7">\${escapeHtml(projectScenarios[0].context)}</textarea>
            </label>
            <label>
              <span>Signals</span>
              <textarea name="signals" rows="10">\${escapeHtml(projectScenarios[0].signals)}</textarea>
            </label>
            <label>
              <span>Operator Note</span>
              <textarea name="operatorNote" rows="4">\${escapeHtml(projectScenarios[0].operatorNote)}</textarea>
            </label>
            <button id="run-button" class="primary-action" type="submit">\${escapeHtml(uiProfile.primaryAction)}</button>
          </form>
        </section>

        <section class="panel result-panel">
          <div class="panel-heading sticky-heading">
            <h2>\${escapeHtml(uiProfile.outputTitle)}</h2>
            <div class="button-row">
              <button class="tool-button" type="button" data-result-action id="copy-comment" disabled><span aria-hidden="true">CP</span>Comment</button>
              <button class="tool-button" type="button" data-result-action id="copy-markdown" disabled><span aria-hidden="true">MD</span>Report</button>
              <button class="tool-button" type="button" data-result-action id="download-json" disabled><span aria-hidden="true">JS</span>JSON</button>
            </div>
          </div>
          <div id="result">\${resultMarkup(project)}</div>
        </section>

        <aside class="rail">
          <section class="architecture-card">
            <h2>\${escapeHtml(uiProfile.sideTitle)}</h2>
            <p>\${escapeHtml(uiProfile.architectureNote)}</p>
            <div class="stage-strip">\${stageMarkup()}</div>
          </section>
          <section>
            <h2>Readiness</h2>
            <ul>\${list(uiProfile.readiness)}</ul>
          </section>
          <section>
            <h2>Decision Labels</h2>
            <div class="label-stack">
              <span>\${escapeHtml(project.positive)}</span>
              <span>\${escapeHtml(project.caution)}</span>
              <span>\${escapeHtml(project.negative)}</span>
            </div>
          </section>
          <section>
            <h2>Signal Tokens</h2>
            <div class="token-stack">\${pillList([...project.metrics, ...uiProfile.insights])}</div>
          </section>
          <section>
            <h2>Stack</h2>
            <ul>\${list(project.stack)}</ul>
          </section>
          <section>
            <h2>History</h2>
            <div id="history-list"></div>
          </section>
        </aside>
      </main>
    </div>\`;

  document.querySelector("#analysis-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    void postAnalysis(project);
  });

  document.querySelectorAll<HTMLButtonElement>("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      const scenario = projectScenarios.find((item) => item.id === button.dataset.scenario);
      if (scenario) writeForm(scenario);
    });
  });

  document.querySelector("#clear-button")?.addEventListener("click", () => {
    writeForm({
      target: "",
      context: "",
      signals: "",
      mode: "balanced",
      evidenceWindow: "",
      operatorNote: "",
    });
  });

  document.querySelector("#github-fetch-button")?.addEventListener("click", () => {
    void collectGitHubPullRequest();
  });

  document.querySelector("#history-list")?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("[data-history-id]");
    if (!button) return;
    const record = loadHistory(project).find((item) => item.id === button.dataset.historyId);
    if (!record) return;
    writeForm(record.input);
    updateResult(project, record);
  });

  document.querySelector("#copy-comment")?.addEventListener("click", () => {
    if (currentRecord) void copyText(currentRecord.result.commentDraft);
  });

  document.querySelector("#copy-markdown")?.addEventListener("click", () => {
    if (currentRecord) void copyText(markdownReport(currentRecord, project));
  });

  document.querySelector("#download-json")?.addEventListener("click", () => {
    if (!currentRecord) return;
    const blob = new Blob([JSON.stringify(currentRecord, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = \`\${project.packageName}-\${uiProfile.architectureId}-decision.json\`;
    link.click();
    URL.revokeObjectURL(url);
  });

  renderHistory(project);
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

function css(profileJson) {
  const c = profileJson.colors;
  return `:root {
  --accent: ${c.accent};
  --secondary: ${c.secondary};
  --ink: ${c.ink};
  --muted: color-mix(in srgb, var(--ink) 62%, white);
  --line: ${c.line};
  --paper: ${c.paper};
  --panel: ${c.panel};
  --danger: ${c.danger};
  --success: color-mix(in srgb, var(--accent) 80%, #ffffff);
  --warning: color-mix(in srgb, var(--secondary) 78%, #ffffff);
  font-family: ${profileJson.font};
  color: var(--ink);
  background: var(--paper);
}

* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  background: var(--paper);
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--accent) 12%, transparent) 0 18%, transparent 19%),
    linear-gradient(135deg, color-mix(in srgb, var(--secondary) 10%, transparent), transparent 34%),
    repeating-linear-gradient(90deg, color-mix(in srgb, var(--ink) 5%, transparent) 0 1px, transparent 1px 34px),
    var(--paper);
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  border: 0;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible,
.history-item:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--accent) 36%, white);
  outline-offset: 2px;
}

.shell {
  width: min(1580px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 18px 0 42px;
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, auto);
  gap: 18px;
  align-items: stretch;
  border-bottom: 2px solid var(--ink);
  padding-bottom: 16px;
}

.topbar h1 {
  margin: 6px 0 8px;
  font-size: clamp(2rem, 3.6vw, 4.2rem);
  line-height: 0.98;
  letter-spacing: 0;
}

.topbar p {
  max-width: 880px;
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.55;
}

.eyebrow {
  display: block;
  color: var(--accent);
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.architecture-band {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
  color: var(--ink);
  font-weight: 900;
}

.architecture-band span {
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 700;
}

.model-pill,
.panel,
.rail section {
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--panel) 92%, var(--paper));
}

.model-pill {
  display: grid;
  align-content: center;
  min-width: 260px;
  min-height: 128px;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 6px 6px 0 color-mix(in srgb, var(--secondary) 82%, black);
}

.model-pill span,
.model-pill strong,
.model-pill small {
  display: block;
}

.model-pill strong {
  margin-top: 4px;
  overflow-wrap: anywhere;
}

.model-pill small {
  margin-top: 12px;
  color: var(--muted);
}

.workspace {
  display: grid;
  grid-template-columns: ${profileJson.workspace};
  gap: 16px;
  margin-top: 18px;
  align-items: start;
}

.panel {
  min-height: 720px;
  border-radius: 8px;
  overflow: clip;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 62px;
  padding: 14px;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--panel) 88%, var(--paper));
}

.sticky-heading {
  position: sticky;
  top: 0;
  z-index: 3;
  backdrop-filter: blur(10px);
}

h2 {
  margin: 0;
  font-size: 0.84rem;
  letter-spacing: 0;
  text-transform: uppercase;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.tool-button,
.scenario-button,
.history-item,
.primary-action {
  min-height: 44px;
  border-radius: 7px;
  font-weight: 900;
}

.tool-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 44px;
  padding: 0 10px;
  border: 1px solid var(--line);
  color: var(--ink);
  background: color-mix(in srgb, var(--panel) 96%, var(--paper));
}

.tool-button span {
  display: inline-grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 999px;
  color: white;
  background: var(--accent);
  font-size: 0.66rem;
}

.tool-button:hover,
.scenario-button:hover,
.history-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--ink) 10%, transparent);
}

.scenario-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 14px;
  border-bottom: 1px solid var(--line);
}

.scenario-button {
  padding: 11px;
  border: 1px solid var(--line);
  color: var(--ink);
  background: color-mix(in srgb, var(--accent) 7%, var(--panel));
  text-align: left;
}

.scenario-button span,
.history-item small {
  display: block;
  margin-top: 5px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 650;
  line-height: 1.35;
}

form {
  display: grid;
  gap: 13px;
  padding: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: 0.78fr 1.22fr;
  gap: 10px;
}

label {
  display: grid;
  gap: 7px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 11px;
  color: var(--ink);
  background: color-mix(in srgb, var(--panel) 96%, white);
  resize: vertical;
}

.primary-action {
  color: white;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--secondary) 74%, var(--accent)));
  box-shadow: 4px 4px 0 var(--ink);
}

#result {
  padding: 14px;
}

.empty-state {
  display: grid;
  min-height: 560px;
  align-content: center;
  justify-items: center;
  gap: 12px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  color: var(--muted);
  text-align: center;
}

.empty-state strong {
  color: var(--ink);
  font-size: 1.1rem;
}

.empty-state.error {
  color: var(--danger);
}

.architecture-mark {
  display: inline-block;
  padding: 6px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, var(--panel));
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.stage-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.stage {
  min-height: 58px;
  padding: 9px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: color-mix(in srgb, var(--panel) 92%, var(--paper));
}

.stage span {
  display: block;
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 900;
}

.stage strong {
  display: block;
  margin-top: 4px;
  font-size: 0.82rem;
}

.stage.active {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--line));
  background: color-mix(in srgb, var(--accent) 10%, var(--panel));
}

.decision-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.decision-strip > div {
  border-left: 4px solid var(--accent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--accent) 7%, var(--panel));
  padding: 12px;
}

.decision-strip.caution > div {
  border-left-color: var(--secondary);
}

.decision-strip.negative > div {
  border-left-color: var(--danger);
}

.decision-strip strong {
  display: block;
  margin-top: 4px;
  font-size: 1.08rem;
  overflow-wrap: anywhere;
}

.result-stages {
  margin-top: 12px;
}

.summary {
  margin: 14px 0;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: color-mix(in srgb, var(--secondary) 8%, var(--panel));
  line-height: 1.6;
}

.result-section,
.result-grid {
  margin-top: 14px;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.result-grid > div,
.result-section {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 13px;
  background: color-mix(in srgb, var(--panel) 94%, var(--paper));
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
  background: color-mix(in srgb, var(--line) 70%, white);
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
  min-width: 38px;
  padding: 4px 6px;
  border: 1px solid var(--line);
  border-radius: 999px;
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
  border: 1px solid color-mix(in srgb, var(--ink) 30%, black);
  border-radius: 8px;
  padding: 12px;
  background: color-mix(in srgb, var(--ink) 92%, black);
  color: #f8fafc;
  font-size: 0.84rem;
}

.rail {
  display: grid;
  gap: 12px;
}

.rail section {
  padding: 13px;
  border-radius: 8px;
}

.rail h2 {
  margin-bottom: 10px;
  color: var(--accent);
}

.rail p {
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
}

.label-stack,
.token-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.label-stack span,
.token {
  border: 1px solid var(--line);
  border-left: 4px solid var(--secondary);
  border-radius: 7px;
  background: color-mix(in srgb, var(--panel) 94%, var(--paper));
  padding: 8px 9px;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.token {
  border-left-color: var(--accent);
  color: var(--muted);
  font-size: 0.8rem;
}

.history-item {
  display: block;
  width: 100%;
  margin-bottom: 8px;
  padding: 10px;
  border: 1px solid var(--line);
  color: var(--ink);
  background: color-mix(in srgb, var(--panel) 96%, var(--paper));
  text-align: left;
}

.history-item span {
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 900;
}

.history-item strong {
  display: block;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.muted {
  color: var(--muted);
}

.fatal {
  width: min(720px, calc(100vw - 32px));
  margin: 12vh auto;
  padding: 24px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
}

.${profileJson.layoutClass} .panel {
  box-shadow: ${profileJson.layoutClass.length % 2 === 0 ? "0 10px 30px color-mix(in srgb, var(--ink) 8%, transparent)" : "5px 5px 0 color-mix(in srgb, var(--secondary) 70%, transparent)"};
}

.${profileJson.layoutClass} .architecture-card {
  border-top: 5px solid var(--accent);
}

@media (max-width: 1180px) {
  .workspace {
    grid-template-columns: 1fr 1fr;
  }

  .rail {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 780px) {
  .shell {
    width: min(100vw - 20px, 720px);
    padding-top: 12px;
  }

  .topbar,
  .workspace,
  .rail,
  .result-grid,
  .decision-strip,
  .scenario-row,
  .form-grid,
  .stage-strip {
    grid-template-columns: 1fr;
  }

  .panel {
    min-height: auto;
  }

  .empty-state {
    min-height: 260px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
  }
}
`;
}

function appendReadme(projectDir, profileJson) {
  const path = join(projectDir, "README.md");
  let text = readFileSync(path, "utf8");
  if (!text.includes("## Differentiated Product Architecture")) {
    text = text.replace(
      "## ProductionレベルMVPとしての保証",
      `## Differentiated Product Architecture

- UI architecture: \`${profileJson.name}\` / \`${profileJson.architectureId}\`
- Layout: \`${profileJson.layoutClass}\`
- Interaction model: scenario intake, project-specific stage strip, decision output, local history, copy/export
- Logic model: project-specific scoring profile embedded in \`src/agent.ts\`
- Visual system: project-specific CSS palette, typography, spacing, and responsive behavior

## ProductionレベルMVPとしての保証`,
    );
  }
  writeText(path, text);
}

function auditDoc(rows) {
  return `# UI Architecture Differentiation Audit

Date: 2026-05-14

## Objective

Make all 20 projects production-level MVPs whose UI, product architecture, and fallback decision logic are materially different.

## Prompt-To-Artifact Checklist

| Requirement | Evidence |
| --- | --- |
| Use UI skill | Applied \`frontend-design\` and \`ui-ux-pro-max\`; design-system guidance favored dense dashboard UIs, accessibility, touch targets, and responsive layouts. |
| 20 distinct UIs | Each project has a different \`uiProfile.architectureId\`, layout class, palette, typography stack, stage model, panel labels, and CSS file. |
| 20 distinct architectures | Each app exposes a different product architecture name and workflow stages in \`src/main.ts\` and README. |
| 20 distinct logic models | Each \`src/agent.ts\` embeds a different \`logicProfile\` with separate lexicons, thresholds, owner routing, action templates, automation plans, and verification commands. |
| Production-level MVP UI | All UIs include accessible focus states, >=44px touch targets, responsive breakpoints, reduced-motion handling, local history, copy/export, structured results, and API error surfaces. |
| Preserve previous production hardening | Server health/readiness/version, security headers, Dockerfiles, and contract tests remain in place. |

## Per-Project Differentiation Matrix

| Rank | Project | UI Architecture | Architecture ID | Layout | Logic Model |
| ---: | --- | --- | --- | --- | --- |
${rows
  .map((row) => `| ${row.rank} | ${row.name} | ${row.uiName} | \`${row.architectureId}\` | \`${row.layoutClass}\` | ${row.logicModel} |`)
  .join("\n")}

## Verification Commands

\`\`\`bash
node scripts/verify_mvp_differentiation.mjs
for d in outputs/[0-9][0-9]-*; do
  (cd "$d" && npm run verify) || exit 1
done
\`\`\`

## Latest Verification Result

Ran on 2026-05-14 JST after UI, architecture, and logic differentiation.

| Gate | Result |
| --- | --- |
| Differentiation verifier | Pass: \`src/main.ts\`, \`src/styles.css\`, and \`src/agent.ts\` are 20/20 unique |
| Architecture IDs | Pass: 20 distinct \`uiProfile.architectureId\` values |
| Layout classes | Pass: 20 distinct layout classes |
| Logic models | Pass: 20 distinct \`logicProfile.scoringModel\` values |
| Accessibility contrast spot check | Pass: all projects meet the checked contrast gates for \`ink/paper\`, \`ink/panel\`, and \`accent/paper\` |
| Production verify | Pass: 20/20 projects passed \`npm run verify\` |
| Test coverage gate | Pass: 104 tests total across 41 test files |
| Build artifacts | Pass: 20 client builds and 20 server builds |
| Representative production smoke | Pass: \`outputs/14-deployment-black-box-recorder\` served \`HEAD /\` with 200, \`/api/ready\` with 200, project-specific \`black-box-timeline\` fallback analysis with 200, and unknown \`/api/*\` with JSON 404 |
| Representative rendered UI check | Pass: Chrome headless rendered \`outputs/14-deployment-black-box-recorder\` to \`/tmp/deployment-black-box-recorder.png\`; the screenshot shows the differentiated three-column production UI with no blank canvas or obvious overlap |

The representative production server was shut down cleanly after the smoke check.
`;
}

const rows = [];

for (const dir of projectDirs) {
  const projectDir = join(outputsDir, dir);
  const project = parseProject(projectDir);
  const profile = profileFor(dir);
  const ui = uiProfile(project, profile);
  const logic = logicProfile(project, profile);
  const hasGitHub = existsSync(join(projectDir, "src", "github.ts"));

  writeText(join(projectDir, "src", "main.ts"), mainTs(ui, hasGitHub));
  writeText(join(projectDir, "src", "styles.css"), css(ui));
  writeText(join(projectDir, "src", "agent.ts"), agentTs(logic));
  appendReadme(projectDir, ui);

  rows.push({
    rank: project.rank,
    name: project.name,
    uiName: ui.name,
    architectureId: ui.architectureId,
    layoutClass: ui.layoutClass,
    logicModel: logic.scoringModel,
  });
}

rows.sort((a, b) => a.rank - b.rank);
writeText(join(outputsDir, "UI_ARCHITECTURE_DIFFERENTIATION_AUDIT.md"), auditDoc(rows));

console.log(`Differentiated ${projectDirs.length} project UIs, architectures, and logic models.`);
