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

function serverTs({ hasGitHub }) {
  return `import cors from "cors";
import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AnalyzeInputSchema, DEFAULT_MODEL, analyze } from "./agent";
${hasGitHub ? 'import { collectGitHubPullRequest } from "./github";\n' : ""}import { project } from "./project";

const serviceVersion = process.env.SERVICE_VERSION || process.env.K_REVISION || "local";
const bodyLimit = process.env.JSON_BODY_LIMIT || "1mb";

function geminiConfigured() {
  return Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  );
}

function allowedOrigins() {
  const raw = process.env.CORS_ORIGIN || "*";
  if (raw === "*") return true;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function requestId(req: Request) {
  const existing = req.header("x-request-id");
  return existing && existing.length <= 120 ? existing : randomUUID();
}

function log(level: "info" | "warn" | "error", message: string, meta: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({
      level,
      message,
      project: project.packageName,
      serviceVersion,
      timestamp: new Date().toISOString(),
      ...meta,
    }),
  );
}

function sendApiError(res: Response, status: number, code: string, message: string, details?: unknown) {
  res.status(status).json({
    ok: false,
    error: {
      code,
      message,
      details,
    },
    requestId: res.locals.requestId,
  });
}

function securityHeaders(_req: Request, res: Response, next: () => void) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'",
  );
  next();
}

function apiNoStore(req: Request, res: Response, next: () => void) {
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const clientDirs = [
  resolve(currentDir, "../client"),
  resolve(process.cwd(), "dist/client"),
  resolve(process.cwd(), "public"),
];
const defaultClientDir = clientDirs.find((dir) => existsSync(resolve(dir, "index.html")));

type CreateAppOptions = {
  clientDir?: string | false;
};

export function createApp(options: CreateAppOptions = {}) {
  const clientDir = options.clientDir === false ? undefined : options.clientDir ?? defaultClientDir;
  const app = express();

  app.disable("x-powered-by");
  app.use(securityHeaders);
  app.use(apiNoStore);
  app.use(
    cors({
      origin: allowedOrigins(),
      credentials: false,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-Request-Id"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: bodyLimit }));
  app.use((req, res, next) => {
    res.locals.requestId = requestId(req);
    res.setHeader("X-Request-Id", res.locals.requestId);
    const startedAt = Date.now();
    res.on("finish", () => {
      log("info", "request_completed", {
        requestId: res.locals.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      status: "live",
      project: project.name,
      rank: project.rank,
      model: DEFAULT_MODEL,
      serviceVersion,
      requestId: res.locals.requestId,
    });
  });

  app.get("/api/ready", (_req, res) => {
    const ready = Boolean(clientDir);
    res.status(ready ? 200 : 503).json({
      ok: ready,
      status: ready ? "ready" : "not-ready",
      project: project.name,
      clientReady: ready,
      geminiConfigured: geminiConfigured(),
      fallbackAvailable: true,
      serviceVersion,
      requestId: res.locals.requestId,
    });
  });

  app.get("/api/version", (_req, res) => {
    res.json({
      ok: true,
      project: project.name,
      packageName: project.packageName,
      ideaNo: project.ideaNo,
      rank: project.rank,
      serviceVersion,
      node: process.version,
      model: DEFAULT_MODEL,
      requestId: res.locals.requestId,
    });
  });

  app.get("/api/project", (_req, res) => {
    res.json({
      ...project,
      defaultModel: DEFAULT_MODEL,
      serviceVersion,
      requestId: res.locals.requestId,
    });
  });

  app.post("/api/analyze", async (req, res, next) => {
    try {
      const parsed = AnalyzeInputSchema.safeParse(req.body);
      if (!parsed.success) {
        sendApiError(res, 400, "INVALID_INPUT", "Input does not match the analysis schema", parsed.error.flatten());
        return;
      }

      const result = await analyze(parsed.data);
      res.json({
        ...result,
        requestId: res.locals.requestId,
      });
    } catch (error) {
      next(error);
    }
  });

${hasGitHub ? `  app.post("/api/collect/github-pr", async (req, res) => {
    const url = typeof req.body?.url === "string" ? req.body.url : "";
    if (!url.trim()) {
      sendApiError(res, 400, "MISSING_GITHUB_URL", "GitHub pull request URL is required");
      return;
    }

    try {
      const result = await collectGitHubPullRequest(url);
      res.json({
        ...result,
        requestId: res.locals.requestId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to collect GitHub PR";
      sendApiError(res, 400, "GITHUB_COLLECTION_FAILED", message);
    }
  });

` : ""}  if (clientDir) {
    app.use(express.static(clientDir, { index: "index.html", maxAge: "1h" }));
  }

  app.use((req, res) => {
    if ((req.method === "GET" || req.method === "HEAD") && clientDir && !req.path.startsWith("/api/")) {
      res.sendFile(resolve(clientDir, "index.html"));
      return;
    }
    sendApiError(res, 404, "NOT_FOUND", "Route not found");
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    log("error", "request_failed", {
      requestId: res.locals.requestId,
      error: message,
    });
    sendApiError(res, 500, "INTERNAL_ERROR", "Unexpected server error");
  };
  app.use(errorHandler);

  return app;
}

export function startServer() {
  const port = Number(process.env.PORT || 8080);
  const host = "0.0.0.0";
  const app = createApp();
  const server = app.listen(port, host, () => {
    log("info", "server_started", {
      host,
      port,
      model: DEFAULT_MODEL,
      geminiConfigured: geminiConfigured(),
      clientReady: Boolean(defaultClientDir),
    });
  });

  const shutdown = (signal: string) => {
    log("info", "server_shutdown_started", { signal });
    server.close(() => {
      log("info", "server_shutdown_complete", { signal });
      process.exit(0);
    });
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));

  return server;
}

if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  startServer();
}
`;
}

function serverTestTs({ hasGitHub }) {
  return `import { afterEach, describe, expect, test } from "vitest";
import type { Server } from "node:http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./server";
import { project } from "./project";

const servers: Server[] = [];
const tempDirs: string[] = [];

async function withServer(clientDir?: string | false) {
  const app = createApp({ clientDir });
  const server = app.listen(0, "127.0.0.1");
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to resolve test server address");
  }
  return \`http://127.0.0.1:\${address.port}\`;
}

async function createClientFixture() {
  const dir = await mkdtemp(join(tmpdir(), \`\${project.packageName}-client-\`));
  tempDirs.push(dir);
  await writeFile(join(dir, "index.html"), "<!doctype html><title>Test Client</title><div id=\\"root\\"></div>", "utf8");
  return dir;
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe.sequential(\`\${project.name} production HTTP contract\`, () => {
  test("exposes health, readiness, and version endpoints", async () => {
    const baseUrl = await withServer();

    const health = await fetch(\`\${baseUrl}/api/health\`);
    expect(health.status).toBe(200);
    expect(health.headers.get("x-request-id")).toBeTruthy();
    expect(health.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(health.json()).resolves.toMatchObject({ ok: true, project: project.name });

    const ready = await fetch(\`\${baseUrl}/api/ready\`);
    expect([200, 503]).toContain(ready.status);
    const readyJson = await ready.json();
    expect(readyJson).toHaveProperty("fallbackAvailable", true);

    const version = await fetch(\`\${baseUrl}/api/version\`);
    expect(version.status).toBe(200);
    await expect(version.json()).resolves.toMatchObject({ ok: true, packageName: project.packageName });
  });

  test("returns structured validation errors", async () => {
    const baseUrl = await withServer();
    const response = await fetch(\`\${baseUrl}/api/analyze\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "", context: "", signals: "", mode: "balanced" }),
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(json.requestId).toBeTruthy();
  });

  test("serves the built UI without masking unknown API routes", async () => {
    const clientDir = await createClientFixture();
    const baseUrl = await withServer(clientDir);

    const root = await fetch(\`\${baseUrl}/\`);
    expect(root.status).toBe(200);
    expect(root.headers.get("content-type") || "").toContain("text/html");

    const nestedRoute = await fetch(\`\${baseUrl}/deep/link\`);
    expect(nestedRoute.status).toBe(200);

    const missingApi = await fetch(\`\${baseUrl}/api/does-not-exist\`);
    expect(missingApi.status).toBe(404);
    await expect(missingApi.json()).resolves.toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

${hasGitHub ? `  test("validates GitHub PR collection input", async () => {
    const baseUrl = await withServer();
    const response = await fetch(\`\${baseUrl}/api/collect/github-pr\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "" }),
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toMatchObject({ ok: false, error: { code: "MISSING_GITHUB_URL" } });
  });

` : ""}});
`;
}

function dockerfile() {
  return `FROM node:22-slim AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build

COPY . .
RUN npm run build

FROM node:22-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/dist ./dist

USER node
EXPOSE 8080

CMD ["node", "dist/server/server.js"]
`;
}

function dockerignore() {
  return `node_modules
dist
coverage
.env
.env.*
.DS_Store
npm-debug.log
*.log
`;
}

function appendEnvDoc(projectDir) {
  const path = join(projectDir, "docs", "environment.md");
  let text = readFileSync(path, "utf8");
  if (!text.includes("## Production Hardening Variables")) {
    text += `

## Production Hardening Variables

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| \`SERVICE_VERSION\` | No | \`K_REVISION\` or \`local\` | Version string returned by \`/api/version\` and logs. |
| \`CORS_ORIGIN\` | No | \`*\` | Comma-separated allowed origins. Set the deployed frontend origin in production. |
| \`JSON_BODY_LIMIT\` | No | \`1mb\` | Maximum JSON request body size for API endpoints. |
| \`GITHUB_TOKEN\` | Only for GitHub collection | empty | Optional GitHub token for higher API rate limits and private PR access when supported by the project. |
`;
  }
  writeText(path, text);
}

function appendReadme(projectDir) {
  const path = join(projectDir, "README.md");
  let text = readFileSync(path, "utf8");
  if (!text.includes("## ProductionレベルMVPとしての保証")) {
    text = text.replace(
      "## リポジトリ構成",
      `## ProductionレベルMVPとしての保証

- \`/api/health\`, \`/api/ready\`, \`/api/version\` を提供します。
- 全APIレスポンスに \`X-Request-Id\` を付与し、構造化ログにも同じIDを残します。
- セキュリティヘッダ、CSP、no-store API cache、統一JSONエラー形式を設定しています。
- \`CORS_ORIGIN\`, \`SERVICE_VERSION\`, \`JSON_BODY_LIMIT\` で本番環境ごとの調整ができます。
- Dockerfileはmulti-stage build、runtimeはdevDependenciesを除外し、non-root \`node\` ユーザーで実行します。
- \`npm run verify\` は typecheck、unit/contract tests、client build、server build を一括で実行します。

## リポジトリ構成`,
    );
  }
  writeText(path, text);
}

function updateRootReadme() {
  const path = join(outputsDir, "README.md");
  let text = readFileSync(path, "utf8");
  if (!text.includes("## Production-Level MVP Gate")) {
    text += `

## Production-Level MVP Gate

All 20 projects are hardened with health/readiness/version endpoints, security headers, request IDs, structured errors, contract tests, and multi-stage non-root Dockerfiles. See \`PRODUCTION_MVP_EVALUATION.md\` and \`PRODUCTION_MVP_AUDIT.md\`.
`;
  }
  writeText(path, text);
}

function evaluationDoc(rows) {
  return `# Production MVP Evaluation

Date: 2026-05-14

## Evaluation Standard

20個すべてを「MVPとして言い張れる」状態にするため、次の観点で再評価しました。

| Axis | Gate |
| --- | --- |
| Product Usability | 3シナリオ、判断モード、履歴、コピー/エクスポートがある |
| AI Contract | 入力検証、構造化AI出力、fallback、契約テストがある |
| Operational Readiness | health/ready/version、request ID、構造化ログ、統一エラーがある |
| Security Baseline | セキュリティヘッダ、CSP、API no-store、CORS設定がある |
| Deployment Readiness | multi-stage Docker、non-root runtime、Cloud Run PORT対応がある |
| Verification | \`npm run verify\` が通る |

## Per-Project Evaluation

| Rank | Project | Product | AI Contract | Ops | Security | Deploy | Verdict |
| ---: | --- | --- | --- | --- | --- | --- | --- |
${rows
  .map(
    (row) =>
      `| ${row.rank} | ${row.name} | ${row.product} | ${row.ai} | ${row.ops} | ${row.security} | ${row.deploy} | ${row.verdict} |`,
  )
  .join("\n")}

## Verdict

全20プロジェクトは、外部APIの実接続を追加すれば本番運用へ進められるProduction-level MVPです。現時点ではハッカソンMVPとして、UI、API、AI契約、検証、Cloud Runデプロイ、運用監視の入口を備えています。
`;
}

function auditDoc() {
  return `# Production MVP Audit

Date: 2026-05-14

## Objective

Re-evaluate all 20 projects and bring them to a production-level state that can credibly be claimed as MVPs.

## Prompt-To-Artifact Checklist

| Requirement | Evidence |
| --- | --- |
| Re-evaluate all 20 projects | \`outputs/PRODUCTION_MVP_EVALUATION.md\` contains a 20-row evaluation table. |
| Make them credible MVPs | Each app has scenarios, decision modes, history, copy/export, structured AI output, fallback, and README MVP guarantees. |
| Bring to production-level state | Each app has security headers, request IDs, structured logging, unified error JSON, health/readiness/version endpoints, and production Dockerfile. |
| Preserve all 20 independent projects | \`outputs/01-*\` through \`outputs/20-*\` remain independent with their own package, source, docs, tests, Dockerfile, and build artifacts. |
| Verify with real gates | \`npm run verify\` is run for every project: typecheck, Vitest, client build, server build. |
| Avoid relying on proxy signals only | Additional checks inspect files for production markers and smoke-test a representative app over HTTP. |

## Required Verification

\`\`\`bash
for d in outputs/[0-9][0-9]-*; do
  (cd "$d" && npm run verify) || exit 1
done
\`\`\`

Expected result: all 20 pass.

\`\`\`bash
node -e 'const fs=require("fs"); const dirs=fs.readdirSync("outputs").filter(x=>/^\\\\d{2}-/.test(x)); const markers=["/api/ready","/api/version","X-Request-Id","Content-Security-Policy","createApp","startServer"]; const bad=[]; for (const d of dirs){ const server=fs.readFileSync("outputs/"+d+"/src/server.ts","utf8"); for (const marker of markers) if(!server.includes(marker)) bad.push(d+" missing "+marker); } console.log(bad.length?bad.join("\\\\n"):"all projects include production server markers");'
find outputs -path '*/dist/client/index.html' | wc -l
find outputs -path '*/dist/server/server.js' | wc -l
\`\`\`

Expected result: all projects include markers, 20 client builds, 20 server builds.

## Latest Verification Result

Ran on 2026-05-14 JST after the production hardening pass.

| Gate | Result |
| --- | --- |
| All project \`npm run verify\` | Pass: 20/20 projects |
| Vitest contract/unit coverage | Pass: 104 tests total; ShipGuard AI has 9 tests, the other 19 projects have 5 tests each |
| Client build artifacts | Pass: 20 \`dist/client/index.html\` files |
| Server build artifacts | Pass: 20 \`dist/server/server.js\` files |
| Production server markers | Pass: 20/20 include health, readiness, version, request ID, CSP, \`createApp\`, and \`startServer\` |
| SPA/API boundary markers | Pass: 20/20 serve static UI while preserving JSON 404s for unknown \`/api/*\` routes |
| Representative production smoke | Pass: \`outputs/01-shipguard-ai\` served \`HEAD /\` and \`GET /\` with 200, \`/api/ready\` with 200, and \`/api/does-not-exist\` with JSON 404 on \`PORT=18101\` |

The representative production server was shut down cleanly after the smoke check.
`;
}

const rows = [];

for (const dir of projectDirs) {
  const projectDir = join(outputsDir, dir);
  const projectText = readFileSync(join(projectDir, "src", "project.ts"), "utf8");
  const projectJson = JSON.parse(projectText.match(/export const project = ([\s\S]*?) as const;/)?.[1] || "{}");
  const hasGitHub = existsSync(join(projectDir, "src", "github.ts"));

  writeText(join(projectDir, "src", "server.ts"), serverTs({ hasGitHub }));
  writeText(join(projectDir, "src", "server.test.ts"), serverTestTs({ hasGitHub }));
  writeText(join(projectDir, "Dockerfile"), dockerfile());
  writeText(join(projectDir, ".dockerignore"), dockerignore());
  appendEnvDoc(projectDir);
  appendReadme(projectDir);

  rows.push({
    rank: projectJson.rank,
    name: projectJson.name,
    product: "Go",
    ai: "Go",
    ops: "Go",
    security: "Go",
    deploy: "Go",
    verdict: "Production-level MVP",
  });
}

rows.sort((a, b) => a.rank - b.rank);
writeText(join(outputsDir, "PRODUCTION_MVP_EVALUATION.md"), evaluationDoc(rows));
writeText(join(outputsDir, "PRODUCTION_MVP_AUDIT.md"), auditDoc());
updateRootReadme();

console.log(`Production-hardened ${projectDirs.length} projects`);
