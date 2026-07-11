import { afterEach, describe, expect, test } from "vitest";
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
  return `http://127.0.0.1:${address.port}`;
}

async function createClientFixture() {
  const dir = await mkdtemp(join(tmpdir(), `${project.packageName}-client-`));
  tempDirs.push(dir);
  await writeFile(join(dir, "index.html"), "<!doctype html><title>Test Client</title><div id=\"root\"></div>", "utf8");
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

describe.sequential(`${project.name} production HTTP contract`, () => {
  test("exposes health, readiness, and version endpoints", async () => {
    const baseUrl = await withServer();

    const health = await fetch(`${baseUrl}/api/health`);
    expect(health.status).toBe(200);
    expect(health.headers.get("x-request-id")).toBeTruthy();
    expect(health.headers.get("x-content-type-options")).toBe("nosniff");
    expect(health.headers.get("content-security-policy")).toBeTruthy();
    await expect(health.json()).resolves.toMatchObject({ ok: true, project: project.name });

    const ready = await fetch(`${baseUrl}/api/ready`);
    expect([200, 503]).toContain(ready.status);
    const readyJson = await ready.json();
    expect(readyJson).toHaveProperty("fallbackAvailable", true);
    expect(readyJson).toHaveProperty("authRequired");

    const version = await fetch(`${baseUrl}/api/version`);
    expect(version.status).toBe(200);
    await expect(version.json()).resolves.toMatchObject({ ok: true, packageName: project.packageName });
  });

  test("returns structured validation errors", async () => {
    const baseUrl = await withServer();
    const response = await fetch(`${baseUrl}/api/analyze`, {
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
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid json",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code: "INVALID_JSON" } });
  });


  test("accepts product learning events", async () => {
    const baseUrl = await withServer();
    const response = await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "feedback_submitted",
        target: project.sampleTarget,
        decision: project.positive,
        confidence: "83",
        source: "local-fallback",
        feedbackScore: 1,
        feedbackReason: "Useful enough for the next release meeting.",
        metadata: { mode: "balanced", copied: true },
      }),
    });

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({ ok: true, accepted: true });
  });

  test("rejects malformed product learning events", async () => {
    const baseUrl = await withServer();
    const response = await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "unknown_event" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code: "PRODUCT_EVENT_INVALID" } });
  });

  test("requires API authentication for protected endpoints when enabled", async () => {
    process.env.REQUIRE_API_AUTH = "true";
    process.env.API_AUTH_TOKEN = "test-secret";
    const baseUrl = await withServer();

    const unauthenticated = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "", context: "", signals: "", mode: "balanced" }),
    });
    expect(unauthenticated.status).toBe(401);

    const authenticated = await fetch(`${baseUrl}/api/analyze`, {
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

    const ready = await fetch(`${baseUrl}/api/ready`);
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

    const first = await fetch(`${baseUrl}/api/analyze`, { method: "POST", headers, body });
    expect(first.status).toBe(400);

    const second = await fetch(`${baseUrl}/api/analyze`, { method: "POST", headers, body });
    expect(second.status).toBe(429);
    await expect(second.json()).resolves.toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
  });

  test("serves the built UI without masking unknown API routes", async () => {
    const clientDir = await createClientFixture();
    const baseUrl = await withServer(clientDir);

    const root = await fetch(`${baseUrl}/`);
    expect(root.status).toBe(200);
    expect(root.headers.get("content-type") || "").toContain("text/html");

    const nestedRoute = await fetch(`${baseUrl}/deep/link`);
    expect(nestedRoute.status).toBe(200);

    const missingApi = await fetch(`${baseUrl}/api/does-not-exist`);
    expect(missingApi.status).toBe(404);
    await expect(missingApi.json()).resolves.toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

});
