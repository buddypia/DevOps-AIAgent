import cors from "cors";
import express, { type ErrorRequestHandler, type NextFunction, type Request, type Response } from "express";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { z } from "zod";
import { AnalyzeInputSchema, DEFAULT_MODEL, analyze } from "./agent";
import { project } from "./project";

const serviceVersion = process.env.SERVICE_VERSION || process.env.K_REVISION || "local";
const bodyLimit = process.env.JSON_BODY_LIMIT || "1mb";

const ProductEventSchema = z.object({
  eventName: z.enum([
    "analysis_started",
    "analysis_completed",
    "analysis_failed",
    "feedback_submitted",
    "github_pr_collected",
    "copy_comment",
    "copy_markdown",
    "download_json",
  ]),
  target: z.string().trim().max(4000).default(""),
  decision: z.string().trim().max(120).optional(),
  confidence: z.coerce.number().min(0).max(100).optional(),
  source: z.string().trim().max(80).optional(),
  feedbackScore: z.coerce.number().min(-1).max(1).optional(),
  feedbackReason: z.string().trim().max(1000).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
});

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
  return req.method !== "OPTIONS" && ["/api/analyze", "/api/events"].includes(req.path);
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

  app.post("/api/events", (req, res) => {
    const parsed = ProductEventSchema.safeParse(req.body);
    if (!parsed.success) {
      sendApiError(res, 400, "PRODUCT_EVENT_INVALID", "Product event does not match the telemetry schema", parsed.error.flatten());
      return;
    }

    log("info", "product_event", {
      requestId: res.locals.requestId,
      event: parsed.data,
    });
    res.status(202).json({
      ok: true,
      accepted: true,
      requestId: res.locals.requestId,
    });
  });

  if (clientDir) {
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
