import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outputsDir = join(root, "outputs");
const projectDirs = readdirSync(outputsDir)
  .filter((entry) => /^\d{2}-/.test(entry))
  .sort();

function writeText(path, text) {
  writeFileSync(path, text.replace(/\n+$/, "\n"), "utf8");
}

function parseProject(projectPath) {
  const source = readFileSync(projectPath, "utf8");
  const start = source.indexOf("{");
  const end = source.lastIndexOf("} as const");
  return JSON.parse(source.slice(start, end + 1));
}

function updateServer(projectDir) {
  const file = join(outputsDir, projectDir, "src/server.ts");
  let text = readFileSync(file, "utf8");
  if (!text.includes('import { z } from "zod";')) {
    text = text.replace('import helmet from "helmet";\n', 'import helmet from "helmet";\nimport { z } from "zod";\n');
  }
  if (!text.includes("ProductEventSchema")) {
    text = text.replace(
      'const bodyLimit = process.env.JSON_BODY_LIMIT || "1mb";\n',
      `const bodyLimit = process.env.JSON_BODY_LIMIT || "1mb";\n\nconst ProductEventSchema = z.object({\n  eventName: z.enum([\n    "analysis_started",\n    "analysis_completed",\n    "analysis_failed",\n    "feedback_submitted",\n    "github_pr_collected",\n    "copy_comment",\n    "copy_markdown",\n    "download_json",\n  ]),\n  target: z.string().trim().max(4000).default(""),\n  decision: z.string().trim().max(120).optional(),\n  confidence: z.coerce.number().min(0).max(100).optional(),\n  source: z.string().trim().max(80).optional(),\n  feedbackScore: z.coerce.number().min(-1).max(1).optional(),\n  feedbackReason: z.string().trim().max(1000).optional(),\n  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),\n});\n`,
    );
  }
  text = text.replace(
    '.includes(req.path);',
    '.includes(req.path);',
  );
  text = text.replace(
    '["/api/analyze", "/api/collect/github-pr"].includes(req.path)',
    '["/api/analyze", "/api/collect/github-pr", "/api/events"].includes(req.path)',
  );
  text = text.replace(
    '["/api/analyze"].includes(req.path)',
    '["/api/analyze", "/api/events"].includes(req.path)',
  );
  if (!text.includes('app.post("/api/events"')) {
    text = text.replace(
      '  if (clientDir) {\n',
      `  app.post("/api/events", (req, res) => {\n    const parsed = ProductEventSchema.safeParse(req.body);\n    if (!parsed.success) {\n      sendApiError(res, 400, "PRODUCT_EVENT_INVALID", "Product event does not match the telemetry schema", parsed.error.flatten());\n      return;\n    }\n\n    log("info", "product_event", {\n      requestId: res.locals.requestId,\n      event: parsed.data,\n    });\n    res.status(202).json({\n      ok: true,\n      accepted: true,\n      requestId: res.locals.requestId,\n    });\n  });\n\n  if (clientDir) {\n`,
    );
  }
  writeText(file, text);
}

function updateServerTests(projectDir) {
  const file = join(outputsDir, projectDir, "src/server.test.ts");
  let text = readFileSync(file, "utf8");
  if (!text.includes("accepts product learning events")) {
    const addition = `\n  test("accepts product learning events", async () => {\n    const baseUrl = await withServer();\n    const response = await fetch(\`\${baseUrl}/api/events\`, {\n      method: "POST",\n      headers: { "Content-Type": "application/json" },\n      body: JSON.stringify({\n        eventName: "feedback_submitted",\n        target: project.sampleTarget,\n        decision: project.positive,\n        confidence: "83",\n        source: "local-fallback",\n        feedbackScore: 1,\n        feedbackReason: "Useful enough for the next release meeting.",\n        metadata: { mode: "balanced", copied: true },\n      }),\n    });\n\n    expect(response.status).toBe(202);\n    await expect(response.json()).resolves.toMatchObject({ ok: true, accepted: true });\n  });\n\n  test("rejects malformed product learning events", async () => {\n    const baseUrl = await withServer();\n    const response = await fetch(\`\${baseUrl}/api/events\`, {\n      method: "POST",\n      headers: { "Content-Type": "application/json" },\n      body: JSON.stringify({ eventName: "unknown_event" }),\n    });\n\n    expect(response.status).toBe(400);\n    await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code: "PRODUCT_EVENT_INVALID" } });\n  });\n`;
    text = text.replace('  test("requires API authentication for protected endpoints when enabled"', `${addition}\n  test("requires API authentication for protected endpoints when enabled"`);
  }
  writeText(file, text);
}

function updateMain(projectDir) {
  const file = join(outputsDir, projectDir, "src/main.ts");
  let text = readFileSync(file, "utf8");
  if (!text.includes("function targetFingerprint")) {
    text = text.replace(
      `function escapeHtml(value: string | number | undefined) {\n`,
      `function targetFingerprint(value: string) {\n  const normalized = value.trim();\n  if (!normalized) return "";\n  return normalized.length <= 96 ? normalized : \`\${normalized.slice(0, 72)}...\${normalized.slice(-18)}\`;\n}\n\nasync function sendProductEvent(\n  eventName:\n    | "analysis_started"\n    | "analysis_completed"\n    | "analysis_failed"\n    | "feedback_submitted"\n    | "github_pr_collected"\n    | "copy_comment"\n    | "copy_markdown"\n    | "download_json",\n  data: Partial<Pick<Analysis, "decision" | "confidence" | "source">> & {\n    target?: string;\n    feedbackScore?: number;\n    feedbackReason?: string;\n    metadata?: Record<string, string | number | boolean | null>;\n  } = {},\n) {\n  try {\n    await fetch("/api/events", {\n      method: "POST",\n      headers: apiHeaders({ "Content-Type": "application/json" }),\n      body: JSON.stringify({\n        eventName,\n        target: targetFingerprint(data.target || readForm()?.target || ""),\n        decision: data.decision,\n        confidence: data.confidence,\n        source: data.source,\n        feedbackScore: data.feedbackScore,\n        feedbackReason: data.feedbackReason,\n        metadata: data.metadata || {},\n      }),\n    });\n  } catch {\n    // Product telemetry must never block the operator workflow.\n  }\n}\n\nfunction escapeHtml(value: string | number | undefined) {\n`,
    );
  }
  if (!text.includes("Product Feedback")) {
    text = text.replace(
      `    <section class="result-section">\n      <h2>Comment Draft</h2>\n      <pre>\${escapeHtml(result.commentDraft)}</pre>\n    </section>\`;`,
      `    <section class="result-section">\n      <h2>Comment Draft</h2>\n      <pre>\${escapeHtml(result.commentDraft)}</pre>\n    </section>\n    <section class="result-section feedback-panel">\n      <h2>Product Feedback</h2>\n      <p>Record whether this decision was useful enough for a real operating moment.</p>\n      <div class="feedback-row">\n        <button type="button" class="tool-button" data-feedback-score="1">Useful</button>\n        <button type="button" class="tool-button" data-feedback-score="0">Unclear</button>\n        <button type="button" class="tool-button" data-feedback-score="-1">Wrong</button>\n      </div>\n      <textarea id="feedback-note" rows="3" placeholder="What would make this safer or more useful?"></textarea>\n    </section>\`;`,
    );
  }
  if (!text.includes('sendProductEvent("analysis_started"')) {
    text = text.replace(
      `  output.innerHTML = \`<div class="empty-state"><div class="architecture-mark">\${escapeHtml(uiProfile.architectureId)}</div><strong>Analyzing evidence</strong><p>\${escapeHtml(uiProfile.motif)}</p></div>\`;\n\n  const response = await fetch("/api/analyze", {`,
      `  output.innerHTML = \`<div class="empty-state"><div class="architecture-mark">\${escapeHtml(uiProfile.architectureId)}</div><strong>Analyzing evidence</strong><p>\${escapeHtml(uiProfile.motif)}</p></div>\`;\n  void sendProductEvent("analysis_started", {\n    target: input.target,\n    metadata: { mode: input.mode, contextLength: input.context.length, signalsLength: input.signals.length },\n  });\n\n  const response = await fetch("/api/analyze", {`,
    );
    text = text.replace(
      `    const error = await response.text();\n    output.innerHTML = \`<div class="empty-state error"><strong>Analysis failed</strong><p>\${escapeHtml(error)}</p></div>\`;`,
      `    const error = await response.text();\n    void sendProductEvent("analysis_failed", {\n      target: input.target,\n      metadata: { status: response.status, bodyLength: error.length },\n    });\n    output.innerHTML = \`<div class="empty-state error"><strong>Analysis failed</strong><p>\${escapeHtml(error)}</p></div>\`;`,
    );
    text = text.replace(
      `    saveHistory(project, [record, ...loadHistory(project)]);\n    updateResult(project, record);`,
      `    saveHistory(project, [record, ...loadHistory(project)]);\n    void sendProductEvent("analysis_completed", {\n      target: input.target,\n      decision: result.decision,\n      confidence: result.confidence,\n      source: result.source,\n      metadata: { mode: result.mode, actionCount: result.actions.length, riskCount: result.risks.length },\n    });\n    updateResult(project, record);`,
    );
    text = text.replace(
      `    const collected = (await response.json()) as GitHubCollection;\n    writeForm({`,
      `    const collected = (await response.json()) as GitHubCollection;\n    void sendProductEvent("github_pr_collected", {\n      target: collected.target,\n      metadata: { repo: \`\${collected.metadata.owner}/\${collected.metadata.repo}\`, files: collected.metadata.files },\n    });\n    writeForm({`,
    );
  }
  if (!text.includes('sendProductEvent("copy_comment"')) {
    text = text.replace(
      `  document.querySelector("#copy-comment")?.addEventListener("click", () => {\n    if (currentRecord) void copyText(currentRecord.result.commentDraft);\n  });`,
      `  document.querySelector("#copy-comment")?.addEventListener("click", () => {\n    if (!currentRecord) return;\n    void copyText(currentRecord.result.commentDraft);\n    void sendProductEvent("copy_comment", {\n      target: currentRecord.input.target,\n      decision: currentRecord.result.decision,\n      confidence: currentRecord.result.confidence,\n      source: currentRecord.result.source,\n    });\n  });`,
    );
    text = text.replace(
      `  document.querySelector("#copy-markdown")?.addEventListener("click", () => {\n    if (currentRecord) void copyText(markdownReport(currentRecord, project));\n  });`,
      `  document.querySelector("#copy-markdown")?.addEventListener("click", () => {\n    if (!currentRecord) return;\n    void copyText(markdownReport(currentRecord, project));\n    void sendProductEvent("copy_markdown", {\n      target: currentRecord.input.target,\n      decision: currentRecord.result.decision,\n      confidence: currentRecord.result.confidence,\n      source: currentRecord.result.source,\n    });\n  });`,
    );
    text = text.replace(
      `    link.download = \`\${project.packageName}-\${uiProfile.architectureId}-decision.json\`;\n    link.click();\n    URL.revokeObjectURL(url);`,
      `    link.download = \`\${project.packageName}-\${uiProfile.architectureId}-decision.json\`;\n    link.click();\n    URL.revokeObjectURL(url);\n    void sendProductEvent("download_json", {\n      target: currentRecord.input.target,\n      decision: currentRecord.result.decision,\n      confidence: currentRecord.result.confidence,\n      source: currentRecord.result.source,\n    });`,
    );
  }
  if (!text.includes("[data-feedback-score]")) {
    text = text.replace(
      `  document.querySelector("#history-list")?.addEventListener("click", (event) => {`,
      `  document.querySelector("#result")?.addEventListener("click", (event) => {\n    const target = event.target as HTMLElement;\n    const button = target.closest<HTMLButtonElement>("[data-feedback-score]");\n    if (!button || !currentRecord) return;\n    const note = document.querySelector<HTMLTextAreaElement>("#feedback-note")?.value || "";\n    const score = Number(button.dataset.feedbackScore || 0);\n    void sendProductEvent("feedback_submitted", {\n      target: currentRecord.input.target,\n      decision: currentRecord.result.decision,\n      confidence: currentRecord.result.confidence,\n      source: currentRecord.result.source,\n      feedbackScore: score,\n      feedbackReason: note,\n      metadata: { mode: currentRecord.result.mode },\n    });\n    button.textContent = "Recorded";\n  });\n\n  document.querySelector("#history-list")?.addEventListener("click", (event) => {`,
    );
  }
  writeText(file, text);
}

function updateStyles(projectDir) {
  const file = join(outputsDir, projectDir, "src/styles.css");
  let css = readFileSync(file, "utf8");
  if (!css.includes(".feedback-panel")) {
    css += `

.feedback-panel {
  display: grid;
  gap: 12px;
}

.feedback-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feedback-panel textarea {
  width: 100%;
  min-height: 76px;
}
`;
  }
  writeText(file, css);
}

function productDoc(project) {
  return `# Product Strategy: ${project.name}

## Critical Verdict

This is a startup-grade validation MVP, not proof of product-market fit. It becomes a real product only if target users repeatedly use it during live operational decisions and trust the output enough to copy, share, or act on it.

## Ideal Customer Profile

- Team: SaaS or platform engineering team running Cloud Run, GitHub PRs, CI, and incident/release workflows.
- Buyer: Head of Engineering, Platform Lead, SRE Manager, or DevOps owner.
- Daily user: release manager, incident commander, on-call engineer, reviewer, or platform engineer.
- Urgent pain: ${project.role} decisions require scattered evidence and are still made by whoever happens to be online.

## Job To Be Done

When ${project.focusAreas.join(", ")} create ambiguity, the user wants to turn raw operational evidence into a decision, owner, verification command, and shareable comment before the window closes.

## Wedge Hypothesis

If ${project.name} can make one high-pressure ${project.focusAreas[0]} decision faster and easier to explain, teams will first use it as a review/incident assistant, then ask for deeper integrations with GitHub, Cloud Logging, Cloud Monitoring, Slack, and audit storage.

## Activation Metric

A user reaches activation when they run an analysis and then copies a comment, exports a report, downloads JSON, or submits useful feedback in the same session.

## Retention Metric

Weekly retained team usage: at least three operational decisions per week from the same team, with at least one copied/exported artifact and one feedback event.

## Pricing Hypothesis

- Starter: free or low-cost single service/team workspace for validation.
- Team: paid per engineering team once GitHub/Cloud integrations and audit history are connected.
- Enterprise: SSO, retention controls, policy approvals, and centralized reporting.

## Two-Week Validation Plan

1. Recruit five teams with active release or incident pain.
2. Ask each team to bring one real recent decision and one upcoming decision.
3. Measure time-to-first-verdict, copied artifacts, feedback score, and whether the output changed the human conversation.
4. Interview users within 24 hours after each use.
5. Keep the product only if it earns repeat usage without the builder present.

## No-Go Or Pivot Criteria

- Users treat the output as a demo summary and do not copy or share it.
- Decisions require integrations before anyone will use the workflow.
- The team does not trust AI-generated evidence enough to put it in PRs, incident channels, or runbooks.
- The product saves less than ten minutes or does not reduce coordination load.

## Instrumentation

The app emits structured product events to \`POST /api/events\` for:

- \`analysis_started\`
- \`analysis_completed\`
- \`analysis_failed\`
- \`feedback_submitted\`
- \`github_pr_collected\`
- \`copy_comment\`
- \`copy_markdown\`
- \`download_json\`

In Cloud Run, these events appear in structured logs and can be exported to BigQuery or a product analytics system.
`;
}

function updateReadme(projectDir) {
  const file = join(outputsDir, projectDir, "README.md");
  let readme = readFileSync(file, "utf8");
  readme = readme.replace(/## Startup Product Validation[\s\S]*?(?=\n## |\n?$)/, "");
  const section = `
## Startup Product Validation

- [Product strategy](./docs/product.md) defines ICP, job-to-be-done, wedge hypothesis, activation, retention, pricing hypothesis, validation plan, and no-go criteria.
- The UI captures product feedback after each decision.
- \`POST /api/events\` records activation and feedback events as structured logs for learning loops.
`;
  const marker = "\n## Production Security Hardening\n";
  readme = readme.includes(marker) ? readme.replace(marker, `${section}${marker}`) : `${readme}${section}`;
  writeText(file, readme);
}

for (const dir of projectDirs) {
  const project = parseProject(join(outputsDir, dir, "src/project.ts"));
  updateServer(dir);
  updateServerTests(dir);
  updateMain(dir);
  updateStyles(dir);
  mkdirSync(join(outputsDir, dir, "docs"), { recursive: true });
  writeText(join(outputsDir, dir, "docs/product.md"), productDoc(project));
  updateReadme(dir);
}

const manifestPath = join(outputsDir, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.startupProduct = {
  generatedAt: "2026-05-25",
  productTelemetry: true,
  feedbackLoop: true,
  productStrategyDocs: true,
  validationPlan: true,
  noGoCriteria: true,
};
for (const project of manifest.projects) {
  project.docs = {
    ...(project.docs || {}),
    product: `${project.path}/docs/product.md`,
  };
}
writeText(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
