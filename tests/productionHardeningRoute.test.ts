import { spawn, type ChildProcessByStdio } from "node:child_process";
import path from "node:path";
import type { Readable } from "node:stream";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace";
import { encodeWorkspaceShareParam, type WorkspaceDraft } from "../src/workspaceDraft";

type ServerProcess = ChildProcessByStdio<null, Readable, Readable>;

type ProductionHardeningResponse = {
  status: string;
  score: number;
  firstAction: {
    label: string;
    href: string;
  };
  actionPacket: {
    openCount: number;
    blockedCount: number;
    items: Array<{
      id: string;
      priority: string;
      owner: string;
      acceptance: string;
    }>;
  };
  recoveryKit: {
    headline: string;
    releaseRule: string;
    issues: Array<{
      issueTitle: string;
      issueBody: string;
    }>;
  };
  checks: Array<{
    id: string;
    status: string;
    evidence: string;
  }>;
};

function tsxBin() {
  return path.resolve(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
}

function waitForServer(child: ServerProcess, port: number) {
  return new Promise<void>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => {
      finish(new Error(`server did not start on ${port}\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    }, 15000);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
      if (stdout.includes(`http://127.0.0.1:${port}`)) finish();
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.once("exit", (code) => {
      finish(new Error(`server exited before ready with code ${code}\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    });
  });
}

function workspaceUrl(port: number, pathname: string, workspace: WorkspaceDraft) {
  const params = new URLSearchParams({ workspace: encodeWorkspaceShareParam(workspace) });
  return `http://127.0.0.1:${port}${pathname}?${params.toString()}`;
}

describe("production hardening public routes", () => {
  const port = 19080 + Math.floor(Math.random() * 1000);
  let server: ServerProcess | undefined;

  beforeAll(async () => {
    const child = spawn(tsxBin(), ["server/index.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"]
    });
    server = child;
    await waitForServer(child, port);
  }, 20000);

  afterAll(async () => {
    if (!server || server.killed) return;
    await new Promise<void>((resolve) => {
      server?.once("exit", () => resolve());
      server?.kill("SIGTERM");
      setTimeout(resolve, 1000);
    });
  });

  test("publishes production hardening as JSON, HTML, and Markdown", async () => {
    const workspace = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", `http://127.0.0.1:${port}`);
    const json = await fetch(workspaceUrl(port, "/api/production-hardening", workspace));
    expect(json.status).toBe(200);
    const gate = (await json.json()) as ProductionHardeningResponse;

    expect(gate.status).toBe("blocked");
    expect(gate.firstAction).toMatchObject({ label: "Fix Public proof URLs" });
    expect(gate.actionPacket).toMatchObject({ openCount: 5, blockedCount: 5 });
    expect(gate.actionPacket.items[0]).toMatchObject({ id: "action-public-proof-urls", priority: "P0", owner: "Proof owner" });
    expect(gate.recoveryKit.headline).toContain("owner-ready recovery tickets");
    expect(gate.recoveryKit.releaseRule).toContain("Do not share externally");
    expect(gate.recoveryKit.issues[0].issueBody).toContain("## Verification");
    expect(gate.checks.map((check) => check.id)).toEqual(["public-proof-urls", "reference-artifacts", "live-verification", "buyer-owned-run", "external-submission"]);
    expect(gate.checks.find((check) => check.id === "reference-artifacts")).toMatchObject({ status: "blocked" });

    const html = await fetch(workspaceUrl(port, "/production-hardening", workspace));
    expect(html.status).toBe(200);
    const htmlText = await html.text();
    expect(htmlText).toContain("Production hardening gate");
    expect(htmlText).toContain("/api/production-hardening?workspace=");
    expect(htmlText).toContain("/production-hardening.md?workspace=");
    expect(htmlText).toContain("Release action packet");
    expect(htmlText).toContain("Global release recovery kit");
    expect(htmlText).toContain("Recovery issue queue");
    expect(htmlText).toContain("Proof owner");
    expect(htmlText).toContain("No-launch rules");

    const markdown = await fetch(workspaceUrl(port, "/production-hardening.md", workspace));
    expect(markdown.status).toBe(200);
    const markdownText = await markdown.text();
    expect(markdownText).toContain("# Production hardening gate");
    expect(markdownText).toContain("## Release action packet");
    expect(markdownText).toContain("## Global release recovery kit");
  });

  test("escapes buyer-provided text in the public hardening HTML", async () => {
    const workspace = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", `http://127.0.0.1:${port}`);
    const unsafeWorkspace: WorkspaceDraft = {
      ...workspace,
      pilotRun: {
        ...workspace.pilotRun,
        reviewerName: "<script>alert('buyer')</script>"
      }
    };
    const response = await fetch(workspaceUrl(port, "/production-hardening", unsafeWorkspace));
    expect(response.status).toBe(200);
    const html = await response.text();

    expect(html).toContain("&lt;script&gt;alert(&#39;buyer&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('buyer')</script>");
  });
});
