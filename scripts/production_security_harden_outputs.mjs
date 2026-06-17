import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outputsDir = join(root, "outputs");
const projectDirs = readdirSync(outputsDir)
  .filter((entry) => /^\d{2}-/.test(entry))
  .sort();

const productionDeps = {
  "express-rate-limit": "8.5.2",
  helmet: "8.1.0",
};

function writeText(path, text) {
  writeFileSync(path, text.replace(/\n+$/, "\n"), "utf8");
}

function parseProject(projectPath) {
  const source = readFileSync(projectPath, "utf8");
  const start = source.indexOf("{");
  const end = source.lastIndexOf("} as const");
  return JSON.parse(source.slice(start, end + 1));
}

function serverTs({ hasGitHub }) {
  return `import cors from "cors";
import express, { type ErrorRequestHandler, type NextFunction, type Request, type Response } from "express";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { AnalyzeInputSchema, DEFAULT_MODEL, analyze } from "./agent";
${hasGitHub ? 'import { collectGitHubPullRequest } from "./github";\n' : ""}import { project } from "./project";

const serviceVersion = process.env.SERVICE_VERSION || process.env.K_REVISION || "local";
const bodyLimit = process.env.JSON_BODY_LIMIT || "1mb";

function envFlag(name: string, defaultValue = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultValue;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

function envInt(name: string, defaultValue: number, min: number, max: number) {
  const parsed = Number(process.env[name] || defaultValue);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function geminiConfigured() {
  return Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  );
}

function apiAuthRequired() {
  return envFlag("REQUIRE_API_AUTH", process.env.NODE_ENV === "production" && !envFlag("ALLOW_UNAUTHENTICATED"));
}

function apiAuthConfigured() {
  return Boolean(process.env.API_AUTH_TOKEN);
}

function geminiRequired() {
  return envFlag("REQUIRE_GEMINI", process.env.NODE_ENV === "production");
}

function corsConfigured() {
  return Boolean(process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== "*");
}

function allowedOrigins() {
  const raw = process.env.CORS_ORIGIN || "*";
  if (raw === "*") {
    if (process.env.NODE_ENV === "production" && !envFlag("ALLOW_WILDCARD_CORS")) return [];
    return true;
  }
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

function protectedApiRoute(req: Request) {
  return req.method !== "OPTIONS" && ["/api/analyze"${hasGitHub ? ', "/api/collect/github-pr"' : ""}].includes(req.path);
}

function extractApiToken(req: Request) {
  const authorization = req.header("authorization") || "";
  if (authorization.toLowerCase().startsWith("bearer ")) return authorization.slice(7).trim();
  return req.header("x-api-key") || "";
}

function tokenMatches(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function requireApiAuth(req: Request, res: Response, next: NextFunction) {
  if (!protectedApiRoute(req) || !apiAuthRequired()) {
    next();
    return;
  }

  const expected = process.env.API_AUTH_TOKEN || "";
  if (!expected) {
    sendApiError(res, 503, "API_AUTH_NOT_CONFIGURED", "API authentication is required but API_AUTH_TOKEN is not configured");
    return;
  }

  if (!tokenMatches(extractApiToken(req), expected)) {
    sendApiError(res, 401, "UNAUTHORIZED", "A valid Bearer token or X-API-Key header is required");
    return;
  }

  next();
}

function jsonSyntaxErrorHandler(error: unknown, _req: Request, res: Response, next: NextFunction) {
  if (error instanceof SyntaxError && typeof error === "object" && error !== null && "body" in error) {
    sendApiError(res, 400, "INVALID_JSON", "Request body must be valid JSON");
    return;
  }
  next(error);
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
  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'"],
          imgSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          baseUri: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-store");
    }
    next();
  });
  app.use(
    cors({
      origin: allowedOrigins(),
      credentials: false,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-Request-Id", "Authorization", "X-API-Key"],
      maxAge: 600,
    }),
  );
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
  app.use(express.json({ limit: bodyLimit }));
  app.use(jsonSyntaxErrorHandler);
  app.use(
    rateLimit({
      windowMs: envInt("RATE_LIMIT_WINDOW_MS", 60_000, 1_000, 3_600_000),
      limit: envInt("RATE_LIMIT_MAX_REQUESTS", 30, 1, 10_000),
      standardHeaders: "draft-7",
      legacyHeaders: false,
      skip: (req) => !protectedApiRoute(req),
      handler: (_req, res) => {
        sendApiError(res, 429, "RATE_LIMITED", "Too many API requests in the current window");
      },
    }),
  );
  app.use(requireApiAuth);

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
    const authReady = !apiAuthRequired() || apiAuthConfigured();
    const modelReady = !geminiRequired() || geminiConfigured();
    const ready = Boolean(clientDir) && authReady && modelReady;
    res.status(ready ? 200 : 503).json({
      ok: ready,
      status: ready ? "ready" : "not-ready",
      project: project.name,
      clientReady: Boolean(clientDir),
      geminiConfigured: geminiConfigured(),
      geminiRequired: geminiRequired(),
      authRequired: apiAuthRequired(),
      authConfigured: apiAuthConfigured(),
      corsConfigured: corsConfigured(),
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
      authRequired: apiAuthRequired(),
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
const managedEnv = [
  "ALLOW_UNAUTHENTICATED",
  "ALLOW_WILDCARD_CORS",
  "API_AUTH_TOKEN",
  "CORS_ORIGIN",
  "NODE_ENV",
  "RATE_LIMIT_MAX_REQUESTS",
  "RATE_LIMIT_WINDOW_MS",
  "REQUIRE_API_AUTH",
  "REQUIRE_GEMINI",
];

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
  for (const key of managedEnv) delete process.env[key];
});

describe.sequential(\`\${project.name} production HTTP contract\`, () => {
  test("exposes health, readiness, and version endpoints", async () => {
    const baseUrl = await withServer();

    const health = await fetch(\`\${baseUrl}/api/health\`);
    expect(health.status).toBe(200);
    expect(health.headers.get("x-request-id")).toBeTruthy();
    expect(health.headers.get("x-content-type-options")).toBe("nosniff");
    expect(health.headers.get("content-security-policy")).toBeTruthy();
    await expect(health.json()).resolves.toMatchObject({ ok: true, project: project.name });

    const ready = await fetch(\`\${baseUrl}/api/ready\`);
    expect([200, 503]).toContain(ready.status);
    const readyJson = await ready.json();
    expect(readyJson).toHaveProperty("fallbackAvailable", true);
    expect(readyJson).toHaveProperty("authRequired");

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

  test("rejects invalid JSON as a client error", async () => {
    const baseUrl = await withServer();
    const response = await fetch(\`\${baseUrl}/api/analyze\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid json",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code: "INVALID_JSON" } });
  });

  test("requires API authentication for protected endpoints when enabled", async () => {
    process.env.REQUIRE_API_AUTH = "true";
    process.env.API_AUTH_TOKEN = "test-secret";
    const baseUrl = await withServer();

    const unauthenticated = await fetch(\`\${baseUrl}/api/analyze\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "", context: "", signals: "", mode: "balanced" }),
    });
    expect(unauthenticated.status).toBe(401);

    const authenticated = await fetch(\`\${baseUrl}/api/analyze\`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-secret" },
      body: JSON.stringify({ target: "", context: "", signals: "", mode: "balanced" }),
    });
    expect(authenticated.status).toBe(400);
    await expect(authenticated.json()).resolves.toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
  });

  test("marks readiness unhealthy when production auth is required but not configured", async () => {
    process.env.NODE_ENV = "production";
    process.env.REQUIRE_API_AUTH = "true";
    const clientDir = await createClientFixture();
    const baseUrl = await withServer(clientDir);

    const ready = await fetch(\`\${baseUrl}/api/ready\`);
    expect(ready.status).toBe(503);
    await expect(ready.json()).resolves.toMatchObject({
      ok: false,
      authRequired: true,
      authConfigured: false,
    });
  });

  test("rate limits protected API requests", async () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = "1";
    process.env.RATE_LIMIT_WINDOW_MS = "60000";
    const baseUrl = await withServer();
    const headers = { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.77" };
    const body = JSON.stringify({ target: "", context: "", signals: "", mode: "balanced" });

    const first = await fetch(\`\${baseUrl}/api/analyze\`, { method: "POST", headers, body });
    expect(first.status).toBe(400);

    const second = await fetch(\`\${baseUrl}/api/analyze\`, { method: "POST", headers, body });
    expect(second.status).toBe(429);
    await expect(second.json()).resolves.toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
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

${hasGitHub ? `  test("validates GitHub PR collection input behind authentication", async () => {
    process.env.REQUIRE_API_AUTH = "true";
    process.env.API_AUTH_TOKEN = "test-secret";
    const baseUrl = await withServer();
    const response = await fetch(\`\${baseUrl}/api/collect/github-pr\`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": "test-secret" },
      body: JSON.stringify({ url: "" }),
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toMatchObject({ ok: false, error: { code: "MISSING_GITHUB_URL" } });
  });

` : ""}});
`;
}

function updatePackage(projectDir) {
  const packagePath = join(outputsDir, projectDir, "package.json");
  const data = JSON.parse(readFileSync(packagePath, "utf8"));
  data.dependencies = {
    ...data.dependencies,
    ...productionDeps,
  };
  writeText(packagePath, `${JSON.stringify(data, null, 2)}\n`);
}

function updateEnv(projectDir) {
  const envPath = join(outputsDir, projectDir, ".env.example");
  let env = readFileSync(envPath, "utf8");
  if (!env.includes("API_AUTH_TOKEN=")) {
    env += `

# Production API protection. In production, protected POST APIs require auth unless ALLOW_UNAUTHENTICATED=true.
API_AUTH_TOKEN=
REQUIRE_API_AUTH=
ALLOW_UNAUTHENTICATED=

# Production readiness and browser access.
REQUIRE_GEMINI=
CORS_ORIGIN=
ALLOW_WILDCARD_CORS=

# Per-instance API cost protection.
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
`;
  }
  writeText(envPath, env);
}

function updateMain(projectDir) {
  const mainPath = join(outputsDir, projectDir, "src/main.ts");
  let text = readFileSync(mainPath, "utf8");
  if (!text.includes("API_TOKEN_STORAGE_KEY")) {
    text = text.replace(
      "let currentRecord: HistoryRecord | undefined;\n",
      `let currentRecord: HistoryRecord | undefined;\nconst API_TOKEN_STORAGE_KEY = "mvp-api-token";\n\nfunction apiHeaders(base: Record<string, string> = {}) {\n  const token = sessionStorage.getItem(API_TOKEN_STORAGE_KEY) || "";\n  return token ? { ...base, Authorization: \`Bearer \${token}\` } : base;\n}\n`,
    );
  }
  text = text.replace('headers: { "Content-Type": "application/json" },', 'headers: apiHeaders({ "Content-Type": "application/json" }),');
  text = text.replace('headers: { "Content-Type": "application/json" },', 'headers: apiHeaders({ "Content-Type": "application/json" }),');
  if (!text.includes('id="api-token"')) {
    text = text.replace(
      `<section>
            <h2>Decision Labels</h2>`,
      `<section>
            <h2>API Access</h2>
            <label class="compact-field">
              <span>API Token</span>
              <input id="api-token" type="password" autocomplete="off" value="\${escapeHtml(sessionStorage.getItem(API_TOKEN_STORAGE_KEY) || "")}" />
            </label>
          </section>
          <section>
            <h2>Decision Labels</h2>`,
    );
  }
  if (!text.includes('querySelector<HTMLInputElement>("#api-token")')) {
    text = text.replace(
      "  renderHistory(project);\n}",
      `  const apiTokenInput = document.querySelector<HTMLInputElement>("#api-token");\n  apiTokenInput?.addEventListener("input", () => {\n    sessionStorage.setItem(API_TOKEN_STORAGE_KEY, apiTokenInput.value.trim());\n  });\n\n  renderHistory(project);\n}`,
    );
  }
  writeText(mainPath, text);
}

function updateStyles(projectDir) {
  const stylesPath = join(outputsDir, projectDir, "src/styles.css");
  let css = readFileSync(stylesPath, "utf8");
  if (!css.includes(".compact-field")) {
    css += `

.compact-field {
  display: grid;
  gap: 6px;
}

.compact-field input {
  width: 100%;
  min-height: 44px;
}
`;
  }
  writeText(stylesPath, css);
}

function writeRepoFiles(projectDir, project) {
  writeText(
    join(outputsDir, projectDir, "SECURITY.md"),
    `# Security Policy

## Supported Version

This MVP supports the current main branch only.

## Reporting A Vulnerability

Do not open public issues for exploitable vulnerabilities or leaked secrets. Send a private report to the repository maintainer with:

- affected endpoint or workflow
- reproduction steps
- expected impact
- suggested remediation, if known

## Production Secrets

- Never commit \`.env\`, \`GEMINI_API_KEY\`, \`API_AUTH_TOKEN\`, GitHub tokens, or Cloud credentials.
- Store production secrets in Google Secret Manager or the hosting platform's secret store.
- Rotate \`API_AUTH_TOKEN\` after demos, shared test runs, or suspected exposure.
`,
  );

  writeText(
    join(outputsDir, projectDir, "CONTRIBUTING.md"),
    `# Contributing

## Local Verification

\`\`\`bash
npm ci
npm run verify
npm audit --audit-level=high
\`\`\`

## Pull Request Checklist

- Update tests for changed API, agent, or UI behavior.
- Keep \`.env.example\`, README, and docs in sync with new configuration.
- Do not commit generated \`node_modules\`, local \`.env\`, credentials, or screenshots containing secrets.
- Explain any production-risk tradeoff in the PR description.
`,
  );

  writeText(
    join(outputsDir, projectDir, "LICENSE"),
    `MIT License

Copyright (c) 2026 DevOps x AI Agent Hackathon contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
  );

  mkdirSync(join(outputsDir, projectDir, ".github", "workflows"), { recursive: true });
  writeText(
    join(outputsDir, projectDir, ".github", "workflows", "ci.yml"),
    `name: ci

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run verify
      - run: npm audit --audit-level=high
      - run: docker build -t ${project.packageName}:ci .
`,
  );

  mkdirSync(join(outputsDir, projectDir, ".github"), { recursive: true });
  writeText(
    join(outputsDir, projectDir, ".github", "dependabot.yml"),
    `version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
`,
  );

  mkdirSync(join(outputsDir, projectDir, "docs"), { recursive: true });
  writeText(
    join(outputsDir, projectDir, "docs", "runbook.md"),
    `# Production Runbook: ${project.name}

## Service

- Package: \`${project.packageName}\`
- Primary protected endpoint: \`POST /api/analyze\`
- Health endpoint: \`GET /api/health\`
- Readiness endpoint: \`GET /api/ready\`

## Required Production Controls

- Set \`NODE_ENV=production\`.
- Set \`API_AUTH_TOKEN\` and keep \`REQUIRE_API_AUTH=true\` unless the service is behind Cloud Run IAM, IAP, or an API Gateway.
- Set \`GEMINI_API_KEY\` through Secret Manager.
- Set \`CORS_ORIGIN\` to the deployed frontend origin.
- Keep \`RATE_LIMIT_MAX_REQUESTS\` conservative until real usage data exists.

## Incident Response

1. Check \`/api/ready\` and confirm \`authConfigured\`, \`geminiConfigured\`, and \`clientReady\`.
2. Search logs by \`requestId\` from the failed API response.
3. If Gemini calls fail, confirm fallback responses are acceptable for the current incident.
4. If rate limits fire, inspect traffic source and raise or block deliberately.
5. Rotate \`API_AUTH_TOKEN\` after suspected exposure.

## Rollback

Use Cloud Run revision rollback to return traffic to the last known healthy revision. Keep the previous revision available until smoke tests and logs are clean.
`,
  );
}

function updateReadme(projectDir) {
  const readmePath = join(outputsDir, projectDir, "README.md");
  let readme = readFileSync(readmePath, "utf8");
  readme = readme.replace(/## Production Security Hardening[\s\S]*?(?=\n## |\n?$)/, "");
  const section = `
## Production Security Hardening

- Protected POST APIs support Bearer token or \`X-API-Key\` auth via \`API_AUTH_TOKEN\`.
- In \`NODE_ENV=production\`, API auth is required unless \`ALLOW_UNAUTHENTICATED=true\` is set intentionally.
- \`helmet\` applies production security headers and CSP.
- \`express-rate-limit\` protects AI/API cost surfaces with \`RATE_LIMIT_WINDOW_MS\` and \`RATE_LIMIT_MAX_REQUESTS\`.
- \`/api/ready\` fails closed when required auth or Gemini configuration is missing.
- GitHub Actions CI, Dependabot, \`SECURITY.md\`, \`CONTRIBUTING.md\`, \`LICENSE\`, and [production runbook](./docs/runbook.md) are included.
`;
  const marker = "\n## リポジトリ構成\n";
  readme = readme.includes(marker) ? readme.replace(marker, `${section}${marker}`) : `${readme}${section}`;
  writeText(readmePath, readme);
}

for (const dir of projectDirs) {
  const project = parseProject(join(outputsDir, dir, "src", "project.ts"));
  const hasGitHub = existsSync(join(outputsDir, dir, "src", "github.ts"));
  writeText(join(outputsDir, dir, "src", "server.ts"), serverTs({ hasGitHub }));
  writeText(join(outputsDir, dir, "src", "server.test.ts"), serverTestTs({ hasGitHub }));
  updatePackage(dir);
  updateEnv(dir);
  updateMain(dir);
  updateStyles(dir);
  writeRepoFiles(dir, project);
  updateReadme(dir);
}
